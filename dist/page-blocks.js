// The blocks under a project page's facts or an article's text: one flat list of sections, each in the reading
// column, with images and videos free to sit wider (layout.width: content, 960, 1280 or page). A `section` block
// groups blocks under a heading without narrowing them, so a wide image inside it still spans its own width.
import {escapeText,safeHref} from './content/html.js';
import {content} from './content/local.js';
import {BLOCK_WIDTHS} from './content/model.js';
import {blockRenderers,header,media} from './content-blocks.js';
import {imageMarkup,posterSource} from './media-loading.js';
import {card} from './card-renderer.js';

const caption=b=>b.caption?`<figcaption class="block-caption">${escapeText(b.caption)}</figcaption>`:'';
// Plain figures, not the card-style .visual frames of the grid pages: a body image keeps its own proportions. The frame
// is what Design → Images → "Wrap images and videos in cards" turns into a card; the caption stays outside it.
const framed=(media,b)=>`<figure class="block-media"><div class="block-media-frame">${media}</div>${caption(b)}</figure>`;
const figure={
 image:(b,store)=>{
  const asset=media(b,{store}),url=safeHref(asset?.url,{asset:true});
  return header(b)+(url?framed(imageMarkup(url,b.alt??asset.alt??''),b):'<p>Image unavailable.</p>');
 },
 video:(b,store)=>{
  const asset=media(b,{store}),poster=store.getAsset(b.posterMediaId);
  return header(b)+framed(`<video class="content-video" controls playsinline preload="none" data-media-src="${safeHref(asset?.url,{asset:true})}"${poster?` data-media-poster="${posterSource(poster.url)}"`:''} aria-label="${escapeText(b.title||b.caption||'Project video')}"></video>`,b);
 }
};

// A section with layout.columns 2 sets its images and videos two to a row on desktop, across layout.width (page by default).
function sectionMarkup(b,store){
 const columns=b.layout?.columns===2?` data-block-columns="2" data-block-width="${BLOCK_WIDTHS.includes(b.layout?.width)?b.layout.width:'page'}"`:'';
 return `<div class="page-block-group" data-block-type="section"${columns}>${b.title||b.label?`<section class="article-section">${header(b)}</section>`:''}${b.items.map(item=>blockMarkup(item,store)).join('')}</div>`;
}

function blockMarkup(b,store){
 if(b.type==='section')return sectionMarkup(b,store);
 const render=figure[b.type]?(block=>figure[b.type](block,store)):Object.hasOwn(blockRenderers,b.type)?(block=>blockRenderers[b.type](block,{store,renderCard:card,render:item=>blockMarkup(item,store)})):null;
 const width=figure[b.type]&&BLOCK_WIDTHS.includes(b.layout?.width)?` data-block-width="${b.layout.width}"`:'';
 return `<section class="article-section" data-block-type="${escapeText(b.type)}"${width}>${render?render(b):'<p>Content type unavailable.</p>'}</section>`;
}

export const pageBlocksMarkup=(blocks=[],{store=content}={})=>blocks.map(b=>blockMarkup(b,store)).join('');
