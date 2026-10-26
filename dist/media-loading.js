import {imageVariants} from './image-variants.js';
import {escapeText,safeHref} from './content/html.js';
export function imageSource(url,width=960){const variants=imageVariants[url]?.variants;return variants?.find(item=>item.width>=width)?.url||variants?.at(-1)?.url||safeHref(url,{asset:true});}
export const posterSource=url=>imageSource(url,960);

export function imageMarkup(url,alt,{eager=false}={}){
 const original=safeHref(url,{asset:true}),meta=imageVariants[url],variants=meta?.variants||[];
 const src=variants.at(-1)?.url||original,srcset=variants.map(item=>`${item.url} ${item.width}w`).join(', ');
 const size=meta&&meta.height>meta.width?'(max-width: 600px) 90vw, 600px':'(max-width: 600px) 90vw, (max-width: 1000px) 80vw, 1000px';
 return `<img data-media-pending ${eager?'src':'data-media-src'}="${escapeText(src)}"${srcset?` ${eager?'srcset':'data-media-srcset'}="${escapeText(srcset)}" ${eager?'sizes':'data-media-sizes'}="${size}"`:''} data-original-image="${escapeText(original)}"${meta?` width="${meta.width}" height="${meta.height}"`:''} alt="${escapeText(alt)}" loading="${eager?'eager':'lazy'}" fetchpriority="${eager?'high':'low'}" decoding="async">`;
}

// Sources are assigned only to the active layout, not its hidden alternatives.
// Observe the actual transformed cards so carousel neighbours load as they approach.
export class MediaLoader{
 constructor({environment=globalThis}={}){
  this.env=environment;this.pending=new Set();this.decoded=new Map();
  // Pages that rebuild their markup (simple transitions) create fresh <img> elements. Holding one live
  // image per loaded URL lets the browser reuse it from memory instead of revalidating it over the network
  // (Vercel serves max-age=0, must-revalidate), so returning images are ready before the page fades in.
  this.ready=event=>{
   const node=event.target;if(node?.tagName!=='IMG')return;node.removeAttribute('data-media-pending');
   const url=event.type==='load'&&node.currentSrc;
   if(url&&!this.decoded.has(url)&&environment.Image){const keep=new environment.Image();keep.src=url;this.decoded.set(url,keep);}
  };
  for(const event of ['load','error'])environment.document?.addEventListener?.(event,this.ready,true);
  this.observer=environment.IntersectionObserver?new environment.IntersectionObserver(entries=>{
   for(const entry of entries.filter(entry=>entry.isIntersecting&&this.visible(entry.target)).sort((a,b)=>Number(this.primary(b.target))-Number(this.primary(a.target))))this.load(entry.target,this.primary(entry.target));
  },{rootMargin:'160px',threshold:0}):null;
  this.scan=()=>{for(const node of [...this.pending].filter(node=>this.near(node)).sort((a,b)=>Number(this.primary(b))-Number(this.primary(a))))this.load(node,this.primary(node));};
  this.queue=()=>{if(!this.frame)this.frame=environment.requestAnimationFrame(()=>{this.frame=0;this.scan();});};
  if(!this.observer)for(const event of ['scroll','resize'])environment.addEventListener(event,this.queue,{passive:true});
 }
 visible(node){return node.isConnected!==false&&!node.closest('[hidden],[aria-hidden="true"],.flow-shell,.transition-clone')&&this.env.getComputedStyle(node).visibility!=='hidden';}
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
  for(const node of root?.querySelectorAll('img[data-media-src],video[data-media-src]')||[]){if(this.pending.has(node))continue;this.pending.add(node);this.observer?.observe(node);}
  for(const node of root?.querySelectorAll('img[data-media-pending]')||[])if(node.complete&&node.naturalWidth)node.removeAttribute('data-media-pending');
  this.queue();
 }
 destroy(){this.observer?.disconnect();this.env.cancelAnimationFrame(this.frame);for(const event of ['load','error'])this.env.document?.removeEventListener?.(event,this.ready,true);if(!this.observer)for(const event of ['scroll','resize'])this.env.removeEventListener(event,this.queue);this.pending.clear();this.decoded.clear();}
}
