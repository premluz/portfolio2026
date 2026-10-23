import {providerErrorCode} from './provider-error.mjs';
import {acknowledgementText} from './assistant-acknowledgements.js';
const voiceId='JBFqnCBsd6RMkjVDRZzb'; // George; override with AI_VOICE_ID.
const maxSpeech=1000;
const windowMs=60*60*1000;
const sessionHits=new Map(),ipHits=new Map();
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

function consume(map,key,limit,now){
 const previous=map.get(key),bucket=!previous||now-previous.start>=windowMs?{start:now,count:0}:previous;
 if(bucket.count>=limit)return false;
 bucket.count++;map.set(key,bucket);
 if(map.size>5000)for(const [id,value] of map){if(now-value.start>=windowMs)map.delete(id);if(map.size<=4000)break;}
 return true;
}
const encoded=(sessionId,text,issuedAt)=>new TextEncoder().encode(`${sessionId}\n${issuedAt}\n${text}`);
const keyFor=secret=>crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unbase64url=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),character=>character.charCodeAt(0));
const selectedVoice=env=>typeof env?.AI_VOICE_ID==='string'&&/^[A-Za-z0-9]{20}$/.test(env.AI_VOICE_ID)?env.AI_VOICE_ID:voiceId;

export async function signSpeech(text,sessionId,secret,now=Date.now()){
 if(!secret)return null;
 const issuedAt=Math.floor(now/1000);
 const signature=await crypto.subtle.sign('HMAC',await keyFor(secret),encoded(sessionId,text,issuedAt));
 return `${issuedAt}.${base64url(signature)}`;
}
export async function verifySpeech(text,sessionId,token,secret,now=Date.now()){
 if(!secret||!/^\d{10}\.[A-Za-z0-9_-]{43}$/.test(token||''))return false;
 const [issued,signature]=token.split('.'),issuedAt=Number(issued);
 if(issuedAt>Math.floor(now/1000)+60||Math.floor(now/1000)-issuedAt>12*60*60)return false;
 try{return await crypto.subtle.verify('HMAC',await keyFor(secret),unbase64url(signature),encoded(sessionId,text,issuedAt));}catch{return false;}
}

async function boundedJson(request){
 const reader=request.body?.getReader();if(!reader)throw Error('empty');
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2200){await reader.cancel();throw Error('too_large');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleVoiceRequest(request,env,{fetcher=globalThis.fetch,now=Date.now()}={}){
 const url=new URL(request.url);if(url.pathname!=='/api/voice')return json({error:'not_found'},404);
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'origin_not_allowed'},403);
 if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))return json({error:'json_required'},415);
 let payload;try{payload=await boundedJson(request);}catch{return json({error:'invalid_request'},400);}
 // An acknowledgement names a fixed phrase, so it needs no answer token; any other text must carry one.
 const acknowledgement=payload?.ack===undefined?null:acknowledgementText(payload.ack);
 if(payload?.ack!==undefined&&!acknowledgement)return json({error:'unknown_acknowledgement'},400);
 const text=acknowledgement||(typeof payload?.text==='string'?payload.text.trim():'');
 const sessionId=typeof payload?.sessionId==='string'?payload.sessionId:'';
 if(!text||text.length>maxSpeech||!sessionId||sessionId.length>100)return json({error:'invalid_speech'},400);
 if(!env?.AI_VOICE_KEY)return json({error:'voice_not_configured'},503);
 if(!acknowledgement&&!await verifySpeech(text,sessionId,payload?.speechToken,env.AI_VOICE_KEY,now))return json({error:'unauthorized_speech'},403);
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 if(!consume(sessionHits,`${ip}:${sessionId}`,12,now)||!consume(ipHits,ip,40,now))return json({error:'voice_rate_limited'},429);
 const selected=selectedVoice(env);
 try{
  const provider=await fetcher(`https://api.elevenlabs.io/v1/text-to-speech/${selected}?output_format=mp3_44100_128`,{
   method:'POST',headers:{'xi-api-key':env.AI_VOICE_KEY,'content-type':'application/json','accept':'audio/mpeg'},
   body:JSON.stringify({text,model_id:'eleven_flash_v2_5'}),signal:AbortSignal.timeout(18000),
  });
  if(!provider.ok||!provider.body)return json({error:'voice_unavailable',providerStatus:provider.status,providerCode:await providerErrorCode(provider)},502);
  return new Response(provider.body,{status:200,headers:{'content-type':'audio/mpeg','cache-control':'no-store','x-content-type-options':'nosniff'}});
 }catch{return json({error:'voice_unavailable'},502);}
}

export function resetVoiceRateLimitsForTests(){sessionHits.clear();ipHits.clear();}
