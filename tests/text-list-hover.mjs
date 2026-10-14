import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
assert(!homeProjects.some(project=>project.id==='porter'),'The fixture preserves the grid-only input that originally excluded Porter');
const controller=mountTextListHover({querySelectorAll:()=>[section]},homeProjects);
events.get('focusin')({target:{closest:()=>row}});await Promise.resolve();await Promise.resolve();
assert(loaded.includes('assets/porter.png'),'Hero text previews resolve Porter from the complete published registry');
assert.equal(portals[0].style.width,'360px');assert.equal(portals[0].style.left,'216px','The thumbnail is on the left with a 24px gap');
controller.destroy();assert.equal(events.size,0);assert.equal(globalListeners.size,0);
const css=await readFile(new URL('../dist/content-widths.css',import.meta.url),'utf8');
assert(css.includes(':is(.home-product-text,.home-about-list-content){cursor:default;user-select:none;-webkit-user-select:none}'),'Blank column gaps explicitly use the arrow instead of browser text-selection heuristics');
assert(css.includes(':is(.home-product-text a,.home-about-row)>*{pointer-events:none}'),'Hero and Experience row text delegates pointer targeting to the row');
console.log('Text list hover passed: grid-only input still resolves Porter, shared size, left-side gap and cleanup.');
