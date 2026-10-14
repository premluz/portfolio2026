import { handleAssistantRequest } from './assistant-core.mjs';
import { publishedAssistantDocuments } from './content.js';
import { handleVoiceRequest } from './voice-core.mjs';

export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/assistant')return handleAssistantRequest(request,env,{documents:publishedAssistantDocuments});
  if(url.pathname==='/api/voice')return handleVoiceRequest(request,env);
  if(env.ASSETS?.fetch)return env.ASSETS.fetch(request);
  return new Response('Site assets are unavailable.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
 },
};
