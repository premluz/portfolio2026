import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {handleSiteConfigRequest,globalConfigStore,memoryStore,activeContentSet,CONTENT_SET_KEY} from '../worker/site-config-core.mjs';
import {contentSets} from '../dist/content/sets.js';
import {activeContentSet as loadedSet,content} from '../dist/content/local.js';

const sets=['catalog','catalog2'];
const call=(store,method='GET',body)=>handleSiteConfigRequest(new Request('https://site.test/api/site-config',{method,...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})}),store,{sets});

// Reading and switching between shipped sets.
const store=memoryStore();
let response=await call(store);assert.equal(response.status,200);assert.deepEqual(await response.json(),{contentSet:'catalog',contentSets:sets,writable:true},'An unset choice serves the default set');
assert.match(response.headers.get('cache-control'),/s-maxage=5/,'Reads are cached briefly at the CDN');
response=await call(store,'POST',{contentSet:'catalog2'});assert.equal(response.status,200);assert.equal(await store.read(),'catalog2');
assert.equal((await (await call(store)).json()).contentSet,'catalog2','The saved set is served');

// Writes can only name a shipped set; there is nothing else to change.
for(const contentSet of ['catalog3','../secrets','',null]){response=await call(store,'POST',{contentSet});assert.equal(response.status,400,`Rejects ${contentSet}`);}
assert.equal((await call(store,'POST','not json')).status,400);
assert.equal((await call(store,'DELETE')).status,405,'No delete or other methods');
assert.equal(await store.read(),'catalog2','Rejected writes leave the choice unchanged');
assert.equal(await activeContentSet(memoryStore('catalog9'),sets),'catalog','A stale saved name falls back to the default set');

// Without Global Config the API still answers reads, and refuses writes loudly.
response=await call(null);assert.deepEqual(await response.json(),{contentSet:'catalog',contentSets:sets,writable:false});
response=await call(null,'POST',{contentSet:'catalog2'});assert.equal(response.status,503);assert.match((await response.json()).message,/GLOBAL_CONFIG_ID/);

// Global Config requests follow the documented endpoints.
assert.equal(globalConfigStore({}),null,'Missing variables mean no store');
const requests=[];let saved='catalog2';
const fetch=async(url,init={})=>{requests.push({url,method:init.method||'GET',auth:init.headers?.authorization,body:init.body});if(init.method==='PATCH'){saved=JSON.parse(init.body).items[0].value;return new Response('{"status":"ok"}');}return new Response(JSON.stringify(saved));};
const remote=globalConfigStore({GLOBAL_CONFIG_ID:'ecfg_1',GLOBAL_CONFIG_READ_TOKEN:'read',VERCEL_API_TOKEN:'write',VERCEL_TEAM_ID:'team_1'},{fetch});
assert.equal(await remote.read(),'catalog2');await remote.read();
assert.equal(requests.length,1,'Reads are cached for a few seconds');
assert.deepEqual(requests[0],{url:`https://global-config.vercel.com/ecfg_1/item/${CONTENT_SET_KEY}`,method:'GET',auth:'Bearer read',body:undefined});
await remote.write('catalog');
assert.deepEqual(requests[1],{url:'https://api.vercel.com/v1/global-config/ecfg_1/items?teamId=team_1',method:'PATCH',auth:'Bearer write',body:JSON.stringify({items:[{operation:'upsert',key:CONTENT_SET_KEY,value:'catalog'}]})});
assert.equal(await remote.read(),'catalog','A write refreshes the cached value');
const failing=globalConfigStore({GLOBAL_CONFIG_ID:'x',GLOBAL_CONFIG_READ_TOKEN:'r',VERCEL_API_TOKEN:'w'},{fetch:async()=>new Response('',{status:500})});
await assert.rejects(failing.read(),/read failed with 500/,'Read failures are reported, not hidden');
await assert.rejects(failing.write('catalog'),/write failed with 500/);

// Build output and loader.
assert(contentSets.includes('catalog')&&contentSets.every(name=>/^catalog/.test(name)),'Every content/catalog*.json is built');
assert.equal(loadedSet,'catalog','Outside a page the default set loads without a network call');
assert(content.get('home'),'The default set provides the home document');
const assistant=await readFile(new URL('../api/assistant.js',import.meta.url),'utf8');assert(assistant.includes('assistantDocumentSets[set]'),'The assistant answers from the live set');
console.log('Site config passed: default set, switching, shipped-set-only writes, no delete, read-only fallback, Global Config endpoints, caching and loud failures.');
