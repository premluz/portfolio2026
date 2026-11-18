import assert from 'node:assert/strict';
import {CardRail,applySectionPresentation,readTestimonialStyle} from '../dist/card-rail.js';
const frames=new Map();let id=0;globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
const flush=()=>{for(const [id,fn] of [...frames]){frames.delete(id);fn();}};
let disconnected=false;globalThis.ResizeObserver=class{observe(){}disconnect(){disconnected=true;}};
const node=()=>({dataset:{},listeners:new Map(),addEventListener(name,fn){this.listeners.set(name,fn);},removeEventListener(name){this.listeners.delete(name);}});
const root=node(),viewport=node(),previous=node(),next=node();root.dataset.cardRailMode='carousel';viewport.clientWidth=600;viewport.scrollWidth=1800;viewport.scrollLeft=0;
let behavior;viewport.scrollBy=options=>{behavior=options.behavior;viewport.scrollLeft=Math.max(0,Math.min(1200,viewport.scrollLeft+options.left));};root.querySelector=selector=>({'[data-card-rail-viewport]':viewport,'[data-card-rail-previous]':previous,'[data-card-rail-next]':next})[selector];
let reduced=false;const rail=new CardRail(root,{reduced:()=>reduced});flush();assert(previous.disabled&&!next.disabled);assert.equal(viewport.tabIndex,0);
rail.move(1);rail.refresh();flush();assert.equal(viewport.scrollLeft,480);assert.equal(behavior,'smooth');
reduced=true;let stopped=false;rail.onKey({key:'ArrowRight',preventDefault(){},stopPropagation(){stopped=true;}});rail.refresh();flush();assert(stopped);assert.equal(behavior,'instant');assert.equal(viewport.scrollLeft,960);
rail.move(1);rail.refresh();flush();assert(next.disabled);assert(!previous.disabled);
root.dataset.cardRailMode='grid';rail.refresh();flush();assert.equal(viewport.tabIndex,-1);assert(previous.disabled&&next.disabled);
const testimonial=node(),page={querySelectorAll:selector=>selector.includes('services')?[root]:[testimonial]};applySectionPresentation(page,{servicesLayout:'carousel',testimonialStyle:'plain'});assert.equal(root.dataset.cardRailMode,'carousel');assert.equal(testimonial.dataset.cardBackground,'false');
assert.equal(root.dataset.cardBackground,'true','Cards show by default');applySectionPresentation(page,{servicesCardBackground:false});assert.equal(root.dataset.cardBackground,'false','Show card off applies to every card section');
rail.destroy();assert(disconnected);assert.equal(viewport.listeners.size,0);assert.equal(frames.size,0);
console.log('Card rail passed: bounds, keyboard, responsive steps, reduced motion, presentation switching and listener cleanup.');
{const section=node(),presented={querySelectorAll:selector=>selector.includes('testimonials')?[section]:[]};
 applySectionPresentation(presented,{});assert.equal(section.dataset.featured,'true','The first testimonial stays dark until switched off');
 applySectionPresentation(presented,{testimonialFeatured:false});assert.equal(section.dataset.featured,'false','Off: every testimonial shares the card grey');}
// Mouse drag (carousel-drag.js): the rail follows the pointer 1:1 with snapping held off, a fling coasts, and the
// settle continues in the travel's direction, never back.
{const dragRoot=node(),dragView=node(),captured=new Set(),scrolls=[],classes=new Set();dragRoot.dataset.cardRailMode='carousel';
 globalThis.getComputedStyle=()=>({scrollPaddingInlineStart:'auto'});
 Object.assign(dragView,{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},clientWidth:600,scrollWidth:1800,children:[0,450,900,1350].map(start=>({getBoundingClientRect:()=>({left:start-dragView.scrollLeft})})),setPointerCapture:id=>captured.add(id),releasePointerCapture:id=>captured.delete(id),hasPointerCapture:id=>captured.has(id),scrollTo:options=>scrolls.push(options),getBoundingClientRect:()=>({left:0})});
 {let left=300;Object.defineProperty(dragView,'scrollLeft',{get:()=>left,set:value=>{left=Math.max(0,Math.min(1200,value));}});}
 dragRoot.querySelector=selector=>({'[data-card-rail-viewport]':dragView,'[data-card-rail-previous]':node(),'[data-card-rail-next]':node()})[selector];
 const dragRail=new CardRail(dragRoot,{reduced:()=>false});flush();const input=dragRail.input;
 const event=extra=>({pointerId:1,pointerType:'mouse',button:0,preventDefault(){},...extra});
 input.down(event({clientX:400,timeStamp:1000}));input.move(event({clientX:300,timeStamp:1016}));assert.equal(dragView.scrollLeft,400,'Dragging left moves the cards left, 1:1');
 assert('cardRailDragging' in dragView.dataset&&'cardRailGliding' in dragView.dataset,'Snapping is off while dragging');assert(captured.has(1));assert(classes.has('is-dragging'),'Cards press back while dragging');
 input.up(event({clientX:300,timeStamp:1300}),false);assert(!('cardRailDragging' in dragView.dataset));assert(!captured.has(1));assert.equal(frames.size,0,'A held release does not coast');
 assert.deepEqual(scrolls.map(scroll=>scroll.left),[450],'Released after a drag to the left, it settles on the next card');scrolls.length=0;
 input.down(event({clientX:400,timeStamp:2000}));input.move(event({clientX:380,timeStamp:2016}));input.up(event({clientX:380,timeStamp:2016}),false);
 const released=dragView.scrollLeft;const lefts=[];for(let n=0;frames.size&&n<300;n++){flush();lefts.push(dragView.scrollLeft);}
 assert(lefts.at(-1)>released+200&&lefts.at(-1)<1200,'A fling coasts on');assert(lefts.every((left,i)=>!i||left>=lefts[i-1]),'The coast never reverses');
 assert.equal(scrolls.length,1);assert(scrolls[0].left>=lefts.at(-1),'The settle continues forward, never back');
 let prevented=false;input.onClick({preventDefault(){prevented=true;},stopPropagation(){}});assert(prevented,'A fling never clicks a card');
 const before=dragView.scrollLeft;input.down({pointerId:2,pointerType:'touch',button:0,clientX:200,clientY:0});input.move({pointerId:2,pointerType:'touch',clientX:50,clientY:0,preventDefault(){}});assert.equal(dragView.scrollLeft,before,'Touch keeps native scrolling');
 dragRoot.dataset.cardRailMode='grid';input.down(event({clientX:400,timeStamp:3000}));input.move(event({clientX:100,timeStamp:3016}));assert.equal(dragView.scrollLeft,before,'A grid does not drag');
 dragRail.destroy();assert.equal(dragView.listeners.size,0,'Destroy removes every listener');}
{const section=node(),presented={querySelectorAll:selector=>selector.includes('testimonials')?[section]:[]};
 applySectionPresentation(presented,{});assert.equal(section.dataset.headings,'false','Quotes are plain text until the headings style is chosen');
 applySectionPresentation(presented,{testimonialStyle:'headings'});assert.equal(section.dataset.headings,'true');assert.equal(section.dataset.cardBackground,'false');
 applySectionPresentation(presented,{testimonialStyle:'cards'});assert.equal(section.dataset.cardBackground,'true');assert.equal(section.dataset.headings,'false');}
{const store=values=>({getItem:key=>values[key]??null});
 assert.equal(readTestimonialStyle(store({'prem-testimonial-style':'headings'})),'headings');assert.equal(readTestimonialStyle(store({'prem-testimonial-card-background':'false'})),'plain','The old switch off becomes No cards');
 assert.equal(readTestimonialStyle(store({'prem-testimonial-card-background':'true'})),'cards');assert.equal(readTestimonialStyle(store({'prem-testimonial-style':'sparkle'})),'cards','An unknown value falls back to cards');}
{const section=node(),presented={querySelectorAll:selector=>selector.includes('testimonials')?[section]:[]};
 applySectionPresentation(presented,{});assert.equal(section.dataset.heading,'true','The Testimonials heading shows until it is switched off');
 applySectionPresentation(presented,{testimonialHeading:false});assert.equal(section.dataset.heading,'false');}
