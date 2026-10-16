import {answerPublishedQuestion} from './assistant-answer.js';
import {assistantKnowledge,findCuratedAnswer,suggestionsFor} from './assistant-knowledge.js';
import {signSpeech} from './voice-core.mjs';
import {assistantLimits,assistantHistory} from './assistant-limits.js';
import {requestModel} from './assistant-model.mjs';

const maxBodyBytes=assistantLimits.requestBytes;
const sessionLimit=20;
const ipLimit=50;
const rateWindow=60*60*1000;
const sessionHits=new Map();
const ipHits=new Map();

const json=(body,status=200)=>new Response(JSON.stringify(body),{
 status,
 headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'},
});

async function readBoundedBody(request){
 const reader=request.body?.getReader();if(!reader)return '';
 const chunks=[];let size=0;
 while(true){
  const {done,value}=await reader.read();if(done)break;
  size+=value.byteLength;if(size>maxBodyBytes){await reader.cancel();throw new RangeError('Request body too large');}
  chunks.push(value);
 }
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return new TextDecoder().decode(bytes);
}

function consume(map,key,limit,now){
 let bucket=map.get(key);
 if(!bucket||now-bucket.startedAt>=rateWindow){bucket={startedAt:now,count:0};map.set(key,bucket);}
 if(bucket.count>=limit)return false;
 bucket.count++;
 if(map.size>5000){for(const [entry,value] of map){if(now-value.startedAt>=rateWindow)map.delete(entry);if(map.size<=4000)break;}}
 return true;
}

// Everything visitors can read as content is source material: project pages, the home, About and Contact
// pages, and the reusable sections they are built from (services, experience, traits, testimonials).
// Page chrome (footer) and popover duplicates of project content are not.
const COMPONENT_EXCLUDED_IDS=new Set(['inline-context','site-footer']);
const text=value=>typeof value==='string'?value.trim():'';
const isSourceDocument=document=>document.status==='published'&&(document.type==='portfolio-item'||document.type==='page'||(document.type==='component'&&!COMPONENT_EXCLUDED_IDS.has(document.id)));
const NESTED_BLOCK_TYPES=new Set(['timeline','carousel','card-gallery']);
// Block types carry their words in different fields; collect them all so no section is silently dropped.
function blockLines(block){
 const quote=text(block.text)&&text(block.attribution)?[text(block.text),'— '+text(block.attribution)]:[text(block.text)];
 const metric=text(block.value)?[text(block.value),text(block.description)]:[text(block.description)];
 return [...(block.paragraphs||[]).map(text),...quote,...metric,text(block.caption),text(block.link?.label)].filter(Boolean);
}
// An experience row has a title and a separate label (its years); keep both.
function nestedItem(item){
 const title=text(item.title),label=text(item.label);
 return {label:title||label,paragraphs:[...(title&&label?[label]:[]),...blockLines(item)]};
}
function blockSection(block){
 const items=NESTED_BLOCK_TYPES.has(block.type)?(block.items||[]).map(nestedItem).filter(item=>item.label||item.paragraphs.length):[];
 return {title:text(block.title)||text(block.label),paragraphs:blockLines(block),items};
}
export function usableDocuments(documents){
 return documents.filter(isSourceDocument).map(document=>({
  id:document.id,
  type:document.type,
  title:document.name||document.title,
  pageTitle:document.pageTitle||document.title,
  client:document.client||'',
  category:document.category||'',
  kind:document.kind||'',
  prototype:document.prototype?.url||'',
  aliases:document.aliases||[],
  domains:document.domains||[],
  capabilities:document.capabilities||[],
  summary:document.summary||'',
  intro:document.intro||'',
  context:document.context||'',
  challenge:document.challenge||'',
  role:document.role||'',
  highlights:document.highlights||'',
  keyWork:document.keyWork||'',
  impact:document.impact||'',
  sections:(document.blocks||[]).map(blockSection).filter(section=>section.title||section.paragraphs.length||section.items.length),
 })).filter(record=>record.summary||record.intro||record.sections.length||record.context);
}

export function publishedFallbackAnswer(question,documents,history=[]){
 if(question.length>assistantLimits.offlineQuestionCharacters)return {text:'A detailed review needs the AI service, which is unavailable right now. Your pasted text has not been evaluated. Please try again shortly.',documentIds:[]};
 const records=documents.filter(isSourceDocument);
 const byId=new Map(records.map(document=>[document.id,document]));
 const store={get:id=>byId.get(id),list:({type}={})=>records.filter(document=>!type||document.type===type),getCard:id=>byId.get(id)?.type==='portfolio-item'?byId.get(id):null,resolveAnswer:answer=>({...answer,sources:(answer.citations||[]).filter(citation=>byId.has(citation.documentId))})};
 const answer=answerPublishedQuestion(question,{store,history});
 return {text:answer.text.slice(0,assistantLimits.answerCharacters),documentIds:[...new Set([...(answer.documentIds||[]),...answer.sources.map(source=>source.documentId)])].filter(id=>byId.has(id))};
}


function requestPayload(payload){
 const question=typeof payload?.question==='string'?payload.question.trim():'';
 const sessionId=typeof payload?.sessionId==='string'?payload.sessionId.slice(0,100):'';
 return question&&question.length<=assistantLimits.questionCharacters&&sessionId
  ?{question,sessionId,history:assistantHistory(payload.history)}:null;
}

async function recoverAnswer(error,status,context,details={}){
 const {question,documents,history,sessionId,env,now}=context;
 const answer=publishedFallbackAnswer(question,documents,history);
 return json({...details,error,...answer,knowledgeSources:[],suggestions:suggestionsFor(answer.documentIds),responseMode:'published-fallback',speechToken:await answerSpeech(answer.text,sessionId,env,now)},status);
}

async function answerSpeech(answer,sessionId,env,now){
 return answer.length<=assistantLimits.speechCharacters?signSpeech(answer,sessionId,env?.AI_VOICE_KEY,now):null;
}

function sourceCorpus(published){
 const ids=new Set(published.map(record=>record.id)),seen=new Set(ids);
 const knowledge=assistantKnowledge.facts.map(fact=>{
  if(!fact.id||!fact.title||!fact.text||seen.has(fact.id)||!Array.isArray(fact.sourceIds)||!fact.sourceIds.length||fact.sourceIds.some(id=>!ids.has(id)))throw new Error('Invalid approved knowledge record: '+fact.id);
  seen.add(fact.id);
  return {...fact,type:'knowledge'};
 });
 return [...published,...knowledge];
}

async function answerRequest(context,fetcher){
 const {question,sessionId,history,documents,env,now}=context,published=usableDocuments(documents);
 const apiKey=env?.AI_API_KEY||env?.OPENAI_API_KEY,baseUrl=env?.AI_API_BASE_URL,model=env?.AI_MODEL;
 if(!apiKey||!baseUrl||!model){
  const curated=findCuratedAnswer(question);
  if(curated)return json({text:curated.text,documentIds:curated.sourceIds.filter(id=>published.some(record=>record.id===id)),knowledgeSources:[],suggestions:curated.followUps,speechToken:await answerSpeech(curated.text,sessionId,env,now)});
  return recoverAnswer('ai_not_configured',503,context);
 }
 if(!published.length)return recoverAnswer('content_unavailable',503,context);
 let endpoint;
 try{const base=new URL(baseUrl);if(base.protocol!=='https:'&&base.hostname!=='localhost'&&base.hostname!=='127.0.0.1')return recoverAnswer('provider_url_must_use_https',503,context);endpoint=new URL(base.href.replace(/\/+$/,'')+'/chat/completions');}
 catch{return recoverAnswer('provider_url_invalid',503,context);}
 try{
  const result=await requestModel({endpoint,apiKey,model,question,history,corpus:sourceCorpus(published),fetcher});
  if(result.error)return recoverAnswer(result.error,502,context,result);
  const answer=result.answer,sourceIds=new Set(answer.sourceIds);
  const knowledgeSources=assistantKnowledge.facts.filter(fact=>sourceIds.has(fact.id)).map(({id,title,route})=>({id,title,route:route||null}));
  for(const fact of assistantKnowledge.facts)if(sourceIds.has(fact.id))for(const id of fact.sourceIds)sourceIds.add(id);
  const documentIds=published.filter(record=>sourceIds.has(record.id)).map(record=>record.id);
  return json({text:answer.answer,kind:answer.kind,documentIds,knowledgeSources,suggestions:suggestionsFor(documentIds),speechToken:await answerSpeech(answer.answer,sessionId,env,now)});
 }catch(error){return recoverAnswer(error.message.startsWith('Assistant')?'invalid_model_response':'model_unavailable',502,context);}
}

export async function handleAssistantRequest(request,env,{documents=[],fetcher=globalThis.fetch,now=Date.now()}={}){
 const url=new URL(request.url);
 if(url.pathname!=='/api/assistant')return json({error:'not_found'},404);
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'origin_not_allowed'},403);
 if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))return json({error:'json_required'},415);
 let payload;try{payload=JSON.parse(await readBoundedBody(request));}catch(error){return json({error:error instanceof RangeError?'request_too_large':'invalid_json'},error instanceof RangeError?413:400);}
 const parsed=requestPayload(payload);if(!parsed)return json({error:'invalid_question'},400);
 const context={...parsed,documents,env,now},ip=request.headers.get('cf-connecting-ip')||'unknown';
 if(!consume(sessionHits,`${ip}:${parsed.sessionId}`,sessionLimit,now)||!consume(ipHits,ip,ipLimit,now))return recoverAnswer('rate_limited',429,context);
 return answerRequest(context,fetcher);
}

export function resetAssistantRateLimitsForTests(){sessionHits.clear();ipHits.clear();}
