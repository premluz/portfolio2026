import {escapeText} from './content/html.js';
import {CircularCardPlacement} from './circular-card-gallery.js';
import {GalleryExtrusion} from './gallery-extrusion.js';
import {normaliseCarouselSettings} from './carousel-settings.js';
import {mountGalleryCardCopy} from './gallery-card-copy.js';

export function galleryPose(offset,reduced=false){
 const distance=Math.abs(offset),bend=Math.max(0,distance-.18);
 return {angle:reduced||bend===0?0:-Math.sign(offset)*Math.min(52,bend*28),scale:reduced?1:1-Math.min(.22,distance*.13),opacity:reduced?1:1-Math.min(.55,distance*.14)};
}

// Content is provided by the caller: images, information cards, project cards,
// or any registered block renderer. This component owns only their placement.
export function cardGalleryMarkup(block,{store,render}){
 const axis=block.orientation==='vertical'?'vertical':'horizontal';
 const variant=block.variant==='circular'?'circular':'perspective';
 return `<div class="spatial-card-gallery" data-card-gallery="${escapeText(block.id)}" data-gallery-axis="${axis}" data-gallery-variant="${variant}" aria-roledescription="carousel" aria-label="${escapeText(block.title||'Card gallery')}"><div class="spatial-gallery-stage"><div class="spatial-gallery-viewport" data-gallery-viewport tabindex="0" aria-label="Browse cards with arrow keys">${block.items.map((item,index)=>{
  const doc=item.type==='reference'?store.get(item.documentId):null;
  const title=item.title||doc?.title||doc?.name||'',description=item.description||doc?.summary||(item.paragraphs||[]).join(' '),hasMedia=!!(item.mediaId||doc?.heroMediaId);
  const media=store.getAsset?.(item.mediaId||doc?.heroMediaId),presentation=doc?store.getPresentation?.(doc.id):null,orientation=presentation?.card.orientation||(media?.width&&media?.height&&media.height>media.width?'portrait':'landscape');
  return `<div class="spatial-gallery-item" data-gallery-item data-gallery-orientation="${orientation}" data-gallery-client="${escapeText(doc?.client||'')}" data-gallery-title="${escapeText(title)}" data-gallery-description="${escapeText(description)}" data-gallery-media="${hasMedia}" role="group" aria-roledescription="slide" aria-label="${index+1} of ${block.items.length}: ${escapeText(title)}"><div class="spatial-gallery-pose">${render(item,true)}</div></div>`;
 }).join('')}</div><div class="spatial-gallery-primary-action"><div class="spatial-gallery-controls"><button class="glass-utility-button" type="button" data-gallery-previous aria-label="Previous card" data-tooltip="Previous card">←</button><button class="glass-utility-button" type="button" data-gallery-next aria-label="Next card" data-tooltip="Next card">→</button></div><a class="spatial-gallery-details glass-utility-button" data-gallery-details draggable="false">View details</a></div></div><div class="spatial-gallery-caption"><a class="spatial-gallery-copy" draggable="false" aria-live="polite" aria-atomic="true"><p class="spatial-gallery-client" data-gallery-client></p><h3 data-gallery-title></h3><p class="spatial-gallery-description" data-gallery-description></p></a></div></div>`;
}

export class CardGallery{
 constructor(root,{reduced=()=>false,arcSettings,nativeSnap=false}={}){
  this.arcSettings=normaliseCarouselSettings(arcSettings);this.nativeSnap=!!nativeSnap;root.dataset.galleryNativeSnap=String(this.nativeSnap);
  this.root=root;this.viewport=root.querySelector('[data-gallery-viewport]');this.items=[...root.querySelectorAll('[data-gallery-item]')];this.reduced=reduced;this.index=Math.min(this.items.length-1,Math.max(0,root.dataset.galleryIndex!==undefined?Number(root.dataset.galleryIndex):Math.floor(this.items.length/2)));this.lastCaption=-1;
  this.client=root.querySelector('[data-gallery-client]:not([data-gallery-item])');this.title=root.querySelector('[data-gallery-title]:not([data-gallery-item])');this.description=root.querySelector('[data-gallery-description]:not([data-gallery-item])');this.details=root.querySelector('[data-gallery-details]');this.previous=root.querySelector('[data-gallery-previous]');this.next=root.querySelector('[data-gallery-next]');
  this.onScroll=()=>{if(!this.circular)this.schedule();};this.onResize=()=>{this.circular?.measure();if(this.variant!=='scroll')this.go(this.index,false);this.schedule();};
  this.onKey=event=>{if(event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;if(event.key==='Enter'&&event.target===this.viewport){const link=this.items[this.index]?.querySelector('a,button');if(link){event.preventDefault();link.click();}return;}const vertical=this.axis==='vertical',direction=event.key===(vertical?'ArrowUp':'ArrowLeft')?-1:event.key===(vertical?'ArrowDown':'ArrowRight')?1:0;if(!direction&&!['Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();this.viewport.focus({preventScroll:true});this.go(event.key==='Home'?0:event.key==='End'?this.items.length-1:(this.circular?.requestedIndex??this.index)+direction);};
  this.onClick=event=>{const item=event.target.closest('[data-gallery-item]'),index=this.items.indexOf(item);if(this.variant!=='scroll'&&index>=0&&index!==this.index){event.preventDefault();event.stopPropagation();this.go(index);}};
  this.onPrevious=()=>this.go((this.circular?.requestedIndex??this.index)-1);this.onNext=()=>this.go((this.circular?.requestedIndex??this.index)+1);
  this.onDown=event=>{if(((!this.circular||this.circular.nativeScroll)&&event.pointerType!=='mouse')||event.button!==0||event.isPrimary===false||this.drag)return;this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:this.viewport.scrollLeft,top:this.viewport.scrollTop,moved:false,caught:this.circular?.beginDrag(event.timeStamp??performance.now())||false};};
  this.onMove=event=>{const drag=this.drag;if(!drag||event.pointerId!==drag.id)return;const delta=this.axis==='vertical'?event.clientY-drag.y:event.clientX-drag.x,cross=this.axis==='vertical'?event.clientX-drag.x:event.clientY-drag.y;if(!drag.moved){if(event.pointerType!=='mouse'&&Math.abs(cross)>=6&&Math.abs(cross)>Math.abs(delta)){this.circular?.release(event.timeStamp??performance.now(),true);this.drag=null;return;}if(Math.abs(delta)<6)return;this.viewport.setPointerCapture?.(drag.id);this.root.dataset.galleryDragging='true';}drag.moved=true;event.preventDefault();if(this.circular){this.circular.drag(delta,event.timeStamp??performance.now());return;}this.viewport.scrollTo({left:this.axis==='horizontal'?drag.left-delta:0,top:this.axis==='vertical'?drag.top-delta:0,behavior:'instant'});this.schedule();};
  this.onUp=event=>{const drag=this.drag;if(!drag||event.pointerId!==drag.id)return;this.drag=null;delete this.root.dataset.galleryDragging;if(this.viewport.hasPointerCapture?.(drag.id))this.viewport.releasePointerCapture(drag.id);if(drag.moved||drag.caught){this.suppressClick=true;clearTimeout(this.clickTimer);this.clickTimer=setTimeout(()=>this.suppressClick=false,250);}if(this.circular){this.circular.release(event.timeStamp??performance.now(),event.type==='pointercancel'||!drag.moved);return;}if(drag.moved)this.go(this.nearestIndex());};
  const selectClick=this.onClick;this.onClick=event=>{if(this.suppressClick){event.preventDefault();event.stopPropagation();return;}selectClick(event);};
  this.onImageDrag=event=>event.preventDefault();
  for(const [name,handler] of [['pointerdown',this.onDown],['pointermove',this.onMove],['pointerup',this.onUp],['pointercancel',this.onUp],['dragstart',this.onImageDrag]])this.viewport.addEventListener(name,handler);
  this.viewport.addEventListener('scroll',this.onScroll,{passive:true});this.root.addEventListener('keydown',this.onKey);this.viewport.addEventListener('click',this.onClick,true);this.previous.addEventListener('click',this.onPrevious);this.next.addEventListener('click',this.onNext);
  this.observer=new ResizeObserver(this.onResize);this.observer.observe(this.viewport);
  this.extrusions=this.items.map(item=>new GalleryExtrusion(item,()=>{this.circular?.measure();this.schedule();}));
  if(root.dataset.cardGallery==='home-projects')this.cardCopyLayout=mountGalleryCardCopy(root);
  if(this.viewport.style?.setProperty){for(const [name,item] of [['first',this.items[0]],['last',this.items.at(-1)]])this.viewport.style.setProperty(`--gallery-${name}-width`,`var(--gallery-${item?.dataset.galleryOrientation==='portrait'?'portrait':'landscape'}-width)`);}
  this.setVariant(root.dataset.galleryVariant);this.setOrientation(root.dataset.galleryAxis);this.schedule();
 }
 get axis(){return this.root.dataset.galleryAxis;}
 setArcSettings(settings){const next=normaliseCarouselSettings(settings);if(Object.keys(next).every(key=>next[key]===this.arcSettings[key]))return;this.arcSettings=next;if(this.circular){const selected=this.circular.requestedIndex??this.index;this.circular.measure();this.circular.go(selected,false);}else this.schedule();}
 async prepareOpen(element,control,duration){const index=this.items.findIndex(item=>item.contains(element));if(index<0||this.variant==='scroll')return;if(this.circular&&!this.reduced())await this.circular.prepareOpen(index,control,duration);else{this.go(index,false);this.paint();}}
 // Experiment: the ring follows a native snap scroller instead of its own motion (see circular-native-scroll.js).
 setNativeSnap(enabled){enabled=!!enabled;if(enabled===this.nativeSnap)return;this.nativeSnap=enabled;this.root.dataset.galleryNativeSnap=String(enabled);if(this.circular)this.setVariant(this.variant);}
 setVariant(variant){this.variant=['circular','scroll'].includes(variant)?variant:'perspective';this.circular?.destroy();this.circular=null;this.root.dataset.galleryVariant=this.variant;this.root.dataset.galleryReduced=String(this.reduced());if(this.variant==='circular'&&!this.reduced()){this.viewport.scrollTo({left:0,top:0,behavior:'instant'});this.items.forEach(item=>item.firstElementChild.style.transform='');this.circular=new CircularCardPlacement(this);}this.applyDescriptionInCard();if(this.variant==='scroll')this.viewport.scrollTo({left:0,top:0,behavior:'instant'});else this.go(this.index,false);this.schedule();}
 setOrientation(axis){this.root.dataset.galleryAxis=axis==='vertical'?'vertical':'horizontal';this.root.dataset.galleryReduced=String(this.reduced());this.circular?.measure();if(this.variant!=='scroll')this.go(this.index,false);this.schedule();}
 setDescriptionInCard(enabled){this.descriptionInCard=!!enabled;this.applyDescriptionInCard();this.updateSelection(this.index);}
 // Scroll shows every card at once, so each card carries its own copy whatever the setting says.
 applyDescriptionInCard(){this.root.dataset.descriptionInCard=String(!!this.descriptionInCard||this.variant==='scroll');this.cardCopyLayout?.refresh();}
 setCardCopyPosition(position){
  const value=position==='top'?'top':'bottom';this.root.dataset.cardCopyPosition=value;
  for(const item of this.items){const card=item.querySelector('.project-card');if(card)card.dataset.cardCopyPosition=value;}
 }
 go(index,smooth=true){
  if(this.circular){this.circular.go(index,smooth);return;}
  index=Math.min(this.items.length-1,Math.max(0,index));const item=this.items[index];if(!item)return;
  const vertical=this.axis==='vertical',position=vertical?item.offsetTop+item.offsetHeight/2-this.viewport.clientHeight/2:item.offsetLeft+item.offsetWidth/2-this.viewport.clientWidth/2;
  this.viewport.scrollTo({left:vertical?0:position,top:vertical?position:0,behavior:smooth&&!this.reduced()?'smooth':'instant'});if(!smooth)this.index=index;this.schedule();
 }
 paint(){
  if(this.dead||!this.items.length)return;if(this.circular){this.circular.paint();return;}const vertical=this.axis==='vertical',v=this.viewport.getBoundingClientRect(),center=vertical?v.top+v.height/2:v.left+v.width/2;let best=0,distance=Infinity;
  this.items.forEach((item,index)=>{const r=item.getBoundingClientRect(),offset=((vertical?r.top+r.height/2:r.left+r.width/2)-center)/Math.max(1,vertical?r.height:r.width),pose=galleryPose(offset,this.reduced()||this.variant==='scroll');if(Math.abs(offset)<distance){best=index;distance=Math.abs(offset);}const inner=item.firstElementChild;inner.style.transform=`perspective(1200px) rotate${vertical?'X':'Y'}(${pose.angle}deg) scale(${pose.scale})`;this.paintOpacity(item,pose.opacity);this.extrusions[index].paint(pose.angle,this.axis,this.reduced(),pose.opacity);});
  this.updateSelection(best);
 }
 nearestIndex(){const vertical=this.axis==='vertical',viewport=this.viewport.getBoundingClientRect(),center=vertical?viewport.top+viewport.height/2:viewport.left+viewport.width/2;return this.items.reduce((nearest,item,index)=>{const rect=item.getBoundingClientRect(),distance=Math.abs((vertical?rect.top+rect.height/2:rect.left+rect.width/2)-center);return distance<nearest.distance?{index,distance}:nearest;},{index:0,distance:Infinity}).index;}
 paintOpacity(item,opacity){const plane=item.firstElementChild,face=plane.querySelector?.(':scope > .content-block');plane.style.opacity=face?'1':String(opacity);if(face)face.style.opacity=String(opacity);}
 updateSelection(best){
  const circular=Boolean(this.circular),descriptionInCard=this.root.dataset.descriptionInCard==='true';
  if(this.lastCaption===best&&this.selectionCircular===circular&&this.selectionDescriptionInCard===descriptionInCard){this.root.dispatchEvent(new Event('gallery-paint'));return;}
  this.selectionCircular=circular;this.selectionDescriptionInCard=descriptionInCard;
  this.index=best;this.root.dataset.galleryIndex=String(best);const copy=this.title.parentElement,link=this.items[best]?.querySelector?.('a[href]');const href=link?.getAttribute?.('href');for(const action of [copy,this.details])if(action){action.morphImageRoot=link||null;if(href){action.setAttribute('href',href);if(link.dataset?.contentCard)action.dataset.contentCard=link.dataset.contentCard;}else{action.removeAttribute?.('href');if(action.dataset)delete action.dataset.contentCard;}}if(this.details)this.details.hidden=!href;this.previous.disabled=!this.circular&&best===0;this.next.disabled=!this.circular&&best===this.items.length-1;
  this.items.forEach((item,index)=>{item.setAttribute('aria-current',String(index===best));item.querySelectorAll('a,button').forEach(node=>{const open=index===best||this.variant==='scroll';node.tabIndex=open?0:-1;node.morphCopyRoot=open?(descriptionInCard?item.querySelector('.card-copy'):this.title.parentElement):null;});});
  if(this.lastCaption!==best){this.lastCaption=best;const active=this.items[best];if(this.client){this.client.textContent=active.dataset.galleryClient||'';this.client.hidden=!this.client.textContent;}this.title.textContent=active.dataset.galleryTitle;this.description.textContent=active.dataset.galleryDescription;this.title.hidden=!this.title.textContent;this.description.hidden=!this.description.textContent;const copy=this.title.parentElement;this.captionAnimation?.cancel();if(!this.reduced())this.captionAnimation=copy.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});globalThis.dispatchEvent?.(new Event('gallery-selection-change'));}
  this.root.dispatchEvent(new Event('gallery-paint'));
 }
 schedule(){if(this.dead||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.paint();});}
 destroy(){this.dead=true;this.cardCopyLayout?.destroy();this.circular?.destroy();this.circular=null;this.extrusions.forEach(edge=>edge.destroy());this.captionAnimation?.cancel();cancelAnimationFrame(this.frame);clearTimeout(this.clickTimer);this.observer.disconnect();if(this.drag&&this.viewport.hasPointerCapture?.(this.drag.id))this.viewport.releasePointerCapture(this.drag.id);this.drag=null;delete this.root.dataset.galleryDragging;for(const [name,handler] of [['pointerdown',this.onDown],['pointermove',this.onMove],['pointerup',this.onUp],['pointercancel',this.onUp],['dragstart',this.onImageDrag]])this.viewport.removeEventListener(name,handler);this.viewport.removeEventListener('scroll',this.onScroll);this.root.removeEventListener('keydown',this.onKey);this.viewport.removeEventListener('click',this.onClick,true);this.previous.removeEventListener('click',this.onPrevious);this.next.removeEventListener('click',this.onNext);}
}
