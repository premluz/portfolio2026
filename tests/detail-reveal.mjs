import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SummaryStream,attachSummaryStream,attachTitleReveal,projectRevealMode,preserveSharedLead,preserveSharedHeading} from '../dist/summary-stream.js';

assert.equal(projectRevealMode({fromHome:true}),'fade','Home card entry uses the same fade sequence as project arrows');
assert.equal(projectRevealMode({fromHome:true,sliding:true}),'fade');
assert.equal(projectRevealMode(),'fade','Direct entry and other routes fade the entire paragraph');
let now=0,id=0;const frames=new Map();
globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const step=ms=>{now+=ms;const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(now);};
function paragraph(){
 const title={style:{},dataset:{}},client={style:{},dataset:{}},facts={style:{}},words=Array.from({length:12},()=>({style:{}}));
 const rest={style:{}};
 const detail={parentElement:{querySelectorAll:()=>[rest]},querySelector:selector=>selector==='h1'?title:selector==='.project-client'?client:selector==='.description'?facts:null};
 return {title,client,facts,rest,words,style:{},dataset:{},querySelectorAll:()=>words,closest:()=>detail};
}
let completed=0;const target=paragraph(),reversals=[],reveal=new SummaryStream(target,{mode:'fade',control:{register:fn=>reversals.push(fn)},onComplete:()=>completed++});
assert(target.words.every(word=>word.style.opacity==='1'),'Fade mode never streams individual words');
assert.equal(target.style.opacity,'0');assert.equal(target.title.style.opacity,'0');assert.equal(target.facts.style.opacity,undefined,'Facts wait for the summary to finish');
step(0);step(40);step(40);
assert(Number(target.title.style.opacity)>0);assert.equal(target.style.opacity,'0','Title starts first');
step(40);step(40);step(40);
assert(Number(target.style.opacity)>0,'Whole paragraph starts after the title');
assert.equal(target.facts.style.opacity,undefined,'Facts wait until the paragraph has completed');
const copy=paragraph(),heading={style:{},dataset:{}},detach=attachSummaryStream(target,copy),detachTitle=attachTitleReveal(target,heading);
assert.equal(copy.style.opacity,target.style.opacity);assert.equal(heading.style.opacity,target.title.style.opacity);
step(16);assert.equal(copy.style.opacity,target.style.opacity);assert.equal(heading.style.opacity,target.title.style.opacity);
assert.equal(target.client.style.opacity,target.title.style.opacity,'Client and title share the same entrance reveal');
const phase=reveal.position;reversals[0]();assert.equal(reveal.position,phase,'Escape reverses without a visibility jump');
step(16);assert(reveal.position<phase);assert.equal(target.client.style.opacity,target.title.style.opacity,'Client reverses with the title on Escape');detach();detachTitle();reveal.destroy();

const incoming=paragraph(),swipe=new SummaryStream(incoming,{mode:'fade',paused:true});
assert.equal(frames.size,0,'Offscreen swipe neighbor waits for commit');swipe.start();step(0);
for(let i=0;i<20;i++)step(16);
const live=paragraph(),handoff=new SummaryStream(live,{mode:'fade',progress:swipe.position});
assert.equal(live.style.opacity,incoming.style.opacity,'Swipe handoff keeps the exact paragraph reveal phase');
assert.equal(live.title.style.opacity,incoming.title.style.opacity);
assert.equal(live.client.style.opacity,incoming.client.style.opacity,'Mobile swipe keeps the client reveal phase during handoff');
assert.equal(live.facts.style.opacity,undefined);assert.equal(live.rest.style.opacity,undefined);swipe.destroy();
for(let i=0;frames.size&&i<100;i++)step(16);
assert.equal(live.style.opacity,'1');assert.equal(live.title.style.opacity,'1');assert.equal(live.facts.style.opacity,undefined);assert.equal(frames.size,0);handoff.destroy();assert.equal(completed,0,'Reversing before completion never starts the remaining reveal');
const reduced=paragraph(),instant=new SummaryStream(reduced,{mode:'fade',reduced:true});
assert.equal(reduced.style.opacity,'1');assert.equal(reduced.title.style.opacity,'1');assert.equal(reduced.facts.style.opacity,undefined);assert.equal(frames.size,0);instant.destroy();

// A selected card carries its existing lead/title/client rather than replaying
// the page entrance. Only the extra context reveals on this morph route.
const common=paragraph(),context={style:{}};common.querySelector=()=>context;
const shared=new SummaryStream(common,{mode:'fade',paused:true});assert.equal(common.title.style.opacity,'0');
preserveSharedLead(common);assert.equal(common.style.opacity,'1');assert.equal(common.title.style.opacity,'');assert.equal(common.client.style.opacity,'');assert.equal(context.style.opacity,'0');assert.equal(common.dataset.revealOpacity,undefined);
const sharedCopy=paragraph(),copyContext={style:{}};sharedCopy.querySelector=()=>copyContext;
const detachShared=attachSummaryStream(common,sharedCopy);shared.start();step(0);for(let i=0;i<16;i++)step(16);
assert.equal(common.style.opacity,'1','Common sentence stays visible while the new context reveals');assert(Number(context.style.opacity)>0);assert.equal(copyContext.style.opacity,context.style.opacity);assert.equal(common.title.style.opacity,'');
shared.reverse();for(let i=0;frames.size&&i<100;i++)step(16);
assert.equal(context.style.opacity,'0');assert.equal(common.style.opacity,'1','Escape removes new context without removing the shared card sentence');detachShared();shared.destroy();

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes('projectRevealMode('),'The common project route selects the shared fade policy');
const drag=await readFile(new URL('../dist/project-drag.js',import.meta.url),'utf8');
assert(drag.indexOf('this.options.onStage?.')>drag.indexOf('document.body.append(s.stage)'),'Clone bindings attach after the swipe stage exists');
console.log('Detail reveal passed: route selection, summary-first sequencing, title/paragraph fade, Escape, clone phase, swipe handoff, reduced motion and idle cleanup.');
