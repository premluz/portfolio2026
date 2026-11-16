import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {revealHomeHero} from '../dist/retained-home.js';
import {EASE,DURATION} from '../dist/motion-tokens.js';

// Going back to Work, the hero staggers in top-down, mirroring its bottom-up exit (same step and length).
const calls=[];
const node=(name,hidden=false)=>({name,hidden,animate(keyframes,options){calls.push({name,keyframes,options});return {finished:Promise.resolve()};}});
const parts={'.badge':node('badge'),h1:node('heading'),'[data-hero-copy]':node('copy')};
const hero={querySelector:selector=>parts[selector]||null};
const root={querySelectorAll:selector=>selector==='.home-hero'?[hero]:[]};
const tracked=[];const control={track:animation=>{tracked.push(animation);return animation;}};
assert.equal(revealHomeHero(root,control,400).length,3);
assert.deepEqual(calls.map(call=>call.name),['badge','heading','copy'],'Top-down: badge, heading, description');
assert.equal(DURATION.returnCopyFade,.42,'The hero waits for the departing project title, which liquid-surface fades out by this share of the morph');
assert.deepEqual(calls.map(call=>call.options.delay),[168,216,264],'Starts once the project title has faded (42%), then one exit step (12% of the duration) apart');
assert(calls.every(call=>call.options.duration===160&&call.options.easing===EASE.settle&&call.options.fill==='backwards'),'Same length as the exit, settling, hidden until each step');
assert.deepEqual(calls[0].keyframes,[{opacity:0},{opacity:1}]);
assert.equal(tracked.length,3,'The transition control owns them, so Escape mid-return reverses them too');
calls.length=0;parts['.badge'].hidden=true;revealHomeHero(root,control,400);
assert.deepEqual(calls.map(call=>[call.name,call.options.delay]),[['heading',168],['copy',216]],'A hidden badge takes no step');
// The strip's own logos stagger in from its step (hero-logos.js); the strip itself is not faded as one block.
const logo=name=>({...node(name),getBoundingClientRect:()=>({left:0,right:80})});
const strip={...node('strip'),getBoundingClientRect:()=>({left:0,right:1000}),querySelectorAll:()=>[logo('logo')]};
calls.length=0;tracked.length=0;parts['.badge'].hidden=false;parts['.hero-logos']=strip;revealHomeHero(root,control,400);
assert.deepEqual(calls.map(call=>[call.name,call.options.delay]),[['badge',168],['heading',216],['copy',264],['logo',312]],'The logos return last, starting one step after the description');
assert(calls.every(call=>call.options.duration===160&&call.options.easing===EASE.settle&&call.options.fill==='backwards'),'The logos share the hero lines\' length, curve and hidden-until-step fill');
assert.equal(tracked.length,4,'The logo animations belong to the transition too');
calls.length=0;parts['.hero-logos'].hidden=true;revealHomeHero(root,control,400);assert(!calls.some(call=>call.name==='logo'||call.name==='strip'),'A hidden strip is not revealed');

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes('if(restoreReturningHome)tasks.push(...revealHomeHero(main,activeTransition,duration*(slow?2.5:1),{stream:!pageSlide&&!reduce.matches}));'),'Only an animated return from a project runs it, streaming the heading unless Page slide is on');
console.log('Home hero return passed: top-down stagger mirroring the exit, logos staggered last, hidden badge skipped, tracked by the transition.');
