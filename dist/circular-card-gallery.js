// Placement adapter for shared gallery cards. No cloned images, sliced tiles,
// WebGL textures or idle animation: only a short transform loop while moving.
import {defaultCarouselSettings} from './carousel-settings.js';
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
  this.gallery=gallery;this.root=gallery.root;this.viewport=gallery.viewport;this.items=gallery.items;this.angle=0;this.frame=0;
  this.onWheel=event=>{if(Math.abs(event.deltaX)<=Math.abs(event.deltaY)||!event.deltaX)return;event.preventDefault();this.target=null;this.requestedIndex=null;this.angle-=event.deltaX/this.dragRadius;this.paint();clearTimeout(this.wheelTimer);this.wheelTimer=setTimeout(()=>this.snap(),120);};
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
  const target=this.angle+wrapAngle(-this.angles[index]-this.angle);
  this.requestedIndex=index;
  if(!smooth||this.gallery.reduced()){this.target=null;this.angle=target;this.paint();return;}
  this.target=target;this.wake();
 }
 nearest(){let best=0,distance=Infinity;this.angles.forEach((angle,index)=>{const d=Math.abs(wrapAngle(angle+this.angle));if(d<distance){best=index;distance=d;}});return best;}
 snap(){this.go(this.nearest());}
 async prepareOpen(index,control,duration){
  cancelAnimationFrame(this.frame);this.frame=0;this.target=null;
  const start=this.angle,target=start+wrapAngle(-this.angles[index]-start);
  if(Math.abs(target-start)<.0005){this.angle=target;this.paint();return;}
  control.synchronize(Math.min(160,duration*.3));
  await new Promise(resolve=>{const frame=now=>{const p=control.advance(now),eased=p*p*(3-2*p);this.angle=start+(target-start)*eased;this.paint();if(!control.timeline.finished)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  this.requestedIndex=this.nearest();
 }
 drag(delta){this.target=null;this.requestedIndex=null;this.angle=this.pressAngle+delta/this.dragRadius;this.paint();}
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
 wake(){if(this.dead||this.frame)return;this.frame=requestAnimationFrame(now=>{this.frame=0;const dt=this.last?Math.min(40,Math.max(1,now-this.last)):16;this.last=now;
   if(this.target!==null&&this.target!==undefined){const delta=this.target-this.angle;this.angle+=delta*(1-Math.exp(-dt/(95*100/this.gallery.arcSettings.speed)));if(Math.abs(delta)<.0005){this.angle=this.target;this.target=null;}}
   this.paint();if(this.target!==null&&this.target!==undefined)this.wake();else this.last=0;
  });}
 destroy(){this.dead=true;cancelAnimationFrame(this.frame);clearTimeout(this.wheelTimer);this.viewport.removeEventListener('wheel',this.onWheel);for(const item of this.items){item.style.transform='';item.style.zIndex='';item.style.visibility='';item.style.pointerEvents='';delete item.dataset.galleryFront;}}
}
