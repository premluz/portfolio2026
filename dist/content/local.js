import {contentSets} from './sets.js';
import {DEFAULT_CONTENT_SET,isContentSetName} from './content-set.js';
import {createContentStore,createContentProvider} from './provider.js';

// The live content set is chosen at runtime (dev panel → /api/site-config); every set ships in the deploy.
// Outside a browser page (tests, build scripts) there is no API to ask, so the default set loads.
async function resolveContentSet(){
 if(!globalThis.document||typeof globalThis.fetch!=='function'||!/^https?:$/.test(globalThis.location?.protocol||''))return DEFAULT_CONTENT_SET;
 try{
  const response=await fetch('/api/site-config',{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error(`Site config responded ${response.status}`);
  const {contentSet}=await response.json();
  if(isContentSetName(contentSet)&&contentSets.includes(contentSet))return contentSet;
  throw new Error(`Site config named an unknown content set: ${contentSet}`);
 }catch(error){
  console.warn('Content set lookup failed; showing the default content.',error);
  return DEFAULT_CONTENT_SET;
 }
}
export const activeContentSet=await resolveContentSet();
const {catalog}=await import(`./${activeContentSet}.js`);
// Embedded snapshots keep the existing synchronous navigation and first render.
export const content=createContentStore(catalog);
export const localContentProvider=createContentProvider({load:async()=>catalog});
