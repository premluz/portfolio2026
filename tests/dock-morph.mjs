import assert from 'node:assert/strict';
import {DockMorph,dockGeometry,backGeometry} from '../dist/dock-morph.js';

for(const diameter of [48,54]){
 const seam=12,width=diameter*2+seam;
 const glass=dockGeometry(0,{main:358,height:48},{anchor:'main',position:1,split:1,left:0,width,height:diameter,radius:diameter/2,splitAts:[.5]}).popover;
 assert.equal(glass.segments.length,2);
 for(const segment of glass.segments)assert.equal(segment.width,glass.height,'Each detached icon outline has equal width and height');
 for(const path of glass.path.split(/(?=M )/).filter(Boolean)){
  const top=/^M (-?[\d.]+) (-?[\d.]+) H (-?[\d.]+)/.exec(path);
  assert(top,'The detached outline has a measurable top edge');
  assert.equal(Number(top[1]),Number(top[3]),'A circular outline has no flat top edge between its two corner curves');
 }
}

const wrappedGroups=[{left:0,top:0,width:76,height:54},{left:94,top:0,width:85,height:54},{left:234,top:0,width:54,height:54},{left:94,top:46,width:100,height:54}];
for(const position of [.1,.5,.94,.97,1]){
 const wrapped=dockGeometry(0,{main:288,height:54},{anchor:'main',position,split:1,left:0,width:288,height:100,radius:27,splitRects:wrappedGroups}).popover;
 assert(!/NaN|Infinity/.test(wrapped.path),'Wrapped control rows retain valid geometry throughout the morph');
 if(position!==1)continue;
 assert.equal(wrapped.segments.length,wrappedGroups.length,'Each wrapped action group retains its own glass outline');
 wrapped.segments.forEach((segment,index)=>{
  const group=wrappedGroups[index];
  assert.equal(segment.height,group.height,'A one-row control does not inherit the height of the complete two-row pane');
  assert.equal(segment.width,group.width);
  assert.equal(segment.top,wrapped.top+group.top);
  assert.equal(segment.left,wrapped.left+group.left);
 });
}

// The glass must have one contour while attached and two only after pinching.
for(const metrics of [{main:252,context:120,gap:12,height:48,radius:24},{main:210,context:82,gap:8,height:48,radius:0}]){
 let width=metrics.main;
 for(let i=0;i<=200;i++){
  const shape=dockGeometry(i/200,metrics);
  assert(!/NaN|Infinity/.test(shape.path));
  assert(Math.abs(shape.width-width)<6,'The liquid outline changes continuously through stretching and settling');width=shape.width;
  assert(shape.neck>=0&&shape.neck<=metrics.height);
  if(shape.connected)assert.equal((shape.path.match(/M /g)||[]).length,1,'Attached lobes share a single perimeter');
 }
 const start=dockGeometry(0,metrics),middle=dockGeometry(.7,metrics),end=dockGeometry(1,metrics);
 assert.equal(start.width,metrics.main);assert.equal(start.reveal,0);
 assert(middle.connected&&middle.neck>0,'A fluid neck remains as the arrow section separates');
 assert.equal(end.width,metrics.main+metrics.context+metrics.gap);
 assert.equal(end.contextWidth,metrics.context);assert.equal(end.neck,0);
 assert.equal((end.path.match(/M /g)||[]).length,2);assert.equal(end.reveal,1);
}

let now=0,nextId=0,reduced=false;
const frames=new Map();
globalThis.performance={now:()=>now};
globalThis.requestAnimationFrame=callback=>{frames.set(++nextId,callback);return nextId;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.addEventListener=globalThis.removeEventListener=()=>{};
const element=()=>({style:{setProperty(key,value){this[key]=value;}},children:[],classList:{add(){},toggle(){}},setAttribute(){},append(...nodes){this.children.push(...nodes);},remove(){this.removed=true;}});
globalThis.document={createElement:element,createElementNS:element};
globalThis.getComputedStyle=()=>({getPropertyValue:()=>''});
const backControl=element(),context=element(),main=element(),legacy=element(),dock=element();dock.querySelector=selector=>selector==='.context-nav'?context:selector==='nav'?main:selector==='.dock-shapes'?legacy:selector==='#assistantBack'?backControl:null;dock.prepend=(...nodes)=>dock.children.unshift(...nodes);
const controller=new DockMorph(dock,{reduced:()=>reduced});
const initialComputedStyle=globalThis.getComputedStyle;
globalThis.getComputedStyle=()=>({height:'54px',getPropertyValue:name=>name==='--nav-height'?'calc(44px + 2 * 5px)':''});
controller.refresh();
assert.equal(controller.baseMetrics.height,54,'Glass uses the resolved CSS height instead of falling back when a height token contains calc()');
globalThis.getComputedStyle=initialComputedStyle;controller.refresh();
assert(legacy.removed,'Legacy static surfaces are removed rather than layered over the morph');
assert.deepEqual(controller.content.children,[context,main],'Visible controls belong to the shared morph layer');
assert.deepEqual(dock.children,[controller.glass,controller.content,controller.rim],'Rim is the foreground sibling');
const step=delay=>{now+=delay;const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(now));};
const finish=()=>{for(let i=0;frames.size&&i<200;i++)step(16);assert.equal(frames.size,0,'Settled navigation stops animation work');};
for(const delay of [32,96,192,304]){
 controller.setSplit(false,{immediate:true});controller.setSplit(true);for(let elapsed=0;elapsed<delay;elapsed+=16)step(16);
 assert.equal(controller.content.style.clipPath,controller.glass.style.clipPath,'Controls and their highlights stay inside the actual liquid silhouette');
 const position=controller.position,velocity=controller.velocity,width=dock.style.width;
 controller.setSplit(false);
 assert.equal(controller.position,position,'Escape does not reset the current shape');
 assert.equal(controller.velocity,velocity,'Escape preserves physical velocity');
 assert.equal(dock.style.width,width,'No width jump on reversal');
 finish();assert.equal(controller.position,0);assert(context.inert);
}
controller.setSplit(true);step(16);const before=controller.position;step(2000);
assert(controller.position-before<.3,'Stalled frames do not teleport to the final menu');
finish();assert.equal(controller.position,1);assert(!context.inert);
controller.setSplit(true);assert.equal(frames.size,0,'Next/previous projects keep the same settled menu');
controller.setSplit(false,{immediate:true});
controller.setComposer(true);for(let i=0;i<8;i++)step(16);
const composerWidth=Number.parseFloat(dock.style.width),composerPosition=controller.composerPosition,composerVelocity=controller.composerVelocity;
assert(composerWidth>controller.baseMetrics.main,'The same glass outline stretches into the composer.');
controller.setComposer(false);
assert.equal(controller.composerPosition,composerPosition,'Composer reversal preserves its current width.');
assert.equal(controller.composerVelocity,composerVelocity,'Composer reversal preserves its physical momentum.');
assert.equal(Number.parseFloat(dock.style.width),composerWidth,'Reversal does not jump the outline.');
finish();assert.equal(controller.composerPosition,0);
globalThis.innerWidth=500;controller.setSplit(true,{immediate:true});controller.setComposer(true,{immediate:true});
assert(Number.parseFloat(dock.style.width)<=globalThis.innerWidth,'The composer leaves room for project controls when both dock sections are visible.');
dock.dataset={separateSettings:'true'};globalThis.innerWidth=390;controller.setSplit(true,{immediate:true});controller.setComposer(true,{immediate:true});
assert(Number.parseFloat(dock.style.width)+controller.baseMetrics.height+10<=globalThis.innerWidth-32,'The composer and separate settings button fit together on mobile.');
controller.setBack(true,{immediate:true});controller.setSplit(false,{immediate:true});controller.setComposer(true,{immediate:true});
assert(Number.parseFloat(dock.style.width)+controller.baseMetrics.backWidth+10+controller.baseMetrics.height+10<=globalThis.innerWidth-32,'Chat reserves room for the wider Go Back pill and settings button');
globalThis.innerWidth=1024;controller.setBack(false,{immediate:true});controller.setSplit(false,{immediate:true});controller.setComposer(false,{immediate:true});
reduced=true;controller.setSplit(false);assert.equal(frames.size,0);assert.equal(controller.position,0);
context.getBoundingClientRect=()=>({width:88});
const previousComputed=globalThis.getComputedStyle;
globalThis.getComputedStyle=node=>node===context?{width:'88px'}:{getPropertyValue:name=>name==='--nav-context-width'?'calc(88px + 2 * 0px)':''};
controller.refresh();assert.equal(controller.baseMetrics.context,88,'Glass uses the resolved CSS control width, without a trailing fallback gap');
globalThis.getComputedStyle=previousComputed;
reduced=false;
for(const elapsed of [32,96,192,304]){
 controller.setBack(true);for(let t=0;t<elapsed;t+=16)step(16);
 const position=controller.backPosition,velocity=controller.backVelocity,width=dock.style.width,center=dock.style['--dock-center-offset'];
 controller.setBack(false);assert.equal(controller.backPosition,position);assert.equal(controller.backVelocity,velocity,'Back reversal preserves its liquid momentum');
 controller.setPopover(null);
 assert.equal(dock.style.width,width,'Repainting during a back reversal preserves the current menu width');
 assert.equal(dock.style['--dock-center-offset'],center,'Repainting during a back reversal preserves the current menu centre');
 finish();assert(backControl.hidden,'Back unmounts only after its merging glass settles');
}
for(const viewport of [390,1024]){
 globalThis.innerWidth=viewport;
 controller.setSplit(true,{immediate:true});controller.setComposer(true,{immediate:true});controller.setBack(true,{immediate:true});
 const startWidth=Number.parseFloat(dock.style.width),startCenter=Number.parseFloat(dock.style['--dock-center-offset']),startIcon=backControl.style.left;
 controller.setBack(false);controller.setSplit(false);controller.setComposer(true);controller.setPopover(null);
 assert.equal(Number.parseFloat(dock.style.width),startWidth,'Go back keeps the current width when route chrome is repainted');
 assert.equal(Number.parseFloat(dock.style['--dock-center-offset']),startCenter,'Go back does not switch the menu to its destination centre');
 assert.equal(backControl.style.left,startIcon,'The back icon retains its current position at the start of merging');
 let previousWidth=startWidth,previousCenter=startCenter;
 for(let i=0;frames.size&&i<200;i++){
  step(16);
  const width=Number.parseFloat(dock.style.width),center=Number.parseFloat(dock.style['--dock-center-offset']);
  assert(Math.abs(width-previousWidth)<20,`Both glass lobes merge continuously at ${viewport}px (${Math.abs(width-previousWidth)}px per frame)`);
  assert(Math.abs(center-previousCenter)<5,'Menu recentering moves smoothly through every merging frame');
  assert(center<=previousCenter+.000001,'A settled back button merges without a centre-position bounce');
  previousWidth=width;previousCenter=center;
 }
 assert.equal(frames.size,0);assert(backControl.hidden);
 assert.equal(controller.position,0,'Returning home merges the project controls into the main glass');
 assert.equal(context.style.visibility,'hidden');assert(context.inert,'Homepage arrows cannot receive focus');
 assert.equal(Number.parseFloat(dock.style['--dock-center-offset']),-(controller.baseMetrics.height+10)/2);
 assert.equal(Number.parseFloat(dock.style['--dock-back-space']),0);
 if(viewport===390)assert(Number.parseFloat(dock.style.width)>startWidth,'Space released by the back button expands the mobile composer during its motion');
}
for(const elapsed of [32,96,192,304]){
 controller.setBack(false,{immediate:true});controller.setSplit(false,{immediate:true});
 controller.setBack(true);controller.setSplit(true);
 for(let t=0;t<elapsed;t+=16)step(16);
 const width=dock.style.width,center=dock.style['--dock-center-offset'],split=controller.position,back=controller.backPosition;
 const splitVelocity=controller.velocity,backVelocity=controller.backVelocity;
 controller.setBack(false);controller.setSplit(false);controller.setPopover(null);
 assert.equal(dock.style.width,width,'Escape preserves the full dock width while both lobes reverse');
 assert.equal(dock.style['--dock-center-offset'],center,'Escape preserves the dock centre');
 assert.equal(controller.position,split);assert.equal(controller.backPosition,back);
 assert.equal(controller.velocity,splitVelocity);assert.equal(controller.backVelocity,backVelocity);
 finish();assert.equal(controller.position,0);assert.equal(controller.backPosition,0);
 assert(context.inert);assert(backControl.hidden);
}
controller.destroy();
console.log('Dock morph passed: continuous contour, neck separation, Escape at four phases, stalls, reduced motion and idle cleanup.');

for(const contextPhase of [0,.2,.6,1])for(const phase of [.1,.4,.7,.99,1]){
 const shape=dockGeometry(contextPhase),back=backGeometry(shape,phase);
 assert(!/NaN|Infinity|undefined/.test(back.path),'Back perimeter stays finite through simultaneous navigation morphs');
 if(back.connected)assert.equal((back.path.match(/M /g)||[]).length,(shape.path.match(/M /g)||[]).length,'Back grows as part of the existing outline while its neck is attached');
 else assert.equal((back.path.match(/M /g)||[]).length,(shape.path.match(/M /g)||[]).length+1,'Back separates into its own glass surface');
}

const wideGroups=dockGeometry(0,{main:520,context:88,gap:12,height:48,radius:24},{anchor:'main',position:1,left:0,width:520,height:48,gap:12,radius:24,split:1,splitAts:[.5],splitGaps:[180]});assert.equal(wideGroups.popover.segments.length,2);assert.equal(wideGroups.popover.segments[1].left-(wideGroups.popover.segments[0].left+wideGroups.popover.segments[0].width),180,'Split alignment leaves open space between independent glass controls');
