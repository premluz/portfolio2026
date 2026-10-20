import {carouselMotion} from './carousel-momentum.js';

// Native scrolling for the circular ring (experiment, behind the "Native snap" setting). The viewport
// becomes a real horizontal scroller with one CSS snap point per card, spaced like the cards on the ring,
// and the ring's angle follows scrollLeft. The browser then runs trackpad, Magic Mouse and touch coasting
// and the snap as one native motion; this only draws it. The cards sit in a sticky layer so they never
// scroll themselves, and the track repeats so the ring can turn either way; it re-centres when idle.
const LOOPS=7,MIDDLE=3,EDGE_LOOPS=2,IDLE_MS=150,tau=Math.PI*2;

export class NativeRingScroll{
 constructor(ring){
  this.ring=ring;this.viewport=ring.viewport;this.frame=0;this.idle=0;
  this.track=document.createElement('div');this.track.className='spatial-gallery-native-track';
  this.layer=document.createElement('div');this.layer.className='spatial-gallery-ring';
  this.markers=document.createElement('div');this.markers.className='spatial-gallery-snap-points';this.markers.setAttribute('aria-hidden','true');
  this.layer.append(...ring.items);this.track.append(this.layer,this.markers);this.viewport.append(this.track);
  this.onScroll=()=>{if(this.repairReset())return;this.schedule();clearTimeout(this.idle);if(!this.hasScrollEnd)this.idle=setTimeout(this.onScrollEnd,IDLE_MS);};
  this.onScrollEnd=()=>{if(this.ring.dragging||this.repairReset())return;this.recentre();this.free(false);this.ring.requestedIndex=null;this.sync();};
  this.hasScrollEnd='onscrollend' in globalThis;
  this.viewport.addEventListener('scroll',this.onScroll,{passive:true});
  if(this.hasScrollEnd)this.viewport.addEventListener('scrollend',this.onScrollEnd);
  // A reset while hidden fires no scroll event; becoming visible again resizes the scroller, so check then.
  this.observer=new ResizeObserver(()=>this.repairReset());this.observer.observe(this.viewport);
  // Transitions move the page in and out of motion layers silently; check once each has settled.
  this.onSettled=()=>this.repairReset();globalThis.addEventListener('portfolio-route-settled',this.onSettled);
  // The ring has no position yet; it scrolls to its card when the placement first goes there.
  this.layout({position:false});
 }
 /** Snap points: one per card per loop, each where scrollLeft puts that card at the front. */
 layout({position=true}={}){
  const {angles,dragRadius}=this.ring,width=this.viewport.clientWidth;
  this.radius=dragRadius;this.loop=tau*dragRadius;
  this.layer.style.width=width+'px';this.track.style.width=LOOPS*this.loop+width+'px';
  this.markers.replaceChildren(...Array.from({length:LOOPS*angles.length},(_,n)=>{
   const marker=document.createElement('span'),loop=Math.floor(n/angles.length),index=n%angles.length;
   marker.className='spatial-gallery-snap';marker.style.left=this.leftOf(index,loop)+'px';return marker;
  }));
  // The ring's angle is the truth: the scroller follows it, in the middle loop, whenever it is laid out anew.
  if(position&&this.laidOut())this.viewport.scrollTo({left:this.leftFromAngle(this.ring.angle),behavior:'instant'});
 }
 laidOut(){return this.viewport.clientWidth>0&&this.viewport.scrollWidth>this.viewport.clientWidth;}
 leftFromAngle(angle){const raw=(-angle-this.ring.angles[0])*this.radius;return raw+(MIDDLE-Math.floor(raw/this.loop))*this.loop;}
 leftOf(index,loop){return loop*this.loop+(this.ring.angles[index]-this.ring.angles[0])*this.radius;}
 angleAt(left){return -this.ring.angles[0]-left/this.radius;}
 /** The snap point of `index` nearest to scroll position `near`. */
 leftFor(index,near){const base=this.leftOf(index,0);return base+Math.max(0,Math.min(LOOPS-1,Math.round((near-base)/this.loop)))*this.loop;}
 nearestTo(left){let best=0;for(let i=1;i<this.ring.angles.length;i++)if(Math.abs(this.leftFor(i,left)-left)<Math.abs(this.leftFor(best,left)-left))best=i;return best;}
 sync(){if(!this.laidOut()||this.repairReset())return;this.ring.angle=this.angleAt(this.viewport.scrollLeft);this.ring.paint();}
 schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.sync();});}
 go(index,smooth){
  const left=this.viewport.scrollLeft,loop=Math.floor(left/this.loop),edge=!this.laidOut()||loop<EDGE_LOOPS||loop>=LOOPS-EDGE_LOOPS;
  const target=this.leftFor(index,edge?this.leftFromAngle(this.ring.angle):left);this.ring.requestedIndex=index;
  if(!smooth){this.ring.angle=this.angleAt(target);this.ring.paint();}
  this.viewport.scrollTo({left:target,behavior:smooth?'smooth':'instant'});
 }
 /**
  * Moving the gallery in the DOM (page transitions) resets a scroller to 0. The ring always rests in the
  * middle loops and loop 0 is ~3 turns away, so a position there is a reset: restore it from the angle.
  */
 repairReset(){
  if(!this.laidOut()||this.viewport.scrollLeft>=this.loop)return false;
  this.viewport.scrollTo({left:this.leftFromAngle(this.ring.angle),behavior:'instant'});return true;
 }
 // The ring is endless; the track is not. Jumping whole loops lands on an identical picture.
 recentre(){
  const left=this.viewport.scrollLeft,loop=Math.floor(left/this.loop);
  if(loop>=EDGE_LOOPS&&loop<LOOPS-EDGE_LOOPS)return;
  this.viewport.scrollTo({left:left+(MIDDLE-loop)*this.loop,behavior:'instant'});
 }
 // Snapping is off while a mouse drags the track and while its release glides to a card.
 free(on){if(on)this.ring.root.dataset.galleryNativeFree='true';else delete this.ring.root.dataset.galleryNativeFree;}
 begin(){this.pressLeft=this.viewport.scrollLeft;this.free(true);}
 move(delta){const left=this.pressLeft-delta;this.viewport.scrollTo({left,behavior:'instant'});return this.angleAt(left);}
 /** A mouse release glides natively to the card its speed points at (`velocity` in rad/ms). */
 release(velocity){
  const projected=this.viewport.scrollLeft-velocity*carouselMotion.decay*this.radius;
  const index=this.nearestTo(projected),left=this.leftFor(index,projected);this.ring.requestedIndex=index;
  // A press without travel (a click) scrolls nowhere, so no scrollend would turn snapping back on.
  if(Math.abs(left-this.viewport.scrollLeft)<1){this.free(false);this.ring.requestedIndex=null;return;}
  this.viewport.scrollTo({left,behavior:this.ring.gallery.reduced()?'instant':'smooth'});
 }
 destroy(){
  cancelAnimationFrame(this.frame);clearTimeout(this.idle);this.observer.disconnect();globalThis.removeEventListener('portfolio-route-settled',this.onSettled);this.free(false);
  this.viewport.removeEventListener('scroll',this.onScroll);this.viewport.removeEventListener('scrollend',this.onScrollEnd);
  this.viewport.append(...this.ring.items);this.track.remove();this.viewport.scrollTo({left:0,top:0,behavior:'instant'});
 }
}
