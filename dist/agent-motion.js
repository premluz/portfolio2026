// Pure motion maths for the agent's body (MOTION.md → Character). No DOM: the engine feeds positions in and
// places the body with what comes out, so every path can be tested without a browser.
import {AGENT,EASE} from './motion-tokens.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);

// Seeded xorshift: the body's variety (arc side, wobble, teleport rolls) is reproducible in tests.
export function seededRandom(seed=1){
 let state=(seed>>>0)||1;
 return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
export function motionSpeed(value){
 if(!Number.isFinite(value)||value<=0)throw new Error('Mascot speed must be a positive finite number.');
 return value;
}
export function travelDuration(length){return clamp(AGENT.travelMin+length*AGENT.travelPerPx,AGENT.travelMin,AGENT.travelMax);}
// Far trips teleport; mid-range ones sometimes do, so the body does not feel scripted.
export function chooseTransition(from,to,viewport,random){
 const share=distance(from,to)/Math.hypot(viewport.width,viewport.height);
 if(share>=AGENT.teleportShare)return 'teleport';
 return share>=AGENT.teleportMixShare&&random()<AGENT.teleportChance?'teleport':'travel';
}
// Velocity is px/ms. Its tangent is capped at three times the trip (Fritsch–Carlson), so a fast redirect
// curves into the new path without looping past the destination.
export function planTravel(from,to,velocity,random,start=0,speed=1){
 const length=distance(from,to),duration=travelDuration(length)/motionSpeed(speed);
 const tangent={x:velocity.x*duration,y:velocity.y*duration},magnitude=Math.hypot(tangent.x,tangent.y),limit=length*3;
 const scale=magnitude>limit&&magnitude>0?limit/magnitude:1;
 return {
  from:{...from},to:{...to},start,duration,speed,
  tangent:{x:tangent.x*scale,y:tangent.y*scale},
  arc:Math.min(AGENT.arcMax,length*AGENT.arcShare)*(random()<.5?-1:1),
  wobble:AGENT.wobble*random(),phase:random()*Math.PI*2
 };
}
// Keep the path and its current progress when the visitor changes speed mid-flight.
export function retimeTravel(plan,speed,now){
 const progress=clamp((now-plan.start)/plan.duration,0,1),duration=plan.duration*plan.speed/motionSpeed(speed);
 return {...plan,start:now-progress*duration,duration,speed};
}
// Cubic Hermite from the current velocity to rest (ease in and out), plus a sideways sine arc and a small
// wobble. Their sin² envelope vanishes with zero slope at both ends: the body leaves and lands exactly where
// planned, and the arc adds no sideways kick to a redirect.
export function travelPoint(plan,t){
 const {from,to,tangent}=plan,t2=t*t,t3=t2*t;
 const h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2;
 const base={x:h00*from.x+h10*tangent.x+h01*to.x,y:h00*from.y+h10*tangent.y+h01*to.y};
 const length=distance(from,to);if(length<1e-6)return base;
 const envelope=Math.sin(Math.PI*t)**2,side=envelope*plan.arc+envelope*plan.wobble*Math.sin(3*Math.PI*t+plan.phase);
 return {x:base.x-(to.y-from.y)/length*side,y:base.y+(to.x-from.x)/length*side};
}
// px/ms at progress t: the starting velocity for a redirect, so a new trip continues the current motion.
export function travelVelocity(plan,t){
 const step=1e-3,a=travelPoint(plan,Math.max(0,t-step)),b=travelPoint(plan,Math.min(1,t+step)),span=(Math.min(1,t+step)-Math.max(0,t-step))*plan.duration;
 return span>0?{x:(b.x-a.x)/span,y:(b.y-a.y)/span}:{x:0,y:0};
}
// Emerge overshoots larger, then smaller, then settles. Offsets space the bounces out as they shrink, and each
// segment eases on `settle` so every bounce lands softly instead of the whole sequence sharing one curve.
export function emergeFrames(){
 const [s0,s1,s2,s3,s4]=AGENT.emergeScale;
 return [
  {opacity:0,transform:`scale(${s0})`,filter:`blur(${AGENT.emergeBlur}px)`,offset:0,easing:EASE.settle},
  {opacity:1,transform:`scale(${s1})`,filter:'blur(0px)',offset:.45,easing:EASE.settle},
  {opacity:1,transform:`scale(${s2})`,filter:'blur(0px)',offset:.7,easing:EASE.settle},
  {opacity:1,transform:`scale(${s3})`,filter:'blur(0px)',offset:.86,easing:EASE.settle},
  {opacity:1,transform:`scale(${s4})`,filter:'blur(0px)',offset:1}
 ];
}
// Collapse swells slightly, then sinks into the page.
export function collapseFrames(){
 const [s0,s1,s2]=AGENT.collapseScale;
 return [
  {opacity:1,transform:`scale(${s0})`,filter:'blur(0px)',offset:0},
  {opacity:1,transform:`scale(${s1})`,filter:'blur(0px)',offset:.3},
  {opacity:0,transform:`scale(${s2})`,filter:`blur(${AGENT.collapseBlur}px)`,offset:1}
 ];
}
// Landing: a squash on arrival, a small rebound, then rest. Without it the body reads as a widget sliding.
export function landingFrames(){
 const [wide,low]=AGENT.landingSquash;
 return [{transform:'scale(1,1)'},{transform:`scale(${wide},${low})`,offset:.35},{transform:`scale(${2-wide},${2-low})`,offset:.7},{transform:'scale(1,1)'}];
}
