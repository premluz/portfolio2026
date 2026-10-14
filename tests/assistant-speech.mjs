import assert from 'node:assert/strict';
import {AssistantSpeech} from '../dist/assistant-speech.js';

const create=URL.createObjectURL,revoke=URL.revokeObjectURL,revoked=[];
URL.createObjectURL=()=>`blob:test-${Math.random()}`;
URL.revokeObjectURL=url=>revoked.push(url);
let calls=0,starts=0,ends=0,latest;
class AudioMock {constructor(url){this.url=url;latest=this;}play(){return Promise.resolve();}pause(){this.paused=true;}}
try{
 const speech=new AssistantSpeech({AudioClass:AudioMock,fetcher:async(_url,options)=>{calls++;assert.deepEqual(JSON.parse(options.body),{text:'Hello Prem',sessionId:'tab-session',speechToken:'signed'});return new Response(new Blob(['mp3']),{status:200});},onStart:()=>starts++,onEnd:()=>ends++});
 const answer={text:'Hello Prem',sessionId:'tab-session',speechToken:'signed'},button={};
 assert.equal(await speech.play(answer,button),true);assert.equal(calls,1);assert.equal(starts,1);assert(speech.active);
 assert.equal(latest.playbackRate,1.25);assert.equal(latest.defaultPlaybackRate,1.25);assert.equal(latest.preservesPitch,true);
 assert.equal(await speech.play(answer,button),false,'Pressing the same control stops playback.');assert(latest.paused);assert.equal(ends,1);
 assert.equal(await speech.play(answer,button),true);assert.equal(calls,1,'Replay uses the already generated audio.');
 assert.equal(latest.playbackRate,1.25,'Cached answers also play at 1.25×.');
 latest.onended();assert.equal(speech.active,false);assert.equal(ends,2);
 speech.destroy();assert.equal(revoked.length,1);
 let players=0,turns=0;
 class SessionAudio extends AudioMock{constructor(url){super(url);players++;}}
 const session=new AssistantSpeech({AudioClass:SessionAudio,fetcher:async()=>{turns++;return new Response(new Blob(['mp3']),{status:200});}});
 assert(await session.prime());const player=latest;
 assert(await session.play({...answer,speechToken:'first'},{}));player.onended();
 assert(await session.play({...answer,text:'Second answer',speechToken:'second'},{}));assert.equal(latest,player,'Every answer uses the same audio element unlocked by Start voice');assert.equal(players,1);assert.equal(turns,2);player.onended();assert(!session.active);session.destroy();
 assert.equal(player.playbackRate,1.25,'Subsequent conversation turns keep the faster playback.');assert.equal(player.preservesPitch,true);
 const states=[];let blockedOnce=true,blockedFetches=0;
 class AutoplayMock extends AudioMock {play(){if(blockedOnce){blockedOnce=false;return Promise.reject(Object.assign(Error('Autoplay blocked'),{name:'NotAllowedError'}));}return Promise.resolve();}}
 const recovery=new AssistantSpeech({AudioClass:AutoplayMock,fetcher:async()=>{blockedFetches++;return new Response(new Blob(['mp3']),{status:200});},onState:state=>states.push(state)});
 assert.equal(await recovery.play(answer,button),false);assert.equal(states.at(-1),'blocked','A browser autoplay rejection should tell the visitor to tap Play.');
 assert.equal(await recovery.play(answer,button),true);assert.equal(blockedFetches,1,'A direct tap retries the cached audio without buying another generation.');recovery.destroy();
 let release,queued=0;const waiting=new AssistantSpeech({AudioClass:AudioMock,fetcher:async()=>{queued++;await new Promise(resolve=>release=resolve);return new Response(new Blob(['mp3']),{status:200});}});
 const pending=waiting.play(answer,button);assert.equal(waiting.state,'loading');
 assert.equal(await waiting.play(answer,button),false,'A second tap cancels even while voice audio is preparing.');
 assert.equal(waiting.active,false);release();assert.equal(await pending,false,'A cancelled request cannot start playback later');assert.equal(queued,1);waiting.destroy();
 let callbackFetches=0;const callbackFailure=new AssistantSpeech({AudioClass:AudioMock,fetcher:async()=>{callbackFetches++;return new Response(new Blob(['mp3']),{status:200});},onStart:()=>{throw Error('Recognition failed to pause');},onEnd:()=>{throw Error('Recognition failed to resume');},onState:()=>{throw Error('Status failed');}});
 assert.equal(await callbackFailure.play(answer,button),true,'Recognition and UI callback failures cannot block the voice request.');
 assert.equal(callbackFetches,1);callbackFailure.destroy();assert.equal(callbackFailure.active,false);
 const originalFetch=globalThis.fetch;let receiver;
 try{
  globalThis.fetch=function(){receiver=this;return Promise.resolve(new Response(new Blob(['mp3']),{status:200}));};
  const browserFetch=new AssistantSpeech({AudioClass:AudioMock});
  assert.equal(await browserFetch.play(answer,button),true);
  assert.equal(receiver,globalThis,'Native fetch must be called with the browser global, not the AssistantSpeech instance.');
  browserFetch.destroy();
 }finally{globalThis.fetch=originalFetch;}
 console.log('Assistant speech passed: private proxy request, replay cache, stop, recognition lifecycle and autoplay recovery.');
}finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
