import {DEFAULT_CONTENT_SET,isContentSetName} from '../dist/content/content-set.js';

// Which content set is live is the only runtime-writable value. Sets ship in the deploy, so a write can
// only pick between them: nothing is uploaded or deleted. Vercel Global Config holds the choice.
// Read: https://vercel.com/docs/global-config/vercel-api#request-a-single-item
// Write: https://vercel.com/docs/global-config/vercel-api#update-your-global-config-items
export const CONTENT_SET_KEY='contentSet';
const READ_CACHE_MS=5000;
const json=(status,body,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});

export function globalConfigStore(env,{fetch:fetcher=globalThis.fetch}={}){
 const id=env.GLOBAL_CONFIG_ID,readToken=env.GLOBAL_CONFIG_READ_TOKEN,writeToken=env.VERCEL_API_TOKEN,team=env.VERCEL_TEAM_ID;
 if(!id||!readToken||!writeToken)return null;
 let cached=null;
 return {
  async read(){
   if(cached&&Date.now()-cached.at<READ_CACHE_MS)return cached.value;
   const response=await fetcher(`https://global-config.vercel.com/${encodeURIComponent(id)}/item/${CONTENT_SET_KEY}`,{headers:{authorization:`Bearer ${readToken}`}});
   if(response.status===404){cached={at:Date.now(),value:null};return null;}
   if(!response.ok)throw new Error(`Global Config read failed with ${response.status}`);
   const value=await response.json();cached={at:Date.now(),value};return value;
  },
  async write(value){
   const response=await fetcher(`https://api.vercel.com/v1/global-config/${encodeURIComponent(id)}/items${team?`?teamId=${encodeURIComponent(team)}`:''}`,{method:'PATCH',headers:{authorization:`Bearer ${writeToken}`,'content-type':'application/json'},body:JSON.stringify({items:[{operation:'upsert',key:CONTENT_SET_KEY,value}]})});
   if(!response.ok)throw new Error(`Global Config write failed with ${response.status}`);
   cached={at:Date.now(),value};
  }
 };
}

// Local development has no Global Config; the Node server passes this explicitly so switching still works there.
export function memoryStore(initial=null){let value=initial;return {async read(){return value;},async write(next){value=next;}};}

export async function activeContentSet(store,sets){
 const value=store?await store.read():null;
 return isContentSetName(value)&&sets.includes(value)?value:DEFAULT_CONTENT_SET;
}

export async function handleSiteConfigRequest(request,store,{sets}){
 if(request.method==='GET')return json(200,{contentSet:await activeContentSet(store,sets),contentSets:sets,writable:Boolean(store)},{'cache-control':'public, max-age=0, s-maxage=5, stale-while-revalidate=30'});
 if(request.method!=='POST')return json(405,{error:'method_not_allowed'},{allow:'GET, POST'});
 if(!store)return json(503,{error:'site_config_unavailable',message:'Set GLOBAL_CONFIG_ID, GLOBAL_CONFIG_READ_TOKEN and VERCEL_API_TOKEN to save the content set.'});
 let body;
 try{body=await request.json();}catch{return json(400,{error:'invalid_json'});}
 if(!isContentSetName(body?.contentSet)||!sets.includes(body.contentSet))return json(400,{error:'unknown_content_set',contentSets:sets});
 await store.write(body.contentSet);
 return json(200,{contentSet:body.contentSet,contentSets:sets,writable:true},{'cache-control':'no-store'});
}
