import {exportSettings} from './settings-transfer.js';
import {revisionKey} from './site-settings.js';

// Publishing saves the panel's current settings on the server for this domain only, so every visitor gets them
// without a deploy. "Use built-in" removes the published profile and the shipped settings file applies again.
export function mountSettingsPublish(panel,{schema,writable,canChange=()=>true,storage,fetch:fetcher=globalThis.fetch,reload=()=>location.reload()}={}){
 if(storage===undefined)try{storage=globalThis.localStorage;}catch{}
 const publish=panel.querySelector('#settingsPublish'),unpublish=panel.querySelector('#settingsUnpublish'),status=panel.querySelector('#settingsPublishStatus');
 if(!publish||!unpublish)return;
 const say=text=>{status.textContent=text;};
 if(!writable){publish.disabled=unpublish.disabled=true;say('Publishing is unavailable: the site config store is not connected.');return;}
 const send=async settings=>{
  const response=await fetcher('/api/site-config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({settings})});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body.message||body.error||`Site config responded ${response.status}`);
  return body;
 };
 const run=async(action,start,done)=>{
  if(!canChange()){say('Wait for the current transition to finish.');return;}
  publish.disabled=unpublish.disabled=true;say(start);
  try{await action();say(done);}
  catch(error){console.error('Publishing site settings failed.',error);say(`Not saved: ${error.message}`);}
  finally{publish.disabled=unpublish.disabled=false;}
 };
 publish.onclick=()=>run(async()=>{
  const body=await send(exportSettings(schema,storage));
  // These settings are already applied here, so this browser must not re-import them as a new revision.
  try{storage?.setItem(revisionKey,body.settings.revision);}catch(error){console.warn('Could not record the published revision.',error);}
 },'Publishing…','Published. Visitors get these settings on their next page load, within about a minute.');
 unpublish.onclick=()=>run(async()=>{await send(null);reload();},'Restoring built-in settings…','Built-in settings restored. Reloading…');
}
