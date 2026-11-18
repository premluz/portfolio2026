// One drag feel for every carousel: the track follows the pointer 1:1, and a release coasts on the last
// sampled speed, decaying per 16 ms frame. Speeds are in pixels per 16 ms frame, as in the reference model.
export const dragMotion=Object.freeze({frame:16,decay:.95,flingSpeed:.5,stopSpeed:.2,clickSpeed:2,touchSlop:10,maxFrame:50,holdWindow:100});
export const sampleVelocity=(dx,elapsed)=>dx/Math.max(1,elapsed)*dragMotion.frame;
export const frameDelta=(now,previous)=>previous?Math.min(dragMotion.maxFrame,Math.max(0,now-previous)):dragMotion.frame;
// Travel is scaled by the frame length so a 120 Hz display coasts as far as a 60 Hz one.
export function coast(momentum,dt){
 const next=momentum*Math.pow(dragMotion.decay,dt/dragMotion.frame);
 return Math.abs(next)<dragMotion.stopSpeed?{momentum:0,travel:0}:{momentum:next,travel:next*dt/dragMotion.frame};
}
const now=event=>event.timeStamp||performance.now();

// Pointer input only. The owner moves its own track from onMove(dx) and coasts from onRelease(velocity).
// onPress runs on every press, before any slop, so a moving track can be caught; returning true marks that press
// as a catch, which never lands as a click. `axis` may be a function for owners that change orientation.
// Mouse drags start at once; touch waits for the slop and then locks to the larger axis, leaving
// predominantly vertical swipes to the page (the node keeps touch-action: pan-y).
export class CarouselDrag{
 constructor(node,{canStart=()=>true,onPress=()=>false,onStart=()=>{},onMove=()=>{},onRelease=()=>{},axis='horizontal'}={}){
  Object.assign(this,{node,canStart,onPress,onStart,onMove,onRelease,axis,drag:null,velocity:0,suppress:false});
  this.handlers={pointerdown:e=>this.down(e),pointermove:e=>this.move(e),pointerup:e=>this.up(e,false),pointercancel:e=>this.up(e,true),lostpointercapture:e=>this.up(e,false),dragstart:e=>e.preventDefault()};
  for(const [type,fn] of Object.entries(this.handlers))node.addEventListener(type,fn);
  this.onClick=e=>{if(!this.suppress)return;this.suppress=false;e.preventDefault();e.stopImmediatePropagation?.();e.stopPropagation();};
  node.addEventListener('click',this.onClick,true);
  // A release the node never hears (context menu, window switch) must still end the drag.
  this.onBlur=()=>this.cancel();globalThis.addEventListener?.('blur',this.onBlur);
 }
 get active(){return !!this.drag?.locked;}
 point(e){return (typeof this.axis==='function'?this.axis():this.axis)==='vertical'?{main:e.clientY,cross:e.clientX}:{main:e.clientX,cross:e.clientY};}
 down(e){
  if(e.isPrimary===false){if(this.drag)this.up({pointerId:this.drag.id},true);return;}
  if(this.drag||e.button!==0||!this.canStart(e))return;
  const {main,cross}=this.point(e),mouse=e.pointerType==='mouse';
  if(mouse)e.preventDefault();
  this.velocity=0;this.suppress=false;
  this.drag={id:e.pointerId,mouse,start:main,cross,last:main,time:now(e),locked:false,caught:!!this.onPress(e)};
  if(mouse)this.lock(e);
 }
 lock(e){this.drag.locked=true;this.node.setPointerCapture?.(this.drag.id);this.node.classList.add('is-dragging');this.onStart(e);}
 move(e){
  const drag=this.drag;if(!drag||e.pointerId!==drag.id)return;
  // The button is already up, so the pointerup was lost: release here, keeping the throw.
  if(drag.mouse&&e.buttons!==undefined&&!(e.buttons&1)){this.up(e,false);return;}
  const {main,cross}=this.point(e);
  if(!drag.locked){
   const dx=main-drag.start,dy=cross-drag.cross;
   if(Math.hypot(dx,dy)<dragMotion.touchSlop)return;
   if(Math.abs(dy)>=Math.abs(dx)){this.drag=null;return;}
   this.lock(e);
  }
  e.preventDefault();
  const time=now(e);this.velocity=sampleVelocity(main-drag.last,time-drag.time);drag.last=main;drag.time=time;
  this.onMove(main-drag.start,e);
 }
 up(e,cancelled){
  const drag=this.drag;if(!drag||e.pointerId!==drag.id)return;this.drag=null;
  if(!drag.locked){this.suppress=drag.caught&&!cancelled;if(drag.caught)this.onRelease(0,true);return;}
  if(this.node.hasPointerCapture?.(drag.id))this.node.releasePointerCapture(drag.id);
  this.node.classList.remove('is-dragging');
  // A pointer held still before release has no speed left to carry.
  if(cancelled||now(e)-drag.time>dragMotion.holdWindow)this.velocity=0;
  // A fling, or any real drag, must not land as a click on whatever card ends up under the pointer.
  this.suppress=drag.caught||Math.abs(this.velocity)>dragMotion.clickSpeed||Math.abs(drag.last-drag.start)>=dragMotion.touchSlop;
  this.onRelease(Math.abs(this.velocity)>dragMotion.flingSpeed?this.velocity:0,cancelled);
 }
 cancel(){if(this.drag)this.up({pointerId:this.drag.id,timeStamp:now({})},true);}
 destroy(){this.cancel();for(const [type,fn] of Object.entries(this.handlers))this.node.removeEventListener(type,fn);this.node.removeEventListener('click',this.onClick,true);globalThis.removeEventListener?.('blur',this.onBlur);}
}
