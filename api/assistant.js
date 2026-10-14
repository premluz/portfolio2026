import {handleAssistantRequest} from '../worker/assistant-core.mjs';
import {publishedAssistantDocuments} from '../dist/server/content.js';
import {vercelEnvironment,vercelRequest} from '../worker/vercel-adapter.mjs';

// Vercel's Web Standard handler preserves the core's bounded Request stream.
// https://vercel.com/docs/functions/runtimes/node-js
export default {
 fetch(request){
  return handleAssistantRequest(vercelRequest(request),vercelEnvironment(),{documents:publishedAssistantDocuments});
 },
};
