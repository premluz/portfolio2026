import assert from 'node:assert/strict';
import {SummaryStream,attachSummaryStream,detailSummaryMarkup,setSummaryProgress,summaryParts} from '../dist/summary-stream.js';
import {card,cardDetail} from '../dist/card-renderer.js';
import {projects} from '../dist/documents.js';
import {escapeText} from '../dist/content/html.js';

for(const project of projects){
 const grid=card(project,0),detail=cardDetail(project),parts=summaryParts(project);
 const cardSummary=grid.match(/<p class="project-summary"[^>]*>(.*?)<\/p>/s)?.[1].replace(/<br>/g,'\n').replace(/<[^>]*>/g,'');
 assert.equal(cardSummary,escapeText(parts.lead),'Card contains the original first sentence');
 assert(grid.includes('data-card-copy-word'),'Card copy is split into stable words for hover streaming');
 assert(!grid.includes('data-summary-context'),'Grid never adds the long context');
 assert.equal((detail.match(/class="project-summary"/g)||[]).length,1,'Details has one summary under the intro heading');
 assert(!detail.includes('class="project-context"'),'No duplicated standalone context');
 const paragraph=detail.match(/<p class="project-summary">(.*?)<\/p>/s)[1].replace(/<[^>]*>/g,'');
 assert.equal(paragraph,escapeText((project.summary||'').trim()),'The project summary appears under the detail intro heading');
 assert(!paragraph.includes(escapeText(project.intro||'')),'The intro is used as the heading, not repeated in the summary');
 assert(!detail.includes('data-summary-lead'),'The full summary streams; no card lead remains visible');
 assert(detail.includes(`<h1 tabindex="-1">${escapeText(project.intro||project.pageTitle||project.title)}</h1>`),'Details use the project intro, while the card keeps its own headline');
 assert(detail.indexOf('</p>')<detail.indexOf('<dt class="text-eyebrow">Context</dt>'));
}
assert(detailSummaryMarkup({summary:'First.',context:'Safe <text> & content.'}).includes('First.'));
assert(detailSummaryMarkup({summary:'Safe <text> & content.'}).includes('&lt;text&gt;'));
assert(detailSummaryMarkup({summary:'Card only.'}).replace(/<[^>]*>/g,'').includes('Card only.'),'The authored summary is used under the detail intro');

let now=0,id=0;const frames=new Map();
globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
function paragraph(){
 const facts={style:{}},words=Array.from({length:40},(_,i)=>({style:{},textContent:'word'+i+' '}));
 return {dataset:{},style:{},words,facts,querySelectorAll:()=>words,closest:()=>({querySelector:()=>facts})};
}
const step=ms=>{now+=ms;const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(now);};
const finish=()=>{for(let i=0;frames.size&&i<300;i++)step(16);assert.equal(frames.size,0,'No idle streaming work');};
const original=paragraph(),text=original.words.map(word=>word.textContent).join('');
let completed=0,revealAt=null,completeAt=null,stream;stream=new SummaryStream(original,{onReveal:()=>revealAt=stream.position,onComplete:()=>{completed++;completeAt=stream.position;}});assert(original.words.every(word=>word.style.opacity==='0'));assert.equal(original.facts.style.opacity,undefined,'Details wait until the opening summary nears completion');
step(0);step(0);assert.equal(stream.position,0);for(let i=0;i<20;i++)step(16);
assert(stream.position>0&&stream.position<1);assert(original.words.some(word=>word.style.opacity==='1'));assert(original.words.some(word=>word.style.opacity==='0'));
assert.equal(original.words.map(word=>word.textContent).join(''),text,'Full text remains accessible with stable wrapping throughout');
const morphCopy=paragraph(),detach=attachSummaryStream(original,morphCopy);
assert.deepEqual(morphCopy.words.map(word=>word.style.opacity),original.words.map(word=>word.style.opacity),'Morph copy starts at exactly the live paragraph phase');
step(16);assert.deepEqual(morphCopy.words.map(word=>word.style.opacity),original.words.map(word=>word.style.opacity));
const before=stream.position;step(5000);assert(stream.position-before<=40/stream.duration+1e-10,'A stalled frame never dumps all remaining text at once');
finish();assert(original.words.every(word=>word.style.opacity==='1'));assert.equal(original.facts.style.opacity,undefined,'Streaming never fades in the detail facts');assert.equal(completed,1,'The summary completion callback runs once');assert(revealAt>=.7&&revealAt<1,'Detail sections begin before the summary finishes');assert(revealAt<completeAt,'The detail reveal overlaps with the summary tail');detach();stream.destroy();
for(const reduced of [true,false]){
 const target=paragraph(),callbacks=[],s=new SummaryStream(target,{reduced,control:{register:fn=>callbacks.push(fn)}});
 if(reduced){assert(target.words.every(word=>word.style.opacity==='1'));assert.equal(target.facts.style.opacity,undefined);assert.equal(frames.size,0);}
 else{for(let i=0;i<20;i++)step(16);const p=s.position;callbacks[0]();assert.equal(s.position,p,'Escape preserves the current revealed words before reversing');finish();assert(target.words.every(word=>word.style.opacity==='0'));assert.equal(target.facts.style.opacity,undefined);}
 s.destroy();
}
const leaving=paragraph();setSummaryProgress(leaving,.4);setSummaryProgress(leaving,0);assert(leaving.words.every(word=>word.style.opacity==='0'),'Return to grid removes the appended context');
const cancelled=new SummaryStream(paragraph());cancelled.destroy();assert.equal(frames.size,0);
console.log('Summary stream passed: single paragraph, unchanged card lead, stable accessible text, clone handoff, staged facts, stalled frames, Escape, reduced motion and cleanup.');
