import assert from 'node:assert/strict';
import {usableDocuments} from '../worker/assistant-core.mjs';
import {catalog} from '../dist/content/catalog.js';

const records=usableDocuments(catalog.documents),byId=new Map(records.map(record=>[record.id,record]));
const flatten=record=>JSON.stringify(record).toLowerCase().replace(/\\n|\s+/g,' ');
const published=catalog.documents.filter(document=>document.status==='published');

// Every project page: all the words a visitor reads on it are in the model's source record.
for(const project of published.filter(document=>document.type==='portfolio-item')){
 const record=byId.get(project.id);assert(record,`Project ${project.id} is a model source`);
 const body=flatten(record);
 for(const field of ['summary','intro','context','challenge','role','highlights','keyWork','impact'])if(project[field])assert(body.includes(project[field].toLowerCase().slice(0,40)),`${project.id}.${field} reaches the model`);
 if(project.client)assert.equal(record.client,project.client,`${project.id} client`);
 if(project.prototype?.url)assert.equal(record.prototype,project.prototype.url,`${project.id} prototype link`);
}

// Reusable sections and pages are sources too, with the text of every block type they use.
for(const id of ['home','about','contact','home-about','home-services','home-approach','home-testimonials','about-traits','about-unusual']){
 const document=published.find(item=>item.id===id);if(!document)continue;
 const record=byId.get(id);assert(record,`${id} is a model source`);
 const body=flatten(record);
 const walk=block=>[...(block.paragraphs||[]),block.text,block.caption,block.description,block.title,block.label,...(block.items||[]).flatMap(walk)].filter(value=>typeof value==='string'&&value.trim());
 for(const block of document.blocks||[])for(const value of walk(block))assert(body.includes(value.trim().toLowerCase().slice(0,40)),`${id}: "${value.slice(0,40)}" reaches the model`);
}
assert(!byId.has('inline-context')&&!byId.has('site-footer'),'Popover duplicates and page chrome are not sources');
assert([...byId.values()].every(record=>published.some(document=>document.id===record.id)),'Only published documents are sources');

// Testimonials keep their attribution, which lives outside `paragraphs`.
const quote=published.find(document=>document.id==='home-testimonials')?.blocks.find(block=>block.type==='quote');
if(quote)assert(flatten(byId.get('home-testimonials')).includes(quote.attribution.toLowerCase()),'Quote attribution reaches the model');

// Draft and archived content never leaks.
const leaked=usableDocuments([{id:'draft',type:'portfolio-item',status:'draft',title:'Secret',summary:'x'},{id:'ok',type:'page',status:'published',title:'Ok',summary:'visible'}]);
assert.deepEqual(leaked.map(record=>record.id),['ok']);
const size=JSON.stringify(records).length;assert(size<120000,`The corpus stays small enough to send whole (${size} characters)`);
// Articles and news are sources, with their dates, authors and series, and their image text reaches the model too.
const articles=published.filter(document=>document.type==='article');
assert(articles.length>0,'The catalog has articles to check');
for(const article of articles){
 const record=byId.get(article.id);assert(record,`Article ${article.id} is a model source`);
 // JSON escapes quotation marks; the model reads them as written.
 const body=flatten(record).replaceAll('\\"','"');
 assert.equal(record.publishedAt,article.publishedAt,`${article.id} publication date`);assert.equal(record.author,article.author,`${article.id} author`);
 if(article.series)assert.deepEqual([record.series.id,record.series.part,record.series.of],[article.series.id,article.series.part,article.series.of],`${article.id} series`);
 const walk=block=>[...(block.paragraphs||[]),block.text,block.caption,block.description,block.title,block.label,...(block.columns||[]),...(block.rows||[]).flat(),...(block.items||[]).flatMap(walk)].filter(value=>typeof value==='string'&&value.trim());
 for(const block of article.blocks||[])for(const value of walk(block))assert(body.includes(value.trim().toLowerCase().slice(0,40)),`${article.id}: "${value.slice(0,40)}" reaches the model`);
}
const withNews=usableDocuments([{id:'n',type:'news',status:'published',title:'Update',summary:'A new case study',publishedAt:'2026-11-01'},{id:'n2',type:'news',status:'draft',title:'Hidden',summary:'x'}]);
assert.deepEqual(withNews.map(record=>[record.id,record.publishedAt]),[['n','2026-11-01']],'A published news item reaches the model; a draft does not');

// Media: a block's alt text and its asset's description (fixture only; the real descriptions are the owner's content).
const media=[{id:'m',type:'page',status:'published',title:'Media',summary:'s',blocks:[{id:'b1',type:'image',mediaId:'shot',alt:'Alt of the shot'},{id:'b2',type:'video',mediaId:'clip'},{id:'b3',type:'carousel',items:[{id:'c1',type:'image',mediaId:'shot',alt:'Nested alt'}]}]}];
const mediaText=flatten(usableDocuments(media,{shot:{description:'A dashboard with three filters'},clip:{description:'A recorded walkthrough of checkout'}})[0]);
for(const expected of ['alt of the shot','a dashboard with three filters','a recorded walkthrough of checkout','nested alt'])assert(mediaText.includes(expected),`"${expected}" reaches the model`);
assert(!flatten(usableDocuments(media)[0]).includes('dashboard'),'Without an asset lookup only the alt text is sent');
console.log(`Assistant sources passed: ${records.length} records, ${size} characters, projects, pages and sections complete.`);
