import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {handleAssistantRequest,resetAssistantRateLimitsForTests} from '../worker/assistant-core.mjs';
import {handleVoiceRequest,signSpeech,verifySpeech,resetVoiceRateLimitsForTests} from '../worker/voice-core.mjs';

const documents=JSON.parse(await fs.readFile(new URL('../dist/content/catalog.json',import.meta.url),'utf8')).documents;
const origin='https://portfolio.example',secret='test-voice-key',sessionId='voice-test-session';
const request=(body,otherOrigin=origin)=>new Request(origin+'/api/voice',{method:'POST',headers:{origin:otherOrigin,'content-type':'application/json','cf-connecting-ip':'192.0.2.123'},body:JSON.stringify(body)});
const now=Date.UTC(2026,9,11,10);
const text='Prem built Rios and Porter.';
const token=await signSpeech(text,sessionId,secret,now);
assert(await verifySpeech(text,sessionId,token,secret,now));
assert.equal(await verifySpeech(text+' More',sessionId,token,secret,now),false,'Speech is authorized only for the returned answer.');
assert.equal(await verifySpeech(text,'other-session',token,secret,now),false);
resetAssistantRateLimitsForTests();
const unsupported=await handleAssistantRequest(new Request(origin+'/api/assistant',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({question:'A question outside the portfolio',sessionId})}),{AI_API_KEY:'test-only',AI_API_BASE_URL:'https://model.example/v1',AI_MODEL:'small-model',AI_VOICE_KEY:secret},{documents,now,fetcher:async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'An unsupported answer',sourceIds:[]})}}]}))});
const unsupportedAnswer=await unsupported.json();assert.equal(unsupported.status,200);assert.equal(unsupportedAnswer.documentIds.length,0);assert(await verifySpeech(unsupportedAnswer.spoken,sessionId,unsupportedAnswer.speechToken,secret,now),'The grounded fallback is also authorized for voice, so later answers do not silently stop speaking');
assert.equal(await verifySpeech(text,sessionId,token,secret,now+13*60*60*1000),false,'Speech authorization expires.');

resetAssistantRateLimitsForTests();
const curated=await handleAssistantRequest(new Request(origin+'/api/assistant',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({question:'Who is Prem?',sessionId})}),{AI_VOICE_KEY:secret},{documents,now});
const answer=await curated.json();
assert.equal(curated.status,200);
assert(await verifySpeech(answer.spoken,sessionId,answer.speechToken,secret,now),'Approved answers receive playback tokens for their short spoken line without calling the language model.');
assert.equal(answer.text===answer.spoken||await verifySpeech(answer.text,sessionId,answer.speechToken,secret,now),answer.text===answer.spoken,'The full written answer is not authorized for speech');

let captured;
const fetcher=async(url,options)=>{captured={url,options};return new Response(new Uint8Array([0x49,0x44,0x33,0x03]),{headers:{'content-type':'audio/mpeg'}});};
resetVoiceRateLimitsForTests();
const response=await handleVoiceRequest(request({text,sessionId,speechToken:token}),{AI_VOICE_KEY:secret,AI_VOICE_ID:'JxfH70f7jvYhi0DKD8Xs'},{fetcher,now});
assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'audio/mpeg');
assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[0x49,0x44,0x33,0x03]);
assert(captured.url.includes('/v1/text-to-speech/JxfH70f7jvYhi0DKD8Xs?'));
assert.equal(captured.options.headers['xi-api-key'],secret);
assert.equal(JSON.parse(captured.options.body).model_id,'eleven_flash_v2_5');
assert.equal(JSON.parse(captured.options.body).text,text);

const forged=await handleVoiceRequest(request({text:text+' More',sessionId,speechToken:token}),{AI_VOICE_KEY:secret},{fetcher,now});
assert.equal(forged.status,403);
const crossSite=await handleVoiceRequest(request({text,sessionId,speechToken:token},'https://other.example'),{AI_VOICE_KEY:secret},{fetcher,now});
assert.equal(crossSite.status,403);
const unavailable=await handleVoiceRequest(request({text,sessionId,speechToken:token}),{},{fetcher,now});
assert.equal(unavailable.status,503);

resetVoiceRateLimitsForTests();
for(let i=0;i<12;i++)assert.equal((await handleVoiceRequest(request({text,sessionId,speechToken:token}),{AI_VOICE_KEY:secret},{fetcher,now})).status,200);
assert.equal((await handleVoiceRequest(request({text,sessionId,speechToken:token}),{AI_VOICE_KEY:secret},{fetcher,now})).status,429);
console.log('Voice API passed: signed answer, session/expiry binding, ElevenLabs proxy, private key, origin and rate limits.');
