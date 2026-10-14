import assert from 'node:assert/strict';
import {AmbientLightMotion,AmbientLight,blendAmbientPalette,ambientDeformation} from '../dist/ambient-light.js';
import {EdgeSpring,materialSettings,springParameters} from '../dist/material-settings.js';
import {morphProgress} from '../dist/transition-control.js';

const a={left:0,top:0,width:300,height:200},b={left:800,top:200,width:600,height:300};
const blue={a:[.82,.055,350],b:[.82,.055,40]},green={a:[.82,.055,10],b:[.82,.055,100]};
const motion=new AmbientLightMotion();motion.aim(a,blue,1);
for(let i=0;i<120;i++)motion.step();
motion.aim(b,green,1);
const initial=motion.rect;let peak=0,frames=0;
for(;frames<180;frames++){
 const moving=motion.step();peak=Math.max(peak,motion.rect.left);
 assert.equal(motion.opacity,1,'Travelling and colour blending never restart the opacity fade');
 if(frames===5)assert(motion.rect.left>morphProgress(6/24)*800,'The aura leads a 400ms card opening');
 const hueTravel=((motion.palette.a[2]-350)%360+360)%360;
 assert(hueTravel>=0&&hueTravel<=20,'Hue travels across the shortest arc without a contrasting flash');
 if(!moving)break;
}
assert(peak>800&&peak<960,'The aura has a bounded, soft bounce');
assert(frames<180,'Spring and colour blending stop at rest');
assert.deepEqual(motion.rect,b);assert.notDeepEqual(initial,b);
motion.aim(a,blue,1);motion.step();const before=motion.rect,velocity=motion.axes.x.velocity;
motion.aim(b,green,1);
assert.deepEqual(motion.rect,before,'Changing targets preserves the current position');
assert.equal(motion.axes.x.velocity,velocity,'Changing targets preserves momentum');
motion.step(1,true);assert.deepEqual(motion.rect,b);assert.equal(motion.axes.x.velocity,0);
assert.equal(blendAmbientPalette(blue,green,.5).a[2],360);
const reference=new EdgeSpring(),{k,damper}=springParameters(materialSettings);
reference.position=150;reference.step(1100,k,damper*.88);
const physical=new AmbientLightMotion();physical.aim(a,blue);physical.aim(b,green);physical.step(1,false,{intensity:1,settings:{...materialSettings,lag:0}});
assert.equal(physical.axes.x.position,reference.position,'Ambient motion uses the card spring implementation and settings');

function journey(options,frames=12){
 const motion=new AmbientLightMotion();motion.aim(a,blue,1);motion.step(1,true);motion.aim(b,green,1);
 let peak=0;for(let i=0;i<frames;i++){motion.step(1,false,options);peak=Math.max(peak,motion.axes.x.position);}
 return {motion,peak};
}
const fastHover=journey({context:'hover',hoverSpeed:100}),slowHover=journey({context:'hover',hoverSpeed:40});
assert(fastHover.motion.rect.left>slowHover.motion.rect.left+150,'Hover speed changes travel speed rather than just changing opacity');
assert(fastHover.motion.palette.a[2]>slowHover.motion.palette.a[2],'Colour travel follows the hover speed');
assert.equal(fastHover.motion.opacity,slowHover.motion.opacity,'Hover speed preserves the existing fade envelope');
const route=journey({duration:400,hoverSpeed:20}),routeWithFastHover=journey({duration:400,hoverSpeed:150});
assert.deepEqual(route.motion.rect,routeWithFastHover.motion.rect,'Hover speed does not alter detail motion');
assert.deepEqual(route.motion.palette,routeWithFastHover.motion.palette,'Hover speed does not alter route colour timing');
const slowRoute=journey({duration:1000}),longSlowRoute=journey({duration:1000},30);
assert(slowRoute.motion.rect.left<route.motion.rect.left-200,'Duration and Slow motion slow the aura alongside the card');
assert(Math.abs(longSlowRoute.motion.rect.left-route.motion.rect.left)<80,'The spring clock scales with route duration');
for(const options of [{intensity:0},{settings:{...materialSettings,overshoot:0}}]){
 const {motion,peak}=journey(options,240);
 assert(peak<=1100.001,'Zero liquid intensity or overshoot removes the spatial bounce');
 assert.deepEqual(motion.rect,b);
}
const noStretch=ambientDeformation(100,80,{settings:{...materialSettings,stretch:0,lag:0}});
assert.deepEqual(noStretch,{driftX:0,driftY:0,stretchX:1.16,stretchY:1.04},'Stretch and lag controls disable the respective motion deformation');
assert.deepEqual(ambientDeformation(100,80,{intensity:0}),noStretch,'Zero intensity keeps only the resting atmospheric footprint');
const short=journey({duration:100},180);assert.deepEqual(short.motion.rect,b,'The fastest transition remains stable and settles');

// Exercise the actual field ownership across hover, navigation and drag.
// Test DOM keeps real parent/child ownership, so a copied or lost field fails.
class Node {
 constructor({rect={left:0,top:0,width:0,height:0},project=false,persistent=false,hues=[350,40],image=null}={}){
  Object.assign(this,{rect,project,persistent,hues,image,children:[],dataset:{},hovered:false});
  this.style={setProperty(key,value){this[key]=value;}};
 }
 get isConnected(){return this===body||!!this.parentNode?.isConnected;}
 append(node){node.remove();this.children.push(node);node.parentNode=this;}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(node=>node!==this);this.parentNode=null;}}
 setAttribute(){}
 getBoundingClientRect(){return this.rect;}
 querySelector(selector){return selector==='.detail'?this.detail:selector==='.visual img'||selector==='.visual'?this.image:null;}
 hasAttribute(name){return name==='data-hover-persistent'&&this.persistent;}
 matches(selector){return this.project&&(selector==='.project-card'||this.hovered);}
}
const body=new Node(),root={dataset:{theme:'light'}};
let clock=0,id=0;const callbacks=new Map();
globalThis.document={body,documentElement:root,createElement:()=>new Node()};
globalThis.addEventListener=()=>{};
globalThis.requestAnimationFrame=callback=>{callbacks.set(++id,callback);return id;};
globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
globalThis.getComputedStyle=host=>({getPropertyValue:key=>key==='--project-hue-start'?String(host.hues[0]):key==='--project-hue-end'?String(host.hues[1]):''});
const pump=(max=180)=>{for(let i=0;i<max&&callbacks.size;i++){clock+=16.667;const batch=[...callbacks.values()];callbacks.clear();batch.forEach(callback=>callback(clock));}};
const cardA=new Node({rect:a,project:true,image:new Node({rect:a})}),cardB=new Node({rect:b,project:true,hues:[10,100],image:new Node({rect:b})});
body.append(cardA);body.append(cardB);
let controls={duration:800,intensity:.7,hoverSpeed:60};
const light=new AmbientLight({controls:()=>controls});light.setEnabled(true);
const effectA=light.register(cardA,new Node()),effectB=light.register(cardB,new Node());
effectA.setActive(true);assert.equal(light.field.style.opacity,'0','The initial field cannot flash at full strength before its first display tick');pump();const field=light.field;
assert.equal(field.parentNode,cardA);assert.equal(light.frame,0,'A settled hovered aura does not run an idle frame loop');
effectA.setActive(false);const priorRect=light.motion.rect;
effectB.setActive(true);
assert.equal(light.field,field);assert.equal(field.parentNode,cardB);
assert.deepEqual(light.motion.rect,priorRect,'Hovering another image does not teleport the field');
assert.equal(light.motion.targetOpacity,1,'Hover transfer cancels the previous card leave fade');
pump();assert.deepEqual(light.motion.rect,b);
// Rapid scroll and elastic return must not look like card movement to the aura.
const localTop=parseFloat(field.style['--ambient-top']);
for(const scroll of [800,1900,2100,2000,2120,2000,500,0,-90,0]){
 globalThis.scrollY=scroll;cardB.rect={...b,top:b.top-scroll};cardB.image.rect=cardB.rect;
 light.scroll();pump(1);
 assert.equal(parseFloat(field.style['--ambient-top']),localTop,'Scrolling keeps aura placement fixed within the card');
 assert.equal(light.motion.axes.y.velocity,0,'Native and elastic scroll never inject spring motion');
 pump();assert.equal(callbacks.size,0,'There is no self-sustaining scroll/spring loop');
}
const liveMotion=new AmbientLightMotion();liveMotion.aim(a,blue);liveMotion.aim(b,green);liveMotion.step();
const beforeRebase=liveMotion.rect,liveVelocity=liveMotion.axes.y.velocity,targetOffset=liveMotion.target.y-liveMotion.axes.y.position;
liveMotion.rebase(-40,-1200);
assert.equal(liveMotion.rect.top,beforeRebase.top-1200);assert.equal(liveMotion.axes.y.velocity,liveVelocity);assert(Math.abs(liveMotion.target.y-liveMotion.axes.y.position-targetOffset)<1e-9,'A rebase preserves an intentional in-flight spring');
light.motion.targetOpacity=0;light.refresh();
assert.equal(light.motion.targetOpacity,0,'Scroll or image resize cannot revive a light that is leaving');
effectB.setActive(true);pump();

light.hold(cardB);assert.equal(field.parentNode,light.stage);
const detail=new Node({rect:b,persistent:true,hues:[160,190],image:new Node({rect:b})});body.append(detail);
const detailEffect=light.register(detail,new Node());detailEffect.setActive(true);
assert.equal(field.parentNode,light.stage,'Rendering the receiving page does not steal the moving field');
const shell=new Node({rect:{left:30,top:20,width:1200,height:700}});body.append(shell);
const travel=light.beginMorph(shell,{image:{rect:b},element:cardB},detail);
assert.equal(field.parentNode,shell);assert.equal(callbacks.size,0,'Morph display ticks replace the hover RAF instead of racing it');
assert.equal(light.context,'route','Morph switches from hover timing to shared card timing');
for(let i=0;i<8;i++)travel.frame(clock+=16.667,1,shell.rect);
for(let i=0;i<18;i++)travel.frame(clock+=16.667,-1,shell.rect);
assert(Math.abs(parseFloat(field.style['--ambient-left'])+shell.rect.left-light.motion.rect.left)<.001,'The field uses this frame’s shell origin, without inheriting its translation');
const reversedRect=light.motion.rect;cardB.hovered=true;travel.handoff(cardB);
assert.deepEqual(light.motion.rect,reversedRect,'Escape reparents the same field without jumping its springs');
assert.equal(light.context,'route','Handoff keeps route timing through the remaining settle');
shell.remove();pump();assert.deepEqual(light.motion.rect,b);assert.equal(field.parentNode,cardB);assert(field.isConnected);

light.hold(cardB);light.beginSlide(detail);pump(20);
const slidingRect=light.motion.rect;light.finishNavigation(detail);
assert.deepEqual(light.motion.rect,slidingRect,'Slide completion keeps the independent aura pose');pump();
assert.equal(light.motion.opacity,1);assert.equal(field.parentNode,detail);
controls={...controls,intensity:0};light.hold(detail);light.beginSlide(detail,1);
assert.equal(light.motion.axes.x.velocity,0,'Zero intensity removes the arrow impulse as well as deformation');
light.finishNavigation(detail);pump();controls={...controls,intensity:.7};
const next=new Node({rect:b,persistent:true,hues:[250,280],image:new Node({rect:b})});body.append(next);
const layers=[{side:0,node:{querySelector:()=>detail}},{side:1,node:{querySelector:()=>next}},{side:-1,node:{querySelector:()=>next}}];
light.hold(detail);light.beginDrag(layers);light.drag({layers,offset:-240,distance:1000});pump(10);
assert(light.motion.palette.a[2]>160&&light.motion.palette.a[2]<250,'Drag blends toward the neighbouring project colour before release');
light.finishNavigation(next);pump();assert.equal(field.parentNode,next);assert.equal(light.field,field);
const fields=node=>(node.className?.includes('ambient-light-field')?1:0)+node.children.reduce((n,child)=>n+fields(child),0);
assert.equal(fields(body),1,'Hover, morph, reversal, slide and drag share exactly one aura');
light.setEnabled(false);assert.equal(fields(body),0);assert.equal(callbacks.size,0,'Switching movement off removes the shared field and its work');
effectA.destroy();effectB.destroy();detailEffect.destroy();
console.log('Ambient light passed: shared card timing/physics, separate hover speed, colour continuity, bounded bounce, one field across hover/routes/drag, Escape handoff, reduced motion and idle cleanup.');
