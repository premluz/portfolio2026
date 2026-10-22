import {contentSets} from './sets.js';
import {DEFAULT_CONTENT_SET,isContentSetName} from './content-set.js';

// One request at startup answers everything the server decides at runtime: the live content set and the
// published settings profile. Outside a browser page (tests, build scripts) there is no API to ask.
const fallback=Object.freeze({contentSet:DEFAULT_CONTENT_SET,settings:null,writable:false});

async function loadSiteConfig(){
 if(!globalThis.document||typeof globalThis.fetch!=='function'||!/^https?:$/.test(globalThis.location?.protocol||''))return fallback;
 try{
  const response=await fetch('/api/site-config',{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error(`Site config responded ${response.status}`);
  const config=await response.json();
  if(!isContentSetName(config.contentSet)||!contentSets.includes(config.contentSet))throw new Error(`Site config named an unknown content set: ${config.contentSet}`);
  return {contentSet:config.contentSet,settings:config.settings?.revision&&config.settings.export?config.settings:null,writable:config.writable===true};
 }catch(error){
  console.warn('Site config lookup failed; showing the default content and built-in settings.',error);
  return fallback;
 }
}
export const siteConfig=await loadSiteConfig();
