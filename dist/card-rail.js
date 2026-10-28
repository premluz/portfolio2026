import {escapeText} from './content/html.js';
export const cardRailControlsMarkup=({label='cards'}={})=>`<div class="card-rail-controls"><button type="button" data-card-rail-previous aria-label="Previous ${escapeText(label)}" data-tooltip="Previous ${escapeText(label)}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14.5 5-7 7 7 7"/></svg></button><button type="button" data-card-rail-next aria-label="Next ${escapeText(label)}" data-tooltip="Next ${escapeText(label)}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9.5 5 7 7-7 7"/></svg></button></div>`;

// A flat carousel controller independent of page layout and card contents.
export class CardRail{
 constructor(root,{reduced=()=>false}={}){
  this.root=root;this.reduced=reduced;this.viewport=root.querySelector('[data-card-rail-viewport]');this.previous=root.querySelector('[data-card-rail-previous]');this.next=root.querySelector('[data-card-rail-next]');
  this.onPrevious=()=>this.move(-1);this.onNext=()=>this.move(1);this.onScroll=()=>this.refresh();this.onKey=event=>{if(root.dataset.cardRailMode==='grid'||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;const direction=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;if(!direction)return;event.preventDefault();event.stopPropagation();this.move(direction);};
  this.previous.addEventListener('click',this.onPrevious);this.next.addEventListener('click',this.onNext);this.viewport.addEventListener('scroll',this.onScroll,{passive:true});this.viewport.addEventListener('keydown',this.onKey);this.observer=new ResizeObserver(()=>this.refresh());this.observer.observe(this.viewport);this.refresh();
 }
 move(direction){this.viewport.scrollBy({left:direction*this.viewport.clientWidth*.8,behavior:this.reduced()?'instant':'smooth'});}
 refresh(){if(this.dead||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;const enabled=this.root.dataset.cardRailMode!=='grid',maximum=Math.max(0,this.viewport.scrollWidth-this.viewport.clientWidth);this.viewport.tabIndex=enabled?0:-1;this.previous.disabled=!enabled||this.viewport.scrollLeft<=1;this.next.disabled=!enabled||this.viewport.scrollLeft>=maximum-1;});}
 destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.previous.removeEventListener('click',this.onPrevious);this.next.removeEventListener('click',this.onNext);this.viewport.removeEventListener('scroll',this.onScroll);this.viewport.removeEventListener('keydown',this.onKey);}
}

export function applySectionPresentation(root,{servicesLayout='grid',servicesCarouselAlignment='full-bleed',servicesCardBackground=true,testimonialCardBackground=true,homeOnly=false}={}){
 for(const section of root.querySelectorAll('[data-component="services"]'+(homeOnly?'[data-home-section="services"]':''))){section.dataset.servicesLayout=servicesLayout==='carousel'?'carousel':'grid';section.dataset.cardRailMode=section.dataset.servicesLayout;section.dataset.servicesCarouselAlignment=servicesCarouselAlignment==='content'?'content':'full-bleed';section.dataset.cardBackground=String(servicesCardBackground!==false);}
 for(const section of root.querySelectorAll('[data-component="testimonials"]'+(homeOnly?'[data-home-section="testimonials"]':'')))section.dataset.cardBackground=String(testimonialCardBackground!==false);
}
