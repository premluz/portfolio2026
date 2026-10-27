import {createLabFilter,RING_RADIUS} from './lab-filter.js';
import {LAB_RIPPLE} from './motion-tokens.js';

// Choosing the Lab sends a short ring out from where the visitor pressed, straight away; once the Lab has faded in
// a full ring runs across it. The two never overlap in normal use, and a landing ring replaces a ring still running.
const clamp=value=>Math.min(1,Math.max(0,value));

// Where the ring starts: the last pointer press, or the focused control for keyboard and command use.
let origin={x:.5,y:.92};
addEventListener('pointerdown',event=>{origin={x:event.clientX/innerWidth,y:event.clientY/innerHeight};},true);
addEventListener('keydown',event=>{
 if(!['Enter',' '].includes(event.key)||!document.activeElement?.getBoundingClientRect)return;
 const rect=document.activeElement.getBoundingClientRect();
 origin={x:(rect.left+rect.width/2)/innerWidth,y:(rect.top+rect.height/2)/innerHeight};
},true);

// Far enough that the ring has fully left the viewport when progress reaches 1.
const reach=(x,y)=>Math.max(Math.hypot(x,y),Math.hypot(innerWidth-x,y),Math.hypot(x,innerHeight-y),Math.hypot(innerWidth-x,innerHeight-y))+LAB_RIPPLE.ringWidth*RING_RADIUS*innerWidth;

// Quick swell, then the ring loses strength as it spreads, like the image hover ripple.
const envelope=progress=>(1-Math.exp(-progress*LAB_RIPPLE.swell))*(1-progress)**LAB_RIPPLE.fade;

class LabRipple{
 constructor(){this.filter=createLabFilter();this.raf=0;}
 /** Runs the ring from `from` to `to` progress; origin is in viewport fractions. */
 play(from,to){
  cancelAnimationFrame(this.raf);
  const duration=(to-from)*LAB_RIPPLE.durationMs,start=performance.now(),ring=origin;
  return new Promise(resolve=>{
   const frame=t=>{
    const progress=from+(to-from)*clamp((t-start)/duration),x=ring.x*innerWidth,y=ring.y*innerHeight;
    const radius=reach(x,y)*(1-(1-progress)**2);
    this.filter.apply({x,y,radius,amplitude:envelope(progress)});
    if(t-start<duration)this.raf=requestAnimationFrame(frame);
    else{this.raf=0;if(progress>=1)this.stop();resolve();}
   };
   this.raf=requestAnimationFrame(frame);
  });
 }
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.filter.apply({x:0,y:0,radius:0,amplitude:0});}
}

/** One ripple for the page: `click()` runs the ring to the handoff and clears it, `land()` runs the whole ring, `stop()` clears it. */
export function createLabRipple(){
 const ripple=new LabRipple();
 return {click:()=>ripple.play(0,LAB_RIPPLE.handoff).then(()=>ripple.stop()),land:()=>ripple.play(0,1),stop:()=>ripple.stop()};
}
