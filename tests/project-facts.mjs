import assert from 'node:assert/strict';
import {contentModel,ContentValidationError} from '../dist/content/model.js';
import {catalog} from '../dist/content/catalog.js';
import {usableDocuments} from '../worker/assistant-core.mjs';

const FACTS={
 timeline:{start:'2024-03',end:'2025'},
 team:{size:6,myRole:'Lead designer',collaborators:['Product','Engineering']},
 outcomes:[{id:'faster',claim:'Navigation went from ten areas to three',metric:'10 to 3',evidenceId:'fixture-evidence'}],
 decisions:[{id:'one-nav',problem:'Ten areas confused new users',options:['Keep ten','Merge to three'],choice:'Merge to three',reason:'Testing showed faster task completion'}],
 tools:['Figma','Playwright'],platforms:['Web','iOS']
};
const FIELDS=Object.keys(FACTS);
const project=catalog.documents.find(document=>document.type==='portfolio-item'&&document.status==='published');
const fixture=(extra={})=>{
 const c=structuredClone(catalog);
 const target=c.documents.find(document=>document.id===project.id);
 target.evidence=[...(target.evidence||[]),{id:'fixture-evidence',kind:'statement',text:'Measured in testing',provenance:{kind:'author-provided'}}];
 Object.assign(target,structuredClone(FACTS),extra);return {c,target};
};
const invalid=(mutate,pattern,label)=>{const {c,target}=fixture();mutate(target);assert.throws(()=>contentModel.assert(c),error=>error instanceof ContentValidationError&&pattern.test(error.message),label);};

// A project with every fact validates; a project with none is unchanged.
const full=fixture();assert.deepEqual(contentModel.validate(full.c),[],'All structured facts validate');
assert.deepEqual(contentModel.validate(catalog),[],'The real catalog, with none, still validates');
for(const field of FIELDS)assert.equal(project[field],undefined,`The real project ${project.id} has no ${field}: values are the owner's to write`);

// Dates are ISO year or year-month; the period must run forwards.
for(const bad of ['24','2024-13','2024-1','March 2024','2024-03-01'])invalid(target=>{target.timeline.start=bad;},/start|pattern|timeline/i,`start ${bad}`);
invalid(target=>{target.timeline={start:'2025-06',end:'2025-01'};},/timeline ends before it starts/,'end before start');
{const {c,target}=fixture({timeline:{start:'2024'}});assert.deepEqual(contentModel.validate(c),[],'An ongoing project has no end');assert.equal(target.timeline.end,undefined);}
{const {c}=fixture({timeline:{start:'2025-01',end:'2025-01'}});assert.deepEqual(contentModel.validate(c),[],'A one-month project ends the month it starts');}

// Shapes and references.
invalid(target=>{target.team.size=0;},/size|minimum/i,'team size is at least one');
invalid(target=>{target.team.size=2.5;},/size|integer/i,'team size is whole');
invalid(target=>{delete target.outcomes[0].claim;},/claim|required/i,'an outcome needs a claim');
invalid(target=>{target.outcomes[0].evidenceId='missing-evidence';},/references missing evidence missing-evidence/,'evidence must exist on the document');
invalid(target=>{target.outcomes.push({...target.outcomes[0]});},/duplicate ID faster/,'outcome ids are unique');
invalid(target=>{target.decisions[0].options=['Only one'];target.decisions[0].choice='Only one';},/options|minItems/i,'a decision weighed at least two options');
invalid(target=>{target.decisions[0].choice='Something else';},/choice is not one of its options/,'the choice is one of the options');
invalid(target=>{target.decisions.push({...target.decisions[0]});},/duplicate ID one-nav/,'decision ids are unique');
invalid(target=>{target.tools=['Figma','Figma'];},/tools|unique/i,'tools are unique');
invalid(target=>{target.unknownFact='x';},/unknownFact|additional/i,'unknown fields are still refused');

// The facts reach the model for a project that has them, and only for it.
const {target}=fixture();
const withFacts=usableDocuments([target])[0];
for(const field of FIELDS)assert.deepEqual(withFacts[field],FACTS[field],`${field} reaches the model`);
const bare=usableDocuments([{...project}])[0];
for(const field of FIELDS)assert(!(field in bare),`A project with no ${field} sends none`);
const page=usableDocuments([{id:'p',type:'page',status:'published',title:'P',summary:'s',timeline:{start:'2020'}}])[0];
assert(!('timeline' in page),'Facts are sent for projects only');

console.log('Project facts passed: every field validates, bad dates, shapes and references fail, facts reach the model, a project with none is unchanged.');
