import {escapeText} from './content/html.js';
export const cardRailControlsMarkup=({label='cards'}={})=>`<div class="card-rail-controls"><button class="glass-surface" type="button" data-card-rail-previous aria-label="Previous ${escapeText(label)}" data-tooltip="Previous ${escapeText(label)}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14.5 5-7 7 7 7"/></svg></button><button class="glass-surface" type="button" data-card-rail-next aria-label="Next ${escapeText(label)}" data-tooltip="Next ${escapeText(label)}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9.5 5 7 7-7 7"/></svg></button></div>`;

// A wheel gesture (trackpad or Magic Mouse momentum included) has ended once no wheel event arrives for this long.
const WHEEL_GESTURE_IDLE_MS=140;
// Below this travel a swipe is treated as a nudge and settles on the nearest card rather than the next one.
const WHEEL_NUDGE_PX=24;
// Browsers without scrollend restore native snapping after this long, by which time a smooth settle has finished.
const SETTLE_FALLBACK_MS=700;
// A mouse press becomes a drag after this much travel, so a plain click on a card is left alone.
const DRAG_START_PX=6;

// A flat carousel controller independent of page layout and card contents.
export class CardRail{
 constructor(root,{reduced=()=>false}={}){
  this.root=root;this.reduced=reduced;this.viewport=root.querySelector('[data-card-rail-viewport]');this.previous=root.querySelector('[data-card-rail-previous]');this.next=root.querySelector('[data-card-rail-next]');
  this.onPrevious=()=>this.move(-1);this.onNext=()=>this.move(1);this.onScroll=()=>this.refresh();this.onWheel=event=>this.wheel(event);this.onSettled=()=>this.release();this.onDown=event=>this.down(event);this.onDrag=event=>this.drag(event);this.onDrop=event=>this.drop(event);this.onKey=event=>{if(root.dataset.cardRailMode==='grid'||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;const direction=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;if(!direction)return;event.preventDefault();event.stopPropagation();this.move(direction);};
  this.previous.addEventListener('click',this.onPrevious);this.next.addEventListener('click',this.onNext);this.viewport.addEventListener('scroll',this.onScroll,{passive:true});this.viewport.addEventListener('wheel',this.onWheel,{passive:true});for(const [name,handler] of [['pointerdown',this.onDown],['pointermove',this.onDrag],['pointerup',this.onDrop],['pointercancel',this.onDrop]])this.viewport.addEventListener(name,handler);this.viewport.addEventListener('keydown',this.onKey);this.observer=new ResizeObserver(()=>this.refresh());this.observer.observe(this.viewport);this.refresh();
 }
 move(direction){this.viewport.scrollBy({left:direction*this.viewport.clientWidth*.8,behavior:this.reduced()?'instant':'smooth'});}
 // Native snap picks the nearest card when a glide slows, which can pull a swipe back; snapping is held off while the gesture runs, then the rail settles in the swipe's direction.
 wheel(event){
  if(this.root.dataset.cardRailMode==='grid'||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
  if(!this.glide){this.release();this.glide={start:this.viewport.scrollLeft,travel:0};this.viewport.dataset.cardRailGliding='';}
  this.glide.travel+=event.deltaX;clearTimeout(this.glideTimer);this.glideTimer=setTimeout(()=>this.settle(),WHEEL_GESTURE_IDLE_MS);
 }
 // Mouse drag only: touch keeps its native scrolling. The rail follows the pointer, then settles on a card like a swipe.
 down(event){
  if(event.pointerType!=='mouse'||event.button!==0||this.root.dataset.cardRailMode==='grid')return;
  this.pull={id:event.pointerId,x:event.clientX,last:event.clientX,left:this.viewport.scrollLeft,moved:false};
 }
 drag(event){
  const pull=this.pull;if(!pull||event.pointerId!==pull.id)return;
  if(!pull.moved){
   if(Math.abs(event.clientX-pull.x)<DRAG_START_PX)return;
   pull.moved=true;this.release();this.viewport.dataset.cardRailGliding='';this.viewport.dataset.cardRailDragging='';this.viewport.setPointerCapture(pull.id);
  }
  pull.last=event.clientX;this.viewport.scrollLeft=pull.left-(event.clientX-pull.x);
 }
 drop(event){
  const pull=this.pull;if(!pull||event.pointerId!==pull.id)return;
  this.pull=null;if(!pull.moved)return;
  delete this.viewport.dataset.cardRailDragging;
  if(this.viewport.hasPointerCapture?.(pull.id))this.viewport.releasePointerCapture(pull.id);
  this.glide={start:pull.left,travel:pull.x-pull.last};this.settle();
 }
 settle(){
  const glide=this.glide;this.glide=null;if(this.dead||!glide)return;
  const left=this.viewport.scrollLeft,target=this.settleTarget(left,Math.abs(left-glide.start)<WHEEL_NUDGE_PX?0:Math.sign(glide.travel));
  if(Math.abs(target-left)<1){this.release();return;}
  this.viewport.addEventListener('scrollend',this.onSettled,{once:true});this.settleTimer=setTimeout(this.onSettled,SETTLE_FALLBACK_MS);
  this.viewport.scrollTo({left:target,behavior:this.reduced()?'instant':'smooth'});
 }
 // Card starts as scroll positions, clamped to the scroll range as native snapping clamps them.
 settleTarget(left,direction){
  const style=getComputedStyle(this.viewport),padding=style.scrollPaddingInlineStart==='auto'?0:parseFloat(style.scrollPaddingInlineStart),origin=this.viewport.getBoundingClientRect().left,maximum=Math.max(0,this.viewport.scrollWidth-this.viewport.clientWidth);
  const points=[...this.viewport.children].map(card=>Math.min(maximum,Math.max(0,left+card.getBoundingClientRect().left-origin-padding)));
  if(!points.length)return left;
  if(direction>0)return Math.min(...points.filter(point=>point>left+1),maximum);
  if(direction<0)return Math.max(...points.filter(point=>point<left-1),0);
  return points.reduce((best,point)=>Math.abs(point-left)<Math.abs(best-left)?point:best);
 }
 release(){clearTimeout(this.settleTimer);this.viewport.removeEventListener('scrollend',this.onSettled);delete this.viewport.dataset.cardRailGliding;}
 refresh(){if(this.dead||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;const enabled=this.root.dataset.cardRailMode!=='grid',maximum=Math.max(0,this.viewport.scrollWidth-this.viewport.clientWidth);this.viewport.tabIndex=enabled?0:-1;this.previous.disabled=!enabled||this.viewport.scrollLeft<=1;this.next.disabled=!enabled||this.viewport.scrollLeft>=maximum-1;});}
 destroy(){this.dead=true;cancelAnimationFrame(this.frame);clearTimeout(this.glideTimer);this.release();this.viewport.removeEventListener('wheel',this.onWheel);for(const [name,handler] of [['pointerdown',this.onDown],['pointermove',this.onDrag],['pointerup',this.onDrop],['pointercancel',this.onDrop]])this.viewport.removeEventListener(name,handler);delete this.viewport.dataset.cardRailDragging;this.observer.disconnect();this.previous.removeEventListener('click',this.onPrevious);this.next.removeEventListener('click',this.onNext);this.viewport.removeEventListener('scroll',this.onScroll);this.viewport.removeEventListener('keydown',this.onKey);}
}

const TESTIMONIAL_STYLES=Object.freeze(['cards','plain','headings']);
// A browser that saved the old on/off card switch (prem-testimonial-card-background) keeps that choice until the style is set.
export function readTestimonialStyle(storage){
 const style=storage.getItem('prem-testimonial-style');
 if(TESTIMONIAL_STYLES.includes(style))return style;
 return storage.getItem('prem-testimonial-card-background')==='false'?'plain':'cards';
}
export function applySectionPresentation(root,{servicesLayout='grid',servicesCarouselAlignment='full-bleed',servicesCardBackground=true,testimonialStyle='cards',testimonialFeatured=true,testimonialHeading=true,homeOnly=false}={}){
 for(const section of root.querySelectorAll('[data-component="services"]'+(homeOnly?'[data-home-section="services"]':''))){section.dataset.servicesLayout=servicesLayout==='carousel'?'carousel':'grid';section.dataset.cardRailMode=section.dataset.servicesLayout;section.dataset.servicesCarouselAlignment=servicesCarouselAlignment==='content'?'content':'full-bleed';section.dataset.cardBackground=String(servicesCardBackground!==false);}
 for(const section of root.querySelectorAll('[data-component="testimonials"]'+(homeOnly?'[data-home-section="testimonials"]':''))){section.dataset.cardBackground=String(testimonialStyle==='cards');section.dataset.featured=String(testimonialFeatured!==false);section.dataset.headings=String(testimonialStyle==='headings');section.dataset.heading=String(testimonialHeading!==false);}
}
