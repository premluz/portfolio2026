const streams=new WeakMap();
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const escapeText=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function summaryParts(project){
 const context=String(project.context||'').trim(),summary=String(project.summary||'').trim();
 if(summary)return {lead:summary,context};
 const first=context.match(/^(.+?[.!?])(?:\s+|$)/);
 return first?{lead:first[1],context:context.slice(first[0].length)}:{lead:context,context:''};
}
export function detailSummaryMarkup(project){
 const context=String(project.intro||project.context||'').trim();if(!context)return '';
 const words=context.match(/\S+\s*/g)||[];
 return `<p class="project-summary"><span data-summary-context>${words.map(word=>`<span data-summary-word>${escapeText(word)}</span>`).join('')}</span></p>`;
}
// Inline words keep the full paragraph's dimensions and accessible text intact.
export function setSummaryProgress(paragraph,progress){
 if(!paragraph)return;const p=clamp(progress),words=[...paragraph.querySelectorAll('[data-summary-word]')];
 for(let i=0;i<words.length;i++){
  const opacity=String(smooth((p*(words.length+2)-i)/3));
  if(words[i].style.opacity!==opacity)words[i].style.opacity=opacity;
 }
 if(paragraph.dataset)paragraph.dataset.summaryProgress=String(p);
}
export function attachSummaryStream(source,copy){
 const stream=source&&streams.get(source);return stream&&copy?stream.attach(copy):()=>{};
}
export function attachTitleReveal(source,copy){
 const stream=source&&streams.get(source);return stream&&copy?stream.attachTitle(copy):()=>{};
}
export function preserveSharedLead(paragraph){
 const stream=paragraph&&streams.get(paragraph);if(!stream)return;
 stream.sharedLead=true;
 preserveSharedHeading(paragraph);
 stream.paint();
}
export function preserveSharedHeading(paragraph){
 const stream=paragraph&&streams.get(paragraph);if(!stream)return;
 stream.sharedHeading=true;
 const detail=paragraph.closest?.('.detail');
 for(const title of [detail?.querySelector('h1'),detail?.querySelector('.project-client'),...stream.titles])if(title){title.style.opacity='';if(title.dataset)delete title.dataset.revealOpacity;}
}
export function projectRevealMode(){
 return 'fade';
}
export class SummaryStream {
 constructor(paragraph,{reduced=false,control=null,delay=40,mode='stream',paused=false,progress=0,onReveal=null,onReverse=null,revealAt=mode==='stream'?.7:.37,onComplete=null}={}){
  this.paragraph=paragraph;this.targets=new Set();this.titles=new Set();this.mode=mode;this.position=clamp(progress);this.delay=mode==='fade'?0:delay;this.direction=1;this.dead=false;this.raf=0;this.onReveal=onReveal;this.onReverse=onReverse;this.revealAt=clamp(revealAt);this.onComplete=onComplete;this.completed=false;this.revealed=false;
  if(!paragraph)return;
  const words=paragraph.querySelectorAll('[data-summary-word]');this.duration=mode==='fade'?620:Math.max(360,Math.min(760,words.length*12));
  streams.set(paragraph,this);this.targets.add(paragraph);
  if(reduced||(mode==='stream'&&!words.length)){this.position=1;this.paint();this.revealContent();this.complete();return;}
  this.paint();this.revealContent();if(this.position===1)this.complete();control?.register(()=>this.reverse());if(!paused)this.start();
 }
 start(){if(this.dead||this.raf)return;this.previous=undefined;this.raf=requestAnimationFrame(now=>this.tick(now));}
 pause(){cancelAnimationFrame(this.raf);this.raf=0;}
 resume(){if(!this.dead&&(this.direction>0?this.position<1:this.position>0))this.start();}
 attach(copy){this.targets.add(copy);this.paintParagraph(copy);return ()=>this.targets.delete(copy);}
 attachTitle(copy){this.titles.add(copy);this.paintTitle(copy);return ()=>this.titles.delete(copy);}
 paintTitle(title){if(!title||this.mode!=='fade'||this.sharedLead||this.sharedHeading)return;const opacity=String(smooth(this.position*this.duration/260));title.style.opacity=opacity;if(title.dataset)title.dataset.revealOpacity=opacity;}
 paintParagraph(target){
  if(this.mode==='stream'){setSummaryProgress(target,this.position);return;}
  // Fade the entire paragraph as one surface; no per-word fading on this route.
  setSummaryProgress(target,1);
  const time=this.position*this.duration,opacity=String(smooth((time-100)/330));
  if(this.sharedLead){target.style.opacity='1';if(target.dataset){target.dataset.revealMode='shared';delete target.dataset.revealOpacity;}const context=target.querySelector?.('[data-summary-context]');if(context)context.style.opacity=opacity;return;}
  target.style.opacity=opacity;if(target.dataset){target.dataset.revealMode='fade';target.dataset.revealOpacity=opacity;}
  const detail=target.closest?.('.detail');this.paintTitle(detail?.querySelector('h1'));this.paintTitle(detail?.querySelector('.project-client'));
 }
 paint(){for(const target of this.targets)this.paintParagraph(target);for(const title of this.titles)this.paintTitle(title);}
 tick(now){
  this.raf=0;if(this.dead)return;const elapsed=this.previous===undefined?0:Math.min(40,Math.max(0,now-this.previous));this.previous=now;
  let remaining=elapsed;if(this.delay>0&&this.direction>0){const consumed=Math.min(this.delay,remaining);this.delay-=consumed;remaining-=consumed;}
  this.position=clamp(this.position+remaining/this.duration*this.direction);this.paint();
  if(this.direction>0)this.revealContent();
  if(this.direction>0&&this.position===1)this.complete();
  if(this.direction>0?this.position<1:this.position>0)this.raf=requestAnimationFrame(time=>this.tick(time));
 }
 revealContent(){if(this.revealed||this.direction<0||this.position<this.revealAt)return;this.revealed=true;this.onReveal?.();}
 complete(){if(this.completed||this.direction<0||this.position<1)return;this.completed=true;this.onComplete?.();}
 reverse(){if(this.dead)return;this.direction=-1;this.delay=0;this.onReverse?.();if(!this.raf)this.raf=requestAnimationFrame(now=>this.tick(now));}
 destroy(){this.dead=true;cancelAnimationFrame(this.raf);this.raf=0;if(this.paragraph)streams.delete(this.paragraph);this.targets.clear();this.titles.clear();}
}
