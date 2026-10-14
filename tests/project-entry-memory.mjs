import assert from 'node:assert/strict';
import {ProjectEntryMemory} from '../dist/project-entry-memory.js';
import {sharedCopyNode} from '../dist/shared-copy.js';
import {readFile} from 'node:fs/promises';

const projects=['one','two'],memory=new ProjectEntryMemory();
for(const route of ['work','about','assistant']){memory.capture(route);assert.equal(memory.backTarget('one',projects),route);assert.equal(memory.backTarget('two',projects),route,'Next/previous projects keep the source');assert.equal(memory.backTarget(route,projects),null);const old=memory.snapshot();memory.capture('contact');memory.restore(old);assert.equal(memory.route,route);memory.clear();assert.equal(memory.backTarget('one',projects),null);}

const nodes={title:{textContent:'Project heading'},client:{textContent:'Customer'},summary:{textContent:'Result'}},caption={querySelector(selector){return {'[data-gallery-title]':nodes.title,'[data-gallery-client]':nodes.client,'[data-gallery-description]':nodes.summary}[selector];}};
const host={morphCopyRoot:caption,querySelector(){throw Error('Hidden card labels must not override the visible gallery caption');}};
for(const key of ['title','client','summary'])assert.equal(sharedCopyNode(host,key),nodes[key]);
const normal={querySelector:selector=>selector};assert.equal(sharedCopyNode(normal,'title'),'h1,h2');

// Execute the production Back adapter with a stale Chat return flag: the
// explicit project entry must win over that older history.
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),code=app.slice(app.indexOf('async function activateBack(){'),app.indexOf('function openSiteIndex('));
const back=new Function('env',`with(env){return (${code})();}`),calls=[];
const env={current:'one',projectIds:projects,projectEntry:memory,spatialNavigation:{cancelScroll(){}},portfolioAssistant:{dictating:false},mediaFocus:{active:false},projectDrag:{active:false},activeTransition:null,projectPopover:{target:null},$:()=>({hidden:true}),assistantNavigation:{backTarget:()=> 'assistant'},activateRoute:route=>calls.push(route)};
memory.capture('work');await back(env);assert.equal(calls.pop(),'work');memory.capture('about');await back(env);assert.equal(calls.pop(),'about');memory.capture('assistant');await back(env);assert.equal(calls.pop(),'assistant');
console.log('Project entry passed: source-specific Back, next/previous continuity, Escape rollback, stale Chat history priority and visible caption slots.');

let clickHandler;const clickedImage={},captionLink={dataset:{contentCard:'one'},morphImageRoot:clickedImage,closest:()=>({})},dispatches=[];
const clickEnv={main:{addEventListener(name,handler){assert.equal(name,'click');clickHandler=handler;}},projectIds:projects,busy:false,navigationPreparing:false,commandBus:{pending:false},galleryProjectTarget:null,dispatchCommand:command=>dispatches.push(command)};
const clickCode=app.slice(app.indexOf("main.addEventListener('click',event=>{const link="),app.indexOf('async function openAssistantProject'));
new Function('env',`with(env){${clickCode}}`)(clickEnv);
clickHandler({target:{closest:()=>captionLink},preventDefault(){}});
assert.equal(clickEnv.galleryProjectTarget,clickedImage,'Clicking the caption detaches the selected image card, not the text link');
assert.deepEqual(dispatches,[{id:'project.open',target:'one',source:'pointer'}]);
