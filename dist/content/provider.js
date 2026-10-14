import {contentModel,exportPublishedCatalog,CONTENT_LIMITS,ContentValidationError,walkBlocks} from './model.js';
import {validateSchema} from './schema-validator.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const normalize=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const gradient=(colors,angle=155)=>`linear-gradient(${angle}deg,${colors.join(',')})`;
const responseObject=(properties,required)=>({type:'object',properties,required,additionalProperties:false});
const docId={type:'string',pattern:'^[a-z][a-z0-9-]*$',maxLength:120};
const citations={type:'array',maxItems:20,items:responseObject({documentId:docId,evidenceId:docId},['documentId'])};
export const answerSchema={
 $schema:'https://json-schema.org/draft/2020-12/schema',title:'Portfolio answer',
 anyOf:[
  responseObject({type:{const:'cards'},documentIds:{type:'array',minItems:1,maxItems:20,uniqueItems:true,items:docId}},['type','documentIds']),
  responseObject({type:{const:'text'},text:{type:'string',minLength:1,maxLength:10000},citations},['type','text','citations']),
  responseObject({type:{const:'mixed'},text:{type:'string',minLength:1,maxLength:10000},documentIds:{type:'array',minItems:1,maxItems:20,uniqueItems:true,items:docId},citations},['type','text','documentIds','citations'])
 ]
};

/** Validated, immutable synchronous snapshot used by renderers and retrieval. */
export function createContentStore(catalog,{model=contentModel,includeUnpublished=false}={}){
 model.assert(catalog);
 // Detach the source so a CMS adapter cannot mutate a rendered snapshot.
 let snapshot;try{snapshot=clone(catalog);}catch{throw new ContentValidationError(['Catalog must be serializable JSON.']);}
 model.assert(snapshot);if(!includeUnpublished)snapshot=exportPublishedCatalog(snapshot,model);
 freeze(snapshot);
 const documents=new Map(snapshot.documents.map(d=>[d.id,d])),assets=new Map(snapshot.assets.map(a=>[a.id,a])),presentations=new Map(snapshot.presentations.map(p=>[p.documentId,p]));
 const layouts=new Map(snapshot.layouts.map(l=>[l.id,l]));
 const query=(filters={})=>{
  if(!filters||typeof filters!=='object'||Array.isArray(filters))throw new TypeError('Content filters must be an object.');
  for(const [key,value] of Object.entries(filters))if(!['type','kind','domain','capability','tag'].includes(key)||typeof value!=='string')throw new TypeError('Invalid content filter '+key);
  const {type,kind,domain,capability,tag}=filters;
  return snapshot.documents.filter(d=>(!type||d.type===type)&&(!kind||d.kind===kind)&&(!domain||d.domains?.includes(domain))&&(!capability||d.capabilities?.includes(capability))&&(!tag||d.tags?.includes(tag)));
 };
 const card=documentId=>{
  const d=documents.get(documentId);if(!d||!(d.type==='portfolio-item'||d.type==='page'&&d.template==='information'))return null;
  const p=presentations.get(d.id),image=assets.get(d.heroMediaId),video=assets.get(d.hoverVideoId);
  const shared={id:d.id,documentId:d.id,title:d.title,name:d.name||d.title,summary:d.summary||'',category:d.category||'',bg:gradient(p?.card.surface||['#ececf0','#ececf0']),blocks:d.blocks,contentColumns:p?.detail.columns||2};
  if(d.type==='page'){const lead=d.blocks.find(b=>b.type==='text');return freeze({...shared,_type:'information',body:lead?.paragraphs||[d.summary||''],blocks:d.blocks.filter(b=>b!==lead),link:d.links?.[0]});}
  return freeze({...shared,_type:'portfolio',client:d.client||'',prototype:d.prototype||{},featured:d.featured===true,listOnly:d.listOnly===true,projectKind:d.kind,commandAliases:d.aliases||[],pageTitle:d.pageTitle||d.title,intro:d.intro||'',context:d.context,challenge:d.challenge||'',role:d.role,results:d.highlights||'',work:d.keyWork,impact:d.impact||'',image:image?.url,imageAlt:image?.alt,videoUrl:video?.url,cardAspect:p?.card.orientation||'landscape'});
 };
 const texts=new Map(snapshot.documents.map(d=>{
  const body=[];walkBlocks(d.blocks,b=>body.push(b.title||'',b.label||'',...(b.paragraphs||[]),b.caption||'',b.text||'',b.description||'',b.value||''));
  return [d.id,{title:normalize([d.title,d.pageTitle,d.name,d.client,...(d.aliases||[])].join(' ')),body:normalize([d.summary,d.intro,d.context,d.challenge,d.role,d.highlights,d.keyWork,d.impact,...(d.domains||[]),...(d.capabilities||[]),...(d.tags||[]),...(d.evidence||[]).map(e=>e.text),...body].join(' '))}];
 }));
 const store={
  schemaVersion:snapshot.schemaVersion,
  get:id=>documents.get(id)||null,
  getAsset:id=>assets.get(id)||null,
  getPresentation:id=>presentations.get(id)||null,
  getLayout:id=>layouts.get(id)||null,
  list:filters=>Object.freeze(query(filters)),
  getCard:card,
  getLayoutCards:(id='home')=>(layouts.get(id)?.items||[]).map(placement=>{const c=card(placement.documentId);return c?freeze({...c,id:placement.id,featured:placement.featured??c.featured??false,...(placement.id!==placement.documentId?{sourceProjectId:placement.documentId}:{})}):null;}).filter(Boolean),
  search:({query:term='',limit=10,offset=0,...filters}={})=>{
   if(typeof term!=='string'||term.length>2000)throw new TypeError('Search query must be text of at most 2000 characters.');
   if(!Number.isInteger(limit)||limit<1||limit>CONTENT_LIMITS.results||!Number.isInteger(offset)||offset<0)throw new RangeError('Search requires limit 1–20 and a nonnegative integer offset.');
   const tokens=[...new Set(normalize(term).split(' ').filter(Boolean))];
   const ranked=query(filters).map(d=>{const t=texts.get(d.id),matches=tokens.filter(token=>t.title.includes(token)||t.body.includes(token));return {d,score:tokens.length?matches.reduce((n,token)=>n+(t.title.includes(token)?5:1),0):1,match:matches.length===tokens.length};}).filter(r=>r.match).sort((a,b)=>b.score-a.score||a.d.id.localeCompare(b.d.id));
   return freeze({total:ranked.length,offset,limit,items:ranked.slice(offset,offset+limit).map(({d,score})=>({documentId:d.id,type:d.type,title:d.title,summary:d.summary||'',score,route:card(d.id)?'#'+d.id:null,evidenceIds:(d.evidence||[]).map(e=>e.id)}))});
  },
  resolveAnswer:answer=>{
   const issues=validateSchema(answer,answerSchema);
   if(issues.length)throw new ContentValidationError(issues);
   for(const id of answer?.documentIds||[])if(!card(id))issues.push('Answer references an unavailable card '+id);
   for(const citation of answer?.citations||[]){const d=documents.get(citation.documentId);if(!d)issues.push('Unknown citation document '+citation.documentId);else if(citation.evidenceId&&!d.evidence?.some(e=>e.id===citation.evidenceId))issues.push('Unknown citation evidence '+citation.documentId+'/'+citation.evidenceId);}
   if(issues.length)throw new ContentValidationError(issues);
   return freeze({...clone(answer),cards:(answer.documentIds||[]).map(card),sources:(answer.citations||[]).map(c=>({documentId:c.documentId,title:documents.get(c.documentId).title,route:card(c.documentId)?'#'+c.documentId:null,evidence:c.evidenceId?documents.get(c.documentId).evidence.find(e=>e.id===c.evidenceId):null}))});
  },
  export:()=>snapshot
 };
 return Object.freeze(store);
}

/** Any CMS adapter supplies load({signal}) -> canonical catalog. UI sees the same store. */
export function createContentProvider({load,model=contentModel}={}){
 if(typeof load!=='function')throw new TypeError('A content provider requires a load function.');
 let current=null,pending=null;
 const refresh=({signal}={})=>{
  if(pending)return pending;
  pending=Promise.resolve().then(()=>load({signal})).then(catalog=>{signal?.throwIfAborted();const next=createContentStore(catalog,{model});current=next;return next;}).finally(()=>{pending=null;});return pending;
 };
 return Object.freeze({load:options=>current?Promise.resolve(current):refresh(options),refresh,get current(){return current;}});
}

export function createHttpContentProvider(url,{fetch:fetcher=globalThis.fetch,adapt=value=>value,model=contentModel}={}){
 return createContentProvider({model,load:async({signal})=>{const response=await fetcher(url,{signal});if(!response.ok)throw new Error('Content request failed: '+response.status);return adapt(await response.json());}});
}
