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
console.log(`Assistant sources passed: ${records.length} records, ${size} characters, projects, pages and sections complete.`);
