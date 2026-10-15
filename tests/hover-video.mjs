import assert from 'node:assert/strict';
import {ImageFrame} from '../dist/image-frame.js';
import {pauseVideoPreviews} from '../dist/hover-video.js';
import {card,cardDetail} from '../dist/card-renderer.js';
import {projects} from '../dist/documents.js';

class Target {
 constructor(){this.events=new Map();}
 addEventListener(type,handler){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(handler);}
 removeEventListener(type,handler){this.events.get(type)?.delete(handler);}
 emit(type,event={}){for(const handler of this.events.get(type)||[])handler(event);}
 get listenerCount(){return [...this.events.values()].reduce((sum,set)=>sum+set.size,0);}
}
const hover=Object.assign(new Target(),{matches:true}),reduced=Object.assign(new Target(),{matches:false});
globalThis.matchMedia=query=>query.includes('reduced')?reduced:hover;
globalThis.document=Object.assign(new Target(),{hidden:false});
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.getComputedStyle=el=>el.isCard?{borderTopLeftRadius:'64px',paddingTop:'40px',paddingRight:'40px',paddingBottom:'40px',paddingLeft:'40px'}:
 {visibility:'visible',getPropertyValue:key=>key==='--image-rounding'?'6px':key.startsWith('--image-padding-')?'24px':''};
function create(mode=null){
 let selected=true;const galleryItem={getAttribute:()=>String(selected)};
 const pending=[],classes=new Set(),attributes=new Map();
 const trigger=Object.assign(new Target(),{isCard:true,dataset:{imageMode:'inset'},classList:{contains:()=>true}});
 const video=Object.assign(new Target(),{style:{},dataset:{videoUrl:'assets/test.mp4'},readyState:0,videoWidth:0,videoHeight:0,pauses:0,loads:0,
  setAttribute:(key,value)=>attributes.set(key,value),getAttribute:key=>attributes.get(key),removeAttribute:key=>attributes.delete(key),
  play:()=>new Promise((resolve,reject)=>pending.push({resolve,reject})),pause(){this.pauses++;},load(){this.loads++;}});
 const image={naturalWidth:1440,naturalHeight:900,style:{},addEventListener(){},removeEventListener(){}};
 const edge={style:{}};
 const el={isConnected:true,clientWidth:600,clientHeight:375,style:{},
  closest:selector=>selector==='.project-card'||selector==='.surface'?trigger:selector==='.detail'&&mode==='detail'?trigger:selector==='[data-gallery-item]'&&mode==='spotlight'?galleryItem:null,
  querySelector:selector=>selector==='img'?image:selector==='video[data-video-url]'?video:edge,
  classList:{add:cls=>classes.add(cls),remove:cls=>classes.delete(cls)}};
 const frame=new ImageFrame(el);
 return {frame,preview:frame.preview,el,trigger,video,pending,classes,image,select:value=>selected=value};
}
const a=create();
assert.equal(a.video.getAttribute('src'),undefined,'Idle cards do not fetch videos');
assert.equal(a.pending.length,0,'Idle cards do not play');
assert(a.video.muted&&a.video.defaultMuted&&!a.video.loop&&a.video.playsInline);
let request=a.preview.play();
assert.equal(a.video.getAttribute('src'),'assets/test.mp4');
assert(!a.classes.has('video-preview-playing'),'Poster remains visible until playback starts');
a.video.readyState=2;a.video.videoWidth=1440;a.video.videoHeight=900;a.video.emit('loadedmetadata');
for(const property of ['width','height','left','top','borderRadius'])assert.equal(a.video.style[property],a.image.style[property],'Video and image share contain/padding/corner geometry');
a.pending.shift().resolve();await request;
assert(a.classes.has('video-preview-playing'));
a.trigger.emit('pointerleave');
assert(a.classes.has('video-preview-playing'));assert(a.preview.active,'Leaving finishes the current playback');a.video.emit('ended');assert(!a.preview.active);

// A requested full playback continues even if the pointer leaves while loading.
request=a.preview.play();a.trigger.emit('pointerleave');a.pending.shift().resolve();await request;
assert(a.classes.has('video-preview-playing'));a.video.emit('ended');
// An older play promise cannot pause or reveal a newer hover request.
const old=a.preview.play();a.preview.stop();const current=a.preview.play();
const pauses=a.video.pauses;a.pending.shift().resolve();await old;
assert.equal(a.video.pauses,pauses);assert(!a.classes.has('video-preview-playing'));
a.pending.shift().resolve();await current;assert(a.classes.has('video-preview-playing'));
a.trigger.emit('pointerdown');assert(!a.preview.active,'Selecting/dragging the card pauses playback');

request=a.preview.play();a.pending.shift().reject(new Error('blocked'));await request;
assert(!a.preview.active);assert(!a.classes.has('video-preview-playing'),'Rejected playback keeps the poster');
reduced.matches=true;await a.preview.play();assert.equal(a.pending.length,0);
reduced.matches=false;hover.matches=false;await a.preview.play();assert.equal(a.pending.length,0);
hover.matches=true;a.trigger.emit('pointerenter',{pointerType:'touch'});assert.equal(a.pending.length,0);

request=a.preview.play();a.pending.shift().resolve();await request;
const b=create(),next=b.preview.play();assert(a.preview.active,'Other hovered cards finish their playback concurrently');
b.pending.shift().resolve();await next;
document.hidden=true;document.emit('visibilitychange');assert(!b.preview.active,'Hidden tabs pause decoding');
document.hidden=false;request=b.preview.play();b.pending.shift().resolve();await request;
pauseVideoPreviews();assert(!b.preview.active,'Navigation pauses all live previews');
request=b.preview.play();b.frame.destroy();b.pending.shift().resolve();await request;
assert(!b.classes.has('video-preview-playing'));assert.equal(b.video.getAttribute('src'),undefined);assert.equal(b.video.loads,1);
assert.equal(b.trigger.listenerCount,0);assert.equal(b.video.listenerCount,0);
a.frame.destroy();assert.equal(document.listenerCount,0);assert.equal(hover.listenerCount,0);assert.equal(reduced.listenerCount,0);

// Spotlight entry works without a hover-capable pointer; leaving finishes one lap.
hover.matches=false;
const spot=create('spotlight');spot.preview.sync();assert.equal(spot.pending.length,1);spot.pending.shift().resolve();await Promise.resolve();spot.video.emit('ended');assert.equal(spot.pending.length,1,'Selected spotlight repeats');spot.pending.shift().resolve();await Promise.resolve();spot.select(false);spot.preview.sync();assert(spot.preview.active);spot.video.emit('ended');assert(!spot.preview.active,'Departed spotlight stops at its next boundary');spot.frame.destroy();
const detail=create('detail');detail.preview.sync();detail.pending.shift().resolve();await Promise.resolve();detail.video.emit('ended');assert.equal(detail.pending.length,1,'Detail videos repeat without hover');detail.pending.shift().resolve();await Promise.resolve();detail.trigger.emit('pointerdown');assert(detail.preview.active,'Pressing an auto-playing clip to open it keeps it playing instead of blanking to the image');detail.frame.destroy();hover.matches=true;

for(const p of projects){
 const html=card(p,0);
 assert.equal(html.includes('<video'),Boolean(p.videoUrl),'Projects without videoUrl keep the image-only renderer');
 if(p.videoUrl){assert(html.includes(`data-video-url="${p.videoUrl}"`));assert(html.includes('preload="none"'));assert(!html.includes('<video src='));assert(cardDetail(p).includes('<video'));}
}
console.log('Hover video passed: lazy muted playback, shared fit/rounding, rapid hover races, rejection, reduced motion, complete hover clips, concurrent cards, spotlight and detail loops, navigation pause and decoder/listener cleanup.');
