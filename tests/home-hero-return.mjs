import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {revealHomeHero} from '../dist/retained-home.js';
import {EASE} from '../dist/motion-tokens.js';

// Going back to Work, the hero staggers in top-down, mirroring its bottom-up exit (same step and length).
const calls=[];
const node=(name,hidden=false)=>({name,hidden,animate(keyframes,options){calls.push({name,keyframes,options});return {finished:Promise.resolve()};}});
const parts={'.badge':node('badge'),h1:node('heading'),'[data-hero-copy]':node('copy')};
const hero={querySelector:selector=>parts[selector]||null};
const root={querySelectorAll:selector=>selector==='.home-hero'?[hero]:[]};
const tracked=[];const control={track:animation=>{tracked.push(animation);return animation;}};
assert.equal(revealHomeHero(root,control,400).length,3);
assert.deepEqual(calls.map(call=>call.name),['badge','heading','copy'],'Top-down: badge, heading, description');
assert.deepEqual(calls.map(call=>call.options.delay),[0,48,96],'One exit step (12% of the duration) apart');
assert(calls.every(call=>call.options.duration===160&&call.options.easing===EASE.settle&&call.options.fill==='backwards'),'Same length as the exit, settling, hidden until each step');
assert.deepEqual(calls[0].keyframes,[{opacity:0},{opacity:1}]);
assert.equal(tracked.length,3,'The transition control owns them, so Escape mid-return reverses them too');
calls.length=0;parts['.badge'].hidden=true;revealHomeHero(root,control,400);
assert.deepEqual(calls.map(call=>[call.name,call.options.delay]),[['heading',0],['copy',48]],'A hidden badge takes no step');

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes('if(restoreReturningHome)tasks.push(...revealHomeHero(main,activeTransition,duration*(slow?2.5:1)));'),'Only an animated return from a project runs it');
console.log('Home hero return passed: top-down stagger mirroring the exit, hidden badge skipped, tracked by the transition.');
