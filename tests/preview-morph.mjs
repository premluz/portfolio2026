import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {containRect,previewMorphProxy,fadeOutProxy}=await import('../dist/preview-morph.js');

assert.deepEqual(containRect({left:0,top:0,width:360,height:260},{width:1440,height:900}),{left:0,top:17.5,width:360,height:225},'Landscape images fill the width and centre vertically, like the hover preview');
assert.deepEqual(containRect({left:10,top:0,width:360,height:260},{width:600,height:1200}),{left:125,top:0,width:130,height:260},'Portrait images fill the height and centre horizontally');
assert.deepEqual(containRect({left:1,top:2,width:3,height:4}),{left:1,top:2,width:3,height:4},'Unknown image size keeps the preview box');

const made=[],doc={body:{append:node=>made.push(node)},createElement:tag=>({tag,style:{},children:[],attributes:{},setAttribute(key,value){this.attributes[key]=value;},append(...nodes){this.children.push(...nodes);}})};
const proxy=previewMorphProxy({left:5,top:6,width:70,height:80},'thumb.webp',doc);
assert.equal(made[0],proxy);assert.equal(proxy.className,'preview-morph-proxy');assert.equal(proxy.attributes['aria-hidden'],'true');
assert.deepEqual([proxy.style.left,proxy.style.top,proxy.style.width,proxy.style.height],['5px','6px','70px','80px']);
assert.equal(proxy.children[0].className,'visual','The stand-in has the .visual frame the card morph reads');assert.equal(proxy.children[0].children[0].src,'thumb.webp');

let removed=0;fadeOutProxy({remove:()=>removed++},true);assert.equal(removed,1,'Reduced motion removes the stand-in at once');fadeOutProxy(null);
const css=await readFile(new URL('../dist/preview-morph.css',import.meta.url),'utf8'),styles=await readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8');
assert(styles.includes("'preview-morph.css'")&&!/#[0-9a-f]{3,8}\b/i.test(css),'Stand-in styles ship in the bundle with tokens only');
console.log('Preview morph passed: contained thumbnail geometry, card-shaped stand-in, reduced-motion cleanup and bundled styles.');
