import assert from 'node:assert/strict';
import {HeroCarousel,carouselRow,carouselPose,carouselProgress} from '../dist/hero-carousel.js';
import {homeMarkup} from '../dist/home-layout.js';
import {cards} from '../dist/documents.js';
const sizes=[{width:630,height:620},{width:630,height:760},{width:630,height:650},{width:630,height:800},{width:630,height:680}];
for(const width of [390,768,1440,2560])for(const offset of [-10000,-2000,0,10000]){
 const row=carouselRow(sizes,{width,height:360,top:560,offset});
 assert(row.some(tile=>tile.left+tile.width>0&&tile.left<width),'Looping never empties the hero');
 row.forEach((tile,i)=>{
  assert(tile.width>0&&tile.height<=360&&Number.isFinite(tile.left));
  const grid={left:70+i%2*660,top:1000+Math.floor(i/2)*850};
  const first=carouselPose(grid,tile,0);assert(Math.abs(grid.left+first.x-tile.left)<1e-6);assert(Math.abs(grid.top+first.y-tile.top)<1e-6);
  assert.deepEqual(carouselPose(grid,tile,1),{x:0,y:0,scale:1},'Final pose is the native grid');
 });
}
assert.equal(carouselProgress(-20,0,800),0);assert.equal(carouselProgress(900,0,800),1);
assert.equal(carouselProgress(399,0,800,true),0);assert.equal(carouselProgress(400,0,800,true),1);
class Node {
 constructor(){this.events=new Map();this.style={};this.children=[];this.classList={values:new Set(),toggle:(k,on)=>on?this.classList.values.add(k):this.classList.values.delete(k),remove:k=>this.classList.values.delete(k)};}
 addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}
 removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
 contains(node){return node===this||this.children.some(child=>child.contains?.(node));}
 closest(){return null;}
}
const win=new Node(),doc=new Node(),root=new Node(),stage=new Node(),controls=new Node(),previous=new Node(),next=new Node(),pause=new Node();
stage.children=[controls];root.children=[stage];stage.getBoundingClientRect=()=>({top:560-scrollY,height:360});
stage.querySelector=s=>({'[data-carousel-controls]':controls,'[data-carousel-previous]':previous,'[data-carousel-next]':next,'[data-carousel-pause]':pause}[s]);
root.querySelector=()=>stage;root.setPointerCapture=id=>root.capture=id;root.hasPointerCapture=id=>root.capture===id;root.releasePointerCapture=()=>root.capture=null;
const gallery={matches:s=>s==='[data-gallery]'};
const slots=new Map(sizes.map((size,i)=>{
 const card=new Node();Object.assign(card,{offsetWidth:size.width,offsetHeight:size.height});card.canvas={id:i};
 const carrier=new Node(),slot=new Node();slot.firstElementChild=carrier;slot.parentElement=gallery;slot.querySelector=()=>card;
 slot.getBoundingClientRect=()=>({left:70+i%2*660,top:1000+Math.floor(i/2)*850-scrollY,...size});root.children.push(card);
 return [String(i),slot];
}));
let serial=0;const frames=new Map();Object.assign(globalThis,{window:win,document:doc,innerWidth:1440,innerHeight:900,scrollY:0,requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id)});
const state={},carousel=new HeroCarousel(root,slots,{state}),identities=[...slots.values()].map(slot=>({slot,carrier:slot.firstElementChild,card:slot.querySelector(),canvas:slot.querySelector().canvas}));
carousel.setEnabled(true);carousel.resume();assert.equal(stage.hidden,false);assert.equal(carousel.progress,0);
carousel.render(30);assert(state.offset<0,'The visible hero drifts horizontally');
carousel.hover=true;const parked=carousel.offset;assert.equal(carousel.render(30),false);assert.equal(carousel.offset,parked,'Hover pauses drift');carousel.hover=false;
carousel.userPaused=true;assert.equal(carousel.render(30),false);carousel.shift(-1);for(let i=0;i<100;i++)carousel.render(16);assert(carousel.offset<parked,'Arrow navigation still works while drift is paused');carousel.offset=parked;
carousel.down({button:0,pointerId:1,clientX:400,clientY:700,target:root});carousel.move({pointerId:1,clientX:470,clientY:705,preventDefault(){}});
assert.equal(carousel.offset,parked+70);assert.equal(root.capture,1);assert(carousel.suppressClick);
carousel.up({pointerId:1});assert.equal(root.capture,null);assert.equal(carousel.drag,null);
carousel.render(0);const row=carousel.tiles;
globalThis.scrollY=400;carousel.render();assert.strictEqual(carousel.frozen,row,'Vertical scrolling freezes the live carousel arrangement');
const poses=[...slots.values()].map(slot=>slot.firstElementChild.style.transform);
globalThis.scrollY=700;carousel.render();globalThis.scrollY=400;carousel.render();assert.deepEqual([...slots.values()].map(slot=>slot.firstElementChild.style.transform),poses,'Reverse scroll returns the same poses');
globalThis.scrollY=1000;carousel.render();assert.equal(carousel.progress,1);assert([...slots.values()].every(slot=>slot.firstElementChild.style.transform===''));assert(controls.inert);
globalThis.scrollY=0;carousel.render();assert.equal(carousel.progress,0);assert(!controls.inert);
carousel.pause();assert.equal(frames.size,0,'Navigation pauses the clock');carousel.resume();assert.equal(frames.size,1);
carousel.setEnabled(false);assert(stage.hidden);assert.equal(frames.size,0);assert([...slots.values()].every(slot=>slot.firstElementChild.style.transform===''));
identities.forEach(({slot,carrier,card,canvas})=>{assert.strictEqual(slot.firstElementChild,carrier);assert.strictEqual(slot.querySelector(),card);assert.strictEqual(card.canvas,canvas);});
carousel.destroy();assert(!root.classList.values.has('home-carousel-active'));assert([...root.events.values()].every(set=>set.size===0));assert([...win.events.values()].every(set=>set.size===0));
const reduced=new HeroCarousel(root,slots,{reduced:()=>true,state});reduced.setEnabled(true);reduced.resume();assert.equal(reduced.render(30),false);reduced.pause();assert.equal(frames.size,0);reduced.destroy();
assert(homeMarkup(cards,'masonry').includes('data-hero-carousel'));
console.log('Hero carousel passed: responsive looping, exact grid landing, reverse scroll, drift/hover/drag, navigation pause, card/canvas identity, gate cleanup and reduced motion.');
