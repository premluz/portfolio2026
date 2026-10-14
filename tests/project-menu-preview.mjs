import assert from 'node:assert/strict';
import {menuPreviewPosition,ProjectMenuPreview} from '../dist/project-menu-preview.js';
const rect={left:300,right:820,top:300},rowRect={top:450,height:40};
assert.equal(menuPreviewPosition(rect,rowRect,{width:1200,height:900}).left,84,'Preview sits beside the glass, never inside its clip');
assert.equal(menuPreviewPosition({left:12,right:532,top:300},rowRect,{width:900,height:900}).left,548,'Falls back to the right');
assert.equal(menuPreviewPosition({left:300,right:400,top:300},rowRect,{width:1200,height:900},{width:200,height:160},'right',24).left,424,'Text-list thumbnails sit to the right with a clear gap');
assert.equal(menuPreviewPosition({left:500,right:700,top:300},rowRect,{width:900,height:900},{width:200,height:160},'right',24).left,276,'Text-list thumbnails fall back left when right space is tight');
assert.equal(menuPreviewPosition({left:20,right:370,top:220},rowRect,{width:390,height:844}).top,44,'Narrow views use free space above');
assert.equal(menuPreviewPosition({left:20,right:370,top:80},rowRect,{width:390,height:844}),null,'Preview never covers menu rows when there is no room');
const listeners=new Map();globalThis.addEventListener=(key,fn)=>listeners.set(key,fn);globalThis.removeEventListener=key=>listeners.delete(key);globalThis.innerWidth=1200;globalThis.innerHeight=900;
function node(){const classes=new Set();return {style:{},children:[],classList:{add(...names){names.forEach(n=>classes.add(n));},remove(n){classes.delete(n);},contains:n=>classes.has(n),toggle(n,on){on?classes.add(n):classes.delete(n);}},setAttribute(){},getBoundingClientRect:()=>({}),append(child){child.parent=this;this.children.push(child);},get firstElementChild(){return this.children[0];},remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);},animate(frames){return {frames,onfinish:null,cancel(){}};},cloneNode(){const copy=node();copy.src=this.src;return copy;}};}
globalThis.document={createElement:node,body:node()};globalThis.getComputedStyle=n=>({opacity:n.style.opacity||'1'});
const loads=new Map();globalThis.Image=class{constructor(){Object.assign(this,node());}set src(url){this.url=url;loads.set(url,this);}get src(){return this.url;}};
const menu={hidden:false,getBoundingClientRect:()=>rect,contains:target=>!!target?.dataset,addEventListener(key,fn){listeners.set('menu-'+key,fn);},removeEventListener(key){listeners.delete('menu-'+key);}};
const row=id=>({dataset:{projectMenuItem:id},getBoundingClientRect:()=>rowRect});
const preview=new ProjectMenuPreview(menu,[{id:'a',image:'a.png'},{id:'b',image:'b.png'},{id:'c',image:'c.png'}]);
const a=row('a'),b=row('b');
const first=preview.show(a),second=preview.show(b);loads.get('a.png').onload();await first;assert.equal(preview.url,undefined,'Slow old loads cannot replace the latest hover');loads.get('b.png').onload();await second;assert.equal(preview.url,'b.png');assert(preview.el.classList.contains('is-visible'));
const third=preview.show(a);await third;assert.equal(preview.url,'a.png');assert.equal(preview.el.children.length,2,'Next row crossfades in the existing preview');
const outgoing=preview.el.children[0];assert.equal(preview.animations.get(outgoing).frames.at(-1).opacity,0,'Outgoing thumbnail actually fades away, including uncovered portrait edges');
preview.animations.get(preview.image).onfinish();assert.equal(preview.el.children.length,1,'Settled swap always removes every previous thumbnail');
const pending=preview.show(row('c'));await preview.show(a);loads.get('c.png').onload();await pending;assert.equal(preview.url,'a.png','Returning to current thumbnail invalidates the pending replacement');
// A late callback from an interrupted fade cannot restore a ghost image.
const swap=preview.show(b);await swap;const interruptedNode=preview.image,interrupted=preview.animations.get(interruptedNode).onfinish;await preview.show(a);const opacity=interruptedNode.style.opacity;interrupted();assert.equal(interruptedNode.style.opacity,opacity,'Interrupted callbacks cannot reset outgoing opacity');preview.animations.get(preview.image).onfinish();assert.equal(preview.el.children.length,1);assert.equal(preview.el.children[0].src,'a.png');
preview.hide();assert(!preview.el.classList.contains('is-visible'));await preview.show(b);assert.equal(preview.url,'b.png');
listeners.get('menu-focusout')({relatedTarget:a});assert(preview.el.classList.contains('is-visible'),'Moving keyboard focus between rows preserves the shared presence');
listeners.get('menu-focusout')({relatedTarget:null});assert(!preview.el.classList.contains('is-visible'));
preview.destroy();assert.equal(listeners.size,0,'Preview removes its handlers and portal');
console.log('Project menu preview passed: unclipped viewport placement, latest-load wins, crossfade reuse, pending cancellation, focus continuity and cleanup.');
