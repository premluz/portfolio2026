import {validateSchema} from './schema-validator.js';

export const CONTENT_SCHEMA_VERSION=1;
export const CONTENT_LIMITS=Object.freeze({documents:10000,assets:10000,blocks:1000,depth:8,results:20});
const text={type:'string',maxLength:100000},short={type:'string',maxLength:500},id={type:'string',pattern:'^[a-z][a-z0-9-]*$',maxLength:120};
const list=schema=>({type:'array',items:schema,maxItems:1000});
const strings={...list(short),uniqueItems:true};
const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
const ref=name=>({$ref:'#/$defs/'+name});
const link=object({id,label:short,url:short},['id','label','url']);
const surface={type:'array',items:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},minItems:2,maxItems:2};
const blockBase={id,title:short,label:short,layout:object({columns:{enum:[1,2]},mediaFit:{enum:['max-side','contain','full-bleed']},span:{type:'integer',minimum:1,maximum:4}}),appearance:object({surface}),evidenceIds:strings};
const common={id,status:{enum:['published','draft','archived']},slug:id,title:{...short,minLength:1},summary:text,name:short,aliases:strings,domains:strings,capabilities:strings,tags:strings,category:short,revision:{type:'integer',minimum:1},updatedAt:{type:'string'},links:list(link),evidence:list(ref('evidence')),blocks:{...list(ref('block')),maxItems:CONTENT_LIMITS.blocks}};
export const documentTypeDefinitions=Object.freeze({
 'portfolio-item':{label:'Portfolio item',properties:{prototype:object({url:short,label:short}),watchPrototype:object({url:short,label:short},['url','label']),qrCodeMediaId:id,qrCodeLabel:short,client:short,kind:{enum:['shipped','lab']},featured:{type:'boolean'},listOnly:{type:'boolean'},pageTitle:short,intro:text,context:text,challenge:text,role:text,highlights:text,keyWork:text,impact:text,heroMediaId:id,hoverVideoId:id},required:['slug','name','kind','context','role','keyWork']},
 page:{label:'Page',properties:{template:{enum:['home','information']}},required:['slug']},
 news:{label:'News',properties:{publishedAt:short},required:['slug']},
 component:{label:'Reusable component',properties:{}}
});
export const blockTypeDefinitions=Object.freeze({
 text:{label:'Text',properties:{paragraphs:list(text)},required:['paragraphs']},
 image:{label:'Image',properties:{mediaId:id,alt:text,caption:text},required:['mediaId']},
 video:{label:'Video',properties:{mediaId:id,posterMediaId:id,caption:text},required:['mediaId']},
 'info-card':{label:'Info card',properties:{paragraphs:list(text),mediaId:id,link},required:['title']},
 timeline:{label:'Timeline',properties:{items:{...list(ref('block')),minItems:1,maxItems:100}},required:['items']},
 'card-gallery':{label:'Spatial card gallery',properties:{items:{...list(ref('block')),minItems:1,maxItems:100},description:text,orientation:{enum:['horizontal','vertical']},variant:{enum:['perspective','circular']}},required:['items']},
 carousel:{label:'Carousel',properties:{items:{...list(ref('block')),minItems:1,maxItems:100},description:text},required:['items']},
 reference:{label:'Document reference',properties:{documentId:id,presentation:{enum:['card','inline']}},required:['documentId','presentation']},
 metric:{label:'Metric',properties:{value:short,description:text,evidenceIds:{...strings,minItems:1}},required:['value','label','evidenceIds']},
 quote:{label:'Quote',properties:{text,attribution:short,evidenceIds:{...strings,minItems:1}},required:['text','attribution','evidenceIds']}
});
const provenance={anyOf:[object({kind:{const:'author-provided'},label:short},['kind']),object({kind:{const:'source-linked'},source:object({url:short,label:short,locator:short},['url','label'])},['kind','source'])]};
export function createContentModel({documentTypes={},blockTypes={}}={}){
 const docs={...documentTypeDefinitions,...documentTypes},blocks={...blockTypeDefinitions,...blockTypes};
 for(const [name,definition] of [...Object.entries(documentTypes),...Object.entries(blockTypes)]){
  if(!/^[a-z][a-z0-9-]*$/.test(name)||!definition.properties)throw new TypeError('Content types need a stable name and property schema.');
  if(name in documentTypeDefinitions||name in blockTypeDefinitions)throw new TypeError('Built-in types require a schema migration to change.');
  if(Object.keys(definition.properties).some(key=>key==='type'||key in common||key in blockBase))throw new TypeError('Extensions cannot replace shared content fields.');
  assertSupportedSchema(definition.properties);
 }
 const defs={
  evidence:object({id,kind:{enum:['statement','metric','quote']},text,provenance},['id','kind','text','provenance']),
  asset:{anyOf:['image','video'].map(type=>object({id,type:{const:type},status:{enum:['published','draft','archived']},url:short,alt:text,width:{type:'integer',minimum:1},height:{type:'integer',minimum:1},credit:text},['id','type','status','url',...(type==='image'?['alt']:[])]))},
  presentation:object({documentId:id,card:object({orientation:{enum:['portrait','landscape']},surface},['orientation','surface']),detail:object({columns:{type:'integer',minimum:1,maximum:4}},['columns'])},['documentId','card','detail']),
  placement:object({id,documentId:id,featured:{type:'boolean'}},['id','documentId']),
  layout:object({id,items:list(ref('placement'))},['id','items'])
 };
 for(const [name,d] of Object.entries(docs))defs['document-'+name]=object({...common,...d.properties,type:{const:name}},['id','type','status','title','blocks',...(d.required||[])]);
 defs['document-portfolio-item'].anyOf=[{required:['heroMediaId']},{required:['listOnly'],properties:{listOnly:{const:true}}}];
 for(const [name,b] of Object.entries(blocks))defs['block-'+name]=object({...blockBase,...b.properties,type:{const:name}},['id','type',...(b.required||[])]);
 defs.document={anyOf:Object.keys(docs).map(name=>ref('document-'+name))};defs.block={anyOf:Object.keys(blocks).map(name=>ref('block-'+name))};
 const schema={
  $schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:prem:portfolio:content:1',title:'Portfolio content catalog',
  ...object({schemaVersion:{const:CONTENT_SCHEMA_VERSION},documents:{...list(ref('document')),maxItems:CONTENT_LIMITS.documents},assets:{...list(ref('asset')),maxItems:CONTENT_LIMITS.assets},presentations:list(ref('presentation')),layouts:list(ref('layout'))},['schemaVersion','documents','assets','presentations','layouts']),$defs:defs
 };
 const model={schema,documentTypes:docs,blockTypes:blocks,validate:catalog=>validateCatalog(catalog,model)};
 model.assert=catalog=>{const issues=model.validate(catalog);if(issues.length)throw new ContentValidationError(issues);return catalog;};
 return Object.freeze(model);
}
export class ContentValidationError extends Error{
 constructor(issues){super('Invalid content:\n'+issues.slice(0,30).join('\n'));this.name='ContentValidationError';this.issues=issues;}
}
// Keep extension validation and the published JSON Schema contract consistent.
function assertSupportedSchema(properties){
 const keywords=new Set(['type','const','enum','anyOf','$ref','properties','required','additionalProperties','items','minItems','maxItems','uniqueItems','minLength','maxLength','pattern','minimum','maximum','title','description']);
 const visit=s=>{for(const key of Object.keys(s)){if(!keywords.has(key))throw new TypeError('Unsupported schema keyword '+key);}for(const child of Object.values(s.properties||{}))visit(child);if(s.items)visit(s.items);for(const child of s.anyOf||[])visit(child);};
 Object.values(properties).forEach(visit);
}
export function safeUrl(value,{asset=false}={}){
 if(typeof value!=='string'||!value||/[\u0000-\u0020\\<>"']/.test(value)||/%(?:0[0-9a-f]|1[0-9a-f]|2f|5c)/i.test(value))return false;
 if(value.startsWith('https://')||value.startsWith('http://')){try{const u=new URL(value);return Boolean(u.hostname)&&!u.username&&!u.password;}catch{return false;}}
 if(!asset&&value.startsWith('mailto:'))return /^[^@]+@[^@]+$/.test(value.slice(7));
 if(!asset&&/^#[a-z][a-z0-9-]*$/.test(value))return true;
 let decoded;try{decoded=decodeURIComponent(value);}catch{return false;}
 return !decoded.startsWith('//')&&!decoded.includes(':')&&!decoded.split(/[/?#]/).includes('..')&&!decoded.startsWith('#');
}
export function walkBlocks(blocks,visit,depth=0){
 if(depth>CONTENT_LIMITS.depth)throw new ContentValidationError(['Content nesting exceeds '+CONTENT_LIMITS.depth+' levels.']);
 for(const b of blocks){visit(b);if(b.items)walkBlocks(b.items,visit,depth+1);}
}
function validateCatalog(catalog,model){
 const issues=validateSchema(catalog,model.schema);if(issues.length)return issues;
 const documents=new Map(),assets=new Map(),inlineEdges=new Map(),slugs=new Set();
 function index(items,map,name){for(const item of items){if(map.has(item.id))issues.push(name+' has duplicate ID '+item.id);map.set(item.id,item);}}
 index(catalog.documents,documents,'documents');index(catalog.assets,assets,'assets');
 const related=(owner,target,kind,path)=>{if(!target)issues.push(path+' refers to a missing '+kind);else if(owner.status==='published'&&target.status!=='published')issues.push(path+' publishes a reference to '+target.status+' '+kind+' '+target.id);};
 for(const a of assets.values())if(!safeUrl(a.url,{asset:true}))issues.push('asset '+a.id+' has an unsafe URL');
 const visitLink=(l,path)=>{if(!safeUrl(l.url))issues.push(path+' has an unsafe link');};
 for(const d of documents.values()){
  if(d.slug){if(slugs.has(d.slug))issues.push('Duplicate document slug '+d.slug);slugs.add(d.slug);}
  const evidence=new Set(),blockIds=new Set(),edges=[];inlineEdges.set(d.id,edges);
  for(const e of d.evidence||[]){if(evidence.has(e.id))issues.push(d.id+' has duplicate evidence ID '+e.id);evidence.add(e.id);if(e.provenance.source)visitLink(e.provenance.source,d.id+' evidence '+e.id);}
  if(d.prototype?.url){visitLink({url:d.prototype.url},d.id+' prototype');if(!/^https?:\/\//.test(d.prototype.url))issues.push(d.id+' prototype requires an HTTP(S) URL');}
  if(d.watchPrototype?.url){visitLink({url:d.watchPrototype.url},d.id+' watch prototype');if(!/^https?:\/\//.test(d.watchPrototype.url))issues.push(d.id+' watch prototype requires an HTTP(S) URL');}
  const linkIds=new Set();for(const l of d.links||[]){if(linkIds.has(l.id))issues.push(d.id+' has duplicate link ID '+l.id);linkIds.add(l.id);visitLink(l,d.id+' link '+l.id);}
  for(const [field,type] of [['heroMediaId','image'],['hoverVideoId','video'],['qrCodeMediaId','image']])if(d[field]){const a=assets.get(d[field]);related(d,a,'asset',d.id+'.'+field);if(a&&a.type!==type)issues.push(d.id+'.'+field+' requires '+type);}
  let count=0;
  try{walkBlocks(d.blocks,b=>{
   count++;if(blockIds.has(b.id))issues.push(d.id+' has duplicate block ID '+b.id);blockIds.add(b.id);
   for(const eid of b.evidenceIds||[])if(!evidence.has(eid))issues.push(d.id+'.'+b.id+' references missing evidence '+eid);
   for(const field of ['mediaId','posterMediaId'])if(b[field]){const a=assets.get(b[field]);related(d,a,'asset',d.id+'.'+b.id);const type=field==='posterMediaId'||b.type==='image'||b.type==='info-card'?'image':b.type==='video'?'video':null;if(a&&type&&a.type!==type)issues.push(d.id+'.'+b.id+' requires '+type);}
   if(b.link)visitLink(b.link,d.id+'.'+b.id);
   if(b.documentId){related(d,documents.get(b.documentId),'document',d.id+'.'+b.id);if(b.presentation==='inline')edges.push(b.documentId);}
   model.blockTypes[b.type]?.validate?.(b,catalog,issues);
  });}catch(error){issues.push(...error.issues);}
  if(count>CONTENT_LIMITS.blocks)issues.push(d.id+' contains too many blocks');
  model.documentTypes[d.type]?.validate?.(d,catalog,issues);
 }
 const active=new Set();
 const cycle=(docId,depth=0)=>{if(active.has(docId)){issues.push('Inline document reference cycle at '+docId);return;}if(depth>CONTENT_LIMITS.depth){issues.push('Inline document reference depth exceeded at '+docId);return;}active.add(docId);for(const next of inlineEdges.get(docId)||[])cycle(next,depth+1);active.delete(docId);};
 for(const docId of documents.keys())cycle(docId);
 const shown=new Set();for(const p of catalog.presentations){if(shown.has(p.documentId))issues.push('Duplicate presentation for '+p.documentId);shown.add(p.documentId);if(!documents.has(p.documentId))issues.push('Presentation refers to missing document '+p.documentId);}
 const layoutIds=new Set();for(const l of catalog.layouts){if(layoutIds.has(l.id))issues.push('Duplicate layout '+l.id);layoutIds.add(l.id);const ids=new Set();for(const p of l.items){if(ids.has(p.id))issues.push(l.id+' has duplicate placement '+p.id);ids.add(p.id);const target=documents.get(p.documentId);if(!target)issues.push(l.id+' has missing document '+p.documentId);if(documents.has(p.id)&&p.id!==p.documentId)issues.push('Placement '+p.id+' collides with another document identity');}}
 return issues;
}
export const contentModel=createContentModel();
export function exportPublishedCatalog(catalog,model=contentModel){
 model.assert(catalog);const documents=catalog.documents.filter(d=>d.status==='published'),ids=new Set(documents.map(d=>d.id));
 return {schemaVersion:catalog.schemaVersion,documents,assets:catalog.assets.filter(a=>a.status==='published'),presentations:catalog.presentations.filter(p=>ids.has(p.documentId)),layouts:catalog.layouts.map(l=>({...l,items:l.items.filter(p=>ids.has(p.documentId))}))};
}
