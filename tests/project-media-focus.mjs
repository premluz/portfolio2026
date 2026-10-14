import assert from 'node:assert/strict';
import {focusedImageRect,descriptionExitTargets,mediaExitKeyframes,ProjectMediaFocus} from '../dist/project-media-focus.js';
import {contentModel} from '../dist/content/model.js';
import {catalog} from '../dist/content/catalog.js';
import {createContentStore} from '../dist/content/provider.js';
import {cardDetail} from '../dist/card-renderer.js';
for(const viewport of [{width:1800,height:1200},{width:390,height:844},{width:900,height:500}]){
 for(const [size,portrait] of [[{width:1920,height:1080},false],[{width:600,height:1280},true]]){
  const r=focusedImageRect(size,viewport,portrait);
  assert(Math.abs(r.width/r.height-size.width/size.height)<.00001,'Image proportions stay intact');
  assert(Math.abs(r.left+r.width/2-viewport.width/2)<.001);assert(Math.abs(r.top+r.height/2-viewport.height/2)<.001);
  assert(r.width<=1440);assert(r.left>=24-.001);if(portrait)assert(r.height<=viewport.height*.85+.001);
 }
}
assert.deepEqual(catalog.documents.filter(doc=>doc.prototype?.url).map(doc=>doc.id).sort(),['bastion','merlin','tracr'],'Only the three supplied projects expose working prototype actions');
for(const [size,portrait] of [[{width:1920,height:1080},false],[{width:600,height:1280},true]]){
 const pane=Object.create(ProjectMediaFocus.prototype);globalThis.innerWidth=390;globalThis.innerHeight=844;
 Object.assign(pane,{source:{naturalWidth:size.width,naturalHeight:size.height},sourceRect:{...size,left:20,top:100},portrait,image:{style:{}},frame:{style:{}},settled:false});
 pane.layout();assert.deepEqual(pane.frame.style,pane.image.style,'Prototype iframe matches every image-pane dimension');assert(Math.abs(parseFloat(pane.frame.style.width)/parseFloat(pane.frame.style.height)-size.width/size.height)<.00001,'Portrait and landscape prototypes retain the image aspect ratio');
}
const targets=[120,700,350].map(top=>({getBoundingClientRect:()=>({top})}));assert.deepEqual(descriptionExitTargets({querySelectorAll:()=>targets}),[targets[1],targets[2],targets[0]],'Description exits from bottom upward');
const copy=structuredClone(catalog);copy.documents.find(d=>d.id==='playstation').prototype={url:'https://example.com/prototype',label:'View prototype'};
assert.equal(contentModel.validate(copy).length,0);const store=createContentStore(copy);assert.equal(store.getCard('playstation').prototype.url,'https://example.com/prototype');
const markup=cardDetail(store.getCard('playstation'));assert(!markup.includes('data-media-focus="prototype"'),'Prototype belongs in the contextual composer navigation');assert(markup.includes('aria-label="View full screen"'));assert(markup.includes('data-media-focus="fullscreen"'));assert(markup.includes('<div class="detail-media-column"><div class="visual">')&&markup.includes('</div><div class="description">'),'The image and its controls share one layout column.');
const projectMediaCss=await (await import('node:fs/promises')).readFile(new URL('../dist/project-media-focus.css',import.meta.url),'utf8');assert(projectMediaCss.includes('gap:24px')&&projectMediaCss.includes('.detail[data-card-orientation="landscape"] .detail-media-column{display:grid;grid-template-columns:minmax(0,1fr);grid-auto-rows:max-content;align-content:start;align-self:start;height:max-content;row-gap:24px}'),'Landscape media controls stay in the content-sized column, 24px below the image; portrait keeps the shared 24px flex gap.');
const actionFrames=mediaExitKeyframes({matches:selector=>selector==='.detail-media-actions'},'.8');assert.deepEqual(actionFrames,[{opacity:'.8',transform:'translateY(0px)'},{opacity:0,transform:'translateY(18px)'}],'Media actions fade and slide down on fullscreen entry, then reverse on close.');
copy.documents.find(d=>d.id==='playstation').prototype.url='javascript:alert(1)';assert(contentModel.validate(copy).some(issue=>issue.includes('prototype')));
// Escape reverses existing animations, without rebuilding them or losing their phase.
let reverseCount=0,awaitCount=0,destroyed=0;const dockModes=[];
const controller=Object.create(ProjectMediaFocus.prototype);Object.assign(controller,{active:true,target:true,settled:false,dock:()=>({setMediaFocus:active=>dockModes.push(active)}),duration:()=>400,frame:{remove(){}},reduced:()=>false,animations:[{currentTime:137,reverse(){reverseCount++;}}],awaitEnd(){awaitCount++;},destroy(){destroyed++;}});
controller.close();assert.equal(reverseCount,1);assert.equal(controller.animations[0].currentTime,137);assert.equal(awaitCount,1);controller.close();assert.equal(reverseCount,1);
controller.target=true;controller.reduced=()=>true;controller.close();assert.equal(destroyed,1,'Reduced motion exits immediately');
assert.deepEqual(dockModes,[false,false],'Both animated and reduced-motion exits restore the composer');
console.log('Project media focus passed: proportional viewport limits, bottom-up description, prototype metadata/URL safety, shared controls and Escape reversal.');

const layoutCss=await (await import('node:fs/promises')).readFile(new URL('../dist/style.css',import.meta.url),'utf8');
assert(layoutCss.includes('.detail.heading-beside-image[data-card-orientation="portrait"]>.detail-layout>.detail-media-column>.visual{height:max('),'Viewport-height image holders are restricted to portraits');
assert(!layoutCss.includes('.detail.heading-beside-image>.detail-layout>.detail-media-column>.visual{height:max('),'Landscape images cannot inherit the portrait letterbox that pushes media buttons away');
