import assert from 'node:assert/strict';
import {AGENT} from '../dist/motion-tokens.js';
import {seededRandom,travelDuration,chooseTransition,planTravel,travelPoint,travelVelocity,emergeFrames,collapseFrames,distance} from '../dist/agent-motion.js';

const random=seededRandom(7),near=(a,b,tolerance=.01)=>assert.ok(distance(a,b)<=tolerance,`${JSON.stringify(a)} ≈ ${JSON.stringify(b)}`);
// Travel time grows with distance inside its bounds.
assert.equal(travelDuration(0),AGENT.travelMin);
assert.equal(travelDuration(1e6),AGENT.travelMax);
assert.ok(travelDuration(400)>travelDuration(100));

// A trip leaves and lands exactly where planned, whatever the arc and wobble.
const from={x:100,y:500},to={x:900,y:200},plan=planTravel(from,to,{x:0,y:0},random);
near(travelPoint(plan,0),from);near(travelPoint(plan,1),to);
assert.ok(Math.abs(plan.arc)<=AGENT.arcMax,'the side arc stays small');
// From rest it eases in and out: never past the destination along the travel line, and still at both ends.
const axis={x:(to.x-from.x)/distance(from,to),y:(to.y-from.y)/distance(from,to)},along=point=>(point.x-from.x)*axis.x+(point.y-from.y)*axis.y;
let previous=-Infinity;
for(let step=0;step<=100;step++){const value=along(travelPoint(plan,step/100));assert.ok(value>=previous-1e-6&&value<=distance(from,to)+1e-6,'travel from rest never doubles back or overshoots');previous=value;}
assert.ok(Math.hypot(travelVelocity(plan,0).x,travelVelocity(plan,0).y)<.05,'a trip from rest starts still');
assert.ok(Math.hypot(travelVelocity(plan,1).x,travelVelocity(plan,1).y)<.05,'a trip lands still');
assert.ok(Math.hypot(travelVelocity(plan,.5).x,travelVelocity(plan,.5).y)>.5,'mid-trip it is moving');

// A redirect continues the current motion: the new trip leaves at the velocity the old one had.
const velocity=travelVelocity(plan,.4),redirect=planTravel(travelPoint(plan,.4),{x:200,y:150},velocity,random);
near(travelVelocity(redirect,0),velocity,.02);
// A fast redirect towards a close target is capped, so it cannot loop far past the destination.
const fast=planTravel({x:0,y:0},{x:20,y:0},{x:5,y:0},random);
assert.ok(Math.hypot(fast.tangent.x,fast.tangent.y)<=60+1e-9,'the starting tangent is capped at three times the trip');

// Far trips teleport, short ones travel, mid-range ones vary with the seeded roll.
const viewport={width:1600,height:900},diagonal=Math.hypot(1600,900);
assert.equal(chooseTransition({x:0,y:0},{x:diagonal*AGENT.teleportShare,y:0},viewport,()=>1),'teleport');
assert.equal(chooseTransition({x:0,y:0},{x:100,y:0},viewport,()=>0),'travel');
assert.equal(chooseTransition({x:0,y:0},{x:diagonal*.4,y:0},viewport,()=>0),'teleport');
assert.equal(chooseTransition({x:0,y:0},{x:diagonal*.4,y:0},viewport,()=>.99),'travel');

// Emerge grows past full size, dips under it, then settles at exactly 1; collapse exits faster than emerge enters.
const scales=emergeFrames().map(frame=>Number(frame.transform.match(/scale\(([\d.]+)\)/)[1]));
assert.ok(scales[1]>1&&scales[2]<1&&scales[3]>1&&scales.at(-1)===1,'emerge overshoots larger, then smaller, then settles');
assert.equal(emergeFrames()[0].opacity,0);assert.equal(collapseFrames().at(-1).opacity,0);
assert.ok(AGENT.collapseMs<AGENT.emergeMs,'exits are faster than entrances');
// Same seed, same body: variety is reproducible.
assert.deepEqual(planTravel(from,to,{x:0,y:0},seededRandom(3)),planTravel(from,to,{x:0,y:0},seededRandom(3)));
console.log('Agent motion passed: exact endpoints, eased travel, continuous redirects, teleport choice and emerge overshoot.');
