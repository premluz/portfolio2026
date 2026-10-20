import assert from 'node:assert/strict';
import {CarouselMomentum} from '../dist/carousel-momentum.js';

function flick({radius=300,distance=-240,duration=80,interval=10,hold=0}={}){
 const motion=new CarouselMomentum();motion.begin(0,0);
 for(let time=interval;time<duration;time+=interval)motion.track(distance*time/duration/radius,time);
 motion.track(distance/radius,duration);motion.release(duration+hold,radius);return motion;
}
for(const radius of [220,650]){
 const fast=flick({radius}).velocity,slow=flick({radius,duration:600}).velocity;
 assert(fast<0&&Math.abs(fast)>Math.abs(slow)*4,'Release speed controls travel instead of a fixed one-card step');
 const sparse=flick({radius,duration:160,interval:1000/60}),dense=flick({radius,duration:160,interval:1000/120});assert(Math.abs(sparse.velocity-dense.velocity)<.000001,'Pointer event frequency does not change release speed');
 assert.equal(flick({radius,hold:200}).velocity,0,'Holding before release cancels momentum');
 const reverse=new CarouselMomentum();reverse.begin(0,0);reverse.track(-1,80);reverse.track(-.5,160);reverse.track(0,240);reverse.release(240,radius);assert(reverse.velocity>0,'The latest direction wins after a deliberate reversal');
 const caught=flick({radius});caught.begin(-1,100);assert.equal(caught.velocity,0,'A fresh press catches the spinning carousel immediately');
}
console.log('Carousel momentum passed: speed-dependent travel, both display scales, hold-to-stop, reversal and catch.');
