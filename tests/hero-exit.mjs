import assert from 'node:assert/strict';
import {fadeHomeChrome} from '../dist/retained-home.js';
import {TransitionControl} from '../dist/transition-control.js';

globalThis.getComputedStyle=()=>({opacity:'1'});
for(const reverseAt of [null,.1,.4,.8]){
 const calls=[];
 const node=name=>({name,style:{},animate(frames,options){let resolve;const animation={frames,options,currentTime:0,playbackRate:1,effect:{getComputedTiming:()=>({endTime:options.delay+options.duration})},finished:new Promise(done=>resolve=done),pause(){},finish(){resolve();},cancel(){this.cancelled=true;}};calls.push({node:this,animation});return animation;}});
 const heading=node('heading'),copy=node('description'),toolbar=node('toolbar'),badge=node('badge');
 const hero={querySelector:selector=>selector==='h1'?heading:selector==='.badge'?badge:copy};
 const layer={querySelectorAll:selector=>selector==='.home-hero'?[hero]:[toolbar]};
 const control=new TransitionControl();control.synchronize(400);
 const promises=fadeHomeChrome(layer,control,400);
 assert.deepEqual(calls.map(({node})=>node.name),['description','heading','badge','toolbar']);
 assert.equal(calls[0].animation.options.delay,0);
 assert.equal(calls[1].animation.options.delay,48,'The lower description exits before the heading');
 assert.equal(calls[2].animation.options.delay,96,'The badge above the heading leaves last, one step after it');
 assert.equal(calls[0].animation.options.duration,160);
 assert(calls.every(({animation})=>animation.frames.every(frame=>!frame.transform)),'Exit uses the existing calm fade without shifting shared text');
 control.advance(0);control.advance(32);
 assert(calls[0].animation.currentTime>0&&calls[1].animation.currentTime<calls[1].animation.options.delay,'Description is already fading while H1 remains visible');
 let reversed=false;
 for(let now=48;!control.timeline.finished&&now<1500;now+=16){control.advance(now);if(reverseAt!==null&&!reversed&&control.timeline.value>=reverseAt){control.reverse();reversed=true;}}
 await Promise.all(promises);
 if(reversed)assert(calls.every(({animation})=>animation.currentTime===0),'Escape seeks both hero layers back to their original visible phase');
 control.complete();assert(calls.every(({animation})=>animation.cancelled));
 assert.equal(copy.style.opacity,undefined);assert.equal(heading.style.opacity,undefined,'The retained hero has no stale inline hiding on return');
}
console.log('Hero exit passed: description, heading, badge stagger, shared navigation clock, unchanged positions, Escape at three phases and clean return.');

const css=await (await import('node:fs/promises')).readFile(new URL('../dist/content-widths.css',import.meta.url),'utf8');
assert(css.includes(':is(#main,.retained-home) .home-hero{padding-inline:0}'),'The retained hero keeps its zero side padding, preventing an exit-only line wrap or position jump');
assert(css.includes(':is(#main,.retained-home):not(.home-view-split) .gallery-grid'),'The retained scene keeps the same grid content-width rules');
