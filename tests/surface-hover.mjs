import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configureSurfaceHover,mountSurfaceRenderer} from '../dist/surface-hover.js';

const layer={setAttribute(){},remove(){this.removed=true;}};
const skin={append(node){assert.equal(node,layer);this.layer=node;node.parentNode=this;}};
globalThis.document={createElement:tag=>{assert.equal(tag,'div');return layer;}};
class Host extends EventTarget{
 constructor(){super();this.dataset={};this.attributes=new Set();this.active=false;}
 querySelector(){return skin;}
 append(node){assert.equal(node,layer);node.parentNode=this;}
 matches(){return this.active;}
 toggleAttribute(name,on){if(on)this.attributes.add(name);else this.attributes.delete(name);}
 hasAttribute(name){return this.attributes.has(name);}
}
const host=new Host(),states=[];
const destroy=mountSurfaceRenderer(host,({host:target,layer:plane})=>{
 assert.equal(target,host);assert.equal(plane,layer);
 return {setActive:active=>states.push(active),destroy:()=>states.push('destroyed')};
});
host.active=true;host.dispatchEvent(new Event('pointerenter'));
configureSurfaceHover([host],{rest:'page',enabled:false});
assert.equal(host.dataset.hoverRest,'page');assert(host.hasAttribute('data-hover-disabled'));
configureSurfaceHover([host],{rest:'surface',enabled:true});
host.dataset.hoverEffect='glow';host.dispatchEvent(new Event('surface-hover-change'));
assert.equal(layer.parentNode,host,'Ambient glow escapes the clipped skin');
host.dataset.hoverEffect='reveal-soft';host.dispatchEvent(new Event('surface-hover-change'));
assert.equal(layer.parentNode,skin,'Masked reveals remain inside the skin');
host.active=false;host.dispatchEvent(new Event('focusout'));
host.toggleAttribute('data-hover-persistent',true);host.dispatchEvent(new Event('surface-hover-change'));
assert.equal(states.at(-1),true,'A persistent detail glow remains active without pointer hover');
host.toggleAttribute('data-hover-persistent',false);host.dispatchEvent(new Event('surface-hover-change'));
assert.equal(states.at(-1),false,'Turning off persistence removes the detail glow');
destroy();host.active=true;host.dispatchEvent(new Event('pointerenter'));
assert.deepEqual(states,[false,true,false,true,true,true,false,true,false,'destroyed']);
assert(layer.removed,'A shader or canvas plane is removed when the renderer detaches');

const css=readFileSync(new URL('../dist/surface-hover.css',import.meta.url),'utf8');
const tokens=readFileSync(new URL('../dist/tokens.css',import.meta.url),'utf8');
assert(!css.includes('.project-card'),'The effect recipe has no card-specific selector');
assert(css.includes('[data-hover-effect~="tint"]')&&css.includes('[data-hover-effect~="blur"]')&&css.includes('[data-hover-effect~="scale"]'));
assert(tokens.includes('--surface-hover-in-duration: 240ms')&&tokens.includes('--surface-hover-out-duration: 1000ms'));
console.log('Surface hover passed: independent recipes, preserved timing, input states and renderer cleanup.');
