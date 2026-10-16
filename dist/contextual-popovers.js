import {content} from './content/local.js';
import {escapeText,safeHref} from './content/html.js';

export const contextualEntries=()=>content.get('inline-context')?.blocks||[];
// Plain source text remains CMS-friendly; this projection adds only known,
// published annotations, with escaped text and validated links.
export function contextualText(text,entries=contextualEntries()){
 const source=String(text??'');let cursor=0,html='';
 while(cursor<source.length){
  let next=null;
  for(const entry of entries){if(!entry.title)continue;const at=source.indexOf(entry.title,cursor);if(at<0)continue;const after=source[at+entry.title.length];if(entry.id==='rios'&&after&&/[a-z]/i.test(after))continue;if(!next||at<next.at||at===next.at&&entry.title.length>next.entry.title.length)next={at,entry};}
  if(!next){html+=escapeText(source.slice(cursor));break;}
  html+=escapeText(source.slice(cursor,next.at));const {entry}=next,label=escapeText(entry.title),attrs=`data-context-id="${escapeText(entry.id)}" aria-haspopup="dialog" aria-expanded="false"`;
  const highlighted=`<span class="context-marker-text">${label}</span>`;
  html+=entry.id==='rios'&&safeHref(entry.link?.url)?`<a class="context-marker context-marker-link" href="${safeHref(entry.link.url)}" target="_blank" rel="noopener" ${attrs}>${highlighted}</a>`:`<span class="context-marker" role="button" tabindex="0" ${attrs}>${highlighted}</span>`;
  cursor=next.at+entry.title.length;
 }
 return html;
}
export function contextualPopoverMarkup(entry){
 if(!entry)return '';
 const rows=entry.items||[entry];
 return `<div class="contextual-popover-copy">${rows.map(row=>{const href=safeHref(row.link?.url);return `<p>${href?`<a href="${href}"${/^https?:/.test(row.link.url)?' target="_blank" rel="noopener"':''}>${escapeText(row.link.label||row.title)}</a> `:''}${(row.paragraphs||[]).map(escapeText).join(' ')}</p>`;}).join('')}</div>`;
}
export function contextualPopoverPosition(anchor,size,viewport,gap=12){
 const margin=16,width=Math.min(size.width,Math.max(0,viewport.width-margin*2)),height=Math.min(size.height,Math.max(0,viewport.height-margin*2));
 const above=anchor.top-height-gap>=margin;
 return {left:Math.max(margin,Math.min(anchor.left,viewport.width-width-margin)),top:Math.max(margin,Math.min(above?anchor.top-height-gap:anchor.bottom+gap,viewport.height-height-margin)),width,height,above};
}
export function mountContextualPopovers({root=document,reduced=()=>false,onRoute=()=>{}}={}){
 const panel=document.createElement('div');panel.id='contextualPopover';panel.className='contextual-popover glass-surface';panel.hidden=true;panel.tabIndex=-1;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','More context');document.body.append(panel);
 const entries=new Map(contextualEntries().map(entry=>[entry.id,entry]));
 let trigger=null,focusReturn=null,pinned=false,closing=false,timer=0,animation=null,epoch=0;
 const position=()=>{if(!trigger||!trigger.isConnected){close(true);return;}panel.style.maxHeight=(innerHeight-32)+'px';panel.style.width=Math.min(420,innerWidth-32)+'px';const rect=trigger.getBoundingClientRect(),size=panel.getBoundingClientRect(),next=contextualPopoverPosition(rect,size,{width:innerWidth,height:innerHeight});panel.style.left=next.left+'px';panel.style.top=next.top+'px';panel.style.transformOrigin=next.above?'bottom left':'top left';};
 const animate=(open,done=()=>{})=>{
  const generation=++epoch,current=animation?getComputedStyle(panel):null;
  const from=current?{opacity:current.opacity,transform:current.transform,clipPath:current.clipPath}:{opacity:open?0:1,transform:open?'translateY(5px) scale(.965)':'translateY(0) scale(1)',clipPath:open?'inset(40% 30% 40% 30% round 24px)':'inset(0% 0% 0% 0% round 24px)'};
  animation?.cancel();animation=null;
  if(reduced()||document.documentElement?.dataset.animation==='off'||!panel.animate){done();return;}
  const frames=open?[
   {...from,offset:0},
   {opacity:1,transform:'translateY(-1px) scale(1.025)',clipPath:'inset(0% 0% 0% 0% round 24px)',offset:.64},
   {opacity:1,transform:'translateY(0) scale(.99)',clipPath:'inset(0% 0% 0% 0% round 24px)',offset:.83},
   {opacity:1,transform:'translateY(0) scale(1)',clipPath:'inset(0% 0% 0% 0% round 24px)',offset:1}
  ]:[from,{opacity:0,transform:'translateY(7px) scale(.985)',clipPath:'inset(12% 6% 12% 6% round 24px)'}];
  animation=panel.animate(frames,{duration:open?340:180,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  animation.finished.then(()=>{if(generation!==epoch)return;animation?.cancel();animation=null;done();},()=>{});
 };
 const close=(immediate=false)=>{clearTimeout(timer);pinned=false;closing=true;if(!trigger&&panel.hidden)return;trigger?.setAttribute('aria-expanded','false');trigger=null;delete document.documentElement.dataset.contextPopoverOpen;if(immediate){++epoch;animation?.cancel();animation=null;panel.hidden=true;}else animate(false,()=>{panel.hidden=true;});};
 const open=(node,{pin=false,focus=false}={})=>{clearTimeout(timer);const entry=entries.get(node?.dataset.contextId);if(!entry)return;if(trigger===node&&!panel.hidden){pinned=pinned||pin;if(focus)(panel.querySelector('a')||panel).focus({preventScroll:true});return;}const shouldEnter=panel.hidden||closing;closing=false;trigger?.setAttribute('aria-expanded','false');trigger=node;pinned=pin;node.setAttribute('aria-expanded','true');node.setAttribute('aria-controls',panel.id);panel.innerHTML=contextualPopoverMarkup(entry);panel.hidden=false;document.documentElement.dataset.contextPopoverOpen='true';position();if(shouldEnter)animate(true);if(focus)(panel.querySelector('a')||panel).focus({preventScroll:true});};
 const deferClose=()=>{clearTimeout(timer);if(!pinned)timer=setTimeout(()=>{if(!panel.contains(document.activeElement)&&document.activeElement!==trigger)close();},180);};
 const over=e=>{const node=e.target.closest?.('[data-context-id]');if(node&&!node.contains(e.relatedTarget))open(node);};
 const out=e=>{const node=e.target.closest?.('[data-context-id]');if(node&&!node.contains(e.relatedTarget)&&!panel.contains(e.relatedTarget))deferClose();};
 const focus=e=>{const node=e.target.closest?.('[data-context-id]');if(node===focusReturn){focusReturn=null;return;}if(node)open(node);};
 const click=e=>{const node=e.target.closest?.('[data-context-id]');if(node){const repeated=trigger===node&&pinned;if(node.tagName==='A'&&(e.pointerType!=='touch'||repeated))return;e.preventDefault();repeated?close():open(node,{pin:true});}};
 const outside=e=>{if(trigger&&!trigger.contains(e.target)&&!panel.contains(e.target))close();};
 const key=e=>{if(!trigger)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();const previous=trigger;close();focusReturn=previous;previous.focus({preventScroll:true});}else if(e.target===trigger&&(e.key==='ArrowDown'||trigger.tagName!=='A'&&['Enter',' '].includes(e.key))){e.preventDefault();e.stopImmediatePropagation();open(trigger,{pin:true,focus:true});}};
 const scroll=e=>{if(e?.target?.nodeType&&panel.contains(e.target))return;close();};
 const enter=()=>clearTimeout(timer);
 const routeClick=e=>{const link=e.target.closest?.('a');if(link?.getAttribute('href')?.startsWith('#')){e.preventDefault();const id=link.getAttribute('href').slice(1);close();onRoute(id);}else if(link)close();};
 root.addEventListener('pointerover',over);root.addEventListener('pointerout',out);root.addEventListener('focusin',focus);root.addEventListener('focusout',deferClose);root.addEventListener('click',click);root.addEventListener('pointerdown',outside);addEventListener('keydown',key,true);panel.addEventListener('pointerenter',enter);panel.addEventListener('pointerleave',deferClose);panel.addEventListener('click',routeClick);addEventListener('resize',position);addEventListener('scroll',scroll,true);addEventListener('hashchange',scroll);
 return {close,destroy(){close(true);root.removeEventListener('pointerover',over);root.removeEventListener('pointerout',out);root.removeEventListener('focusin',focus);root.removeEventListener('focusout',deferClose);root.removeEventListener('click',click);root.removeEventListener('pointerdown',outside);removeEventListener('keydown',key,true);removeEventListener('resize',position);removeEventListener('scroll',scroll,true);removeEventListener('hashchange',scroll);panel.remove();}};
}
