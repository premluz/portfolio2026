import {classifyHand,GestureIntent} from './gesture-intent.js';

const cameraErrors={
  NotAllowedError:'Camera access was not allowed. Check this site’s permission, or open the site directly if you are in a preview.',
  NotFoundError:'No camera is available. Connect a camera and try again.',
  NotReadableError:'The camera is being used by another app. Close it there and try again.',
  SecurityError:'Camera access is blocked in this view. Open the site directly and try again.'
};
export class GestureNavigation {
  constructor({onFrame=()=>{},onStatus=()=>{},onChange=()=>{},canSwipe=()=>true,environment=globalThis}={}) {
    Object.assign(this,{onFrame,onStatus,onChange,canSwipe,environment,enabled:false,paused:false,generation:0,epoch:0});
    this.intent=new GestureIntent();this.frameCallback=0;this.interval=1000/15;
  }
  status(message,phase='ready'){this.onStatus({message,phase});}
  async start() {
    this.stop();const generation=this.generation,env=this.environment;
    if(!env.navigator?.mediaDevices?.getUserMedia||!env.Worker||!env.createImageBitmap)
      throw Error('Local hand tracking is not supported in this view. Open the site directly in a browser with camera support.');
    this.status('Waiting for camera permission…','starting');
    let stream;
    try{stream=await env.navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}},audio:false});}
    catch(error){throw Error(cameraErrors[error.name]||'The camera could not start. Please try again.');}
    if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return false;}
    this.stream=stream;this.video=env.document.createElement('video');
    Object.assign(this.video,{autoplay:true,muted:true,playsInline:true,srcObject:stream});
    this.video.setAttribute('aria-hidden','true');this.video.className='interaction-capture';env.document.body.append(this.video);
    for(const track of stream.getVideoTracks())track.onended=()=>this.fail('The camera stopped. Enable gestures again to reconnect.');
    try{await this.video.play();}catch{this.stop();throw Error('Camera playback is blocked. Open the site directly and try again.');}
    if(generation!==this.generation)return false;
    this.status('Loading local hand tracking…','starting');
    return new Promise((resolve,reject)=>{
      this.startup={resolve,reject};
      this.startTimer=setTimeout(()=>this.fail('Local hand tracking took too long to load. Please try again.'),60000);
      try {
        this.worker=new env.Worker(new URL('./hand-tracking-worker.js',import.meta.url));
        this.worker.onerror=()=>this.fail('Local hand tracking could not start in this browser. Please try again.');
        this.worker.onmessage=({data})=>{
          if(generation!==this.generation)return;
          if(data.type==='error'){this.fail(data.message);return;}
          if(data.type==='ready') {
            clearTimeout(this.startTimer);this.enabled=true;this.paused=false;this.inFlight=false;this.lastFrame=-Infinity;
            this.onChange(true);this.status('Show two joined fingers · thumb away','tracking');
            this.startup?.resolve(true);this.startup=null;this.schedule();
          } else if(data.type==='result') {
            this.inFlight=false;
            // Slow hardware automatically receives fewer frames, never a queue.
            this.interval=Math.max(1000/15,Math.min(220,this.interval*.8+data.elapsed*1.4*.2));
            if(this.enabled&&!this.paused&&data.epoch===this.epoch){const intent=this.intent.update(classifyHand(data.landmarks,data.worldLandmarks),data.time,{allowSwipe:this.canSwipe()});this.onFrame(intent);this.status(intent.cue,'tracking');}
          }
        };
        this.worker.postMessage({type:'init'});
      } catch {this.fail('Local hand tracking could not start in this browser. Please try again.');}
    });
  }
  schedule() {
    if(!this.enabled||this.paused)return;
    const callback=time=>{this.frameCallback=0;if(!this.enabled||this.paused)return;this.capture(time);this.schedule();};
    this.videoFrames=typeof this.video.requestVideoFrameCallback==='function';
    this.frameCallback=this.videoFrames?this.video.requestVideoFrameCallback(callback):this.environment.requestAnimationFrame(callback);
  }
  async capture(time) {
    if(this.inFlight||time-this.lastFrame<this.interval||this.video.readyState<2)return;
    this.inFlight=true;this.lastFrame=time;const generation=this.generation,epoch=this.epoch;
    try {
      const ratio=this.video.videoHeight/Math.max(1,this.video.videoWidth);
      const bitmap=await this.environment.createImageBitmap(this.video,{resizeWidth:320,resizeHeight:Math.max(1,Math.round(320*ratio)),resizeQuality:'low'});
      if(generation!==this.generation){bitmap.close();return;}
      if(!this.enabled||this.paused||epoch!==this.epoch){bitmap.close();this.inFlight=false;return;}
      this.worker.postMessage({type:'frame',bitmap,time,epoch},[bitmap]);
    } catch {if(generation===this.generation){this.inFlight=false;this.fail('The camera frame could not be processed locally. Please try again.');}}
  }
  cancelFrame(){if(this.frameCallback){if(this.videoFrames)this.video?.cancelVideoFrameCallback(this.frameCallback);else this.environment.cancelAnimationFrame(this.frameCallback);}this.frameCallback=0;}
  pause(){this.paused=true;this.epoch++;this.cancelFrame();this.intent.reset();this.onFrame({cursor:null});this.status('Gestures paused','paused');}
  resume(){if(!this.enabled)return;this.paused=false;this.intent.reset();this.schedule();}
  fail(message){const startup=this.startup;this.startup=null;this.stop();startup?.reject(Error(message));this.status(message,'error');}
  stop() {
    ++this.generation;this.enabled=false;this.paused=false;this.cancelFrame();clearTimeout(this.startTimer);
    this.worker?.terminate();this.worker=null;
    this.stream?.getTracks().forEach(track=>{track.onended=null;track.stop();});this.stream=null;
    if(this.video){this.video.pause();this.video.srcObject=null;this.video.remove();this.video=null;}
    this.startup?.resolve(false);this.startup=null;this.inFlight=false;this.intent.reset();this.onFrame({cursor:null});this.onChange(false);
  }
}
