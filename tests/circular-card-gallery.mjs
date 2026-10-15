import assert from 'node:assert/strict';
import {circularGeometry,circularPose,circularArcPose,circularArcLayout,projectedCardBounds,wrapAngle} from '../dist/circular-card-gallery.js';
import {CardGallery} from '../dist/card-gallery.js';
import {contentBlocks} from '../dist/content-blocks.js';
import {content} from '../dist/content/local.js';
import {TransitionControl} from '../dist/transition-control.js';
import {defaultCarouselSettings} from '../dist/carousel-settings.js';

const geometry=circularGeometry([700,360,700,360,700]);
assert(geometry.angles.every((a,i)=>!i||a>geometry.angles[i-1]));
assert(Math.abs(geometry.radius*2*Math.PI-(2820+5*32))<1e-6,'Mixed card widths determine the ring pitch');
const front=circularPose(0,geometry.radius),back=circularPose(Math.PI,geometry.radius);
assert.equal(front.x,0);assert.equal(front.z,0);assert.equal(front.angle,0);assert.equal(front.opacity,1);
assert(back.z<front.z&&back.opacity===0&&back.order<front.order,'Back faces are not displayed');
for(let angle=-8;angle<=8;angle+=.1){const pose=circularArcPose(angle,geometry.radius);assert(Object.values(pose).every(v=>typeof v==='boolean'||Number.isFinite(v)));assert(Math.abs(pose.angle)<=24,'The shallow arc never turns a card to a sharp angle');assert(pose.opacity>=0&&pose.opacity<=1);}
for(const width of [390,960,1440,1920]){const edge=circularArcPose(2.4,width*.68);assert(edge.x>width*.6,'Outer cards extend to the edge of the full canvas instead of fitting into its middle');assert.equal(circularArcPose(0,width*.68).z,0,'The front card is never shrunk by fitting the ring');}
assert.equal(circularArcPose(Math.PI,1440).front,false);assert.equal(circularArcPose(Math.PI,1440).opacity,0);
assert(circularArcPose(Math.PI-.001,1440).opacity<.001&&circularArcPose(-Math.PI+.001,1440).opacity<.001,'Wrap-around happens while invisible');
assert(Math.abs(wrapAngle(Math.PI*2+.2)-.2)<1e-8);
for(const width of [320,390,600])for(const count of [3,6,8]){
 const sizes=Array.from({length:count},(_,i)=>width-(i%2?64:48)),geometry=circularGeometry(sizes,48),faces=sizes.map((size,index)=>({size:index%2?Math.min(size-32,328*.48):size-48,offset:index%2?0:-8}));
 for(let index=0;index<count;index++){
  const poses=circularArcLayout(geometry.angles.map(angle=>angle-geometry.angles[index]),width*.68,faces,{compact:true,viewportWidth:width});
  for(const direction of [-1,1]){
   const next=(index+direction+count)%count,edge=projectedCardBounds(poses[next],faces[next]);
   assert(Math.abs((direction>0?edge.left:-edge.right)-(width/2-12))<.001,'Both mobile neighbours remain partially visible for every portrait/landscape selection');
  }
  assert(Math.abs(poses[index].x)<.001&&poses[index].z===0,'Mobile spacing leaves the selected card centred at its native size');
 }
}
for(const faces of [[700,700,700,360,700,360],[668,668,668,220,668,220]]){
 const geometry=circularGeometry([700,700,700,360,700,360]),angles=geometry.angles.map(angle=>angle-geometry.angles[1]),poses=circularArcLayout(angles,1920*.68,faces,{viewportWidth:1920});
 const visible=poses.map((pose,index)=>({pose,world:wrapAngle(angles[index]),bounds:projectedCardBounds(pose,faces[index])})).filter(item=>item.pose.opacity>.01&&item.bounds.right>-960&&item.bounds.left<960);
 assert(visible.filter(item=>item.world<-.001).length>=1&&visible.filter(item=>item.world>.001).length>=1,'The shallow arc keeps neighbours visible on both sides while outer projects may remain off screen');
}
for(const viewportWidth of [320,390,600,720,960,1440,1920]){
 const compact=viewportWidth<=600,landscape=compact?viewportWidth-48:Math.max(340,Math.min(700,viewportWidth*.46)),portrait=compact?viewportWidth-64:Math.max(210,Math.min(360,viewportWidth*.26));
 const sizes=[landscape,landscape,landscape,portrait,landscape,portrait],geometry=circularGeometry(sizes,compact?48:32),faces=sizes.map((size,index)=>({size:index===3||index===5?Math.min(size-32,(compact?328:468)*.48):size-32,offset:0}));
 for(let step=0;step<=180;step++){
  const angle=step*Math.PI/90,angles=geometry.angles.map(value=>value+angle),poses=circularArcLayout(angles,viewportWidth*.68,faces,{compact,viewportWidth});
  const visible=poses.map((pose,index)=>({pose,world:wrapAngle(angles[index]),bounds:projectedCardBounds(pose,faces[index])})).filter(item=>item.pose.opacity>.01).sort((a,b)=>a.world-b.world);
  for(let i=1;i<visible.length;i++)assert(visible[i].bounds.left-visible[i-1].bounds.right>=(compact?8:32)-.001,'Projected faces retain a visible gap throughout navigation at every screen width');
  for(const item of visible)if(Math.abs(item.world)>Math.PI*.82)assert(item.bounds.left>=viewportWidth/2||item.bounds.right<=-viewportWidth/2,'Wrap fades take place beyond either screen edge');
 }
 for(let selected=0;selected<sizes.length;selected++){
  const before=circularArcLayout(geometry.angles.map(angle=>angle-geometry.angles[selected]-.000001),viewportWidth*.68,faces,{compact,viewportWidth});
  const after=circularArcLayout(geometry.angles.map(angle=>angle-geometry.angles[selected]+.000001),viewportWidth*.68,faces,{compact,viewportWidth});
  for(let i=0;i<sizes.length;i++)if(before[i].opacity>.01&&after[i].opacity>.01)assert(Math.abs(before[i].x-after[i].x)<.01,'Crossing a selected card changes the spacing continuously');
 }
}
const block=content.get('home').blocks.find(b=>b.type==='card-gallery'),html=contentBlocks([block],2);
assert(html.includes('data-gallery-variant="circular"'));
// Every card keeps its authored orientation; mixed proportions themselves are covered by the geometry cases above.
const orientations=[...html.matchAll(/data-gallery-orientation="(\w+)"/g)].map(match=>match[1]);
assert(orientations.length&&orientations.every(value=>['landscape','portrait'].includes(value)),'Each gallery card carries its orientation');
assert.equal((html.match(/data-content-card=/g)||[]).length,block.items.length,'The variant uses one shared card per project');

let now=0,id=0,reduced=false;const frames=new Map();
globalThis.performance={now:()=>now};
globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
const flush=()=>{for(let n=0;frames.size&&n<200;n++){now+=16;const callbacks=[...frames];frames.clear();for(const [,fn] of callbacks)fn(now);}assert.equal(frames.size,0,'Motion stops after settling');};
const node=()=>({dataset:{},style:{setProperty(k,v){this[k]=v;}},listeners:new Map(),addEventListener(k,fn){this.listeners.set(k,fn);},removeEventListener(k){this.listeners.delete(k);},setAttribute(k,v){this[k]=v;}});
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const root=node();root.dataset={galleryVariant:'circular',galleryAxis:'horizontal',galleryIndex:'2'};
const viewport=node();Object.assign(viewport,{clientWidth:1440,clientHeight:564,scrollLeft:0,scrollTop:0,focus(){},scrollTo(p){this.scrollLeft=p.left;this.scrollTop=p.top;},getBoundingClientRect(){return {left:0,top:0,width:1440,height:564};}});
const widths=[700,360,700,360,700],items=widths.map((width,index)=>{const item=node();Object.assign(item,{offsetWidth:width,offsetHeight:500,offsetLeft:370+index*650,offsetTop:32,firstElementChild:node()});item.dataset={galleryTitle:`Title ${index}`,galleryClient:`Client ${index}`,galleryDescription:`Description ${index}`,galleryOrientation:width===360?'portrait':'landscape'};item.link={tabIndex:-1};item.querySelectorAll=()=>[item.link];item.querySelector=()=>item.link;item.contains=node=>node===item.link;item.getBoundingClientRect=()=>({left:item.offsetLeft-viewport.scrollLeft,top:32-viewport.scrollTop,width,height:500});return item;});
const client=node(),title=node(),description=node(),previous=node(),next=node();title.parentElement={animate(){return {cancel(){}};}};
root.querySelectorAll=()=>items;root.querySelector=s=>({'[data-gallery-viewport]':viewport,'[data-gallery-client]:not([data-gallery-item])':client,'[data-gallery-title]:not([data-gallery-item])':title,'[data-gallery-description]:not([data-gallery-item])':description,'[data-gallery-previous]':previous,'[data-gallery-next]':next})[s];
const gallery=new CardGallery(root,{reduced:()=>reduced});flush();
assert.equal(gallery.index,2);assert.equal(client.textContent,'Client 2');assert.equal(title.textContent,'Title 2');assert.equal(items[2].link.tabIndex,0);assert.equal(previous.disabled,false);assert.equal(next.disabled,false);
const retainedAdapter=gallery.circular,retainedItems=[...gallery.items];gallery.setArcSettings({...defaultCarouselSettings,tilt:8,spread:140,depth:0,gap:64});flush();
assert.equal(gallery.circular,retainedAdapter);assert.deepEqual(gallery.items,retainedItems,'Live knobs preserve the carousel and native card nodes');assert.equal(gallery.index,2);assert(Math.abs(gallery.circular.angle+gallery.circular.angles[2])<.001,'Changing gap keeps the selected project exactly centred');
for(const item of items)assert(Math.abs(Number(item.style.transform.match(/rotateY\(([^d]+)deg\)/)[1]))<=8,'Side tilt changes immediately on existing cards');
gallery.setArcSettings(defaultCarouselSettings);flush();
gallery.circular.angle+=.1;const control=new TransitionControl(),preparing=gallery.prepareOpen(items[2].link,control,400);flush();await preparing;control.complete();assert.equal(gallery.index,2);assert(Math.abs(gallery.circular.angle+gallery.circular.angles[2])<.001,'Opening first brings the shared card face-on');
const identities=[...gallery.items];gallery.go(4);flush();assert.equal(gallery.index,4);gallery.onNext();flush();assert.equal(gallery.index,0,'Circular arrows wrap around');
gallery.onNext();gallery.onNext();flush();assert.equal(gallery.index,2,'Rapid input advances the destination without waiting for the previous motion');
gallery.setOrientation('vertical');flush();assert(items[2].style.transform.includes('rotateX(0'));assert.equal(gallery.index,2);
gallery.setOrientation('horizontal');flush();
gallery.onDown({pointerType:'touch',button:0,pointerId:1,clientX:0,clientY:0});
gallery.onMove({pointerType:'touch',pointerId:1,clientX:2,clientY:40,preventDefault(){throw Error('Vertical page scrolling should remain native');}});assert.equal(gallery.drag,null);
gallery.onDown({pointerType:'touch',button:0,pointerId:2,clientX:0,clientY:0});
gallery.onMove({pointerType:'touch',pointerId:2,clientX:-330,clientY:0,preventDefault(){}});assert.equal(root.dataset.galleryDragging,'true');gallery.onUp({pointerId:2});flush();assert.equal(root.dataset.galleryDragging,undefined);
for(const [pointerType,width] of [['mouse',1440],['touch',390]]){
 viewport.clientWidth=width;items.forEach((item,index)=>item.offsetWidth=width<=600?width-(index%2?64:48):widths[index]);gallery.onResize();flush();gallery.go(0,false);
 const press=now,event={pointerType,button:0,pointerId:3,clientX:0,clientY:0,timeStamp:press};gallery.onDown(event);
 for(let step=1;step<=6;step++){now=press+step*16;gallery.onMove({...event,clientX:-step*60,timeStamp:now,preventDefault(){}});}
 const releaseAngle=gallery.circular.angle;gallery.onUp({...event,timeStamp:now,type:'pointerup'});assert(gallery.circular.momentum.velocity<0,'Mouse and touch flicks retain release speed');
 let prevented=false;gallery.onClick({target:{closest:()=>items[0]},preventDefault(){prevented=true;},stopPropagation(){}});assert(prevented,'Releasing a drag never opens a project');
 flush();assert(gallery.circular.angle<releaseAngle-Math.PI*2/items.length,'One flick continues beyond another complete card');assert(Math.abs(wrapAngle(gallery.circular.angle+gallery.circular.angles[gallery.index]))<.001,'Momentum ends on a centred card');
 gallery.onDown({...event,timeStamp:now});now+=16;gallery.onMove({...event,clientX:150,timeStamp:now,preventDefault(){}});gallery.onUp({...event,type:'pointercancel',timeStamp:now});assert.equal(gallery.circular.momentum.velocity,0,'A cancelled pointer cannot launch a spin');flush();
 gallery.onDown({...event,timeStamp:now});now+=16;gallery.onMove({...event,clientX:-180,timeStamp:now,preventDefault(){}});gallery.onUp({...event,type:'pointerup',timeStamp:now});assert(gallery.circular.momentum.velocity);
 gallery.onDown({...event,timeStamp:now});assert.equal(gallery.circular.momentum.velocity,0,'Pressing a moving carousel catches it immediately');gallery.onUp({...event,type:'pointerup',timeStamp:now});flush();
}
gallery.setVariant('perspective');flush();assert.equal(gallery.circular,null);assert(items.every(item=>item.style.transform===''&&item.style.visibility===''&&item.style.pointerEvents===''));assert.deepEqual(gallery.items,identities,'Changing placement retains and reveals the native cards');
gallery.setVariant('circular');flush();assert(gallery.circular);reduced=true;gallery.setVariant('circular');flush();assert.equal(gallery.circular,null,'Reduced motion falls back to native scrolling');assert.equal(root.dataset.galleryReduced,'true');
reduced=false;gallery.setVariant('circular');gallery.go(3);gallery.destroy();flush();assert.equal(viewport.listeners.size,0);assert(items.every(item=>item.style.transform===''),'Disposal clears ring transforms and pending animation');
console.log('Circular gallery passed: mixed proportions, front/back depth, shared cards, both axes, captions, rapid navigation/wrap, touch scrolling, retained variant switching, reduced motion and cleanup.');
