import assert from 'node:assert/strict';
import {catalog} from '../dist/content/catalog.js';
import {answerPortfolioQuestion} from '../dist/portfolio-assistant.js';
import {handleAssistantRequest,resetAssistantRateLimitsForTests,publishedFallbackAnswer} from '../worker/assistant-core.mjs';
import {verifySpeech} from '../worker/voice-core.mjs';
const documents=catalog.documents,question='What changed the Tracer',sessionId='fallback-speech',secret='test-only-voice-secret',now=Date.UTC(2026,9,12,12);
const req=()=>new Request('https://portfolio.example/api/assistant',{method:'POST',headers:{origin:'https://portfolio.example','content-type':'application/json'},body:JSON.stringify({question,sessionId})});
const expected=answerPortfolioQuestion(question);
assert(expected.text.includes('10→3'));
assert.equal(publishedFallbackAnswer(question,documents).text,expected.text,'The server reuses the exact grounded formatter that produced the reported reply');
for(const fetcher of [async()=>new Response('Provider failed',{status:502}),async()=>{throw Error('Timed out');},async()=>new Response(JSON.stringify({choices:[{message:{content:'broken json'}}]}))]){
 resetAssistantRateLimitsForTests();
 const response=await handleAssistantRequest(req(),{AI_API_KEY:'test-only',AI_API_BASE_URL:'https://models.example/v1',AI_MODEL:'small-model',AI_VOICE_KEY:secret},{documents,fetcher,now});
 assert.equal(response.status,502);const reply=await response.json();assert.equal(reply.text,expected.text);assert.equal(reply.responseMode,'published-fallback');assert.deepEqual(reply.documentIds,['tracr']);assert(await verifySpeech(reply.spoken,sessionId,reply.speechToken,secret,now),'Provider errors, timeouts and invalid JSON still authorize this fallback\'s spoken line for ElevenLabs');
}
const draft={...documents.find(d=>d.id==='tracr'),status:'draft',highlights:'SECRET DRAFT CLAIM'};
assert(!publishedFallbackAnswer(question,[draft,...documents.filter(d=>d.id!=='tracr')]).text.includes('SECRET'),'Unpublished fields cannot enter a signed response');
console.log('Published fallback speech passed: exact reported question, provider errors/timeouts/invalid JSON, signed fallback and draft exclusion.');
