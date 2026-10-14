import assert from 'node:assert/strict';
import {EdgeShades} from '../dist/edge-shades.js';
import {TransitionControl,morphProgress} from '../dist/transition-control.js';

const directions={top:'translate3d(0,-100%,0)',bottom:'translate3d(0,100%,0)',left:'translate3d(-100%,0,0)',right:'translate3d(100%,0,0)'};
function fixture(reduced=false){
 const animations=[];
 const animate=(frames,options)=>{
  let resolve;const animation={frames,options,currentTime:0,playbackRate:1,playState:'running',effect:{getComputedTiming:()=>({endTime:options.duration})},finished:new Promise(done=>resolve=done),pause(){this.playState='paused';},finish(){this.currentTime=this.playbackRate<0?0:options.duration;resolve();},cancel(){this.playState='idle';},reverse(){this.playbackRate*=-1;}};
  animations.push(animation);return animation;
 };
 const edges=Object.keys(directions).map(side=>({side,classList:{contains:name=>name===side},animate}));
 const root={dataset:{},querySelectorAll:()=>edges,animate};
 return {root,edges,animations,shades:new EdgeShades(root,{reduced:()=>reduced})};
}
for(const fromDetails of [false,true])for(const reverseAt of [null,0,.16,.6,.94]){
 const {root,animations,shades}=fixture();shades.sync(fromDetails);
 const control=new TransitionControl();control.synchronize(400);
 shades.animateTo(!fromDetails,control,400);
 assert.equal(animations.length,5,'One fade and four directional translations');
 for(const [i,side] of Object.keys(directions).entries()){
  assert.equal(animations[i+1].frames[1].transform,fromDetails?'translate3d(0,0,0)':directions[side]);
  assert.equal(animations[i+1].playState,'paused','Shade motion waits for the prepared card');
 }
 let now=1800,reversed=false;control.advance(now);
 while(!control.timeline.finished||now===1800){
  if(reverseAt!==null&&!reversed&&control.timeline.value>=reverseAt){
   const times=animations.map(animation=>animation.currentTime);control.reverse();reversed=true;
   assert.deepEqual(animations.map(animation=>animation.currentTime),times,'Escape reverses without seeking to another frame');
  }
  now+=now===1832?800:16;control.advance(now);
  for(const animation of animations)assert(Math.abs(animation.currentTime/400-morphProgress(control.timeline.value))<1e-10,'Shades remain on the bounded card clock, including dropped frames');
 }
 await control.wait();
 const finalDetails=reversed?fromDetails:!fromDetails;
 shades.sync(finalDetails);
 const committed=root.dataset.retreated;control.complete();
 assert.equal(root.dataset.retreated,String(finalDetails));assert.equal(root.dataset.retreated,committed,'Clearing animation fills preserves the final route state');
}
{
 const {root,animations,shades}=fixture();
 shades.sync(true);assert.equal(root.dataset.retreated,'true','Direct detail links start shade-free');
 shades.animateTo(true,new TransitionControl(),400);assert.equal(animations.length,0,'Next/previous detail navigation leaves shades hidden');
 shades.setRetreat(false);assert.equal(root.dataset.retreated,'false','Turning off keeps configured shades on details');
 shades.animateTo(false,new TransitionControl(),400);assert.equal(animations.length,0,'Disabled retreat schedules no motion');
 shades.setRetreat(true);shades.sync(false);assert.equal(root.dataset.retreated,'false');
}
{
 const {root,animations,shades}=fixture(true);
 shades.animateTo(true,new TransitionControl(),400);
 assert.equal(root.dataset.retreated,'true');assert.equal(animations.length,0,'Reduced motion applies the destination without animation');
}
{
 const {animations,shades}=fixture();
 shades.animateTo(true,new TransitionControl(),400);
 assert(animations.every(animation=>animation.options.easing==='cubic-bezier(.22,1,.36,1)'),'Slide navigation uses the same native easing as its cards');
}
console.log('Edge shades passed: four outward directions, direct links, disabled setting, reduced motion, synchronized return and Escape at four phases.');
