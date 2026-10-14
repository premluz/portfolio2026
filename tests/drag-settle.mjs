import assert from 'node:assert/strict';
import {ProjectDrag,settleDragPosition} from '../dist/project-drag.js';
import {MotionMaterial} from '../dist/motion-material.js';

let mobile=false;globalThis.matchMedia=()=>({matches:mobile});
const gesture=Object.create(ProjectDrag.prototype);gesture.options={canStart:()=>true};gesture.state=null;
const event={pointerType:'mouse',isPrimary:true,button:0,pointerId:1,clientX:100,clientY:100,target:{closest:selector=>selector==='.detail'?{}:null}};
gesture.down(event);assert.equal(gesture.state,null,'Desktop mouse drag cannot navigate projects');
gesture.down({...event,pointerType:'touch'});assert.equal(gesture.state,null,'Desktop touchscreens keep project navigation on buttons');
mobile=true;gesture.down(event);assert.equal(gesture.state,null,'A mouse in a narrow window still cannot swipe');
gesture.down({...event,pointerType:'touch'});assert.equal(gesture.state.id,1,'Mobile finger swipe remains available');
gesture.down({...event,pointerType:'touch',isPrimary:false,pointerId:2});assert.equal(gesture.state,null,'Adding a second finger cancels the candidate swipe for pinch zoom');
globalThis.visualViewport={scale:1.5};gesture.down({...event,pointerType:'touch'});assert.equal(gesture.state,null,'Zoomed detail views cannot mistake native panning for project navigation');delete globalThis.visualViewport;

// After pointer release, the finger-driven spring becomes a bounded glide to
// the chosen neighbor. It cannot overshoot or reverse direction while settling.
for(const [start,end] of [[240,-1200],[-180,1150],[80,0]]){
 let previous=start;
 for(let frame=1;frame<=60;frame++){
  const value=settleDragPosition(start,end,frame/60);
  assert(end>start?value>=previous:value<=previous,'Release position moves only toward its destination');
  assert(end>start?value<=end:value>=end,'Release position never crosses its destination');
  previous=value;
 }
 assert.equal(previous,end,'Release lands exactly on the selected endpoint');
}
assert.equal(settleDragPosition(10,90,-1),10);
assert.equal(settleDragPosition(10,90,2),90);

// Only the transient swipe layers skip spring-back during cleanup. Other
// surfaces retain their regular glass settling behaviour.
const style=()=>({setProperty(){},removeProperty(){}});
const spring=()=>({position:8,velocity:-2,step(target,k,damping,dt){this.velocity+=(target-this.position)*k*dt;this.velocity*=Math.pow(damping,dt);this.position+=this.velocity*dt;return this.position;}});
const surface=stage=>({isConnected:true,closest:selector=>selector==='.drag-stage'&&stage?{}:null,querySelectorAll:()=>[]});
const item=stage=>({left:spring(),right:spring(),cornerLeft:spring(),cornerRight:spring(),reflectionSpring:spring(),skin:{style:style()},reflection:{style:style()},r:40,w:500,h:600,visuals:[],imageMotion:{x:4,y:-2},glow:0,vx:0,vy:0});
let scheduled=0;const frames=[];globalThis.requestAnimationFrame=callback=>{frames.push(callback);return ++scheduled;};globalThis.cancelAnimationFrame=()=>{};
const dragging=item(true),ordinary=item(false);
const material=Object.create(MotionMaterial.prototype);
Object.assign(material,{running:true,raf:1,previous:0,items:new Map([[surface(true),dragging],[surface(false),ordinary]]),transientImages:new Map(),waiters:[],strength:()=>1});
const stopped=material.stop({snapSelector:'.drag-stage'});material.tick(16);
for(let frame=0;frames.length&&frame<180;frame++)frames.shift()(16+(frame+1)*16.667);
await stopped;
for(const edge of [dragging.left,dragging.right,dragging.cornerLeft,dragging.cornerRight,dragging.reflectionSpring])assert.equal(edge.position,0,'Swipe-layer glass settles without a return spring');
assert.notEqual(ordinary.left.position,0,'Regular surfaces keep the existing spring settling');
console.log('Swipe release passed: monotone endpoint glide and spring-free settle for swipe layers only.');
