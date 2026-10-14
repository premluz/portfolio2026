import {contextualText} from './contextual-popovers.js';
import {escapeText,safeHref} from './content/html.js';
const clamp=value=>Math.max(0,Math.min(1,value));
export function timelineMarkup(block,{graphic=true,text=true}={}){
 const items=block?.items||[];if(!items.length||(!graphic&&!text))return '';
 return `<div class="hero-timeline" data-hero-timeline data-timeline-graphic="${graphic}" aria-label="${escapeText(block.title||'My path')}"><div class="timeline-viewport" data-timeline-viewport tabindex="0" aria-label="Scroll the timeline"><div class="timeline-track">${graphic?'<div class="timeline-rule" aria-hidden="true"></div>':''}<ol>${items.map(item=>`<li data-timeline-item="${escapeText(item.id)}"${item.label?` aria-label="${escapeText(item.label)}"`:''}>${text?`${(item.paragraphs||[]).map(paragraph=>`<p>${contextualText(paragraph)}</p>`).join('')}${item.link&&safeHref(item.link.url)?`<a href="${safeHref(item.link.url)}">${escapeText(item.link.label)}</a>`:''}`:''}</li>`).join('')}</ol></div></div>${graphic?'<div class="timeline-scrubber"><button class="timeline-handle" data-timeline-handle role="slider" aria-label="Timeline position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-orientation="horizontal" data-tooltip="Drag to explore the timeline"></button></div><span class="sr" data-timeline-instruction>Move left and right to explore. You can also drag the dot or use the arrow keys.</span>':''}</div>`;
}
export function timelineTarget(clientX,rect,max){return clamp((clientX-rect.left)/Math.max(1,rect.width))*Math.max(0,max);}
export function timelineDrag(startScroll,startX,clientX,max,travel){return Math.max(0,Math.min(max,startScroll+(clientX-startX)*max/Math.max(1,travel)));}
export class HeroTimeline {
 constructor(root,{mode='cursor',reduced=()=>false}={}){
  this.root=root;this.viewport=root.querySelector('[data-timeline-viewport]');this.handle=root.querySelector('[data-timeline-handle]');this.reduced=reduced;this.abort=new AbortController();this.target=this.viewport.scrollLeft;this.drag=null;
  const on=(node,event,fn,options={})=>node.addEventListener(event,fn,{...options,signal:this.abort.signal});
  on(root,'pointermove',e=>this.move(e));on(root,'pointerdown',e=>this.down(e));on(root,'pointerup',e=>this.release(e));on(root,'pointercancel',e=>this.release(e));on(root,'lostpointercapture',e=>this.release(e));
  on(this.viewport,'scroll',()=>{this.paint();if(!this.frame)this.target=this.viewport.scrollLeft;},{passive:true});
  on(this.viewport,'wheel',()=>this.stop(),{passive:true});on(this.viewport,'touchstart',()=>this.stop(),{passive:true});
  on(root,'keydown',e=>this.key(e));
  this.observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>{this.target=Math.min(this.target,this.max);this.paint();});this.observer?.observe(this.viewport);this.observer?.observe(this.viewport.firstElementChild);
  this.setMode(mode);this.paint();
 }
 get max(){return Math.max(0,this.viewport.scrollWidth-this.viewport.clientWidth);}
 setMode(mode){this.stop();if(this.drag&&this.root.hasPointerCapture(this.drag.id))this.root.releasePointerCapture(this.drag.id);this.drag=null;delete this.root.dataset.dragging;this.mode=mode==='drag'?'drag':'cursor';this.root.dataset.timelineMode=this.mode;this.root.querySelector('[data-timeline-instruction]').textContent=this.mode==='drag'?'Drag the timeline or the dot. Use arrow keys to step through it.':'Move left and right to explore. You can also drag the dot or use the arrow keys.';}
 down(e){
  if(e.button!==0||e.target.closest('a,[data-context-id]'))return;
  const handle=e.target.closest('[data-timeline-handle]');if(!handle&&this.mode!=='drag')return;
  // Native touch scrolling owns the content; only the dot captures touch.
  if(e.pointerType==='touch'&&!handle)return;
  this.stop();this.drag={id:e.pointerId,x:e.clientX,scroll:this.viewport.scrollLeft,handle:!!handle};this.root.setPointerCapture(e.pointerId);this.root.dataset.dragging='true';e.preventDefault();
 }
 move(e){
  if(this.drag){if(e.pointerId!==this.drag.id)return;const travel=this.drag.handle?this.viewport.clientWidth-32:this.max;this.viewport.scrollLeft=timelineDrag(this.drag.scroll,this.drag.x,this.drag.handle?e.clientX:2*this.drag.x-e.clientX,this.max,travel);this.target=this.viewport.scrollLeft;this.paint();return;}
  if(e.target.closest('[data-context-id]')){this.stop();return;}
  if(this.mode!=='cursor'||e.pointerType!=='mouse'||!this.max)return;
  this.aim(timelineTarget(e.clientX,this.viewport.getBoundingClientRect(),this.max));
 }
 release(e){if(!this.drag||e.pointerId!==this.drag.id)return;this.drag=null;delete this.root.dataset.dragging;if(this.root.hasPointerCapture(e.pointerId))this.root.releasePointerCapture(e.pointerId);}
 aim(value){this.target=Math.max(0,Math.min(this.max,value));if(this.reduced()){this.viewport.scrollLeft=this.target;this.paint();return;}if(!this.frame)this.frame=requestAnimationFrame(now=>this.tick(now));}
 tick(now){this.frame=0;const dt=this.last?Math.max(.25,Math.min(3,(now-this.last)/16.667)):1;this.last=now;const error=this.target-this.viewport.scrollLeft;if(Math.abs(error)<.5){this.viewport.scrollLeft=this.target;this.paint();this.last=0;return;}this.viewport.scrollLeft+=error*(1-Math.pow(.82,dt));this.paint();this.frame=requestAnimationFrame(now=>this.tick(now));}
 key(e){if(e.target.closest('a,[data-context-id]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const item=this.root.querySelector('[data-timeline-item]'),step=item?.getBoundingClientRect().width||240;this.aim(e.key==='Home'?0:e.key==='End'?this.max:this.viewport.scrollLeft+(e.key==='ArrowLeft'?-step:step));}
 paint(){const progress=this.max?clamp(this.viewport.scrollLeft/this.max):0;this.root.style.setProperty('--timeline-position',String(progress));this.handle?.setAttribute('aria-valuenow',String(Math.round(progress*100)));this.handle?.setAttribute('aria-disabled',String(!this.max));}
 stop(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;this.target=this.viewport.scrollLeft;}
 destroy(){this.stop();this.abort.abort();this.observer?.disconnect();if(this.drag&&this.root.hasPointerCapture(this.drag.id))this.root.releasePointerCapture(this.drag.id);this.drag=null;}
}
