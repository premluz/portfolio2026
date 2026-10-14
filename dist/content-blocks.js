import {cardGalleryMarkup} from './card-gallery.js';
import {timelineMarkup} from './hero-timeline.js';
import {clamp} from './placement.js';
import {content} from './content/local.js';
import {escapeText,headingText,safeHref} from './content/html.js';
import {card} from './card-renderer.js';
import {CONTENT_LIMITS} from './content/model.js';
import {imageMarkup,posterSource} from './media-loading.js';
const paragraphs=values=>(values||[]).map(text=>`<p>${escapeText(text)}</p>`).join('');
const header=b=>`${b.label?`<p class="eyebrow content-block-eyebrow">${escapeText(b.label)}</p>`:''}${b.title?`<h2>${headingText(b.title)}</h2>`:''}`;
const surface=b=>{const colors=b.appearance?.surface||String(b.background||'').match(/#[0-9a-f]{6}/gi);return colors?.length>=2?`linear-gradient(145deg,${colors.slice(0,2).join(',')})`:/^#[0-9a-f]{3,6}$/i.test(b.background||'')?b.background:'var(--card-surface)';};
const media=(b,ctx)=>ctx.store.getAsset(b.mediaId)||{url:b.image,alt:b.alt};
const image=(b,ctx)=>{const asset=media(b,ctx),url=safeHref(asset?.url,{asset:true});return url?`<div class="visual content-media-frame">${imageMarkup(url,b.alt??asset.alt??'')}</div>${b.caption?`<p class="block-caption">${escapeText(b.caption)}</p>`:''}`:'<p>Image unavailable.</p>';};
export const blockRenderers=Object.freeze({
 text:(b,ctx)=>header(b)+paragraphs(b.paragraphs),
 image:(b,ctx)=>header(b)+image(b,ctx),
 video:(b,ctx)=>{const asset=media(b,ctx),poster=ctx.store.getAsset(b.posterMediaId);return header(b)+`<div class="visual content-media-frame"><video class="content-video" controls playsinline preload="none" data-media-src="${safeHref(asset?.url,{asset:true})}"${poster?` data-media-poster="${posterSource(poster.url)}"`:''} aria-label="${escapeText(b.title||b.caption||'Project video')}"></video></div>`+(b.caption?`<p class="block-caption">${escapeText(b.caption)}</p>`:'');},
 'info-card':(b,ctx)=>header(b)+(b.mediaId?image(b,ctx):'')+paragraphs(b.paragraphs)+(b.link?`<a class="content-link" href="${safeHref(b.link.url)}">${escapeText(b.link.label)}</a>`:''),
 timeline:b=>timelineMarkup(b),
 'card-gallery':(b,ctx)=>header(b)+(b.description?`<p>${escapeText(b.description)}</p>`:'')+cardGalleryMarkup(b,ctx),
 carousel:(b,ctx)=>header(b)+(b.description?`<p>${escapeText(b.description)}</p>`:'')+`<div class="content-carousel" role="region" aria-label="${escapeText(b.title||'Content carousel')}" tabindex="0">${b.items.map(item=>ctx.render(item,true)).join('')}</div>`,
 reference:(b,ctx)=>{
  const doc=ctx.store.get(b.documentId);if(!doc)return '<p>Content unavailable.</p>';
  if(b.presentation==='card'){const p=ctx.store.getCard(doc.id);return p?ctx.renderCard(p,0,'regular',{link:true}):`<article>${header(doc)}${paragraphs([doc.summary])}</article>`;}
  return header(doc)+paragraphs(doc.summary?[doc.summary]:[])+doc.blocks.map(item=>ctx.render(item,true)).join('');
 },
 metric:b=>header(b)+`<p class="content-metric">${escapeText(b.value)}</p>`+paragraphs(b.description?[b.description]:[]),
 quote:b=>header(b)+`<figure class="content-quote"><blockquote><p>${escapeText(b.text)}</p></blockquote><figcaption>${escapeText(b.attribution)}</figcaption></figure>`
});
/** A new block type registers a schema and a renderer, without changing layout. */
export function createBlockRenderer({store=content,renderers={},renderCard=card}={}){
 const registry={...blockRenderers,...renderers};
 return (blocks=[],columns=2)=>{
  const count=clamp(Number(columns)||2,1,4);let depth=0;
  const render=(b,nested=false)=>{
   if(depth>CONTENT_LIMITS.depth)return '<p>Content nesting limit reached.</p>';
   const renderer=Object.hasOwn(registry,b.type)?registry[b.type]:null,requestedColumns=Number(b.layout?.columns??b.layout?.span??b.span)||1,span=clamp(requestedColumns,1,count),mediaFit=['max-side','contain','full-bleed'].includes(b.layout?.mediaFit)?b.layout.mediaFit:'contain';
   depth++;let body;try{body=renderer?renderer(b,{store,renderCard,render}):'<p>Content type unavailable.</p>';}finally{depth--;}
   const mediaAttribute=['image','video','info-card'].includes(b.type)?` data-media-fit="${mediaFit}"`:'';
   return `<section class="${['card-gallery','timeline'].includes(b.type)?'content-block '+(b.type==='timeline'?'timeline-block':'card-gallery-block'):nested?'content-block':'surface'}" style="--project-bg:${surface(b)};--block-span:${span}" data-block-columns="${span}"${mediaAttribute}${nested||['card-gallery','timeline'].includes(b.type)?'':' data-surface'} data-block-type="${escapeText(b.type)}"${b.id?` data-block-id="${escapeText(b.id)}"`:''}>${body}</section>`;
  };
  return `<div class="story content-grid" style="--content-columns:${count}" data-content-columns="${count}">${blocks.map(b=>render(b)).join('')}</div>`;
 };
}
export const contentBlocks=createBlockRenderer();
