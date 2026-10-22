import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {handleSiteConfigRequest,globalConfigStore,memoryStore,activeContentSet,readConnectionString,CONTENT_SET_KEY} from '../worker/site-config-core.mjs';
import {contentSets} from '../dist/content/sets.js';
import {activeContentSet as loadedSet,content} from '../dist/content/local.js';

const sets=['catalog','catalog2'];
const call=(store,method='GET',body)=>handleSiteConfigRequest(new Request('https://site.test/api/site-config',{method,...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})}),store,{sets});

// Reading and switching between shipped sets.
const store=memoryStore();
let response=await call(store);assert.equal(response.status,200);assert.deepEqual(await response.json(),{contentSet:'catalog',contentSets:sets,writable:true,settings:null},'An unset choice serves the default set and no published settings');
assert.match(response.headers.get('cache-control'),/s-maxage=5/,'Reads are cached briefly at the CDN');
response=await call(store,'POST',{contentSet:'catalog2'});assert.equal(response.status,200);assert.equal(await store.read('contentSet'),'catalog2');
assert.equal((await (await call(store)).json()).contentSet,'catalog2','The saved set is served');

// Writes can only name a shipped set; there is nothing else to change.
for(const contentSet of ['catalog3','../secrets','',null]){response=await call(store,'POST',{contentSet});assert.equal(response.status,400,`Rejects ${contentSet}`);}
assert.equal((await call(store,'POST','not json')).status,400);
assert.equal((await call(store,'DELETE')).status,405,'No delete or other methods');
assert.equal(await store.read('contentSet'),'catalog2','Rejected writes leave the choice unchanged');
assert.equal(await activeContentSet(memoryStore({contentSet:'catalog9'}),sets),'catalog','A stale saved name falls back to the default set');

// Without Global Config the API still answers reads, and refuses writes loudly.
response=await call(null);assert.deepEqual(await response.json(),{contentSet:'catalog',contentSets:sets,writable:false,settings:null});
response=await call(null,'POST',{contentSet:'catalog2'});assert.equal(response.status,503);assert.match((await response.json()).message,/GLOBAL_CONFIG/);

// Global Config requests follow the documented endpoints.
assert.equal(globalConfigStore({}),null,'Missing variables mean no store');
assert.deepEqual(readConnectionString('https://global-config.vercel.com/ecfg_abc?token=read-1'),{id:'ecfg_abc',token:'read-1',origin:'https://global-config.vercel.com'},'The connection string carries the ID and read token');
assert.throws(()=>readConnectionString('not a url'),/valid connection string/,'A malformed connection string fails loudly');
{const seen=[];const viaConnection=globalConfigStore({GLOBAL_CONFIG:'https://global-config.vercel.com/ecfg_abc?token=read-1',VERCEL_API_TOKEN:'w'},{fetch:async(url,init)=>{seen.push([url,init.headers.authorization]);return new Response('"catalog2"');}});
 assert.equal(await viaConnection.read(),'catalog2');assert.deepEqual(seen[0],['https://global-config.vercel.com/ecfg_abc/item/contentSet','Bearer read-1'],'Only the connection string and a write token are needed');}
assert.equal(globalConfigStore({GLOBAL_CONFIG:'https://global-config.vercel.com/ecfg_abc?token=r'}),null,'Writes still need VERCEL_API_TOKEN');
// Two sites on one store keep separate choices through their own key.
{const items={};const shared=async(url,init={})=>{if(init.method==='PATCH'){for(const item of JSON.parse(init.body).items)items[item.key]=item.value;return new Response('{"status":"ok"}');}const key=url.split('/item/')[1];return key in items?new Response(JSON.stringify(items[key])):new Response('',{status:404});};
 const env={GLOBAL_CONFIG:'https://global-config.vercel.com/ecfg_abc?token=r',VERCEL_API_TOKEN:'w'};
 const main=globalConfigStore(env,{fetch:shared}),second=globalConfigStore({...env,CONTENT_SET_KEY:'contentSet-second'},{fetch:shared});
 await second.write('contentSet','catalog2');assert.equal(await second.read(),'catalog2');assert.equal(await main.read(),null,'The other site is unaffected');assert.deepEqual(Object.keys(items),['contentSet-second']);
 assert.throws(()=>globalConfigStore({...env,CONTENT_SET_KEY:'../x'}),/CONTENT_SET_KEY/,'A malformed key is rejected');}
{const seen=[];await globalConfigStore({EDGE_CONFIG:'https://edge-config.vercel.com/ecfg_old?token=t',VERCEL_API_TOKEN:'w'},{fetch:async url=>{seen.push(url);return new Response('null');}}).read();assert.equal(seen[0],'https://edge-config.vercel.com/ecfg_old/item/contentSet','Reads use the host the connection string names');}
const requests=[];let saved='catalog2';
const fetch=async(url,init={})=>{requests.push({url,method:init.method||'GET',auth:init.headers?.authorization,body:init.body});if(init.method==='PATCH'){saved=JSON.parse(init.body).items[0].value;return new Response('{"status":"ok"}');}return new Response(JSON.stringify(saved));};
const remote=globalConfigStore({GLOBAL_CONFIG_ID:'ecfg_1',GLOBAL_CONFIG_READ_TOKEN:'read',VERCEL_API_TOKEN:'write',VERCEL_TEAM_ID:'team_1'},{fetch});
assert.equal(await remote.read(),'catalog2');await remote.read();
assert.equal(requests.length,1,'Reads are cached for a few seconds');
assert.deepEqual(requests[0],{url:`https://global-config.vercel.com/ecfg_1/item/${CONTENT_SET_KEY}`,method:'GET',auth:'Bearer read',body:undefined});
await remote.write('contentSet','catalog');
assert.deepEqual(requests[1],{url:'https://api.vercel.com/v1/global-config/ecfg_1/items?teamId=team_1',method:'PATCH',auth:'Bearer write',body:JSON.stringify({items:[{operation:'upsert',key:CONTENT_SET_KEY,value:'catalog'}]})});
assert.equal(await remote.read(),'catalog','A write refreshes the cached value');
const failing=globalConfigStore({GLOBAL_CONFIG_ID:'x',GLOBAL_CONFIG_READ_TOKEN:'r',VERCEL_API_TOKEN:'w'},{fetch:async()=>new Response('',{status:500})});
await assert.rejects(failing.read(),/read failed with 500/,'Read failures are reported, not hidden');
await assert.rejects(failing.write('contentSet','catalog'),/write failed with 500/);

// Published settings: validated, saved per project under their own key, readable by every visitor.
const profile=()=>({format:'prem-portfolio-settings',version:1,exportedAt:'2026-10-22T10:00:00.000Z',settings:{homeContentWidth:'small',heroCarousel:false,'carousel.tilt':0}});
const published=memoryStore();
response=await call(published,'POST',{settings:profile()});assert.equal(response.status,200);
const {settings:publishedRevision}=await response.json();assert.match(publishedRevision.revision,/^[0-9a-f]{64}$/,'The server returns the revision visitors will apply');
const {createHash}=await import('node:crypto');assert.equal(publishedRevision.revision,createHash('sha256').update(JSON.stringify(profile().settings)).digest('hex'),'The revision matches the build\'s, so identical settings never re-import');
let live=await (await call(published)).json();assert.deepEqual(live.settings.export.settings,profile().settings,'Visitors read the published settings');assert.equal(live.settings.revision,publishedRevision.revision);
assert.equal(live.contentSet,'catalog','Publishing settings leaves the content set alone');
const bad=[{...profile(),format:'other'},{...profile(),version:2},{...profile(),exportedAt:'soon'},{...profile(),settings:{}},{...profile(),settings:{'../x':true}},{...profile(),settings:{a:{b:1}}},{...profile(),settings:{a:'x'.repeat(201)}},{...profile(),settings:{a:Infinity}},{...profile(),settings:Object.fromEntries(Array.from({length:401},(_,i)=>['k'+i,true]))},'text',[],{...profile(),settings:{big:'x'.repeat(200),...Object.fromEntries(Array.from({length:399},(_,i)=>['key'+i,'y'.repeat(200)]))}}];
for(const settings of bad){response=await call(published,'POST',{settings});assert.equal(response.status,400,'Rejects '+JSON.stringify(settings).slice(0,60));}
live=await (await call(published)).json();assert.equal(live.settings.revision,publishedRevision.revision,'Rejected publishes leave the live settings unchanged');
response=await call(published,'POST',{settings:null});assert.equal(response.status,200);assert.equal((await (await call(published)).json()).settings,null,'Built-in settings restore with null');
response=await call(null,'POST',{settings:profile()});assert.equal(response.status,503,'Publishing needs the store');
{const stale=memoryStore({settings:{revision:'x',export:{format:'wrong'}}});const warn=console.warn;const warnings=[];console.warn=(...args)=>warnings.push(args[0]);const config=await (await call(stale)).json();console.warn=warn;assert.equal(config.settings,null);assert.match(warnings[0],/malformed/,'A damaged stored profile is reported and ignored');}
{const keys=[];const f=async(url,init={})=>{keys.push(init.method==='PATCH'?JSON.parse(init.body).items[0].key:url.split('/item/')[1]);return init.method==='PATCH'?new Response('{}'):new Response('null');};
 const env={GLOBAL_CONFIG:'https://global-config.vercel.com/ecfg_abc?token=r',VERCEL_API_TOKEN:'w'};
 const one=globalConfigStore(env,{fetch:f}),two=globalConfigStore({...env,CONTENT_SET_KEY:'contentSet-prems'},{fetch:f});
 await one.read('settings');await one.write('settings',null);await two.read('settings');await two.write('settings',null);await two.read('contentSet');
 assert.deepEqual(keys,['contentSet-settings','contentSet-settings','contentSet-prems-settings','contentSet-prems-settings','contentSet-prems'],'Each project keeps its own content set and settings keys');}

// Build output and loader.
assert(contentSets.includes('catalog')&&contentSets.every(name=>/^catalog/.test(name)),'Every content/catalog*.json is built');
assert.equal(loadedSet,'catalog','Outside a page the default set loads without a network call');
assert(content.get('home'),'The default set provides the home document');
const assistant=await readFile(new URL('../api/assistant.js',import.meta.url),'utf8');assert(assistant.includes('assistantDocumentSets[set]'),'The assistant answers from the live set');
const control=await readFile(new URL('../dist/settings-publish-control.js',import.meta.url),'utf8');assert(control.includes('send(null)')&&control.includes('exportSettings(schema,storage)'),'The panel publishes the exported settings and can restore the built-in ones');
console.log('Site config passed: default set, switching, shipped-set-only writes, no delete, read-only fallback, Global Config endpoints, caching, loud failures, validated settings publishing and per-project keys.');
