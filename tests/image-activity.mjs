import assert from 'node:assert/strict';
import {LiquidImage,configureImageEffects} from '../dist/liquid-image.js';

// Exercise native/canvas handoff and the real animation scheduling without a GPU.
let now=100,draws=0,nextFrame=0,canvasCount=0,releases=0;
const shaders=[];
const frames=new Map(),classes=new Set(),events=[];
globalThis.performance={now:()=>now};
globalThis.devicePixelRatio=2;
globalThis.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback);return nextFrame;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.getComputedStyle=()=>({getPropertyValue:()=>''});
const gl=new Proxy({
 getShaderParameter:()=>true,getProgramParameter:()=>true,
 createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),createTexture:()=>({}),
 getAttribLocation:()=>0,getUniformLocation:(_,name)=>name,getExtension:()=>({loseContext:()=>releases++}),
shaderSource:(_,source)=>{if(source.includes('precision mediump'))shaders.push(source);},
 drawArrays:()=>draws++
},{get:(object,key)=>object[key]||(()=>{})});
const canvas={style:{},getContext:()=>gl,remove(){}};
globalThis.document={createElement:tag=>{if(tag==='canvas'){canvasCount++;return canvas;}return {style:{},setAttribute(){}};}};
const img={complete:true,naturalWidth:1600,naturalHeight:900,style:{},addEventListener(){},removeEventListener(){}};
const el={clientWidth:600,clientHeight:400,querySelector:selector=>selector==='img'?img:null,append(){},
 addEventListener:type=>events.push(type),classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}};
configureImageEffects({ripple:true,blur:true});
const image=new LiquidImage(el,()=>1);
const step=time=>{now=time;const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(time));};
assert.equal(draws,0,'Idle screenshots do not run the GPU draw pass');
assert.equal(canvasCount,0,'First render allocates no image canvases or WebGL contexts');
assert(!classes.has('liquid-image-ready'),'Native image remains visible at rest');
assert.equal(frames.size,0,'No idle animation loop');
assert.deepEqual(events,[],'Pointer hover never starts image effects');

image.pulse();step(116);
assert.equal(draws,1);assert(classes.has('liquid-image-ready'));
assert.equal(canvas.style.visibility,'','Canvas replaces the native image after drawing');
const state=image.rippleState();
image.resumeRipple(state);
assert.deepEqual(image.rippleState(),state,'Navigation handoff preserves wave phase');
step(1600);
assert.equal(frames.size,0,'Ripple animation stops after expiry');
assert(!classes.has('liquid-image-ready'));assert.equal(canvas.style.visibility,'hidden');
assert.equal(image.rippleState(),null);

image.setMotion(-3,1);step(1616);
assert(classes.has('liquid-image-ready'),'Signed movement enables the trail');
image.setMotion(0,0);step(1632);
assert(!classes.has('liquid-image-ready'),'Stopping movement restores the sharp native image');
assert.equal(frames.size,0);
assert.equal(image.resumeRipple(state),false,'An expired handoff cannot restart the effect');
image.pulse();image.destroy();
assert.equal(frames.size,0,'Destroy cancels pending work');
assert(!classes.has('liquid-image-ready'));
// Each disabled effect must be absent from the compiled shader, not zeroed.
for(const ripple of [false,true])for(const blur of [false,true]){
 configureImageEffects({ripple,blur});
 const before=canvasCount;
 const candidate=new LiquidImage(el,()=>1);
 assert.equal(canvasCount,before,'Enabled effects also wait for their first motion');
 if(!ripple&&!blur){
  assert.equal(canvasCount,before,'Both off allocates no canvas or WebGL context');
  candidate.pulse();candidate.setMotion(8,-2);
  assert.equal(candidate.resumeRipple({start:now,force:1,origin:[.06,.5]}),false);
  assert.equal(frames.size,0,'Disabled effects schedule no image animation');
 }else{
  candidate.pulse();candidate.setMotion(8,-2);
  const shader=shaders.at(-1);
  assert.equal(shader.includes('sin('),ripple,'Ripple calculations only exist in enabled variants');
  assert.equal(shader.includes('uniform vec2 travel;'),blur,'Blur code only exists in enabled variants');
  assert.equal((shader.match(/texture2D/g)||[]).length,blur?3:1,'Disabled blur removes extra texture samples');
  assert.equal(!!candidate.rippleState(),ripple);
  assert.equal(candidate.motion.x,blur?8:0);
  const allocations=canvasCount,oldReleases=releases;
  configureImageEffects({ripple:false,blur:false});
  assert.equal(candidate.gl,null);assert.equal(candidate.canvas,null);
  assert.equal(canvasCount,allocations,'Turning off allocates no replacement renderer');
  assert.equal(releases,oldReleases+1,'Turning off releases the active WebGL context');
  assert.equal(frames.size,0,'Turning off cancels pending animation');
  assert(!classes.has('liquid-image-ready'),'Turning off immediately restores the native image');
 }
 candidate.destroy();
}
configureImageEffects({ripple:true,blur:true});
const retained=new LiquidImage(el,()=>1),frame=retained.imageFrame,geometry={...img.style};retained.pulse();
const allocated=canvasCount,released=releases;retained.suspend();
assert.equal(frames.size,0);assert.equal(retained.gl,null);assert.equal(releases,released+1);assert(!classes.has('liquid-image-ready'));
configureImageEffects({ripple:false,blur:true});assert.equal(canvasCount,allocated,'Preference changes cannot allocate a hidden retained page');
el.clientWidth=0;frame.resize();assert.deepEqual(img.style,geometry,'A hidden Chat card cannot overwrite its fitted image with zero-width geometry');el.clientWidth=600;
retained.resume();assert.equal(retained.imageFrame,frame);assert.equal(canvasCount,allocated);assert.deepEqual(img.style,geometry);assert.equal(frames.size,0,'Resuming preserves the native frame without GPU allocation or idle rendering');retained.setMotion(2,0);assert.equal(canvasCount,allocated+1,'A resumed image allocates only when it moves again');retained.destroy();
configureImageEffects({ripple:true,blur:true});
console.log('Image activity passed: no hover/idle loop, phase-preserving handoff, native image restored after motion.');
