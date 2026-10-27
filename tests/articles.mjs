import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {contentModel} from '../dist/content/model.js';
import {cardIds,informationCards,getDocument,cards} from '../dist/documents.js';
import {cardDetail} from '../dist/card-renderer.js';
import {articleDate} from '../dist/article-page.js';
import {homeWritingMarkup} from '../dist/home-writing.js';
import {HOME_SECTION_DEFAULTS} from '../dist/home-sections.js';
import {homeMarkup} from '../dist/home-layout.js';

const catalog=JSON.parse(await readFile(new URL('../content/catalog.json',import.meta.url),'utf8'));
assert.doesNotThrow(()=>contentModel.assert(catalog),'Both articles and the table block validate');
const broken=structuredClone(catalog);broken.documents.find(doc=>doc.id==='desire-and-lived-experience').publishedAt='14 Oct';
assert.throws(()=>contentModel.assert(broken),'Article dates must be ISO calendar days');

for(const id of ['desire-and-lived-experience','design-after-the-screen']){
 assert(cardIds.includes(id),id+' is a route');assert(informationCards.some(card=>card.id===id),id+' returns home like an information page');
}
assert.equal(articleDate('2026-10-14'),'Oct 14, 2026','Dates keep the authored calendar day');

const first=cardDetail(getDocument('desire-and-lived-experience')),second=cardDetail(getDocument('design-after-the-screen'));
assert(first.includes('<time datetime="2026-10-14">Oct 14, 2026</time></p>')&&!first.includes('@Prem'),'The date sits under the title, without the author');
assert(first.indexOf('<h1')<first.indexOf('article-meta')&&first.indexOf('article-meta')<first.indexOf('article-body')&&first.indexOf('article-body')<first.indexOf('article-series'),'Title, then date; the series line is the first line of the text, not part of the title block');
assert(first.includes('Part 1 of 2. <a href="#design-after-the-screen">Part 2: Design after the screen</a>.'),'Part 1 links to Part 2');
assert(second.includes('Part 2 of 2. <a href="#desire-and-lived-experience">Part 1: The distance between desire and lived experience</a>.'),'Part 2 links back to Part 1');
assert(second.includes('<th scope="col">Product decides</th><th scope="col">Design shapes</th>')&&(second.match(/<tr>/g)||[]).length===5,'The decisions table renders a header and four rows');
assert(first.includes('<h2>The same evening, every era</h2>')&&first.includes('Nielsen Norman Group')&&second.includes('September 1991'),'Section headings and sources render');
assert(!first.includes('class="story content-grid"'),'Articles read in one column, not the information card grid');
assert(!/<(header|footer)\b/.test(first+second),'Article markup avoids header and footer tags, which carry fixed site chrome styles');

const home=homeWritingMarkup();
assert(home.includes('data-home-section="writing"')&&home.includes('>Writing and opinions</h2>'),'Home shows the writing section');
assert(home.indexOf('#desire-and-lived-experience')<home.indexOf('#design-after-the-screen'),'Writing follows the authored order');
assert.equal(HOME_SECTION_DEFAULTS.writing,true,'Writing can be toggled and starts visible');
const page=homeMarkup(cards,'masonry'),at=name=>page.indexOf(`data-home-section="${name}"`);
assert(at('about')<at('writing')&&at('writing')<at('testimonials'),'Writing sits after About and before Testimonials');
const styles=await readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8');assert(styles.includes("'article.css'"),'Article styles ship in the bundle');
{const css=await readFile(new URL('../dist/article.css',import.meta.url),'utf8'),tokensCss=await readFile(new URL('../dist/tokens.css',import.meta.url),'utf8'),design=await readFile(new URL('../dist/design-system.css',import.meta.url),'utf8'),focus=await readFile(new URL('../dist/project-media-focus.css',import.meta.url),'utf8');
assert(!css.includes('.article-header,.article-section,.article-sources{')&&css.includes('.article-section,.article-sources{max-width:var(--content-width-reading);margin-inline:auto}'),'The title is not centred in the reading column; the text is');
assert(css.includes(':root.article-title-body .article-header h1{font-size:var(--font-size-body);'),'A setting sets the article title at body size');
assert(tokensCss.includes('--card-title-rest-strength: 100%;')&&design.includes('.project-card:not(.flow-content) h2{color:color-mix(in oklab,var(--ink) var(--card-title-rest-strength),var(--surface-fill))}')&&focus.includes('.detail-caption-title{color:var(--ink)}'),'Card and project titles are the strongest text, above the results line');}
console.log('Articles passed: schema, ISO dates, routes, byline, series links, table, sources, one-column reading and home writing section.');
