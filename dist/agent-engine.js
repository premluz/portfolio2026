// The agent's state machine: hidden → home ⇄ travelling | teleporting → perched. One body, one position; every
// move starts from wherever the body is, so it glides in from where it last stopped. Frames run only while it
// travels. Speaking and sleeping are future states on this same machine.
import {AGENT,EASE} from './motion-tokens.js';
import {distance,chooseTransition,planTravel,travelPoint,travelVelocity,emergeFrames,collapseFrames,landingFrames} from './agent-motion.js';

const STILL=Object.freeze({x:0,y:0});
const report=error=>console.error('Agent motion failed.',error);
const browserTimers={set:(callback,ms)=>setTimeout(callback,ms),clear:id=>clearTimeout(id)};

export class AgentEngine{
 constructor({body,world,reduced=()=>false,random=Math.random,frame=callback=>requestAnimationFrame(callback),cancelFrame=id=>cancelAnimationFrame(id),now=()=>performance.now(),timers=browserTimers}){
  Object.assign(this,{body,world,reduced,random,frame,cancelFrame,now,timers});
  this.state='hidden';this.position=null;this.plan=null;this.raf=0;this.linger=0;this.pending=null;this.epoch=0;
  this.tick=this.tick.bind(this);
 }
 size(){return this.body.size()*AGENT.bodyShare;}
 setState(state){this.state=state;this.body.setState(state);}
 appear(){
  const home=this.world.home(this.size());this.position=home;this.body.place(home);
  if(this.reduced()){this.setState('home');return;}
  this.pending={destination:home,arrival:'home'};this.emerge(++this.epoch).catch(report);
 }
 attend(target,obstacles=[]){if(this.state==='hidden')return;this.timers.clear(this.linger);this.moveTo(this.world.seat(target,obstacles,this.size()),'perched');}
 release(delay=AGENT.lingerMs){if(this.state==='hidden')return;this.timers.clear(this.linger);this.linger=this.timers.set(()=>this.goHome(),delay);}
 goHome(){this.timers.clear(this.linger);if(this.state!=='hidden')this.moveTo(this.world.home(this.size()),'home');}
 // The anchor moved (dock morph, route change, resize): follow small shifts, make a trip of large ones.
 refreshHome(){
  if(this.state!=='home')return;
  const home=this.world.home(this.size());
  if(distance(home,this.position)<=AGENT.snapPx){this.position=home;this.body.place(home);}else this.moveTo(home,'home');
 }
 moveTo(destination,arrival){
  if(this.state==='teleporting'){this.pending={destination,arrival};return;}
  const velocity=this.plan?travelVelocity(this.plan,this.progress()):STILL;
  this.stopTravel();
  if(this.reduced()){this.body.stop();this.position=destination;this.body.place(destination);this.setState(arrival);return;}
  if(distance(this.position,destination)<1){this.setState(arrival);return;}
  if(chooseTransition(this.position,destination,this.world.viewport(),this.random)==='teleport'){
   this.pending={destination,arrival};this.teleport(++this.epoch).catch(report);return;
  }
  this.plan={...planTravel(this.position,destination,velocity,this.random,this.now()),arrival};
  this.setState('travelling');this.raf=this.frame(this.tick);
 }
 progress(){return this.plan?Math.min(1,(this.now()-this.plan.start)/this.plan.duration):1;}
 tick(){
  const t=this.progress();this.position=travelPoint(this.plan,t);this.body.place(this.position);
  if(t<1){this.raf=this.frame(this.tick);return;}
  const {arrival}=this.plan;this.raf=0;this.plan=null;this.land(arrival);
 }
 stopTravel(){if(this.raf)this.cancelFrame(this.raf);this.raf=0;this.plan=null;}
 land(arrival){
  this.setState(arrival);
  this.body.play(landingFrames(),{duration:AGENT.landingMs,easing:EASE.settle}).catch(report);
  if(arrival==='home')this.refreshHome();
 }
 wait(ms){return new Promise(resolve=>this.timers.set(resolve,ms));}
 // Collapse into the page where it is, then emerge at the latest destination (it may change mid-teleport).
 async teleport(epoch){
  this.setState('teleporting');
  const collapsed=await this.body.play(collapseFrames(),{duration:AGENT.collapseMs,easing:EASE.leave},{keep:true});
  if(!collapsed||epoch!==this.epoch)return;
  await this.wait(AGENT.teleportGapMs);if(epoch!==this.epoch)return;
  this.position=this.pending.destination;this.body.place(this.position);
  await this.emerge(epoch);
 }
 async emerge(epoch){
  this.setState('teleporting');
  if(!await this.body.play(emergeFrames(),{duration:AGENT.emergeMs})||epoch!==this.epoch)return;
  const {destination,arrival}=this.pending;this.pending=null;this.setState(arrival);
  if(distance(destination,this.position)>=1)this.moveTo(destination,arrival);
  else if(arrival==='home')this.refreshHome();
 }
 destroy(){++this.epoch;this.stopTravel();this.timers.clear(this.linger);this.body.destroy();this.world.destroy();}
}
