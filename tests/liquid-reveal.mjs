import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLiquidReveal,stepLiquidPointer} from '../dist/liquid-reveal.js';

const point={x:0,y:0,vx:0,vy:0},target={x:100,y:40};
stepLiquidPointer(point,target);
assert(point.x>0&&point.x<100&&point.y>0&&point.y<40,'The leading lobe follows with spring lag');
for(let i=0;i<120;i++)stepLiquidPointer(point,target);
assert(Math.hypot(point.x-100,point.y-40,point.vx,point.vy)<.1,'The lobe settles without an idle drift');

const frames=new Map(),styles=new Map(),classes=new Set();let nextId=0;
globalThis.requestAnimationFrame=callback=>{frames.set(++nextId,callback);return nextId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.matchMedia=()=>({matches:false});
globalThis.document={documentElement:{dataset:{animation:'on'}}};
let imageRect={left:100,top:190,width:270,height:160};
const image={getBoundingClientRect:()=>imageRect};
const imageFrame={getBoundingClientRect:()=>({left:90,top:170,width:300,height:210})};
class Host extends EventTarget{
 constructor(){super();this.dataset={hoverEffect:'reveal'};this.isConnected=true;}
 getBoundingClientRect(){return {left:20,top:30,width:480,height:400};}
 querySelector(selector){return selector.includes('> img')?image:imageFrame;}
}
const host=new Host(),layer={style:{setProperty:(key,value)=>styles.set(key,value)},classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
const effect=createLiquidReveal({host,layer});
const enter=Object.assign(new Event('pointerenter'),{pointerType:'mouse',clientX:400,clientY:130});
host.dispatchEvent(enter);effect.setActive(true);
assert(classes.has('is-active'));
assert.equal(styles.get('--liquid-x'),'380.0px');
const restingWidth=parseFloat(styles.get('--liquid-rx'));
host.dispatchEvent(Object.assign(new Event('pointermove'),{pointerType:'mouse',clientX:150,clientY:300}));
const [firstId,firstFrame]=frames.entries().next().value;frames.delete(firstId);firstFrame(16.667);
assert(parseFloat(styles.get('--liquid-rx'))>restingWidth,'The leading lobe elongates while moving');
assert(Math.abs(parseFloat(styles.get('--liquid-side-x'))-parseFloat(styles.get('--liquid-x')))>10,'A side lobe pulls the boundary away from a plain ellipse');
assert(Math.abs(parseFloat(styles.get('--liquid-tail-x'))-parseFloat(styles.get('--liquid-x')))>1,'The trailing lobe lags behind the leading edge');
host.dispatchEvent(Object.assign(new Event('pointermove'),{pointerType:'mouse',clientX:400,clientY:130}));
assert.equal(frames.size,1,'Pointer reversal reuses the active animation frame');
for(let i=0;frames.size&&i<220;i++){
 const [id,frame]=frames.entries().next().value;frames.delete(id);frame((i+1)*16.667);
}
assert.equal(frames.size,0,'The animation loop stops once the pointer and trailing lobe settle');
assert(Math.abs(parseFloat(styles.get('--liquid-x'))-380)<1);
assert(Math.abs(parseFloat(styles.get('--liquid-tail-x'))-380)<1);
effect.setActive(false);assert(!classes.has('is-active'));
host.dataset.hoverEffect='reveal-soft';effect.setActive(true);
assert(parseFloat(styles.get('--liquid-rx'))>restingWidth,'The earlier broad two-lobe reveal is preserved');
host.dispatchEvent(Object.assign(new Event('pointermove'),{pointerType:'mouse',clientX:150,clientY:300}));
for(let i=0;frames.size&&i<220;i++){
 const [id,frame]=frames.entries().next().value;frames.delete(id);frame((i+1)*16.667);
}
assert.equal(frames.size,0,'The previous reveal also stops updating when settled');
effect.setActive(false);
host.dataset.hoverEffect='glow';effect.setActive(true);
assert(classes.has('is-active'),'The ambient glow follows the same hover lifecycle');
assert.equal(styles.get('--ambient-left'),'80.0px');
assert.equal(styles.get('--ambient-top'),'160.0px');
assert.equal(styles.get('--ambient-width'),'270.0px');
assert.equal(frames.size,0,'Ambient glow activates without a pointer animation loop');
const oldX=styles.get('--liquid-x');
host.dispatchEvent(Object.assign(new Event('pointermove'),{pointerType:'mouse',clientX:200,clientY:240}));
assert.equal(styles.get('--liquid-x'),oldX,'The ambient glow ignores pointer movement');
assert.equal(frames.size,0);
imageRect={left:110,top:195,width:280,height:170};
effect.setActive(true);
assert.equal(styles.get('--ambient-left'),'90.0px','The glow stays anchored to the resized or moved image');
effect.setActive(false);
effect.destroy();assert.equal(frames.size,0);
const css=readFileSync(new URL('../dist/surface-hover.css',import.meta.url),'utf8');
assert(css.includes('[data-hover-effect~="reveal"][data-hover-rest="page"]'),'A page-coloured resting surface stays page-coloured outside the reveal during hover');
assert(css.includes('var(--liquid-side-rx'),'The reveal has a deformable side lobe');
assert(css.includes('--liquid-soft-mask:')&&css.includes('[data-hover-effect~="reveal-soft"]'),'The previous broad mask stays selectable');
assert(css.includes('[data-hover-effect~="glow"]>.surface-effect-layer')&&css.includes('overflow:visible;opacity:0;-webkit-mask:none;mask:none'),'The glow has a feathered, unmasked plane outside the card skin');
assert(css.includes('var(--ambient-width,100%)')&&css.includes('.surface-effect-layer.is-active::before'),'The glow blooms around the measured image');
console.log('Liquid reveal passed: delayed organic lobes, directional response, settling and idle cleanup.');
