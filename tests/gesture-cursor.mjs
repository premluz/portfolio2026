import assert from 'node:assert/strict';
import {GestureCursor} from '../dist/gesture-cursor.js';

const frames=new Map(),scrolls=[],activations=[];let serial=0,hit=null;
const classes=()=>{const set=new Set();return {add:(...names)=>names.forEach(name=>set.add(name)),remove:(...names)=>names.forEach(name=>set.delete(name)),toggle(name,on){if(on)set.add(name);else set.delete(name);},contains:name=>set.has(name)};};
const root={isConnected:true},document={body:root,documentElement:root,elementFromPoint:()=>hit};
const window={innerWidth:1000,innerHeight:800,scrollBy:options=>scrolls.push(options.top),getComputedStyle:node=>({overflowY:node.overflow||'visible'}),requestAnimationFrame:callback=>{frames.set(++serial,callback);return serial;},cancelAnimationFrame:id=>frames.delete(id)};
function button(name,parent=root) {
  return {name,isConnected:true,disabled:false,classList:classes(),parentElement:parent,closest(selector){return selector.startsWith('button')?this:null;},focus(){this.focused=true;},click(){activations.push(name);this.onclick?.();},getAttribute:()=>name};
}
const cursorNode={hidden:true,style:{},classList:classes(),offsetWidth:24};
const cursor=new GestureCursor(cursorNode,{document,window}),first=button('Open PlayStation'),second=button('Open Tracr');
hit=first;cursor.move({x:.3,y:.4});assert.equal(cursor.target,first);assert(first.classList.contains('gesture-hover'));
hit=second;cursor.hold({x:.6,y:.8});assert.equal(cursor.target,first,'Thumb contact keeps the last pointed DOM control instead of re-testing underneath');
assert.equal(cursor.activate().ok,true);assert.deepEqual(activations,['Open PlayStation']);assert(first.focused);
cursor.clear();assert.equal(cursor.activate().ok,false,'Clearing/tracking loss removes remembered click targets');
hit=second;cursor.move({x:.4,y:.4});second.isConnected=false;assert.equal(cursor.activate().ok,false,'A detached card cannot be activated');
second.isConnected=true;second.disabled=true;cursor.move({x:.4,y:.4});assert.equal(cursor.target,null);second.disabled=false;

hit=null;for(const y of [.01,.98,.01,.98])cursor.move({x:.4,y});
assert.equal(scrolls.length,0,'Moving a cursor to a screen edge cannot compete with explicit scroll input');cursor.clear();
console.log('Cursor passed: captured pinch click/focus, target loss/disable, release cleanup and no competing edge auto-scroll.');
