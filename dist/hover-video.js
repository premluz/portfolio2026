const previews=new Set();
let frame=0;
export function pauseVideoPreviews(except){for(const preview of previews)if(preview!==except&&preview.active)preview.stop();}
const queue=()=>{if(frame||!globalThis.requestAnimationFrame)return;frame=requestAnimationFrame(()=>{frame=0;for(const preview of previews)preview.sync();});};
const events=['scroll','resize','gallery-selection-change','portfolio-route-settled'];
function watch(enabled){for(const event of events)globalThis[enabled?'addEventListener':'removeEventListener']?.(event,queue,{passive:true,capture:event==='scroll'});if(!enabled&&frame){cancelAnimationFrame(frame);frame=0;}}

// Each hover owns one complete playback. Spotlight/detail playback repeats at
// the native ended boundary, so leaving never cuts a clip short.
export class HoverVideo {
 constructor(el,video,onMetadata=()=>{}){
  this.el=el;this.video=video;this.active=false;this.dead=false;this.generation=0;
  this.trigger=el.closest?.('.project-card')||el;
  this.hover=matchMedia('(hover: hover)');this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  video.muted=true;video.defaultMuted=true;video.loop=false;video.playsInline=true;
  this.enter=e=>{if(e?.pointerType!=='touch')this.play();};
  this.leave=()=>{};this.cancel=()=>this.stop();this.visibility=()=>{if(document.hidden)this.stop();else this.sync();};
  this.error=()=>this.stop();this.metadata=onMetadata;
  this.ended=()=>{if(this.automatic()){this.active=false;this.play({automatic:true});}else this.stop();};
  for(const [event,handler] of [['pointerenter',this.enter],['pointerleave',this.leave],['pointerdown',this.cancel],['focusin',this.enter],['focusout',this.leave]])this.trigger.addEventListener(event,handler);
  video.addEventListener('ended',this.ended);video.addEventListener('error',this.error);video.addEventListener('loadedmetadata',this.metadata);
  document.addEventListener('visibilitychange',this.visibility);
  this.reduced.addEventListener('change',this.cancel);this.hover.addEventListener('change',this.cancel);
  if(!previews.size)watch(true);previews.add(this);
  if(globalThis.IntersectionObserver){this.observer=new IntersectionObserver(()=>this.sync(),{threshold:[0,.25]});this.observer.observe(el);}
  queue();
 }
 visible(){
  if(this.dead||this.reduced.matches||document.hidden||!this.el.isConnected||this.el.closest?.('[hidden],[aria-hidden="true"],.flow-shell,.drag-stage,.transition-clone')||getComputedStyle(this.el).visibility==='hidden'||document.documentElement?.classList?.contains('route-transition'))return false;
  if(this.el.getBoundingClientRect){const r=this.el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  return true;
 }
 automatic(){
  if(!this.visible())return false;
  if(this.el.closest?.('.detail'))return true;
  const item=this.el.closest?.('[data-gallery-item]');if(item)return item.getAttribute('aria-current')==='true';
  if(this.el.closest?.('.home-view-split'))return this.trigger.dataset?.videoSpotlight==='true'||this.el.closest?.('.card-placement')?.style.zIndex==='2';
  return false;
 }
 sync(){if(this.automatic())this.play({automatic:true});}
 async play({automatic=false}={}){
  if(this.active||!this.visible()||!automatic&&!this.hover.matches)return;
  this.active=true;const generation=++this.generation;
  if(!this.video.getAttribute('src'))this.video.setAttribute('src',this.video.dataset.videoUrl);
  try{
   if(this.video.readyState>0)this.video.currentTime=0;
   await this.video.play();
   if(generation!==this.generation)return;
   if(this.dead||!this.active||!this.el.isConnected){this.stop();return;}
   this.el.classList.add('video-preview-playing');
  }catch{if(generation===this.generation)this.stop();}
 }
 stop(){this.active=false;++this.generation;this.el.classList.remove('video-preview-playing');this.video.pause();}
 destroy(){
  this.dead=true;this.stop();this.observer?.disconnect();previews.delete(this);if(!previews.size)watch(false);
  for(const [event,handler] of [['pointerenter',this.enter],['pointerleave',this.leave],['pointerdown',this.cancel],['focusin',this.enter],['focusout',this.leave]])this.trigger.removeEventListener(event,handler);
  this.video.removeEventListener('ended',this.ended);this.video.removeEventListener('error',this.error);this.video.removeEventListener('loadedmetadata',this.metadata);
  document.removeEventListener('visibilitychange',this.visibility);
  this.reduced.removeEventListener('change',this.cancel);this.hover.removeEventListener('change',this.cancel);
  this.video.removeAttribute('src');this.video.load();
 }
}
