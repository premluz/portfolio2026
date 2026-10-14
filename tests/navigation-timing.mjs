import assert from 'node:assert/strict';
import {TransitionControl,morphProgress} from '../dist/transition-control.js';
import {neighborPush} from '../dist/placement.js';

// A WAAPI stand-in records seeks and completion. The scenarios represent a
// delayed first paint, dropped frames, and Escape after chrome has faded away.
function animation(duration){
 let resolve;
 return {
  effect:{getComputedTiming:()=>({endTime:duration})},currentTime:0,playbackRate:1,
  playState:'running',finished:new Promise(done=>resolve=done),completed:false,
  pause(){this.playState='paused';},
  finish(){this.currentTime=this.playbackRate<0?0:duration;this.completed=true;this.playState='finished';resolve();},
  reverse(){this.playbackRate*=-1;},cancel(){this.playState='idle';}
 };
}
function transaction(){
 const control=new TransitionControl();control.synchronize(400);
 const grid=control.track(animation(400)),chrome=control.track(animation(160));
 const neighbor=control.track(animation(400),morphProgress);
 return {control,grid,chrome,neighbor};
}

for(const setupDelay of [0,250,1800]){
 const {control,grid,chrome,neighbor}=transaction();
 assert.equal(grid.playState,'paused');
 assert.equal(control.advance(setupDelay),0,'Destination preparation must not consume animation time');
 let now=setupDelay,previous=0;
 for(const elapsed of [16,16,240,16,900,16]){
  now+=elapsed;const progress=control.advance(now);
  assert(progress-previous<=.08+1e-10,'A stalled frame cannot skip most of the return');
  assert(Math.abs(grid.currentTime/400-progress)<1e-10,'Neighbor and liquid shell stay together');
  assert.equal(chrome.currentTime,Math.min(grid.currentTime,160));
  assert(Math.abs(neighbor.currentTime/400-morphProgress(grid.currentTime/400))<1e-10,'Neighbor displacement follows the selected card expansion, including reversal');
  assert(!grid.completed,'No companion may finish while the liquid shell is travelling');
  previous=progress;
 }
 while(!control.timeline.finished){now+=16;control.advance(now);}
 await control.wait();assert.equal(grid.currentTime,400);assert.equal(chrome.currentTime,160);
 control.complete();assert.equal(grid.playState,'idle');
}

for(const reverseAt of [0,64,224,384]){
 const {control,grid,chrome,neighbor}=transaction();let now=0;
 control.advance(now);
 while(grid.currentTime<reverseAt){now+=16;control.advance(now);}
 const before=grid.currentTime;control.reverse();
 assert.equal(grid.currentTime,before,'Escape changes direction without changing the rendered frame');
 while(!control.timeline.finished){now+=16;control.advance(now);assert.equal(chrome.currentTime,Math.min(grid.currentTime,160));
  assert(Math.abs(neighbor.currentTime/400-morphProgress(grid.currentTime/400))<1e-10,'Neighbor displacement follows the selected card expansion, including reversal');}
 // Reverse before the first movement still needs its endpoint applied.
 control.advance(now+16);await control.wait();
 assert.equal(grid.currentTime,0);assert.equal(chrome.currentTime,0);
 control.complete();
}
const viewport={width:1200,height:900};
const cases=[
 {selected:{left:40,top:40,width:560,height:500},rect:{left:640,top:40,width:560,height:500},axis:'x',end:1224,visible:r=>r.left<1200},
 {selected:{left:640,top:40,width:560,height:500},rect:{left:40,top:40,width:560,height:500},axis:'x',end:-24,visible:r=>r.left+r.width>0},
 {selected:{left:40,top:40,width:560,height:500},rect:{left:40,top:600,width:560,height:500},axis:'y',end:924,visible:r=>r.top<900},
 {selected:{left:40,top:600,width:560,height:500},rect:{left:40,top:40,width:560,height:500},axis:'y',end:-24,visible:r=>r.top+r.height>0}
];
for(const {selected,rect,axis,end,visible} of cases){
 const push=neighborPush(rect,selected,viewport);
 const intermediate={...rect,left:rect.left+push.x*morphProgress(.25),top:rect.top+push.y*morphProgress(.25)};
 assert(visible(intermediate),'Close neighbors should still be visible during early expansion');
 const final=axis==='x'?(push.x>0?rect.left+push.x:rect.left+rect.width+push.x):(push.y>0?rect.top+push.y:rect.top+rect.height+push.y);
 assert.equal(final,end,'Only enough displacement to clear the viewport is needed');
}
assert.deepEqual(neighborPush({left:40,top:1400,width:560,height:500},cases[0].selected,viewport),{x:0,y:0},'Already offscreen cards need no extra travel');
console.log('Navigation timing passed: delayed setup, stalled frames, synchronized docking, and Escape at four phases.');
