import {handleSiteConfigRequest,globalConfigStore} from '../worker/site-config-core.mjs';
import {contentSets} from '../dist/content/sets.js';

const store=globalConfigStore(process.env);
// Reads and writes the live content set for the dev panel and the site's first load.
// https://vercel.com/docs/functions/runtimes/node-js
export default {
 fetch(request){
  return handleSiteConfigRequest(request,store,{sets:contentSets});
 },
};
