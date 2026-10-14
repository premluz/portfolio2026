import assert from 'node:assert/strict';
import {ViewportScroll} from '../dist/viewport-scroll.js';

const frames=new Map(),moves=[];let serial=0,time=0,hit=null;
const root={scrollTop:2000,scrollHeight:10000,clientHeight:800,isConnected:true};
const document={scrollingElement:root,body:root,documentElement:root,elementFromPoint:()=>hit};
const apply=(target,top)=>{target.scrollTop=Math.max(0,Math.min(target.scrollHeight-target.clientHeight,target.scrollTop+top));};
const window={innerWidth:1000,innerHeight:800,performance:{now:()=>time},scrollBy({top}){moves.push(top);apply(root,top);},getComputedStyle:node=>({overflowY:node.overflow||'visible'}),requestAnimationFrame:callback=>{frames.set(++serial,callback);return serial;},cancelAnimationFrame:id=>frames.delete(id)};
const scroll=new ViewportScroll({window,document});
function frame(){time+=16;const current=[...frames];frames.clear();for(const [,callback] of current)callback(time);assert(frames.size<=1,'Viewport input owns at most one display loop');}
function drain(){let count=0;while(frames.size){assert(count++<70,'Scroll input must stop when complete or stale');frame();}}

const before=root.scrollTop;scroll.step(1);assert.equal(frames.size,1);assert.equal(root.scrollTop,before,'A smooth voice step begins on the display frame');drain();
assert(Math.abs(root.scrollTop-before-576)<.001,'Voice Down moves 72% of the viewport');
scroll.step(-1);drain();assert(Math.abs(root.scrollTop-before)<.001,'Voice Up reverses by the same readable page step');
scroll.step(1,{smooth:false});assert.equal(frames.size,0);assert(Math.abs(root.scrollTop-before-576)<.001,'Animation Off uses immediate scrolling');

const menu={isConnected:true,parentElement:root,overflow:'auto',scrollTop:100,scrollHeight:700,clientHeight:200,closest:()=>null,scrollBy({top}){apply(this,top);}};
const pageAt=root.scrollTop;scroll.step(1,{element:menu});drain();assert.equal(root.scrollTop,pageAt);assert(Math.abs(menu.scrollTop-244)<.001,'An open popover receives voice scrolling before the page');
hit={parentElement:menu,closest:()=>null};scroll.rate(.6,{point:{x:.4,y:.4}});frame();assert.equal(scroll.target,menu,'Hand scroll captures the nested viewport once');scroll.stop();hit=null;

root.scrollTop=2000;moves.length=0;scroll.rate(.6);const rateStart=root.scrollTop;
for(let i=0;i<60;i++){if(i%4===0)scroll.rate(.6);frame();}
assert(root.scrollTop-rateStart>400,'A displaced held hand scrolls continuously without repeated strokes');assert.equal(scroll.mode,'rate');
scroll.rate(0);const neutralAt=root.scrollTop;assert.equal(frames.size,0);for(let i=0;i<10;i++)frame();assert.equal(root.scrollTop,neutralAt,'The neutral zone stops immediately with no drift');
scroll.rate(.8);for(let i=0;i<6;i++)frame();const directionAt=root.scrollTop;scroll.rate(-.8);frame();assert(root.scrollTop<directionAt,'Direction reversal does not overshoot in the previous direction');
scroll.stop();assert.equal(frames.size,0);assert.equal(scroll.mode,null);

scroll.rate(.7);drain();assert.equal(scroll.mode,null);assert.equal(frames.size,0,'Stale camera data expires instead of scrolling indefinitely');
scroll.step(1);const stepping=root.scrollTop;scroll.rate(-1);assert.equal(scroll.mode,'step','A voice step takes priority over simultaneous hand rate');drain();assert(root.scrollTop>stepping);
root.scrollTop=0;scroll.rate(-.8);assert.equal(frames.size,0,'At the page edge, held input has no idle display loop');
assert.equal(scroll.step(-1).message,'Top reached');
scroll.rate(.8,{element:menu});menu.isConnected=false;frame();assert.equal(scroll.mode,null);assert.equal(root.scrollTop,0,'A detached popover never redirects its scroll onto the page');menu.isConnected=true;
console.log('Viewport scroll passed: voice page steps/reduced motion, popover scope, continuous rate, neutral stop, reversal, stale-input lease, arbitration, page bounds and cleanup.');
