import assert from 'node:assert/strict';
import {sameImageAsset,ImageDecodeGate,handoffImage,presentedImage,clearImageHandoffs} from '../dist/image-handoff.js';

const tick=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
let observers=[];
globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
function image(src,{original='assets/project.png',complete=true,decode=()=>Promise.resolve()}={}){
 const listeners=new Map(),attrs=new Map([['data-media-pending','']]);
 const node={src,currentSrc:src,complete,naturalWidth:complete?960:0,dataset:{originalImage:original},style:{position:'absolute',width:'600px',height:'400px',left:'0px',top:'0px',borderRadius:'6px',setProperty(key,value){this[key]=value;}},classes:new Set(),listeners,attrs,decode,
  addEventListener(key,fn){const set=listeners.get(key)||new Set();set.add(fn);listeners.set(key,set);},removeEventListener(key,fn){listeners.get(key)?.delete(fn);},removeAttribute(key){attrs.delete(key);},remove(){this.parentElement?.children.splice(this.parentElement.children.indexOf(this),1);this.parentElement=null;this.removed=true;},
  load(){this.complete=true;this.naturalWidth=1920;for(const fn of [...listeners.get('load')||[]])fn();}};
 node.classList={add:key=>node.classes.add(key)};return node;
}
function visual(target){return {isConnected:true,children:[target],querySelector:()=>target,append(node){this.children.push(node);node.parentElement=this;}};}

const source={src:'https://portfolio.invalid/assets/optimised/project-960.webp',originalSrc:'assets/project.png'},target=image('https://portfolio.invalid/assets/optimised/project-1920.webp');
assert(sameImageAsset(source,target),'Responsive sizes of one asset never trigger a second-image crossfade');
assert(!sameImageAsset(source,image('other.webp',{original:'assets/other.png'})),'Different project images retain their crossfade');

let ready=0;const decode=deferred(),loading=image('large.webp',{complete:false,decode:()=>decode.promise}),gate=new ImageDecodeGate(loading,()=>ready++);
assert(!gate.isReady());loading.load();await tick();assert(!gate.isReady()&&!ready,'A loaded but not yet decoded image cannot receive the handoff');decode.resolve();await tick();assert(gate.isReady());assert.equal(ready,1);gate.dispose();

// Candidate changes during decoding must not reveal an unready responsive file.
const first=deferred(),second=deferred();let calls=0;
const changing=image('small.webp',{decode:()=>++calls===1?first.promise:second.promise}),changingGate=new ImageDecodeGate(changing);
changing.currentSrc='large.webp';changing.complete=false;first.resolve();await tick();assert(!changingGate.isReady());changing.load();second.resolve();await tick();assert(changingGate.isReady());changing.currentSrc='larger.webp';assert(!changingGate.isReady(),'Readiness is specific to the decoded candidate');changingGate.dispose();

const pending=deferred(),native=image('large.webp',{decode:()=>pending.promise}),slot=visual(native),painted=image('small.webp');
let paints=0;
handoffImage(painted,slot,{beforeReveal:()=>{assert.equal(presentedImage(slot),painted);assert(slot.children.includes(painted),'The already-painted image covers the slot until the receiving GPU draw completes');paints++;}});
assert.equal(presentedImage(slot),painted);assert.equal(painted.style.visibility,'visible');assert.equal(painted.style.opacity,'1');assert(painted.classes.has('morph-image-bridge'));assert(!painted.attrs.has('data-media-pending'));
native.style.width='500px';observers.at(-1).callback();assert.equal(painted.style.width,'500px','A waiting handoff keeps the receiving image geometry on resize');
assert.equal(paints,0);pending.resolve();await tick();assert.equal(paints,1);assert.equal(presentedImage(slot),native);assert(painted.removed);assert(!native.attrs.has('data-media-pending'));assert.equal(slot.children.length,1,'Exactly one live image remains after the atomic swap');

// New navigation/Escape can remove a waiting bridge. A late decode must not
// affect the next bridge, its native slot, or its paint callback.
const oldDecode=deferred(),newDecode=deferred();let generation=0,latePaints=0;
const shared=image('large.webp',{decode:()=>++generation===1?oldDecode.promise:newDecode.promise}),sharedSlot=visual(shared),oldBridge=image('old.webp'),newBridge=image('new.webp');
handoffImage(oldBridge,sharedSlot,{beforeReveal:()=>latePaints++});handoffImage(newBridge,sharedSlot,{beforeReveal:()=>latePaints++});assert(oldBridge.removed);oldDecode.resolve();await tick();assert.equal(presentedImage(sharedSlot),newBridge);assert.equal(latePaints,0);
clearImageHandoffs({contains:node=>node===sharedSlot});newDecode.resolve();await tick();assert(newBridge.removed);assert.equal(latePaints,0);assert.equal(sharedSlot.children.length,1);assert.equal(shared.listeners.get('load').size,0);

const failed=deferred(),failedNative=image('broken.webp',{decode:()=>failed.promise}),failedSlot=visual(failedNative),fallback=image('cached.webp');handoffImage(fallback,failedSlot);failed.reject(Error('decode failed'));await tick();assert.equal(presentedImage(failedSlot),fallback,'A failed upgrade retains the visible cached image');clearImageHandoffs();assert(fallback.removed);assert(observers.every(observer=>observer.disconnected));
console.log('Image handoff passed: responsive identity, decode gating, atomic bitmap/GPU reveal, resize, candidate races, interrupted navigation, failure fallback and cleanup.');
