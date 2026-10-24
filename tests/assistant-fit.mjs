import assert from 'node:assert/strict';
import {parseModelAnswer,answerSchema,quoteIds,parseRequirements} from '../worker/assistant-policy.mjs';
import {evidenceLink,readRequirements,fitStatuses} from '../dist/assistant-fit-table.js';
import {readRoleBrief,uploadedQuestion} from '../dist/assistant-upload.js';

// Schema: every answer carries a requirements list; quotes can be cited one by one.
const corpus=[{id:'tracr',type:'portfolio-item'},{id:'home-testimonials',type:'component',blocks:[{id:'quote-matt',type:'quote',text:'Deep technical design.',attribution:'Matt Bindoff',label:'Lead Engineer'}]},{id:'about',type:'page'}];
const schema=answerSchema(corpus).json_schema.schema;
assert(schema.required.includes('requirements'));
assert.deepEqual(schema.properties.requirements.items.properties.status.enum,['covered','partial','missing']);
assert.deepEqual(schema.properties.requirements.items.properties.evidence.items.properties.quoteId.enum,['quote-matt',''],'Only real testimonial quotes can be cited');
assert.deepEqual(quoteIds(corpus),['quote-matt']);

const ids=new Set(corpus.map(r=>r.id)),quotes=new Set(['quote-matt']);
const answer=parseModelAnswer(JSON.stringify({answer:'Strong fit.',spoken:'Two of three covered.',sourceIds:[],kind:'job-fit',requirements:[
 {requirement:'Design systems',status:'covered',note:'Tracr',evidence:[{sourceId:'tracr',quoteId:''},{sourceId:'home-testimonials',quoteId:'quote-matt'}]},
 {requirement:'Native iOS',status:'missing',note:'Not shown',evidence:[{sourceId:'tracr',quoteId:''}]},
 {requirement:'x'.repeat(200),status:'partial',note:'y'.repeat(300),evidence:[]}]}),ids,quotes);
assert.deepEqual(answer.sourceIds,['tracr','home-testimonials'],'Cited evidence becomes the answer’s sources, so a grounded table is never discarded');
assert.equal(answer.requirements[1].evidence.length,0,'A not-shown requirement carries no evidence');
assert(answer.requirements[2].requirement.length<=90&&answer.requirements[2].note.length<=120,'Long phrasing is clipped');
assert.throws(()=>parseRequirements([{requirement:'a',status:'great',note:'',evidence:[]}],ids,quotes),/unknown requirement status/);
assert.throws(()=>parseRequirements([{requirement:'a',status:'covered',note:'',evidence:[{sourceId:'made-up',quoteId:''}]}],ids,quotes),/unknown source/);
assert.throws(()=>parseRequirements([{requirement:'a',status:'covered',note:'',evidence:[{sourceId:'tracr',quoteId:'quote-fake'}]}],ids,quotes),/unknown testimonial/);
assert.equal(parseRequirements(Array.from({length:40},()=>({requirement:'a',status:'covered',note:'',evidence:[]})),ids,quotes).length,16,'At most 16 rows');
assert.deepEqual(parseModelAnswer(JSON.stringify({answer:'Hi',spoken:'Hi',sourceIds:[],kind:'conversation',requirements:[{requirement:'a',status:'covered',note:'',evidence:[]}]}),ids,quotes).requirements,[],'Only job-fit answers carry a table');

// Evidence links come from the site's own content.
const docs=new Map([['tracr',{id:'tracr',type:'portfolio-item',client:'Tracr'}],['home-testimonials',{id:'home-testimonials',type:'component',title:'Testimonials',blocks:corpus[1].blocks}],['about',{id:'about',type:'page',name:'About'}],['home-approach',{id:'home-approach',type:'component',title:'How I work'}]]);
const store={get:id=>docs.get(id)};
assert.deepEqual(evidenceLink({sourceId:'tracr',quoteId:''},store),{kind:'project',label:'Tracr',href:'#tracr'},'Projects link to their page');
assert.deepEqual(evidenceLink({sourceId:'home-testimonials',quoteId:'quote-matt'},store),{kind:'testimonial',label:'Matt Bindoff',detail:'Lead Engineer',quote:'Deep technical design.',href:'#work',section:'testimonials'},'Testimonials link to the testimonials section and carry the quote');
assert.deepEqual(evidenceLink({sourceId:'about',quoteId:''},store),{kind:'page',label:'About',href:'#about'});
assert.equal(evidenceLink({sourceId:'home-approach',quoteId:''},store).section,'approach','Home sections scroll to themselves');
assert.equal(evidenceLink({sourceId:'nope',quoteId:''},store),null);
assert.deepEqual(Object.keys(fitStatuses),['covered','partial','missing']);assert.equal(fitStatuses.missing.label,'Not shown','Missing reads as not shown, never as lacking');

// The browser re-checks restored history.
const restored=readRequirements([{requirement:'ok',status:'covered',note:'n',evidence:[{sourceId:'tracr'},{sourceId:'ghost'}]},{requirement:'',status:'covered'},{requirement:'bad status',status:'great'},'junk'],store);
assert.equal(restored.length,1);assert.deepEqual(restored[0].evidence,[{sourceId:'tracr',quoteId:''}],'Unknown records are dropped from saved tables');

// Upload: text and Markdown are read; documents get a clear message.
const file=(name,content,type='')=>new File([content],name,{type});
assert.deepEqual(await readRoleBrief(file('role.md','# Role\nDesign systems'),{maxCharacters:12000}),{ok:true,question:uploadedQuestion('role.md','# Role\nDesign systems')});
assert.match((await readRoleBrief(file('role.pdf','%PDF'),{maxCharacters:12000})).message,/PDF and Word/);
assert.match((await readRoleBrief(file('role.docx','x'),{maxCharacters:12000})).message,/PDF and Word/);
assert.match((await readRoleBrief(file('image.png','x','image/png'),{maxCharacters:12000})).message,/\.txt or \.md/);
assert.match((await readRoleBrief(file('empty.txt','   '),{maxCharacters:12000})).message,/empty/);
assert.match((await readRoleBrief(file('long.txt','a'.repeat(13000)),{maxCharacters:12000})).message,/under 12000/);
console.log('Assistant fit passed: schema and quote enum, validated requirements, clipped phrasing, job-fit only, evidence links, restore checks and text uploads.');
