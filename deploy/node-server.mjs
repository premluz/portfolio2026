import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {handleAssistantRequest} from '../dist/server/assistant-core.mjs';
import {publishedAssistantDocuments} from '../dist/server/content.js';
import {handleVoiceRequest} from '../dist/server/voice-core.mjs';
import {readPublishedSettings,publishedSettingsModule} from '../scripts/site-settings.mjs';

const publicDirectory=path.resolve(fileURLToPath(new URL('../dist/client/',import.meta.url)));
const trustedProxy=process.env.TRUST_PROXY==='true';
const environment={
 AI_API_BASE_URL:process.env.AI_API_BASE_URL,
 AI_API_KEY:process.env.AI_API_KEY,
 AI_MODEL:process.env.AI_MODEL,
 OPENAI_API_KEY:process.env.OPENAI_API_KEY,
 AI_VOICE_KEY:process.env.AI_VOICE_KEY,
 AI_VOICE_ID:process.env.AI_VOICE_ID,
};
const mimeTypes={
 '.avif':'image/avif','.css':'text/css; charset=utf-8','.gif':'image/gif','.html':'text/html; charset=utf-8',
 '.ico':'image/x-icon','.jpeg':'image/jpeg','.jpg':'image/jpeg','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.mp4':'video/mp4',
 '.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm','.webp':'image/webp',
 '.woff':'font/woff','.woff2':'font/woff2',
};

function firstHeader(value){return Array.isArray(value)?value[0]:value;}

function requestUrl(incoming){
 const forwardedProtocol=trustedProxy?firstHeader(incoming.headers['x-forwarded-proto']):null;
 const forwardedHost=trustedProxy?firstHeader(incoming.headers['x-forwarded-host']):null;
 const protocol=forwardedProtocol==='https'?'https':'http';
 const host=forwardedHost||incoming.headers.host||'localhost';
 return new URL(incoming.url||'/',`${protocol}://${host}`);
}

function sendJson(response,status,body){
 response.statusCode=status;
 response.setHeader('content-type','application/json; charset=utf-8');
 response.setHeader('cache-control','no-store');
 response.setHeader('x-content-type-options','nosniff');
 response.end(JSON.stringify(body));
}

function fetchRequest(incoming,url){
 const headers=new Headers();
 for(const [name,value] of Object.entries(incoming.headers)){
  if(value===undefined||name==='connection'||name==='transfer-encoding')continue;
  headers.set(name,Array.isArray(value)?value.join(', '):value);
 }
 const forwardedFor=trustedProxy?firstHeader(incoming.headers['x-forwarded-for']):null;
 const clientIp=forwardedFor?.split(',')[0]?.trim()||incoming.socket.remoteAddress||'unknown';
 headers.set('cf-connecting-ip',clientIp);
 const method=incoming.method||'GET';
 const init={method,headers};
 if(method!=='GET'&&method!=='HEAD'){
  init.body=Readable.toWeb(incoming);
  init.duplex='half';
 }
 return new Request(url,init);
}

async function serveApi(incoming,response,url){
 const handler=url.pathname==='/api/assistant'?handleAssistantRequest:url.pathname==='/api/voice'?handleVoiceRequest:null;
 if(!handler)return sendJson(response,404,{error:'not_found'});
 try{
  const result=await handler(fetchRequest(incoming,url),environment,{documents:publishedAssistantDocuments});
  response.statusCode=result.status;
  for(const [name,value] of result.headers)response.setHeader(name,value);
  if(!result.body){response.end();return;}
  Readable.fromWeb(result.body).pipe(response);
 }catch{
  if(!response.headersSent)sendJson(response,500,{error:'internal_error'});
  else response.destroy();
 }
}

async function serveFile(incoming,response,url){
 if(!['GET','HEAD'].includes(incoming.method||'GET')){
  response.setHeader('allow','GET, HEAD');
  return sendJson(response,405,{error:'method_not_allowed'});
 }
 let decoded;
 try{decoded=decodeURIComponent(url.pathname);}catch{return sendJson(response,400,{error:'invalid_path'});}
 if(decoded.includes('\0'))return sendJson(response,400,{error:'invalid_path'});
 const relative=decoded==='/'?'index.html':decoded.replace(/^\/+/, '');
 let filename=path.resolve(publicDirectory,relative);
 if(filename!==publicDirectory&&!filename.startsWith(publicDirectory+path.sep))return sendJson(response,404,{error:'not_found'});
 try{
  let info=await stat(filename);
  if(info.isDirectory()){
   filename=path.join(filename,'index.html');
   info=await stat(filename);
  }
  if(!info.isFile())return sendJson(response,404,{error:'not_found'});
  const extension=path.extname(filename).toLowerCase();
  const headers={
   'accept-ranges':'bytes',
   'cache-control':extension==='.html'?'no-cache':isLocalRequest(incoming)?'no-store':'public, max-age=3600',
   'content-length':String(info.size),
   'content-type':mimeTypes[extension]||'application/octet-stream',
   'last-modified':info.mtime.toUTCString(),
   'permissions-policy':'camera=(self), microphone=(self)',
   'referrer-policy':'strict-origin-when-cross-origin',
   'x-content-type-options':'nosniff',
  };
  let start=0,end=info.size-1,status=200;
  const rawRange=firstHeader(incoming.headers.range);
  if(rawRange){
   const match=/^bytes=(\d*)-(\d*)$/.exec(rawRange);
   if(!match||(!match[1]&&!match[2])){
    response.statusCode=416;response.setHeader('content-range',`bytes */${info.size}`);return response.end();
   }
   if(!match[1]){const suffix=Number(match[2]);start=Math.max(0,info.size-suffix);}
   else start=Number(match[1]);
   if(match[2]&&match[1])end=Math.min(info.size-1,Number(match[2]));
   if(start>=info.size||start>end){response.statusCode=416;response.setHeader('content-range',`bytes */${info.size}`);return response.end();}
   status=206;
   headers['content-range']=`bytes ${start}-${end}/${info.size}`;
   headers['content-length']=String(end-start+1);
  }
  response.statusCode=status;
  for(const [name,value] of Object.entries(headers))response.setHeader(name,value);
  if(incoming.method==='HEAD')return response.end();
  createReadStream(filename,{start,end}).pipe(response);
 }catch(error){
  if(error?.code==='ENOENT'||error?.code==='ENOTDIR')return sendJson(response,404,{error:'not_found'});
  throw error;
 }
}

async function serveSiteSettings(response){
 const profile=await readPublishedSettings();
 response.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
 response.end(publishedSettingsModule(profile));
}

const server=createServer(async(incoming,response)=>{
 try{
  const url=requestUrl(incoming);
  if(url.pathname==='/healthz')return sendJson(response,200,{status:'ok'});
  if(url.pathname==='/published-settings.js')return await serveSiteSettings(response);
  if(url.pathname.startsWith('/api/'))return await serveApi(incoming,response,url);
  return await serveFile(incoming,response,url);
 }catch(error){
  console.error('Request failed:',error?.message||'unknown error');
  if(!response.headersSent)sendJson(response,500,{error:'internal_error'});
  else response.destroy();
 }
});

const port=Number(process.env.PORT)||3000;
// Local development always serves fresh modules; a reload must never reuse a stale cached script.
const LOCAL_HOSTNAMES=new Set(['localhost','127.0.0.1','[::1]']);
function isLocalRequest(incoming){
 const hostname=String(incoming.headers.host||'').replace(/:\d+$/,'').toLowerCase();
 return LOCAL_HOSTNAMES.has(hostname)||hostname.endsWith('.localhost');
}
const host=process.env.HOST||'0.0.0.0';
server.listen(port,host,()=>console.log(`Portfolio server listening on http://${host}:${port}`));
