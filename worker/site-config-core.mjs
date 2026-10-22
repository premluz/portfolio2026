import {DEFAULT_CONTENT_SET,isContentSetName} from '../dist/content/content-set.js';
import {validateSettingsExport,settingsRevision} from './site-settings-validation.mjs';

// Two values are runtime-writable: which content set is live (sets ship in the deploy, so a write can only pick
// between them) and the published settings profile. Nothing is uploaded and nothing is deleted. Vercel Global
// Config holds both, each project under its own key.
// Read: https://vercel.com/docs/global-config/vercel-api#request-a-single-item
// Write: https://vercel.com/docs/global-config/vercel-api#update-your-global-config-items
export const CONTENT_SET_KEY='contentSet';
// Projects that share one store (same codebase, different sites) each set CONTENT_SET_KEY to keep their own choice.
const KEY_PATTERN=/^[A-Za-z0-9_-]{1,50}$/;
export const CONTENT_SET_ITEM='contentSet',SETTINGS_ITEM='settings';
const itemKey=(base,item)=>item===SETTINGS_ITEM?`${base}-settings`:base;
const READ_CACHE_MS=5000;
const json=(status,body,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});

// Connecting a store to a project adds one connection string (https://…/ecfg_…?token=…) holding the ID and read
// token; explicit GLOBAL_CONFIG_ID / GLOBAL_CONFIG_READ_TOKEN still take precedence.
export function readConnectionString(value){
 if(!value)return {};
 let url;try{url=new URL(value);}catch(error){throw new Error('GLOBAL_CONFIG is not a valid connection string URL',{cause:error});}
 const id=url.pathname.split('/').find(part=>part.startsWith('ecfg_'));
 return {id,token:url.searchParams.get('token')||undefined,origin:url.origin};
}

export function globalConfigStore(env,{fetch:fetcher=globalThis.fetch}={}){
 const connection=readConnectionString(env.GLOBAL_CONFIG||env.EDGE_CONFIG);
 const id=env.GLOBAL_CONFIG_ID||connection.id,readToken=env.GLOBAL_CONFIG_READ_TOKEN||connection.token,writeToken=env.VERCEL_API_TOKEN,team=env.VERCEL_TEAM_ID;
 if(!id||!readToken||!writeToken)return null;
 const key=env.CONTENT_SET_KEY?.trim()||CONTENT_SET_KEY;
 if(!KEY_PATTERN.test(key))throw new Error('CONTENT_SET_KEY may only contain letters, numbers (up to 50), - and _');
 const readOrigin=env.GLOBAL_CONFIG_ID?'https://global-config.vercel.com':connection.origin||'https://global-config.vercel.com';
 const cache=new Map();
 return {
  async read(item=CONTENT_SET_ITEM){
   const hit=cache.get(item);if(hit&&Date.now()-hit.at<READ_CACHE_MS)return hit.value;
   const response=await fetcher(`${readOrigin}/${encodeURIComponent(id)}/item/${itemKey(key,item)}`,{headers:{authorization:`Bearer ${readToken}`}});
   if(response.status===404){cache.set(item,{at:Date.now(),value:null});return null;}
   if(!response.ok)throw new Error(`Global Config read failed with ${response.status}`);
   const value=await response.json();cache.set(item,{at:Date.now(),value});return value;
  },
  async write(item,value){
   const response=await fetcher(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}/items${team?`?teamId=${encodeURIComponent(team)}`:''}`,{method:'PATCH',headers:{authorization:`Bearer ${writeToken}`,'content-type':'application/json'},body:JSON.stringify({items:[{operation:'upsert',key:itemKey(key,item),value}]})});
   if(!response.ok)throw new Error(`Global Config write failed with ${response.status}`);
   cache.set(item,{at:Date.now(),value});
  }
 };
}

// Local development has no Global Config; the Node server passes this explicitly so publishing still works there.
export function memoryStore(initial={}){const items=new Map(Object.entries(initial));return {async read(item=CONTENT_SET_ITEM){return items.get(item)??null;},async write(item,value){items.set(item,value);}};}

export async function activeContentSet(store,sets){
 const value=store?await store.read(CONTENT_SET_ITEM):null;
 return isContentSetName(value)&&sets.includes(value)?value:DEFAULT_CONTENT_SET;
}

// A stored profile that no longer has the expected shape is reported and ignored, so the built-in settings apply.
export async function publishedSettings(store){
 const value=store?await store.read(SETTINGS_ITEM):null;
 if(value===null)return null;
 if(typeof value?.revision==='string'&&validateSettingsExport(value.export).ok)return {export:value.export,revision:value.revision};
 console.warn('Stored site settings are malformed; serving the built-in settings.');
 return null;
}

export async function handleSiteConfigRequest(request,store,{sets}){
 if(request.method==='GET')return json(200,{contentSet:await activeContentSet(store,sets),contentSets:sets,writable:Boolean(store),settings:await publishedSettings(store)},{'cache-control':'public, max-age=0, s-maxage=5, stale-while-revalidate=30'});
 if(request.method!=='POST')return json(405,{error:'method_not_allowed'},{allow:'GET, POST'});
 if(!store)return json(503,{error:'site_config_unavailable',message:'Connect a Global Config store (GLOBAL_CONFIG) and set VERCEL_API_TOKEN to publish changes.'});
 let body;
 try{body=await request.json();}catch{return json(400,{error:'invalid_json'});}
 const headers={'cache-control':'no-store'};
 if(body&&'settings' in body){
  // null returns the site to the built-in settings; anything else must be a valid exported profile.
  if(body.settings===null){await store.write(SETTINGS_ITEM,null);return json(200,{settings:null},headers);}
  const checked=validateSettingsExport(body.settings);
  if(!checked.ok)return json(400,{error:'invalid_settings',message:checked.reason});
  const revision=await settingsRevision(checked.value.settings);
  await store.write(SETTINGS_ITEM,{export:checked.value,revision});
  return json(200,{settings:{revision}},headers);
 }
 if(!isContentSetName(body?.contentSet)||!sets.includes(body.contentSet))return json(400,{error:'unknown_content_set',contentSets:sets});
 await store.write(CONTENT_SET_ITEM,body.contentSet);
 return json(200,{contentSet:body.contentSet,contentSets:sets,writable:true},headers);
}
