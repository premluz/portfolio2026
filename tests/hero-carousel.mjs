import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CarouselDrag,coast,dragMotion,sampleVelocity} from '../dist/carousel-drag.js';
import {HeroCarousel,filmstripLoop,filmstripMarkup,filmstripShape,wrapFilmstrip} from '../dist/hero-carousel.js';
import {homeMarkup} from '../dist/home-layout.js';
import {cards} from '../dist/documents.js';

// Physics: the reference model's numbers.
assert.equal(sampleVelocity(10,16),10,'Speed is pixels per 16 ms frame');
let m=10,travelled=0,frames=0;while(m){const next=coast(m,16);m=next.momentum;travelled+=next.travel;frames++;}
assert(frames>70&&frames<80&&travelled>170&&travelled<200,'A 10 px/frame fling decays by .95 per frame and stops under .2');
assert.deepEqual(coast(.21,16),{momentum:0,travel:0});
const half=coast(10,8),second=coast(half.momentum,8),full=coast(10,16);assert(Math.abs(half.travel+second.travel-full.travel)<.2,'Frame length does not change the distance covered');
assert.equal(wrapFilmstrip(-1001,1000),-1);assert.equal(wrapFilmstrip(5,1000),-995);assert.equal(wrapFilmstrip(-400,1000),-400);

// Markup: covers in a list, shape from the image's own pixels.
const projects=cards.filter(doc=>!doc.body&&!doc.listOnly);
const markup=filmstripMarkup(projects);
assert.equal((markup.match(/hero-filmstrip-card/g)||[]).length,projects.filter(doc=>doc.image).length);
assert(projects.every(doc=>!doc.image||filmstripShape(doc.image)==='standard'),'Every current cover is landscape');
assert.equal(filmstripShape('missing.png'),'standard');
assert(homeMarkup(cards,'masonry').includes('data-hero-carousel'));
assert(!markup.includes('data-carousel-controls'),'The filmstrip has no arrows or pause button');

// Fake DOM.
class Node{
 constructor(){this.events=new Map();this.style={};this.children=[];this.dataset={};this.attributes={};const set=new Set();this.classList={has:k=>set.has(k),add:k=>set.add(k),remove:k=>set.delete(k)};}
 addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}
 removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
 fire(type,event){for(const fn of this.events.get(type)||[])fn({preventDefault(){this.prevented=true;},stopPropagation(){},button:0,isPrimary:true,...event});}
 setAttribute(k,v){this.attributes[k]=v;}append(node){this.children.push(node);}
 cloneNode(){const n=new Node();n.offsetWidth=this.offsetWidth;return n;}
 setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
}
let serial=0;const frames$=new Map();const win=new Node();
Object.assign(globalThis,{window:win,document:Object.assign(new Node(),{hidden:false}),addEventListener:(...a)=>win.addEventListener(...a),removeEventListener:(...a)=>win.removeEventListener(...a),
 getComputedStyle:()=>({columnGap:'24px'}),requestAnimationFrame:fn=>{frames$.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames$.delete(id)});
const tick=now=>{const pending=[...frames$.values()];frames$.clear();pending.forEach(fn=>fn(now));};
const stage=new Node(),track=new Node(),root=new Node();
[739,238,722].forEach(width=>{const card=new Node();card.offsetWidth=width;track.children.push(card);});
stage.querySelector=()=>track;root.querySelector=()=>stage;
const carousel=new HeroCarousel(root);
assert.equal(track.children.length,6,'The row is cloned once');
assert(track.children.slice(3).every(card=>card.attributes['aria-hidden']==='true'),'Copies are hidden from assistive technology');
carousel.setEnabled(true);carousel.resume();assert.equal(stage.hidden,false);assert.equal(carousel.width,739+238+722+72);
tick(1000);tick(1016);
assert(Math.abs(carousel.position+carousel.width/filmstripLoop*32)<1e-9,'Drift moves one set every 150 s');
assert.match(track.style.transform,/^translate3d\(-/);

// Mouse drag follows 1:1 and a fling coasts back into drift.
const before=carousel.position;
stage.fire('pointerdown',{pointerId:1,pointerType:'mouse',clientX:500,clientY:300,timeStamp:2000});
assert(stage.classList.has('is-dragging'),'Mouse drag starts at once');
stage.fire('pointermove',{pointerId:1,pointerType:'mouse',clientX:540,clientY:300,timeStamp:2016});
const dragged=wrapFilmstrip(before+40,carousel.width);assert.equal(carousel.position,dragged);
tick(2020);assert.equal(carousel.position,dragged,'Drift waits while dragging');
stage.fire('pointerup',{pointerId:1,pointerType:'mouse',clientX:540,timeStamp:2020});
assert.equal(carousel.momentum,40,'Release carries the sampled speed');
assert(!stage.classList.has('is-dragging'));
let suppressed=false;stage.fire('click',{stopPropagation(){suppressed=true;}});assert(suppressed,'A fling never clicks');
tick(2036);assert(carousel.position>dragged,'Momentum carries on after release');
for(let t=2052;carousel.momentum;t+=16)tick(t);
const drifting=carousel.position;tick(5000);tick(5016);assert(carousel.position<drifting,'Drift resumes after momentum ends');

// Touch: vertical swipes belong to the page; horizontal ones lock after the slop.
stage.fire('pointerdown',{pointerId:2,pointerType:'touch',clientX:100,clientY:100,timeStamp:6000});
stage.fire('pointermove',{pointerId:2,pointerType:'touch',clientX:103,clientY:120,timeStamp:6016});
assert(!carousel.drag.active&&carousel.drag.drag===null,'A vertical swipe is left to the page');
stage.fire('pointerdown',{pointerId:3,pointerType:'touch',clientX:100,clientY:100,timeStamp:7000});
stage.fire('pointermove',{pointerId:3,pointerType:'touch',clientX:105,clientY:101,timeStamp:7016});
assert(!carousel.drag.active,'Inside the slop nothing moves');
stage.fire('pointermove',{pointerId:3,pointerType:'touch',clientX:130,clientY:104,timeStamp:7032});
assert(carousel.drag.active,'A horizontal swipe locks the carousel');
stage.fire('pointerdown',{pointerId:4,pointerType:'touch',isPrimary:false,clientX:0,clientY:0});
assert(!carousel.drag.active,'A second finger cancels the drag');
stage.fire('pointerdown',{pointerId:5,pointerType:'mouse',clientX:0,clientY:0,timeStamp:8000});
stage.fire('pointermove',{pointerId:5,pointerType:'mouse',clientX:30,clientY:0,timeStamp:8016});
stage.fire('pointerup',{pointerId:5,pointerType:'mouse',clientX:30,timeStamp:8400});
assert.equal(carousel.momentum,0,'A pointer held still before release does not fling');
assert.equal(dragMotion.touchSlop,10);
// A lost pointerup (context menu, release outside the window) must not leave the row stuck to the mouse.
stage.fire('pointerdown',{pointerId:6,pointerType:'mouse',clientX:0,clientY:0,timeStamp:9000});
stage.fire('pointermove',{pointerId:6,pointerType:'mouse',buttons:1,clientX:40,clientY:0,timeStamp:9016});
stage.fire('pointermove',{pointerId:6,pointerType:'mouse',buttons:0,clientX:80,clientY:0,timeStamp:9032});
assert(!carousel.drag.active,'A move with no button held ends the drag');assert(carousel.momentum<0||carousel.momentum>0,'and still throws');
carousel.momentum=0;
stage.fire('pointerdown',{pointerId:7,pointerType:'mouse',clientX:0,clientY:0,timeStamp:9100});
stage.fire('lostpointercapture',{pointerId:7,timeStamp:9110});assert(!carousel.drag.active,'Losing pointer capture ends the drag');
stage.fire('pointerdown',{pointerId:8,pointerType:'mouse',clientX:0,clientY:0,timeStamp:9200});
for(const fn of win.events.get('blur')||[])fn();assert(!carousel.drag.active,'Leaving the window ends the drag');

carousel.pause();assert.equal(frames$.size,0);carousel.resume();assert.equal(frames$.size,1);
carousel.setEnabled(false);assert(stage.hidden);assert.equal(frames$.size,0);
carousel.destroy();assert([...stage.events.values()].every(set=>set.size===0));assert([...win.events.values()].every(set=>set.size===0));
const reduced=new HeroCarousel(root,{reduced:()=>true});reduced.setEnabled(true);reduced.resume();assert.equal(frames$.size,0,'Reduced motion never drifts');reduced.destroy();
assert(!new CarouselDrag(new Node(),{canStart:()=>false}).active);

const css=await readFile(new URL('../dist/hero-carousel.css',import.meta.url),'utf8');
for(const rule of ['--filmstrip-height:508px','--filmstrip-standard:739px','--filmstrip-height:380px','--filmstrip-standard:494px','--filmstrip-gap:24px','--filmstrip-drag-scale:.93','touch-action:pan-y'])assert(css.includes(rule),rule);
console.log('Hero filmstrip passed: drag physics, cloned loop, 150 s drift, 1:1 drag, fling and click suppression, touch axis lock, reduced motion and cleanup.');
