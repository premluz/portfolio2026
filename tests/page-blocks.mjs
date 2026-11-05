import assert from 'node:assert/strict';
import {catalog} from '../dist/content/catalog.js';
import {createContentStore} from '../dist/content/provider.js';
import {contentModel,BLOCK_WIDTHS} from '../dist/content/model.js';
import {pageBlocksMarkup} from '../dist/page-blocks.js';
import {cardDetail} from '../dist/card-renderer.js';

// Blocks under a project's facts or an article's text: sections with headings, text, and captioned images and videos
// that can sit wider than the text column.
const store=createContentStore(catalog);
const blocks=[
 {id:'key-work',type:'section',title:'Key work',label:'Chapter',items:[
  {id:'intro',type:'text',title:'Unifying three systems',paragraphs:['First paragraph.','Second <b>paragraph</b>.']},
  {id:'flow',type:'image',mediaId:'playstation-content',alt:'The publishing flow',caption:'Publishing flow, end to end',layout:{width:'960'}},
  {id:'demo',type:'video',mediaId:'playstation-walkthrough',posterMediaId:'playstation-cover',caption:'Terms of sale',layout:{width:'page'}},
  {id:'plain',type:'image',mediaId:'playstation-content',caption:'Default width'}
 ]},
 {id:'after',type:'text',paragraphs:['Outside any section.']},
 {id:'bad',type:'image',mediaId:'playstation-content',layout:{width:'4000'}}
];
const html=pageBlocksMarkup(blocks,{store});

assert.equal((html.match(/<div class="page-block-group" data-block-type="section">/g)||[]).length,1,'A section is one flat group');
assert(html.includes('<section class="article-section"><p class="eyebrow content-block-eyebrow">Chapter</p><h2>Key work</h2></section>'),'The section heading sits in the reading column on its own');
assert(html.includes('<h2>Unifying three systems</h2><p>First paragraph.</p><p>Second &lt;b&gt;paragraph&lt;/b&gt;.</p>'),'A text block carries its own heading and paragraphs, escaped');
const image=/<section class="article-section" data-block-type="image" data-block-width="960">(.*?)<\/section>/.exec(html)?.[1]||'';
assert(image.startsWith('<figure class="block-media"><div class="block-media-frame"><img')&&image.includes('alt="The publishing flow"')&&image.includes('</div><figcaption class="block-caption">Publishing flow, end to end</figcaption></figure>'),'An image sits in its frame (the card, when cards are on) with the caption underneath, outside it');
assert(!image.includes('class="visual'),'Body images are plain figures, with no card frame or liquid effect');
const video=/<section class="article-section" data-block-type="video" data-block-width="page">(.*?)<\/section>/.exec(html)?.[1]||'';
assert(video.includes('<video class="content-video" controls playsinline preload="none" data-media-src=')&&video.includes('data-media-poster=')&&video.includes('Terms of sale</figcaption>'),'A video lazy-loads with its poster and caption');
assert(html.includes('data-block-type="image"><figure')&&html.split('data-block-width=').length===3,'Only blocks that set a valid width carry one; the others follow the site setting');
assert(!html.includes('4000'),'An unknown width is ignored, not written out');
assert(html.includes('<section class="article-section" data-block-type="text"><p>Outside any section.</p></section>'),'Blocks outside a section are plain sections in the same list');
assert.equal(pageBlocksMarkup([{id:'x',type:'nope'}],{store}),'<section class="article-section" data-block-type="nope"><p>Content type unavailable.</p></section>','An unknown block type says so instead of vanishing');

// The model accepts sections and the width choice, and rejects a width it does not know.
assert.deepEqual([...BLOCK_WIDTHS],['content','960','1280','page']);
const withBlocks=value=>{const copy=structuredClone(catalog);copy.documents.find(doc=>doc.id==='playstation').blocks.push(value);return copy;};
assert.doesNotThrow(()=>contentModel.assert(withBlocks(blocks[0])),'A section with text, image and video blocks validates');
assert.throws(()=>contentModel.assert(withBlocks(blocks[2])),/width|enum|one of/i,'An unknown layout.width fails the build');
assert.throws(()=>contentModel.assert(withBlocks({id:'empty',type:'section',title:'Empty',items:[]})),'A section needs at least one block');

// A project page shows its authored blocks after the facts, but never the hover walkthrough video.
const project=structuredClone(store.getCard('playstation')),withBody={...project,bodyBlocks:blocks.slice(0,2)};
const page=cardDetail(withBody);
assert(page.indexOf('</dl></div></div><div class="page-blocks">')>0&&page.indexOf('Key work')>page.indexOf('detail-fact'),'The block list follows the facts');
assert(!cardDetail({...project,bodyBlocks:[]}).includes('page-blocks'),'A project with no extra blocks gets no empty list');
assert(!project.bodyBlocks.some(b=>b.mediaId==='playstation-walkthrough'),'The walkthrough video that feeds the card hover is not a body block');
// Two to a row: a section with layout.columns 2 marks itself and defaults to the page width; one column stays plain.
const two=pageBlocksMarkup([{id:'pair',type:'section',layout:{columns:2},items:[{id:'l',type:'image',mediaId:'playstation-content'},{id:'r',type:'image',mediaId:'playstation-content'}]}],{store});
assert(two.startsWith('<div class="page-block-group" data-block-type="section" data-block-columns="2" data-block-width="page">'),'A two-column section spans the page unless it sets a width');
assert(pageBlocksMarkup([{id:'pair',type:'section',layout:{columns:2,width:'1280'},items:[{id:'l',type:'image',mediaId:'playstation-content'}]}],{store}).includes('data-block-columns="2" data-block-width="1280"'));
assert(!pageBlocksMarkup([{id:'one',type:'section',layout:{columns:1},items:[{id:'l',type:'image',mediaId:'playstation-content'}]}],{store}).includes('data-block-columns'),'One column is the plain list');
const css=await (await import('node:fs/promises')).readFile(new URL('../dist/article.css',import.meta.url),'utf8');
assert(css.includes('@media(min-width:751px){\n.page-block-group[data-block-columns="2"]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'),'Two to a row on desktop only');
assert(css.includes(':root[data-page-image-cards="on"] .block-media-frame{display:grid;place-items:center;padding:var(--page-image-card-padding);background:var(--card-surface);border-radius:var(--radius-card)}'),'Cards use the card surface, the card rounding and the padding setting');
const indexHtml=await (await import('node:fs/promises')).readFile(new URL('../dist/index.html',import.meta.url),'utf8');
assert(indexHtml.includes('<input id="pageImageCards" type="checkbox"> Wrap images and videos in cards')&&indexHtml.includes('<input id="pageImageCardPadding" type="range" min="0" max="40" step="1" value="16">'),'The switch starts off; padding defaults to 16% of the card width');
console.log('Page blocks passed: sections, headings, captioned images and videos, per-block widths, validation, and project page placement.');
