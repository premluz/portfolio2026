// Browser playback for server-authorized answers. The ElevenLabs key remains in
// the Worker; a short-lived speech token binds each request to an exact answer.
const assistantSpeechRate=1.15;
// The spoken answer waits this long at most for the acknowledgement to finish before it plays.
const acknowledgementWait=4000;
export class AssistantSpeech {
 constructor({fetcher=(...args)=>globalThis.fetch(...args),AudioClass=globalThis.Audio,onState=()=>{},onStart=()=>{},onEnd=()=>{},onWorking=()=>{}}={}){
  Object.assign(this,{fetcher,AudioClass,onState,onStart,onEnd,onWorking});this.awaiting=false;this.cue=null;
  this.epoch=0;this.cache=new Map();this.audio=null;this.player=null;this.abort=null;this.current=null;this.speaking=false;this.state='idle';
 }
 get active(){return Boolean(this.current);}
 prime(){
  if(!this.AudioClass)return Promise.resolve(false);
  const audio=this.player||(this.player=new this.AudioClass());
  audio.src='data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  try{return Promise.resolve(audio.play()).then(()=>{if(!this.current){audio.pause();audio.currentTime=0;}return true;},()=>false);}catch{return Promise.resolve(false);}
 }
 stop(){
  ++this.epoch;this.awaiting=false;this.cue=null;this.abort?.abort();this.abort=null;
  if(this.audio){this.audio.onended=null;this.audio.onerror=null;this.audio.pause();this.audio=null;}
  const previous=this.current;this.current=null;this.state='idle';
  if(this.speaking){this.speaking=false;try{this.onEnd();}catch{}}
  if(previous)try{this.onState('idle',previous);}catch{}
 }
 // Lane one: a short phrase the moment a voice question is sent. Output stays active afterwards (the microphone
 // stays quiet) in a working phase until the spoken answer plays or release() says none is coming.
 acknowledge({id,sessionId,text=''}){
  if(!this.AudioClass||!id)return;
  this.stop();const epoch=this.epoch;this.awaiting=true;this.speaking=true;try{this.onStart(text);}catch(error){console.error('Speech start handler failed.',error);}
  this.cue=(async()=>{
   try{
    const key='ack:'+id;let url=this.cache.get(key);
    if(!url){const response=await this.fetcher('/api/voice',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ack:id,sessionId})});if(!response.ok)throw Error(`Acknowledgement voice responded ${response.status}`);url=URL.createObjectURL(await response.blob());this.cache.set(key,url);}
    if(epoch!==this.epoch)return;
    const audio=this.player||(this.player=new this.AudioClass(url));audio.src=url;audio.currentTime=0;audio.playbackRate=assistantSpeechRate;audio.preservesPitch=true;this.audio=audio;
    await new Promise(resolve=>{audio.onended=resolve;audio.onerror=resolve;Promise.resolve(audio.play()).catch(resolve);});
   }catch(error){console.warn('The acknowledgement could not play; the answer still follows.',error);}
   finally{if(epoch===this.epoch&&this.awaiting){if(this.audio){this.audio.onended=null;this.audio.onerror=null;}this.audio=null;try{this.onWorking();}catch(error){console.error('Speech working handler failed.',error);}}}
  })();
 }
 // No spoken answer will follow (text-only reply or an error): end the working phase.
 release(){if(!this.awaiting)return;this.awaiting=false;this.cue=null;if(!this.current&&this.speaking){this.speaking=false;try{this.onEnd();}catch(error){console.error('Speech end handler failed.',error);}}}
 async play({text,speechToken,sessionId},button){
  if(!speechToken||!text)return false;
  if(this.current===button){this.stop();return false;}
  // Lane two waits for the acknowledgement to finish, then takes over the same speaking turn without reopening the mic.
  if(this.awaiting&&this.cue){const cue=this.cue,before=this.epoch;await Promise.race([cue,new Promise(resolve=>setTimeout(resolve,acknowledgementWait))]);if(before!==this.epoch)return false;this.awaiting=false;this.cue=null;this.speaking=false;}
  this.stop();const epoch=this.epoch;this.current=button;this.state='loading';
  try{
   try{this.onState('loading',button);}catch{}
   this.speaking=true;try{this.onStart(text);}catch(error){console.error('Speech start handler failed.',error);}
   let url=this.cache.get(speechToken);
   if(!url){
    const controller=new AbortController();this.abort=controller;
    const response=await this.fetcher('/api/voice',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text,sessionId,speechToken}),signal:controller.signal});
    if(!response.ok)throw Error('Voice is unavailable right now.');
    const blob=await response.blob();if(!blob.size)throw Error('Voice is unavailable right now.');
    if(epoch!==this.epoch)return false;
    url=URL.createObjectURL(blob);this.cache.set(speechToken,url);
    if(this.cache.size>6){const oldest=this.cache.keys().next().value;URL.revokeObjectURL(this.cache.get(oldest));this.cache.delete(oldest);}
   }
   if(epoch!==this.epoch)return false;
   this.abort=null;const audio=this.player||(this.player=new this.AudioClass(url));audio.src=url;audio.currentTime=0;this.audio=audio;
   // Speed up locally, including cached replies, without changing voice pitch.
   audio.defaultPlaybackRate=assistantSpeechRate;audio.playbackRate=assistantSpeechRate;audio.preservesPitch=true;
   audio.onended=()=>{if(epoch===this.epoch)this.stop();};
   audio.onerror=()=>{if(epoch===this.epoch){this.stop();try{this.onState('error',button);}catch{}}};
   await audio.play();if(epoch!==this.epoch)return false;
   this.state='playing';try{this.onState('playing',button);}catch{}return true;
  }catch(error){if(epoch===this.epoch){this.stop();try{if(error?.name==='NotAllowedError')this.onState('blocked',button);else if(error?.name!=='AbortError')this.onState('error',button);}catch{}}return false;}
 }
 destroy(){this.stop();this.player?.pause();if(this.player)this.player.src='';this.player=null;for(const url of this.cache.values())URL.revokeObjectURL(url);this.cache.clear();}
}
