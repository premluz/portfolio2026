import assert from 'node:assert/strict';
import {mountTextListHover} from '../dist/text-list-hover.js';
import {homeProjects} from '../dist/documents.js';

const loaded=[],portals=[],globalListeners=new Map();
globalThis.innerWidth=1400;globalThis.innerHeight=900;
globalThis.addEventListener=(event,handler)=>globalListeners.set(event,handler);
globalThis.removeEventListener=event=>globalListeners.delete(event);
function node(){
 const classes=new Set();
 return {style:{},children:[],classList:{add(...names){names.forEach(name=>classes.add(name));},remove(name){classes.delete(name);},contains:name=>classes.has(name),toggle(name,on){on?classes.add(name):classes.delete(name);}},
  setAttribute(){},getBoundingClientRect:()=>({}),append(child){this.children.push(child);child.parent=this;},remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);},
  animate:()=>({cancel(){}}),cloneNode(){const clone=node();clone.src=this.src;return clone;}};
}
globalThis.document={documentElement:{dataset:{}},createElement:node,body:{append:portal=>portals.push(portal)}};
globalThis.getComputedStyle=()=>({opacity:'1'});
globalThis.Image=class{constructor(){Object.assign(this,node());this.complete=true;this.naturalWidth=1440;}set src(value){this.url=value;loaded.push(value);}get src(){return this.url;}};
const events=new Map(),anchor={getBoundingClientRect:()=>({left:600,right:850,top:300,height:30})};
const row={dataset:{projectMenuItem:'porter'},querySelector:()=>anchor,getBoundingClientRect:()=>({top:300,height:30})};
const section={querySelectorAll:()=>[],hidden:false,contains:()=>false,addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:type=>events.delete(type)};
const controller=mountTextListHover({querySelectorAll:selector=>{assert(selector.includes('.home-about-list'),'Experience sections keep the shared text-list hover controller');return [section];}},homeProjects);
events.get('focusin')({target:{closest:()=>row}});await Promise.resolve();await Promise.resolve();
assert(loaded.some(url=>/assets\/(optimised\/)?porter[-.]/.test(url)),'Hero text previews resolve Porter from the complete published registry');
assert.equal(portals[0].style.width,'360px');assert.equal(portals[0].style.left,'216px','The thumbnail is on the left with a 24px gap');
controller.destroy();assert.equal(events.size,0);assert.equal(globalListeners.size,0);
console.log('Text list hover passed: Experience uses the shared controller, Porter resolves, thumbnail geometry and cleanup remain intact.');
