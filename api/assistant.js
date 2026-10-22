import {handleAssistantRequest} from '../worker/assistant-core.mjs';
import {assistantDocumentSets} from '../dist/server/content.js';
import {contentSets} from '../dist/content/sets.js';
import {DEFAULT_CONTENT_SET} from '../dist/content/content-set.js';
import {activeContentSet,globalConfigStore} from '../worker/site-config-core.mjs';
import {vercelEnvironment,vercelRequest} from '../worker/vercel-adapter.mjs';

const store=globalConfigStore(process.env);
// Vercel's Web Standard handler preserves the core's bounded Request stream.
// https://vercel.com/docs/functions/runtimes/node-js
export default {
 async fetch(request){
  const set=await activeContentSet(store,contentSets).catch(error=>{console.error('Content set read failed; answering from the default set.',error);return DEFAULT_CONTENT_SET;});
  const documents=assistantDocumentSets[set];
  return handleAssistantRequest(vercelRequest(request),vercelEnvironment(),{documents});
 },
};
