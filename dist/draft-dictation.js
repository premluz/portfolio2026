const messages={'not-allowed':'Microphone permission was denied. Check the browser permission and try again.','service-not-allowed':'Speech recognition is blocked in this browser view. Open the site directly.','audio-capture':'No microphone is available.','network':'Speech recognition could not connect. Please try again.'};
export const appendDictation=(draft,text)=>text.trim()?`${draft}${draft&&!/\s$/.test(draft)?' ':''}${text.trim()}`:draft;

// A local microphone analyser supplies visual levels only: no recorder, files,
// uploads or speaker connection. Recognition remains the browser speech service.
export class DictationMeter{
 constructor({environment=globalThis,onLevel=()=>{}}={}){this.environment=environment;this.onLevel=onLevel;this.generation=0;}
 async start(){
  this.stop();const generation=this.generation,env=this.environment;
  if(!env.navigator?.mediaDevices?.getUserMedia)return;
  try{
   const stream=await env.navigator.mediaDevices.getUserMedia({audio:true,video:false});
   if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return;}
   this.stream=stream;const Context=env.AudioContext||env.webkitAudioContext;if(!Context){this.stop();return;}
   this.context=new Context();await this.context.resume();
   if(generation!==this.generation)return;
   this.source=this.context.createMediaStreamSource(stream);this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.source.connect(this.analyser);this.samples=new Uint8Array(this.analyser.fftSize);
   const tick=()=>{if(generation!==this.generation)return;this.analyser.getByteTimeDomainData(this.samples);const rms=Math.sqrt(this.samples.reduce((sum,value)=>sum+((value-128)/128)**2,0)/this.samples.length);this.onLevel(Math.min(1,rms*10));this.timer=env.setTimeout(tick,40);};tick();
  }catch{if(generation===this.generation)this.stop();}
 }
 stop(){++this.generation;this.environment.clearTimeout(this.timer);this.timer=0;this.source?.disconnect();this.source=null;this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;this.context?.close().catch(()=>{});this.context=null;this.analyser=null;this.onLevel(0);}
}

export class DraftDictation{
 constructor({environment=globalThis,getDraft=()=>'',setDraft=()=>{},onState=()=>{},onLevel=()=>{},onError=()=>{},onStart=()=>{},onEnd=()=>{}}={}){
  Object.assign(this,{environment,getDraft,setDraft,onState,onLevel,onError,onStart,onEnd,generation:0,session:null});this.meter=new DictationMeter({environment,onLevel});
 }
 get active(){return !!this.session;}
 start(){
  if(this.active)return;
  const Recognition=this.environment.SpeechRecognition||this.environment.webkitSpeechRecognition;
  if(!Recognition){this.onError('Dictation is unavailable in this browser. Open the site directly in a browser with speech recognition support.');return;}
  const session={Recognition,recognition:null,generation:++this.generation,base:this.getDraft(),transcript:'',started:false,stopping:false,meterStarted:false,emptyEnds:0};session.finished=new Promise(resolve=>session.resolve=resolve);this.session=session;
  this.onStart();this.onState('starting');this.listen(session);
 }
 valid(session){return this.session===session&&this.generation===session.generation;}
 listen(session){
  if(!this.valid(session)||session.stopping)return;
  let recognition;try{recognition=new session.Recognition();}catch{this.onError('The microphone could not start.');this.finish(session);return;}
  session.recognition=recognition;session.started=false;session.restartTimer=0;
  const valid=()=>this.valid(session)&&session.recognition===recognition;
  recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
  recognition.onstart=()=>{if(!valid())return;if(session.stopping){this.finish(session);return;}session.started=true;this.environment.clearTimeout(session.startTimer);this.onState('listening');if(!session.meterStarted){session.meterStarted=true;void this.meter.start();}};
  recognition.onspeechstart=()=>{if(valid()){this.onState('hearing');this.onLevel(.35);}};
  recognition.onspeechend=()=>{if(valid())this.onState(session.stopping?'finishing':'listening');};
  recognition.onresult=event=>{
   if(!valid())return;
   session.transcript=Array.from(event.results).map(result=>result[0]?.transcript||'').join(' ').trim();
   if(session.transcript)session.emptyEnds=0;
   this.setDraft(appendDictation(session.base,session.transcript));this.onState(session.stopping?'finishing':'hearing');
  };
  recognition.onerror=event=>{if(!valid())return;if(event.error==='no-speech'){if(session.stopping)this.finish(session);return;}if(event.error!=='aborted')this.onError(messages[event.error]||'Dictation stopped. Try the microphone again.');this.finish(session);};
  recognition.onend=()=>{if(valid())session.stopping?this.finish(session):this.resume(session,recognition);};
  session.startTimer=this.environment.setTimeout(()=>{if(valid()){this.onError('Microphone setup timed out. Check the browser permission.');this.cancel();}},15000);
  try{recognition.start();}catch(error){this.onError(error.message||'The microphone could not start.');this.finish(session);}
 }
 resume(session,recognition){
  // Android's speech service can end a recognition even with continuous=true.
  // A native end is a segment boundary; only Stop/Cancel ends user dictation.
  this.environment.clearTimeout(session.startTimer);this.detach(recognition);
  session.recognition=null;session.started=false;
  if(!session.transcript&&++session.emptyEnds>3){this.onError('Dictation stopped because no speech was detected. Try the microphone again.');this.finish(session);return;}
  session.base=appendDictation(session.base,session.transcript);session.transcript='';
  this.onState('listening');
  // Let the previous native service release its microphone before restarting.
  session.restartTimer=this.environment.setTimeout(()=>this.listen(session),120);
 }
 detach(recognition){
  if(!recognition)return;
  for(const event of ['onstart','onresult','onend','onerror','onspeechstart','onspeechend'])recognition[event]=null;
 }
 stop(){
  const session=this.session;if(!session)return Promise.resolve();if(session.stopping)return session.finished;
  session.stopping=true;this.meter.stop();this.onState('finishing');
  this.environment.clearTimeout(session.startTimer);this.environment.clearTimeout(session.restartTimer);
  if(!session.recognition){this.finish(session);return session.finished;}
  session.stopTimer=this.environment.setTimeout(()=>this.finish(session),900);
  try{session.started?session.recognition.stop():session.recognition.abort();}catch{this.finish(session);}
  return session.finished;
 }
 finish(session){
  if(this.session!==session)return;
  this.environment.clearTimeout(session.startTimer);this.environment.clearTimeout(session.stopTimer);this.environment.clearTimeout(session.restartTimer);this.meter.stop();
  this.detach(session.recognition);try{session.recognition?.abort();}catch{}
  this.session=null;++this.generation;this.onState('idle');this.onEnd();session.resolve();
 }
 cancel(){if(this.session)this.finish(this.session);}
}
