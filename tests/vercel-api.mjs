import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import assistant from '../api/assistant.js';
import voice from '../api/voice.js';
import {vercelEnvironment,vercelRequest} from '../worker/vercel-adapter.mjs';
import {resetAssistantRateLimitsForTests} from '../worker/assistant-core.mjs';
import {providerErrorCode,providerRateLimits} from '../worker/provider-error.mjs';

globalThis.crypto??=webcrypto;
const origin='https://portfolio.example';
const request=(route,payload,extra={})=>new Request(origin+'/api/'+route,{
 method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'198.51.100.42',...extra},
 body:JSON.stringify(payload),
});
const envNames=['AI_API_KEY','OPENAI_API_KEY','AI_API_BASE_URL','AI_MODEL','AI_VOICE_KEY','AI_VOICE_ID'];
const previous=new Map(envNames.map(name=>[name,process.env[name]]));
const previousFetch=globalThis.fetch;
try{
 for(const name of envNames)delete process.env[name];
 process.env.AI_API_KEY='test-only-model-key';process.env.AI_VOICE_KEY='test-only-voice-key';
 process.env.AI_VOICE_ID='GEcKlrQ1MWkJKoc7UTJd';
 assert.equal(vercelEnvironment().AI_MODEL,'gpt-6-luna');
 assert.equal(vercelEnvironment({AI_MODEL:'custom',AI_API_BASE_URL:'https://models.example/v1'}).AI_MODEL,'custom');
 assert.equal(vercelEnvironment({AI_VOICE_KEY:' test-only-voice-key\n'}).AI_VOICE_KEY,'test-only-voice-key');
 const normalized=vercelRequest(request('assistant',{question:'Who is Prem?',sessionId:'header'}, {'cf-connecting-ip':'spoofed'}));
 assert.equal(normalized.headers.get('cf-connecting-ip'),'198.51.100.42');
 assert.equal((await normalized.json()).sessionId,'header','IP normalization preserves the body stream');
 const ipv6=vercelRequest(request('voice',{}, {'x-forwarded-for':'2001:db8::1, 198.51.100.7'}));
 assert.equal(ipv6.headers.get('cf-connecting-ip'),'2001:db8::1');
 const missingIp=vercelRequest(new Request(origin+'/api/assistant',{headers:{'cf-connecting-ip':'spoofed'}}));
 assert.equal(missingIp.headers.get('cf-connecting-ip'),'unknown');

 globalThis.fetch=()=>{throw Error('Curated answers must not contact a provider.');};
 const curated=await assistant.fetch(request('assistant',{question:'Who is Prem?',sessionId:'vercel-curated'}));
 assert.equal(curated.status,200);
 const answer=await curated.json();assert(answer.text);assert(answer.speechToken);
 assert.equal((await assistant.fetch(new Request(origin+'/api/assistant'))).status,405);
 assert.equal((await assistant.fetch(request('assistant',{question:'Who is Prem?',sessionId:'cross-site'},{origin:'https://other.example'}))).status,403);
 assert.equal((await assistant.fetch(request('assistant',{question:'x'.repeat(5000),sessionId:'too-big'}))).status,413);

 let providerCalls=0;
 globalThis.fetch=async(url,options)=>{
  providerCalls++;
  assert.equal(url,'https://api.openai.com/v1/chat/completions');
  assert.equal(options.headers.authorization,'Bearer test-only-model-key');
  const body=JSON.parse(options.body);assert.equal(body.model,'gpt-6-luna');
  return Response.json({choices:[{message:{content:JSON.stringify({answer:'Tracr reduced navigation from ten areas to three.',sourceIds:['tracr']})}}]});
 };
 resetAssistantRateLimitsForTests();
 const model=await assistant.fetch(request('assistant',{question:'How did Tracr simplify its platform?',sessionId:'vercel-model'}));
 assert.equal(model.status,200);assert.equal(providerCalls,1);
 assert.deepEqual((await model.json()).documentIds,['tracr']);

 globalThis.fetch=async(url,options)=>{
  assert(url.includes('/text-to-speech/'+process.env.AI_VOICE_ID));
  assert.equal(options.headers['xi-api-key'],'test-only-voice-key');
  return new Response(new Uint8Array([73,68,51]),{headers:{'content-type':'audio/mpeg'}});
 };
 const spoken=await voice.fetch(request('voice',{text:answer.text,sessionId:'vercel-curated',speechToken:answer.speechToken}));
 assert.equal(spoken.status,200);assert.equal(spoken.headers.get('content-type'),'audio/mpeg');
 assert.deepEqual([...new Uint8Array(await spoken.arrayBuffer())],[73,68,51]);
 assert.equal((await voice.fetch(request('voice',{text:answer.text,sessionId:'wrong-session',speechToken:answer.speechToken}))).status,403);
 assert.equal((await voice.fetch(new Request(origin+'/api/voice'))).status,405);

 globalThis.fetch=async()=>Response.json({error:{code:'insufficient_quota',message:'Private provider details'}},{status:429});
 const exhausted=await assistant.fetch(request('assistant',{question:'How did Tracr simplify its platform?',sessionId:'vercel-quota'}));
 assert.equal(exhausted.status,502);
 const quota=await exhausted.json();assert.equal(quota.providerCode,'insufficient_quota');assert(!JSON.stringify(quota).includes('Private provider details'));
 globalThis.fetch=async()=>Response.json({detail:{status:'voice_not_found',message:'Private voice details'}},{status:400});
 const absentVoice=await voice.fetch(request('voice',{text:answer.text,sessionId:'vercel-curated',speechToken:answer.speechToken}));
 const voiceFailure=await absentVoice.json();assert.equal(voiceFailure.providerCode,'voice_not_found');assert(!JSON.stringify(voiceFailure).includes('Private voice details'));
 assert.equal(await providerErrorCode(Response.json({error:{code:'unrecognized-private-value'}})),'unknown_provider_error');
 assert.equal(await providerErrorCode(new Response('not JSON')),'invalid_provider_error');
 assert.deepEqual(providerRateLimits(new Response('',{headers:{'x-ratelimit-limit-tokens':'10000','retry-after':'2.5'}})),{tokens:10000,retryAfterSeconds:2.5});
 assert.deepEqual(providerRateLimits(new Response('',{headers:{'x-ratelimit-limit-project-tokens':'0','x-ratelimit-remaining-requests':'bad','retry-after':'-1'}})),{projectTokens:0});
}finally{
 globalThis.fetch=previousFetch;
 for(const [name,value] of previous)value===undefined?delete process.env[name]:process.env[name]=value;
}
console.log('Vercel API passed: real entry points, provider defaults, streamed speech, signed session binding, origin/body guards and trusted client IPs.');
