import assert from 'node:assert/strict';
import {GestureNavigation} from '../dist/gesture-navigation.js';

let cameraCalls=0,workers=[],videos=[],bitmaps=[],frames=[],resolveCapture;
const tracks=[{stops:0,stop(){this.stops++;}}],stream={getTracks:()=>tracks,getVideoTracks:()=>tracks};
class Worker {
  constructor(url){this.url=url;this.posts=[];workers.push(this);}
  postMessage(data){this.posts.push(data);if(data.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));}
  terminate(){this.terminated=true;}
  result(frame){this.onmessage({data:{type:'result',time:frame.time,epoch:frame.epoch,elapsed:20,landmarks:null}});}
}
const video=()=>{
  const callbacks=new Map();let id=0;
  const node={readyState:4,videoWidth:640,videoHeight:480,callbacks,setAttribute(){},async play(){},pause(){this.paused=true;},remove(){this.removed=true;},requestVideoFrameCallback(cb){callbacks.set(++id,cb);return id;},cancelVideoFrameCallback(id){callbacks.delete(id);}};
  videos.push(node);return node;
};
const environment={Worker,navigator:{mediaDevices:{async getUserMedia(options){cameraCalls++;assert.equal(options.audio,false,'Camera capture never acquires audio');return stream;}}},document:{createElement:type=>{assert.equal(type,'video');return video();},body:{append(){}}},async createImageBitmap(source,options){assert.equal(options.resizeWidth,320);const bitmap={closed:false,close(){this.closed=true;}};bitmaps.push(bitmap);if(resolveCapture===true)return new Promise(resolve=>resolveCapture=()=>resolve(bitmap));return bitmap;}};
const gesture=new GestureNavigation({environment,onFrame:intent=>frames.push(intent)});
assert.equal(cameraCalls,0,'Constructing/loading the Site never requests a camera');
assert.equal(await gesture.start(),true);assert(gesture.enabled);assert.equal(cameraCalls,1);
const worker=workers.at(-1);assert.equal(worker.posts[0].type,'init');assert(worker.url.pathname.endsWith('/hand-tracking-worker.js'));
await gesture.capture(100);assert(gesture.inFlight);const sent=worker.posts[1];
await gesture.capture(220);assert.equal(worker.posts.length,2,'Only one bitmap can be in flight');
worker.result(sent);assert.equal(gesture.inFlight,false);assert(frames.length>0);
await gesture.capture(300);const pausedFrame=worker.posts.at(-1);gesture.pause();gesture.resume();const before=frames.length;
worker.result(pausedFrame);assert.equal(frames.length,before,'Results from before pause cannot move a resumed cursor');
gesture.stop();assert(worker.terminated);assert.equal(tracks[0].stops,1);assert(videos[0].removed&&videos[0].srcObject===null);assert.equal(videos[0].callbacks.size,0);

// An asynchronous bitmap from an old camera session cannot clear the new
// session's in-flight gate or be posted to its worker.
await gesture.start();resolveCapture=true;const stale=gesture.capture(1000);await Promise.resolve();const finishOld=resolveCapture;
gesture.stop();resolveCapture=null;await gesture.start();const nextWorker=workers.at(-1);await gesture.capture(1100);assert(gesture.inFlight);
finishOld();await stale;assert(bitmaps.at(-2).closed);assert(gesture.inFlight,'Stale capture cannot release the new session gate');assert.equal(nextWorker.posts.length,2);gesture.stop();

let grant;
const pendingEnvironment={...environment,navigator:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>grant=resolve)}}};
const pending=new GestureNavigation({environment:pendingEnvironment});const requesting=pending.start();pending.stop();const priorStops=tracks[0].stops;grant(stream);
assert.equal(await requesting,false);assert.equal(tracks[0].stops,priorStops+1,'Camera permission granted after Cancel is immediately released');
const denied=new GestureNavigation({environment:{...environment,navigator:{mediaDevices:{getUserMedia:async()=>{throw Object.assign(Error(),{name:'NotAllowedError'});}}}}});
await assert.rejects(denied.start(),/Camera access/);assert.equal(denied.enabled,false);
console.log('Camera passed: explicit activation, no audio, local worker, bounded frames, pause epochs, stale capture races, cancel/denial and camera/worker/video cleanup.');
