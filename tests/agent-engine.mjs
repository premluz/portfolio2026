import assert from 'node:assert/strict';
import {AGENT} from '../dist/motion-tokens.js';
import {AgentEngine} from '../dist/agent-engine.js';

// A fake clock drives frames and timers; a fake body records what the engine asks of it.
function rig({reduced=false,teleport=false}={}){
 let clock=0,frames=[],timers=[],nextId=1;
 const plays=[],states=[];
 const body={size:()=>72,place(point){this.at=point;},setState:state=>states.push(state),stop(){},destroy(){},play:(frames,options,flags={})=>{plays.push({frames,options,flags});return Promise.resolve(true);}};
 const home={x:900,y:840},world={home:()=>({...home}),seat:()=>({x:1000,y:300}),viewport:()=>({width:1440,height:900}),destroy(){}};
 const engine=new AgentEngine({body,world,reduced:()=>reduced,random:()=>teleport?0:.99,
  frame:callback=>{frames.push(callback);return frames.length;},cancelFrame:()=>{frames=[];},now:()=>clock,
  timers:{set:(callback,ms)=>{const id=nextId++;timers.push({id,at:clock+ms,callback});return id;},clear:id=>{timers=timers.filter(timer=>timer.id!==id);}}});
 const advance=async ms=>{const end=clock+ms;while(clock<end){clock=Math.min(end,clock+16);const due=timers.filter(timer=>timer.at<=clock);timers=timers.filter(timer=>timer.at>clock);due.forEach(timer=>timer.callback());const queued=frames;frames=[];queued.forEach(callback=>callback(clock));await Promise.resolve();await Promise.resolve();}};
 return {engine,body,world,plays,states,advance,pendingFrames:()=>frames.length};
}

{ // Appearing emerges at home; hovering travels to the seat and lands; leaving lingers, then goes home.
 const {engine,body,plays,states,advance,pendingFrames}=rig();
 engine.appear();await advance(0);
 assert.equal(engine.state,'home');assert.deepEqual(body.at,{x:900,y:840});
 assert.ok(plays[0].frames[1].transform.includes('scale(1.14'),'the body emerges with an overshoot');
 engine.attend({},[]);assert.equal(engine.state,'travelling');
 await advance(AGENT.travelMax+32);
 assert.equal(engine.state,'perched');assert.deepEqual(body.at,{x:1000,y:300});
 assert.equal(pendingFrames(),0,'no frame loop runs at rest');
 assert.ok(plays.at(-1).frames.some(frame=>/scale\(1\.06,0?\.94\)/.test(frame.transform)),'arrival squashes on landing');
 engine.release();await advance(AGENT.lingerMs-50);
 assert.equal(engine.state,'perched','the body lingers after the visitor leaves');
 await advance(AGENT.travelMax+100);
 assert.equal(engine.state,'home');assert.deepEqual(body.at,{x:900,y:840});
 assert.ok(states.includes('travelling'));
}
{ // A new target during the linger cancels the trip home.
 const {engine,advance}=rig();engine.appear();await advance(0);
 engine.attend({},[]);await advance(AGENT.travelMax+32);
 engine.release();await advance(AGENT.lingerMs/2);engine.attend({},[]);await advance(AGENT.lingerMs);
 assert.equal(engine.state,'perched');
}
{ // Redirecting mid-flight starts the new trip from wherever the body is, not from its last stop.
 const {engine,body,advance}=rig();engine.appear();await advance(0);
 engine.attend({},[]);await advance(200);
 const midway={...body.at};assert.notDeepEqual(midway,{x:900,y:840});
 engine.goHome();assert.deepEqual(engine.plan.from,midway);
}
{ // Teleport collapses (held hidden), then emerges at the destination.
 const {engine,body,plays,advance}=rig({teleport:true});engine.appear();await advance(0);
 engine.world.seat=()=>({x:40,y:40});engine.attend({},[]);
 await advance(AGENT.collapseMs+AGENT.teleportGapMs+AGENT.emergeMs+64);
 const collapse=plays.find(play=>play.flags.keep);assert.ok(collapse,'collapse holds its hidden frame until emerging');
 assert.equal(engine.state,'perched');assert.deepEqual(body.at,{x:40,y:40});
}
{ // Reduced motion: the body is placed at once, with no trip and no frame loop.
 const {engine,body,plays,pendingFrames}=rig({reduced:true});engine.appear();
 assert.equal(engine.state,'home');assert.equal(plays.length,0);
 engine.attend({},[]);assert.equal(engine.state,'perched');assert.deepEqual(body.at,{x:1000,y:300});assert.equal(pendingFrames(),0);
}
{ // Before it has appeared, hovering does nothing.
 const {engine}=rig();engine.attend({},[]);assert.equal(engine.state,'hidden');
}
console.log('Agent engine passed: appear, travel, land, linger, redirect, teleport and reduced motion.');
