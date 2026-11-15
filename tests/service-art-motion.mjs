import assert from 'node:assert/strict';
import {mountServiceArtMotion,restTransform} from '../dist/service-art-motion.js';
import {DURATION} from '../dist/motion-tokens.js';

const part=(transform,step)=>{const calls=[];return {calls,dataset:{step:String(step)},getAttribute:()=>transform,animate(keyframes,options){const animation={keyframes,options,cancelled:false,cancel(){this.cancelled=true;}};calls.push(animation);return animation;}};};
const card=parts=>{const listeners=new Map();return {parts,listeners,querySelector:()=>parts[0]??null,querySelectorAll:()=>parts,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};};
const rootOf=cards=>({querySelectorAll:()=>cards});
const env=({hover,observer=null,animation='on'})=>({matchMedia:()=>({matches:hover}),document:{documentElement:{dataset:{animation}}},getComputedStyle:()=>({transform:'matrix(1, 0, 0, 1, -3, -5)'}),IntersectionObserver:observer});

assert.equal(restTransform(part('translate(-6 -10)',0)),'translate(-6px, -10px)');
assert.throws(()=>restTransform(part('scale(2)',0)),/no translate rest pose/,'An unexpected rest pose fails loudly');

// Hover: loops rest ↔ pose while hovered, eases back to rest on leave, staggered by step.
{const a=part('translate(-6 -10)',0),b=part('translate(14 -7)',2),c=card([a,b]);
 const motion=mountServiceArtMotion(rootOf([c]),{environment:env({hover:true})});
 c.listeners.get('pointerenter')();
 const loop=b.calls[0];assert.deepEqual(loop.keyframes,[{transform:'translate(14px, -7px)'},{transform:'none'}]);
 assert.equal(loop.options.iterations,Infinity);assert.equal(loop.options.direction,'alternate');assert.equal(loop.options.duration,DURATION.serviceArtLeg);assert.equal(loop.options.delay,2*DURATION.staggerStep);
 c.listeners.get('pointerleave')();
 assert(loop.cancelled,'Leaving stops the loop');assert.deepEqual(b.calls[1].keyframes,[{transform:'matrix(1, 0, 0, 1, -3, -5)'},{transform:'translate(14px, -7px)'}],'and eases back from where it was');
 assert.equal(b.calls[1].options.fill,undefined,'The return leaves no fill, so the attribute takes over');
 motion.destroy();assert.equal(c.listeners.size,0);}

// Touch: one rest → pose → rest play per card, only once it is mostly on screen.
{let callback,observed=[],unobserved=[];class Observer{constructor(fn,options){callback=fn;assert.deepEqual(options.threshold,[.6]);}observe(target){observed.push(target);}unobserve(target){unobserved.push(target);}disconnect(){}}
 const first=part('translate(0 12)',0),later=part('translate(0 8)',0),c1=card([first]),c2=card([later]);
 mountServiceArtMotion(rootOf([c1,c2]),{environment:env({hover:false,observer:Observer})});
 assert.equal(observed.length,2);assert.equal(first.calls.length+later.calls.length,0,'Nothing plays before a card is reached');
 callback([{target:c1,intersectionRatio:.7},{target:c2,intersectionRatio:.2}]);
 assert.equal(first.calls.length,1);assert.equal(later.calls.length,0,'A card further along the carousel waits');
 assert.deepEqual(first.calls[0].keyframes.map(frame=>frame.transform),['translate(0px, 12px)','none','translate(0px, 12px)']);
 assert.equal(first.calls[0].options.iterations,undefined,'Once, not looped');assert.deepEqual(unobserved,[c1]);
 callback([{target:c2,intersectionRatio:.9}]);assert.equal(later.calls.length,1);}

// Reduced motion and Animation off: no movement.
{const a=part('translate(0 12)',0),c=card([a]);mountServiceArtMotion(rootOf([c]),{reduced:()=>true,environment:env({hover:true})});c.listeners.get('pointerenter')();assert.equal(a.calls.length,0);
 const b=part('translate(0 12)',0),d=card([b]);mountServiceArtMotion(rootOf([d]),{environment:env({hover:true,animation:'off'})});d.listeners.get('pointerenter')();assert.equal(b.calls.length,0);}

console.log('Service art motion passed: hover loop and return, touch plays once in view, reduced motion still.');
