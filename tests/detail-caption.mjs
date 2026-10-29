import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {detailCaptionLines,detailCaptionInner,DEFAULT_CAPTION_FLAGS} from '../dist/detail-caption.js';

// The project page caption reads the Cards settings: title/category, company and year, then the authored intro and summary.
const data={client:'Gala',title:'Made Web3 invisible',category:'Web3 film platform',summary:'End-to-end 0 → 1',year:'2025',intro:'I designed a decentralised platform'};
const flags=extra=>({...DEFAULT_CAPTION_FLAGS,...extra});
assert.deepEqual(detailCaptionLines(data,flags({})),{eyebrow:'',title:'Made Web3 invisible',lead:'',results:'End-to-end 0 → 1',intro:'I designed a decentralised platform'},'Default: title, intro and summary, without company-year');
assert.deepEqual(detailCaptionLines(data,flags({clientAbove:true,showCategory:true})),{eyebrow:'Gala',title:'Web3 film platform',lead:'',results:'End-to-end 0 → 1',intro:'I designed a decentralised platform'},'Company above the category');
assert.equal(detailCaptionLines(data,flags({clientInline:true,showCategory:true})).title,'Gala. Web3 film platform','Company leads the title');
assert.equal(detailCaptionLines(data,flags({clientAbove:true,clientInline:true})).title,'Made Web3 invisible','Above wins over inline, as on the cards');
assert.equal(detailCaptionLines(data,flags({companyYear:true})).lead,'Gala · 2025','Company and year replace the results line');
assert.equal(detailCaptionLines(data,flags({companyYear:true})).results,'End-to-end 0 → 1','The summary stays on the caption, under the intro');
assert.equal(detailCaptionLines(data,flags({companyYear:true,showDescription:false})).results,'','A hidden description hides the results line too');
assert.equal(detailCaptionLines(data,flags({showClient:false,clientAbove:true})).eyebrow,'','A hidden company shows nowhere');
assert.deepEqual(detailCaptionLines(data,flags({showTitle:false,showDescription:false})),{eyebrow:'',title:'',lead:'',results:'',intro:'I designed a decentralised platform'},'Title and description can be hidden; the intro stays');
assert.equal(detailCaptionLines({...data,category:''},flags({showCategory:true})).title,'Made Web3 invisible','No category falls back to the title');
assert.equal(detailCaptionInner({eyebrow:'<b>',title:'T',lead:''}),'<p class="detail-caption-client">&lt;b&gt;</p><h2 class="detail-caption-title">T</h2>','The detail caption title is a semantic heading and text remains escaped');
assert.equal(detailCaptionInner({eyebrow:'',title:'T',lead:'L',intro:'I',results:'R'}),'<h2 class="detail-caption-title">T</h2><p class="detail-caption-lead">L</p><p class="detail-caption-intro">I</p><p class="detail-caption-results">R</p>','The caption orders title, company-year, intro and summary');
const detailStyles=await readFile(new URL('../dist/project-media-focus.css',import.meta.url),'utf8');
assert(detailStyles.includes('.detail-caption-lead{color:var(--eyebrow-ink)}'),'The detail client and year use the quieter eyebrow ink');
assert(detailStyles.includes('.surface.detail[data-card-orientation]:not(.text-only-detail)>.detail-caption{display:block;grid-column:1;grid-row:1;width:100%;max-width:var(--page-intro-width);margin:0 0 var(--space-page-rhythm-md)}')&&detailStyles.includes('.detail-caption :is(p,h2){margin:0;font-size:var(--font-size-project-summary);')&&detailStyles.includes('.detail-caption-title + .detail-caption-lead{margin-top:var(--space-title-eyebrow)}')&&detailStyles.includes('.detail-caption .detail-caption-results{margin-top:var(--space-hero-heading-content);')&&detailStyles.includes('.surface.detail[data-card-orientation]:not(.text-only-detail)>.project-summary{display:none;')&&detailStyles.includes('>.detail-layout>.description{grid-column:1;grid-row:3}')&&detailStyles.includes(':root[data-heading-style="editorial"] .detail-caption .detail-caption-title{font-size:var(--heading-title-size);'),'The detail caption uses the first-column width, matches the Home carousel rhythm before the image, keeps the card title rhythm, puts intro and summary above the image, then starts Context below it');
console.log('Detail caption passed: company position, title or category, results or company and year, hidden parts, fallbacks and escaping.');
