// Placement adapter for shared gallery cards. No cloned images, sliced tiles,
// WebGL textures or idle animation: only a short transform loop while moving.
import {defaultCarouselSettings} from './carousel-settings.js';
import {CarouselMomentum,carouselMotion} from './carousel-momentum.js';
const tau=Math.PI*2;
const arcSpread=.46;
export const wrapAngle=value=>((value+Math.PI)%tau+tau)%tau-Math.PI;
export function circularGeometry(widths,gap=32){
 const sizes=widths.map(width=>Math.max(1,Number(width)||1));
 const circumference=sizes.reduce((sum,width)=>sum+width+gap,0),radius=Math.max(1,circumference/tau);
 let distance=0;
 const angles=sizes.map((width,index)=>{if(index)distance+=(sizes[index-1]+width)/2+gap;return distance/radius;});
 return {radius,angles};
}
export function circularPose(angle,radius){
 const world=wrapAngle(angle),facing=Math.cos(world),depth=(1-facing)/2;
 const front=facing>0;
 return {x:Math.sin(world)*radius,y:-depth*32,z:(facing-1)*radius,angle:world*180/Math.PI,opacity:front?1-.78*depth:0,front,order:Math.round((facing+1)*100)};
}
export function circularArcPose(angle,radius,settings=defaultCarouselSettings){
 // Navigation wraps around a logical ring, while presentation uses only a
 // wide front arc. The seam fades beyond the viewport, never showing backs.
 const world=wrapAngle(angle),distance=Math.abs(world)/Math.PI;
 const fade=Math.max(0,Math.min(1,(1-distance)/.18)),seam=fade*fade*(3-2*fade);
 // A shallow tilt is independent of horizontal travel. Far cards keep moving
 // beyond either screen edge instead of turning almost edge-on in view.
 const pose=circularPose(Math.sin(world/2)*settings.tilt*Math.PI/180,radius);
 return {...pose,x:world*arcSpread*radius*settings.spread/100,y:pose.y*settings.depth/100||0,z:pose.z*settings.depth/100||0,opacity:pose.opacity*seam,front:pose.front&&seam>.001};
}
const faceSize=face=>typeof face==='number'?{size:Math.max(1,face),offset:0}:{size:Math.max(1,face?.size||1),offset:face?.offset||0};
export function projectedCardBounds(pose,face,perspective=1800){
 const {size,offset}=faceSize(face),angle=pose.angle*Math.PI/180,sin=Math.sin(angle),cos=Math.cos(angle),near=offset-size/2,far=offset+size/2;
 const leftScale=perspective/(perspective-pose.z+near*sin),rightScale=perspective/(perspective-pose.z+far*sin);
 return {left:(pose.x+near*cos)*leftScale,right:(pose.x+far*cos)*rightScale,leftScale,rightScale};
}
export function circularArcLayout(angles,radius,faces,{viewportWidth=0,compact=false,settings=defaultCarouselSettings,gap=settings.gap}={}){
 // Rotation and depth retain the front arc. Only horizontal placement spreads
 // when projected faces would collide, so mixed aspect ratios keep their gaps.
 // Anchor between the two faces crossing the centre; changing selection never
 // switches an anchor abruptly. Cached face measurements avoid layout reads.
 const entries=angles.map((angle,index)=>({index,world:wrapAngle(angle),pose:circularArcPose(angle,radius,settings),face:faceSize(faces[index])})).sort((a,b)=>a.world-b.world);
 if(entries.length<2)return entries.map(entry=>entry.pose);
 const target=Math.max(1,viewportWidth/2-settings.peek),mobileGap=(entry,direction)=>Math.max(8,target-entry.face.size/2-direction*entry.face.offset),outerGap=compact?Math.max(8,gap/2):gap;
 let left=-1;for(let index=0;index<entries.length;index++)if(entries[index].world<=0)left=index;
 let right=left+1,t=0;
 const bounds=entry=>projectedCardBounds(entry.pose,entry.face);
 if(left>=0&&right<entries.length){
  const a=entries[left],b=entries[right],aBounds=bounds(a),bBounds=bounds(b);
  t=-a.world/(b.world-a.world);
  const spacing=compact?mobileGap(a,1)*(1-t)+mobileGap(b,-1)*t:gap;
  let shift=(spacing-bBounds.left+aBounds.right)/(aBounds.rightScale*t+bBounds.leftScale*(1-t));
  if(!compact)shift=Math.max(0,shift);
  a.pose.x-=t*shift;b.pose.x+=(1-t)*shift;
 }else{
  const anchor=entries.reduce((best,entry,index)=>Math.abs(entry.world)<Math.abs(entries[best].world)?index:best,0);
  left=right=anchor;
 }
 for(let index=left-1;index>=0;index--){
  const entry=entries[index],inner=entries[index+1],edge=bounds(entry),innerEdge=bounds(inner);
  const spacing=compact&&index===left-1?outerGap+(mobileGap(inner,-1)-outerGap)*(1-t):outerGap;
  let shift=(innerEdge.left-spacing-edge.right)/edge.rightScale;
  if(!compact)shift=Math.min(0,shift);entry.pose.x+=shift;
 }
 for(let index=right+1;index<entries.length;index++){
  const entry=entries[index],inner=entries[index-1],edge=bounds(entry),innerEdge=bounds(inner);
  const spacing=compact&&index===right+1?outerGap+(mobileGap(inner,1)-outerGap)*t:outerGap;
  let shift=(innerEdge.right+spacing-edge.left)/edge.leftScale;
  if(!compact)shift=Math.max(0,shift);entry.pose.x+=shift;
 }
 const poses=[];entries.forEach(entry=>poses[entry.index]=entry.pose);return poses;
}
export class CircularCardPlacement{
 constructor(gallery){
  this.gallery=gallery;this.root=gallery.root;this.viewport=gallery.viewport;this.items=gallery.items;this.angle=0;this.frame=0;this.momentum=new CarouselMomentum();
  this.onWheel=event=>{
   if(Math.abs(event.deltaX)<=Math.abs(event.deltaY)||!event.deltaX)return;event.preventDefault();
   // The ring eases after the scrolled position; when scrolling stops, what is left of that motion is
   // reshaped to come to rest on a card, so the snap is the end of the scroll, not a second movement.
   if(!this.wheeling){this.momentum.stop();this.target=null;this.coast=null;this.spring=null;this.requestedIndex=null;this.raw=this.angle;this.wheeling=true;}
   this.raw-=event.deltaX/this.dragRadius;
   if(this.gallery.reduced()){this.angle=this.raw;this.paint();}else this.wake();
   clearTimeout(this.wheelTimer);this.wheelTimer=setTimeout(()=>{this.wheeling=false;this.coastTo(this.raw,this.gallery.reduced()?0:(this.raw-this.angle)/carouselMotion.wheelFollow);},carouselMotion.wheelIdle);
  };
  this.viewport.addEventListener('wheel',this.onWheel,{passive:false});this.measure();this.go(gallery.index,false);
 }
 measure(){
  const vertical=this.gallery.axis==='vertical',compact=!vertical&&this.viewport.clientWidth<=600,sizes=this.items.map(item=>vertical?item.offsetHeight:item.offsetWidth),gap=this.gallery.arcSettings.gap,geometry=circularGeometry(sizes,compact?gap+16:gap);
  this.angles=geometry.angles;
  this.compact=compact;this.extent=vertical?this.viewport.clientHeight:this.viewport.clientWidth;
  this.faces=this.items.map((item,index)=>{const bounds=this.gallery.extrusions?.[index]?.bounds;return bounds?{size:vertical?bounds.height:bounds.width,offset:(vertical?bounds.top+bounds.height/2:bounds.left+bounds.width/2)-sizes[index]/2}:{size:sizes[index],offset:0};});
  // Use the full canvas as the perimeter instead of fitting a compact ring
  // inside its middle. Image/card sizes stay unchanged at the front.
  this.radius=this.extent*.68;
  this.dragRadius=Math.max(100,geometry.radius);
 }
 go(index,smooth=true){
  if(!this.items.length)return;index=((index%this.items.length)+this.items.length)%this.items.length;
  this.momentum.stop();clearTimeout(this.wheelTimer);this.wheeling=false;this.spring=null;this.coast=null;
  const target=this.angle+wrapAngle(-this.angles[index]-this.angle);
  this.requestedIndex=index;
  if(!smooth||this.gallery.reduced()){this.target=null;this.angle=target;this.paint();return;}
  this.target=target;this.wake();
 }
 nearest(){let best=0,distance=Infinity;this.angles.forEach((angle,index)=>{const d=Math.abs(wrapAngle(angle+this.angle));if(d<distance){best=index;distance=d;}});return best;}
 // Settling onto the nearest card is a critically damped spring, not the arrows' ease: it carries on from
 // the speed the ring already has (0 after a scroll pauses), so it eases in and out instead of jumping.
 // From rest (a drag held still), settling is a soft critically damped spring onto the nearest card.
 snap(){
  this.go(this.nearest(),!this.gallery.reduced());
  if(this.target!==null&&this.target!==undefined)this.spring={velocity:0};
 }
 /**
  * A moving ring coasts on and comes to rest exactly on a card, in one motion: the card nearest to where
  * `projected` says it would stop, never one behind it, reached by an exponential slowdown that leaves at
  * the current `velocity` (rad/ms). It never passes the card and never comes back.
  */
 coastTo(projected,velocity){
  const direction=Math.abs(velocity*this.dragRadius)>=carouselMotion.stopSpeed?Math.sign(velocity):0;
  if(!direction){this.snap();return;}
  const rest=angle=>projected+wrapAngle(-angle-projected);
  let index=0;this.angles.forEach((angle,i)=>{if(Math.abs(rest(angle)-projected)<Math.abs(rest(this.angles[index])-projected))index=i;});
  let target=rest(this.angles[index]);
  if((target-this.angle)*direction<=0){
   let best=Infinity;this.angles.forEach((angle,i)=>{const ahead=((wrapAngle(-angle-this.angle)*direction)+tau)%tau;if(ahead>0&&ahead<best){best=ahead;index=i;}});
   target=this.angle+best*direction;
  }
  this.go(index,!this.gallery.reduced());if(this.target===null||this.target===undefined)return;
  this.target=target;this.coast={tau:Math.max(carouselMotion.coastMin,Math.min(carouselMotion.coastMax,(target-this.angle)/velocity))};
 }
 async prepareOpen(index,control,duration){
  cancelAnimationFrame(this.frame);this.frame=0;this.target=null;this.momentum.stop();clearTimeout(this.wheelTimer);this.wheeling=false;this.coast=null;this.spring=null;
  const start=this.angle,target=start+wrapAngle(-this.angles[index]-start);
  if(Math.abs(target-start)<.0005){this.angle=target;this.paint();return;}
  control.synchronize(Math.min(160,duration*.3));
  await new Promise(resolve=>{const frame=now=>{const p=control.advance(now),eased=p*p*(3-2*p);this.angle=start+(target-start)*eased;this.paint();if(!control.timeline.finished)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  this.requestedIndex=this.nearest();
 }
 beginDrag(time){
  const moving=this.wheeling||this.target!==null&&this.target!==undefined;
  cancelAnimationFrame(this.frame);clearTimeout(this.wheelTimer);this.wheeling=false;this.coast=null;this.spring=null;this.frame=0;this.last=0;this.target=null;this.requestedIndex=null;this.pressAngle=this.angle;
  // Match pointer travel to the visible arc, including mixed card widths.
  const index=this.nearest(),step=carouselMotion.derivativeStep,options={viewportWidth:this.extent,compact:this.compact,settings:this.gallery.arcSettings};
  const before=circularArcLayout(this.angles.map(angle=>angle+this.angle-step),this.radius,this.faces,options)[index];
  const after=circularArcLayout(this.angles.map(angle=>angle+this.angle+step),this.radius,this.faces,options)[index];
  this.dragRadius=Math.max(1,Math.abs(after.x-before.x)/(2*step));
  this.momentum.begin(this.angle,time);return moving;
 }
 drag(delta,time){this.target=null;this.requestedIndex=null;this.angle=this.pressAngle+delta/this.dragRadius;this.momentum.track(this.angle,time);this.wake();}
 release(time,cancelled=false){
  if(cancelled||this.gallery.reduced())this.momentum.stop();else this.momentum.release(time,this.dragRadius);
  const velocity=this.momentum.velocity;this.momentum.stop();this.last=time;
  if(velocity)this.coastTo(this.angle+velocity*carouselMotion.decay,velocity);else this.snap();
 }
 paint(){
  if(this.dead)return;const vertical=this.gallery.axis==='vertical';
  const poses=circularArcLayout(this.angles.map(angle=>angle+this.angle),this.radius,this.faces,{viewportWidth:this.extent,compact:this.compact,settings:this.gallery.arcSettings});
  this.items.forEach((item,index)=>{const pose=poses[index],x=vertical?pose.y:pose.x,y=vertical?pose.x:pose.y;
   item.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,${pose.z}px) rotate${vertical?'X':'Y'}(${vertical?-pose.angle:pose.angle}deg)`;
   item.style.zIndex=String(pose.order);item.style.visibility=pose.front?'visible':'hidden';item.style.pointerEvents=pose.front?'':'none';this.gallery.paintOpacity(item,pose.opacity);item.dataset.galleryFront=String(pose.front);
   this.gallery.extrusions?.[index]?.paint(vertical?-pose.angle:pose.angle,this.gallery.axis,this.gallery.reduced(),pose.opacity);
  });
  this.gallery.updateSelection(this.nearest());
 }
 settleSpring(dt){
  const omega=1/carouselMotion.snapTime,spring=this.spring;
  for(let left=dt;left>0;left-=carouselMotion.snapStep){const h=Math.min(carouselMotion.snapStep,left);spring.velocity+=(-omega*omega*(this.angle-this.target)-2*omega*spring.velocity)*h;this.angle+=spring.velocity*h;}
  if(Math.abs(this.target-this.angle)*this.dragRadius<carouselMotion.settlePixels&&Math.abs(spring.velocity*this.dragRadius)*16<carouselMotion.settlePixels){this.angle=this.target;this.target=null;this.spring=null;}
 }
 wake(){if(this.dead||this.frame)return;this.frame=requestAnimationFrame(now=>{this.frame=0;const dt=this.last?Math.min(40,Math.max(1,now-this.last)):16;this.last=now;
   if(this.wheeling)this.angle+=(this.raw-this.angle)*(1-Math.exp(-dt/carouselMotion.wheelFollow));
   else if(this.coast&&this.target!==null&&this.target!==undefined){this.angle+=(this.target-this.angle)*(1-Math.exp(-dt/this.coast.tau));if(Math.abs(this.target-this.angle)*this.dragRadius<carouselMotion.settlePixels){this.angle=this.target;this.target=null;this.coast=null;}}
   else if(this.spring&&this.target!==null&&this.target!==undefined)this.settleSpring(dt);
   else if(this.target!==null&&this.target!==undefined){const delta=this.target-this.angle;this.angle+=delta*(1-Math.exp(-dt/(95*100/this.gallery.arcSettings.speed)));if(Math.abs(delta)<.0005){this.angle=this.target;this.target=null;}}
   this.paint();if(this.wheeling||this.target!==null&&this.target!==undefined)this.wake();else this.last=0;
  });}
 destroy(){this.dead=true;this.momentum.stop();cancelAnimationFrame(this.frame);clearTimeout(this.wheelTimer);this.viewport.removeEventListener('wheel',this.onWheel);for(const item of this.items){item.style.transform='';item.style.zIndex='';item.style.visibility='';item.style.pointerEvents='';delete item.dataset.galleryFront;}}
}
