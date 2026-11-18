// The hero filmstrip: project covers in one row that drifts left forever and can be dragged.
// The row is rendered twice back to back, so wrapping by one set's width never shows a jump.
import {escapeText} from './content/html.js';
import {imageMarkup} from './media-loading.js';
import {imageVariants} from './image-variants.js';
import {CarouselDrag,coast,frameDelta} from './carousel-drag.js';
import {DragCursor} from './drag-cursor.js';
export const filmstripLoop=150000;
// The shape comes from the image's own pixels, never from its name: portrait covers take the narrow card.
export const filmstripShape=url=>{const meta=imageVariants[url];return meta&&meta.height>meta.width?'narrow':'standard';};
export function filmstripMarkup(documents){
 const cards=documents.filter(doc=>doc.image).map(doc=>`<li class="hero-filmstrip-card" data-filmstrip-shape="${filmstripShape(doc.image)}">${imageMarkup(doc.image,doc.imageAlt||`Product design screen for ${doc.name}`)}</li>`).join('');
 return `<section class="hero-carousel-stage" data-hero-carousel aria-label="${escapeText('Selected work')}" hidden><ul class="hero-filmstrip-track" data-filmstrip-track>${cards}</ul></section>`;
}
// Keeps the position inside one set's width; dragging past either end continues into the copy.
export const wrapFilmstrip=(position,width)=>width>0?(position<=-width?position+width:position>0?position-width:position):position;
export class HeroCarousel{
 constructor(root,{reduced=()=>false}={}){
  this.root=root;this.reduced=reduced;this.stage=root.querySelector('[data-hero-carousel]');this.track=this.stage?.querySelector('[data-filmstrip-track]');
  this.enabled=false;this.paused=true;this.dead=false;this.position=0;this.momentum=0;this.frame=0;this.previous=0;this.width=0;
  if(!this.track)return;
  this.originals=[...this.track.children];
  for(const card of this.originals){const copy=card.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.dataset.filmstripCopy='';this.track.append(copy);}
  this.drag=new CarouselDrag(this.stage,{
   canStart:()=>this.enabled&&!this.reduced(),
   onStart:()=>{this.momentum=0;this.dragStart=this.position;},
   onMove:dx=>{this.position=wrapFilmstrip(this.dragStart+dx,this.width);this.paint();},
   onRelease:velocity=>{this.momentum=velocity;this.previous=0;this.schedule();}
  });
  this.cursor=new DragCursor(this.stage);
  this.onResize=()=>this.measure();addEventListener('resize',this.onResize);
  this.onVisibility=()=>{this.previous=0;this.schedule();};document.addEventListener('visibilitychange',this.onVisibility);
 }
 setEnabled(enabled){
  enabled=!!enabled&&!!this.track;
  if(enabled===this.enabled){if(enabled)this.measure();return;}
  this.enabled=enabled;this.stage.hidden=!enabled;
  if(enabled)this.measure();else{this.stop();this.drag.cancel();}
 }
 // One set's travel is every original card plus the gap after it, read from layout so the CSS breakpoints stay the only source.
 measure(){
  if(!this.enabled||this.dead)return;
  const gap=parseFloat(getComputedStyle(this.track).columnGap)||0;
  this.width=this.originals.reduce((sum,card)=>sum+card.offsetWidth+gap,0);
  this.position=wrapFilmstrip(this.position,this.width);this.paint();this.schedule();
 }
 paint(){if(this.track)this.track.style.transform=`translate3d(${this.position}px,0,0)`;}
 step(now){
  const dt=frameDelta(now,this.previous);this.previous=now;
  if(this.drag.active)return;
  if(this.momentum){const next=coast(this.momentum,dt);this.momentum=next.momentum;this.position+=next.travel;}
  else this.position-=this.width/filmstripLoop*dt;
  this.position=wrapFilmstrip(this.position,this.width);this.paint();
 }
 schedule(){
  if(!this.enabled||this.paused||this.dead||this.frame||this.reduced()||document.hidden||!this.width)return;
  this.frame=requestAnimationFrame(now=>{this.frame=0;this.step(now);this.schedule();});
 }
 stop(){cancelAnimationFrame(this.frame);this.frame=0;this.previous=0;this.momentum=0;}
 pause(){this.paused=true;this.stop();this.drag?.cancel();}
 resume(){this.paused=false;this.schedule();}
 destroy(){
  this.dead=true;this.pause();if(!this.track)return;
  this.drag.destroy();this.cursor.destroy();removeEventListener('resize',this.onResize);document.removeEventListener('visibilitychange',this.onVisibility);
  this.track.style.transform='';
 }
}
