import {imageVariants} from './image-variants.js';
import {videoVariants} from './video-variants.js';
import {escapeText,safeHref} from './content/html.js';
export function imageSource(url,width=960){const variants=imageVariants[url]?.variants;return variants?.find(item=>item.width>=width)?.url||variants?.at(-1)?.url||safeHref(url,{asset:true});}
export const posterSource=url=>imageSource(url,960);
// The smaller re-encode from scripts/optimise-videos.mjs, or the original when none beat it.
export const videoSource=url=>safeHref(videoVariants[url]?.url||url,{asset:true});

export function imageMarkup(url,alt,{eager=false}={}){
 const original=safeHref(url,{asset:true}),meta=imageVariants[url],variants=meta?.variants||[];
 const src=variants.at(-1)?.url||original,srcset=variants.map(item=>`${item.url} ${item.width}w`).join(', ');
 const size=meta&&meta.height>meta.width?'(max-width: 600px) 90vw, 600px':'(max-width: 600px) 90vw, (max-width: 1000px) 80vw, 1000px';
 return `<img data-media-pending ${eager?'src':'data-media-src'}="${escapeText(src)}"${srcset?` ${eager?'srcset':'data-media-srcset'}="${escapeText(srcset)}" ${eager?'sizes':'data-media-sizes'}="${size}"`:''} data-original-image="${escapeText(original)}"${meta?` width="${meta.width}" height="${meta.height}"`:''} alt="${escapeText(alt)}" loading="${eager?'eager':'lazy'}" fetchpriority="${eager?'high':'low'}" decoding="async">`;
}

// The images with the most visible area when a view renders load first, at high priority, without waiting a
// frame for the observer: on Home the first two cards, on About the centred photos. Chosen once per view:
// later refreshes (gallery moves, settings) leave priority to the observer while the leads are still on the page.
export const LEAD_IMAGES=2;

// Sources are assigned only to the active layout, not its hidden alternatives.
// Observe the actual transformed cards so carousel neighbours load as they approach.
export class MediaLoader{
 constructor({environment=globalThis}={}){
  this.env=environment;this.pending=new Set();this.decoded=new Map();this.leads=[];
  // Pages that rebuild their markup (simple transitions) create fresh <img> elements. Holding one live
  // image per loaded URL lets the browser reuse it from memory instead of revalidating it over the network
  // (Vercel serves max-age=0, must-revalidate), so returning images are ready before the page fades in.
  this.ready=event=>{
   const node=event.target;if(node?.tagName!=='IMG')return;
   if(event.type==='load'&&node.hasAttribute?.('data-media-pending')&&!node.hasAttribute('data-media-waiting')&&this.fades(node))node.setAttribute('data-media-fade','');
   node.removeAttribute('data-media-pending');
   const url=event.type==='load'&&node.currentSrc;
   if(url&&!this.decoded.has(url)&&environment.Image){const keep=new environment.Image();keep.src=url;this.decoded.set(url,keep);}
  };
  for(const event of ['load','error'])environment.document?.addEventListener?.(event,this.ready,true);
  this.settled=event=>{if(event.animationName==='media-reveal')event.target.removeAttribute('data-media-fade');};
  environment.document?.addEventListener?.('animationend',this.settled,true);
  // Images below the fold wait until they scroll into view, so they fade in as they arrive instead of
  // finishing their fade before anyone sees them (loading starts 160px early).
  this.seen=environment.IntersectionObserver?new environment.IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)this.reveal(entry.target);},{rootMargin:'0px 0px -6% 0px',threshold:0}):null;
  this.observer=environment.IntersectionObserver?new environment.IntersectionObserver(entries=>{
   for(const entry of entries.filter(entry=>entry.isIntersecting&&this.visible(entry.target)).sort((a,b)=>Number(this.primary(b.target))-Number(this.primary(a.target))))this.load(entry.target,this.primary(entry.target));
  },{rootMargin:'160px',threshold:0}):null;
  this.scan=()=>{for(const node of [...this.pending].filter(node=>this.near(node)).sort((a,b)=>Number(this.primary(b))-Number(this.primary(a))))this.load(node,this.primary(node));};
  this.queue=()=>{if(!this.frame)this.frame=environment.requestAnimationFrame(()=>{this.frame=0;this.scan();});};
  if(!this.observer)for(const event of ['scroll','resize'])environment.addEventListener(event,this.queue,{passive:true});
 }
 // Media reveal (Settings → Fade images in): content images only; backdrops have their own entrance, and a
 // morph's bridge image already covers its target, so a fade under it would show as a dip.
 revealing(){const root=this.env.document?.documentElement;return root?.dataset?.mediaReveal==='on'&&root.dataset.animation!=='off'&&!this.env.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
 fades(node){return !node.closest?.('.card-backdrop')&&!node.closest?.('.visual')?.querySelector?.('.morph-image-bridge')&&this.revealing();}
 wait(node){if(!this.seen||node.tagName!=='IMG'||!this.fades(node))return;const r=node.getBoundingClientRect();if(r.height>0&&r.top>=this.env.innerHeight){node.setAttribute('data-media-waiting','');this.seen.observe(node);}}
 reveal(node){this.seen?.unobserve(node);if(!node.hasAttribute('data-media-waiting'))return;if(!node.hasAttribute('data-media-pending'))node.setAttribute('data-media-fade','');node.removeAttribute('data-media-waiting');}
 visible(node){return node.isConnected!==false&&!node.closest('[hidden],[aria-hidden="true"],.flow-shell,.transition-clone')&&this.env.getComputedStyle(node).visibility!=='hidden';}
 onScreen(node){if(!this.visible(node))return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<this.env.innerHeight&&r.right>0&&r.left<this.env.innerWidth;}
 lead(root){
  this.leads=this.leads.filter(node=>node.isConnected!==false);if(this.leads.length)return;
  const {innerWidth:width,innerHeight:height}=this.env;
  const area=node=>{const r=node.getBoundingClientRect();return Math.max(0,Math.min(r.right,width)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,height)-Math.max(r.top,0));};
  const onScreen=[...root?.querySelectorAll?.('img[data-media-src]')||[]].filter(node=>!node.closest('.card-backdrop')&&this.onScreen(node));
  this.leads=onScreen.sort((a,b)=>Number(this.primary(b))-Number(this.primary(a))||area(b)-area(a)).slice(0,LEAD_IMAGES);
  for(const node of this.leads)this.load(node,true);
 }
 near(node){if(!this.visible(node))return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>-160&&r.top<this.env.innerHeight+160&&r.right>-160&&r.left<this.env.innerWidth+160;}
 primary(node){return !!node.closest('.detail-media-column,[aria-current="true"]')||!!node.closest('.home-work')&&node===node.closest('.home-work').querySelector('img');}
 load(node,high=false){
  if(!node.dataset.mediaSrc)return;
  node.fetchPriority=high?'high':'low';node.loading='eager';
  // Pixel sizes select a copy for this actual frame, including narrow grids.
  if(node.dataset.mediaSrcset){const frame=node.closest('.visual'),rect=frame?.getBoundingClientRect();const width=parseFloat(node.style.width)||rect?.width;node.sizes=width>0?`${Math.ceil(width)}px`:node.dataset.mediaSizes;node.srcset=node.dataset.mediaSrcset;}
  if(node.dataset.mediaPoster)node.poster=node.dataset.mediaPoster;
  node.src=node.dataset.mediaSrc;
  for(const key of ['mediaSrc','mediaSrcset','mediaSizes','mediaPoster'])delete node.dataset[key];
  this.pending.delete(node);this.observer?.unobserve(node);
 }
 refresh(root){
  for(const node of this.pending)if(node.isConnected===false){this.observer?.unobserve(node);this.pending.delete(node);}
  for(const node of root?.querySelectorAll('img[data-media-src],video[data-media-src]')||[]){if(this.pending.has(node))continue;this.pending.add(node);this.observer?.observe(node);this.wait(node);}
  for(const node of root?.querySelectorAll('img[data-media-pending]')||[])if(node.complete&&node.naturalWidth)node.removeAttribute('data-media-pending');
  this.lead(root);this.queue();
 }
 destroy(){this.observer?.disconnect();this.seen?.disconnect();this.env.document?.removeEventListener?.('animationend',this.settled,true);this.env.cancelAnimationFrame(this.frame);for(const event of ['load','error'])this.env.document?.removeEventListener?.(event,this.ready,true);if(!this.observer)for(const event of ['scroll','resize'])this.env.removeEventListener(event,this.queue);this.pending.clear();this.decoded.clear();this.leads=[];}
}
