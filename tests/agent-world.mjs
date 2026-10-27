import assert from 'node:assert/strict';
import {homeSeat,chooseSeat,boxAround,overlapArea} from '../dist/agent-world.js';

const viewport={width:1440,height:900},size=40,gap=12;
const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const inside=point=>point.x-size/2>=gap&&point.x+size/2<=viewport.width-gap&&point.y-size/2>=gap&&point.y+size/2<=viewport.height-gap;

// Home sits right of the composer, centred on it; without room there, above its right end.
const composer=rect(560,820,320,48);
assert.deepEqual(homeSeat(composer,viewport,size,gap),{x:880+gap+size/2,y:844});
const edge=homeSeat(rect(1100,820,320,48),viewport,size,gap);
assert.ok(inside(edge)&&edge.y<820,'with no room on the right, home sits above the anchor');

// The hover seat avoids the popover and the paragraph, stays on screen, and stays close to the marker.
const marker=rect(820,410,170,30),popover=rect(500,130,840,250),paragraph=rect(500,400,700,120);
const seat=chooseSeat({target:marker,obstacles:[popover,paragraph],viewport,size,gap});
const body=boxAround(seat,size);
for(const box of [marker,popover,paragraph])assert.equal(overlapArea(body,box),0,'the agent covers nothing the visitor is reading');
assert.ok(inside(seat),'the seat is fully on screen');
assert.ok(Math.hypot(seat.x-905,seat.y-425)<600,'the seat stays near the marker');

// Content found under a spot (or the visitor's pointer) pushes the seat elsewhere.
const free=chooseSeat({target:marker,obstacles:[popover,paragraph],viewport,size,gap,probe:box=>overlapArea(box,boxAround(seat,size))>0?1:0});
assert.notDeepEqual(free,seat,'a probed hit moves the seat');
assert.equal(overlapArea(boxAround(free,size),boxAround(seat,size)),0);

// A marker at the screen edge still yields a seat on screen.
const corner=chooseSeat({target:rect(1400,860,40,30),viewport,size,gap});
assert.ok(inside(corner),'edge targets keep the seat on screen');
console.log('Agent world passed: home beside the composer, seats clear of reading and on screen, probes respected.');
