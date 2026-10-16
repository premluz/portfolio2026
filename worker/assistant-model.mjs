import {assistantLimits} from '../dist/assistant-limits.js';
import {assistantInstructions,answerSchema,parseModelAnswer} from './assistant-policy.mjs';
import {providerErrorCode,providerRateLimits} from './provider-error.mjs';

export function modelRequest(model,question,history,corpus,openAI){
 const titles=new Map(corpus.map(record=>[record.id,record.client?.split(' • ')[0]||record.title]));
 const turns=history.map(({role,text,documentIds})=>({role,text,...(documentIds.length?{shownProjects:documentIds.map(id=>titles.get(id)).filter(Boolean)}:{})}));
 const body={model,temperature:0,max_tokens:assistantLimits.outputTokens,messages:[
  {role:'system',content:assistantInstructions},{role:'user',content:JSON.stringify({question,history:turns,sources:corpus})},
 ]};
 if(openAI){
  delete body.max_tokens;body.max_completion_tokens=assistantLimits.outputTokens;
  body.store=false;body.service_tier='flex';body.response_format=answerSchema(corpus);
  if(model==='gpt-6-luna')body.reasoning_effort='none';
  else if(/^gpt-[56]/.test(model))delete body.temperature;
 }
 return body;
}

export async function requestModel({endpoint,apiKey,model,question,history,corpus,fetcher}){
 const body=modelRequest(model,question,history,corpus,endpoint.hostname==='api.openai.com');
 const send=request=>fetcher(endpoint.toString(),{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(assistantLimits.requestTimeout)});
 let response=await send(body);
 if(endpoint.hostname==='api.openai.com'&&response.status===429){
  const error=await response.clone().json();
  const details=[error?.error?.code,error?.error?.type,error?.error?.message].filter(Boolean).join(' ');
  if(/resource[ _-]?unavailable/i.test(details))response=await send({...body,service_tier:'auto'});
 }
 if(!response.ok)return {error:'model_unavailable',providerStatus:response.status,providerCode:await providerErrorCode(response),providerLimits:providerRateLimits(response)};
 const result=await response.json(),message=result?.choices?.[0]?.message;
 if(message?.refusal)throw new Error('Assistant provider declined this request');
 return {answer:parseModelAnswer(message?.content,new Set(corpus.map(record=>record.id)))};
}
