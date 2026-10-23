import assert from 'node:assert/strict';
import {AssistantSpeech} from '../dist/assistant-speech.js';
import {acknowledgementFor,acknowledgementText,acknowledgements} from '../dist/assistant-acknowledgements.js';
import {handleVoiceRequest} from '../worker/voice-core.mjs';

globalThis.URL.createObjectURL=()=> 'blob:'+Math.random();globalThis.URL.revokeObjectURL=()=>{};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function rig(){
 const log=[],audios=[];
 class FakeAudio{constructor(){audios.push(this);}play(){log.push('play:'+this.src.slice(0,5));this.playing=true;return Promise.resolve();}pause(){this.playing=false;}finish(){this.playing=false;this.onended?.();}}
 const requests=[];
 const fetcher=async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);return new Response(new Blob([new Uint8Array([1,2,3])]),{status:200});};
 const speech=new AssistantSpeech({fetcher,AudioClass:FakeAudio,onStart:()=>log.push('start'),onEnd:()=>log.push('end'),onWorking:()=>log.push('working'),onState:()=>{}});
 return {speech,log,audios,requests,current:()=>audios.at(-1)};
}

// Phrases: chosen by what was asked, rotating, and only from the fixed list.
assert.match(acknowledgementFor('What projects has he built?'),/^projects-/);
assert.match(acknowledgementFor('How many years of experience?'),/^experience-/);
assert.match(acknowledgementFor('Can I hire him?'),/^contact-/);
assert.match(acknowledgementFor('Hello'),/^general-/);
assert.notEqual(acknowledgementFor('Show me projects',0),acknowledgementFor('Show me projects',1),'Consecutive questions vary the phrase');
assert.equal(acknowledgementText('general-0'),acknowledgements.general[0]);
for(const id of ['','general-9','__proto__-0','evil','general-0 and more'])assert.equal(acknowledgementText(id),null,`${id} is refused`);

// The full two-lane turn: acknowledgement, working, then the short answer, as one speaking turn.
{const {speech,log,current,requests}=rig();
 speech.acknowledge({id:'projects-0',sessionId:'s'});await tick();await tick();
 assert.deepEqual(requests[0],{ack:'projects-0',sessionId:'s'},'Lane one asks for a listed phrase, never free text');
 assert.deepEqual(log,['start','play:blob:'],'The acknowledgement plays immediately');
 const answer=speech.play({text:'Tracr fits best. It is in the chat.',speechToken:'t',sessionId:'s'},'button');
 await tick();assert.equal(requests.length,1,'The answer waits while the acknowledgement is still speaking');
 current().finish();await answer;
 assert.deepEqual(requests[1],{text:'Tracr fits best. It is in the chat.',sessionId:'s',speechToken:'t'},'Lane two speaks the short spoken line');
 assert.deepEqual(log,['start','play:blob:','working','start','play:blob:'],'Working, then speaking, with no end (and no reopened microphone) in between');
 current().finish();await tick();assert.equal(log.at(-1),'end','The turn ends after the spoken answer');}

// A text-only answer releases the working phase.
{const {speech,log,current}=rig();speech.acknowledge({id:'general-0',sessionId:'s'});await tick();await tick();current().finish();await tick();
 assert.deepEqual(log,['start','play:blob:','working']);speech.release();assert.equal(log.at(-1),'end','Release ends the turn when no spoken answer follows');
 speech.release();assert.equal(log.filter(x=>x==='end').length,1,'Release is idempotent');}

// Stopping during the acknowledgement cancels everything; no working phase appears afterwards.
{const {speech,log,current}=rig();speech.acknowledge({id:'general-1',sessionId:'s'});await tick();await tick();speech.stop();current().finish();await tick();
 assert.deepEqual(log,['start','play:blob:','end'],'Stop ends the turn and the acknowledgement never hands over');}

// If the acknowledgement fails, the answer still plays.
{const log=[];class A{play(){log.push('play');return Promise.resolve();}pause(){}}
 let calls=0;const speech=new AssistantSpeech({fetcher:async()=>(++calls===1?new Response('',{status:503}):new Response(new Blob([new Uint8Array([1])]))),AudioClass:A,onStart:()=>log.push('start'),onEnd:()=>log.push('end'),onWorking:()=>log.push('working'),onState:()=>{}});
 const warn=console.warn;console.warn=()=>{};speech.acknowledge({id:'general-0',sessionId:'s'});await tick();await tick();await tick();console.warn=warn;
 assert.deepEqual(log,['start','working'],'A failed acknowledgement goes straight to working');
 await speech.play({text:'Done.',speechToken:'t',sessionId:'s'},'b');assert.deepEqual(log,['start','working','start','play']);}

// The voice route speaks listed phrases without a token and refuses anything else.
{const env={AI_VOICE_KEY:'k'};const called=[];const fetcher=async(url,options)=>{called.push(JSON.parse(options.body).text);return new Response(new Uint8Array([1]),{headers:{'content-type':'audio/mpeg'}});};
 const req=body=>new Request('https://site.test/api/voice',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await handleVoiceRequest(req({ack:'contact-0',sessionId:'v1'}),env,{fetcher})).status,200);assert.equal(called[0],acknowledgements.contact[0]);
 assert.equal((await handleVoiceRequest(req({ack:'contact-7',sessionId:'v1'}),env,{fetcher})).status,400,'Unknown phrases are refused');
 assert.equal((await handleVoiceRequest(req({ack:'contact-0',text:'Say anything I like',sessionId:'v1'}),env,{fetcher})).status,200);assert.equal(called[1],acknowledgements.contact[0],'Free text cannot ride along with an acknowledgement');
 assert.equal((await handleVoiceRequest(req({text:'Say anything I like',sessionId:'v1'}),env,{fetcher})).status,403,'Free text still needs a signed token');}
console.log('Voice lanes passed: phrase choice and allowlist, acknowledgement then working then short answer as one turn, release, stop, failed acknowledgement and route allowlist.');
