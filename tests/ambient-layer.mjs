import assert from 'node:assert/strict';
import {ambientLayerParent,trackAmbientGallery} from '../dist/ambient-layer.js';

class Node extends EventTarget{
 constructor(){super();this.children=[];this.dataset={};this.attributes=new Map();}
 setAttribute(name,value){this.attributes.set(name,value);}
 prepend(node){this.children.unshift(node);node.parentElement=this;}
 querySelector(selector){assert.equal(selector,':scope > .spatial-gallery-ambient');return this.children.find(node=>node.className==='spatial-gallery-ambient');}
}
globalThis.document={createElement:tag=>{assert.equal(tag,'div');return new Node();}};
const gallery=new Node(),stage=new Node();
const host=()=>({closest:selector=>selector==='.spatial-gallery-stage'?stage:gallery});
const first=host(),second=host(),backdrop=ambientLayerParent(first);
assert.equal(backdrop,ambientLayerParent(second),'Every carousel card shares one background plane');
assert.equal(stage.children.length,1);
assert.equal(backdrop.parentElement,stage);
assert.equal(backdrop.dataset.hoverEffect,'glow');
assert.equal(backdrop.attributes.get('aria-hidden'),'true');
const otherStage=new Node(),other={closest:()=>otherStage};
assert.notEqual(ambientLayerParent(other),backdrop,'Separate galleries never share a field container');
const ordinaryCard={closest:()=>null};
assert.equal(ambientLayerParent(ordinaryCard),ordinaryCard,'Grid and detail cards retain their local field');
let paints=0;
const untrack=trackAmbientGallery(first,()=>paints++);
gallery.dispatchEvent(new Event('gallery-paint'));assert.equal(paints,1);
untrack();gallery.dispatchEvent(new Event('gallery-paint'));assert.equal(paints,1,'Disposal detaches animation tracking');
trackAmbientGallery(ordinaryCard,()=>assert.fail('Non-gallery cards need no gallery tracking'))();
console.log('Ambient layer passed: shared backdrop, separate galleries, standalone surfaces and listener cleanup.');
