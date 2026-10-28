import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {detailCaptionLines,detailCaptionInner,DEFAULT_CAPTION_FLAGS} from '../dist/detail-caption.js';

// The project page caption reads the Cards settings: company position, title or category, results or "Company · Year".
const data={client:'Gala',title:'Made Web3 invisible',category:'Web3 film platform',summary:'End-to-end 0 → 1',year:'2025',pageTitle:'Made Web3 wiring invisible for fans'};
const flags=extra=>({...DEFAULT_CAPTION_FLAGS,...extra});
assert.deepEqual(detailCaptionLines(data,flags({})),{eyebrow:'',title:'Made Web3 invisible',lead:'End-to-end 0 → 1',results:'',intro:'Made Web3 wiring invisible for fans'},'Default: title then results, no company line');
assert.deepEqual(detailCaptionLines(data,flags({clientAbove:true,showCategory:true})),{eyebrow:'Gala',title:'Web3 film platform',lead:'End-to-end 0 → 1',results:'',intro:'Made Web3 wiring invisible for fans'},'Company above the category');
assert.equal(detailCaptionLines(data,flags({clientInline:true,showCategory:true})).title,'Gala. Web3 film platform','Company leads the title');
assert.equal(detailCaptionLines(data,flags({clientAbove:true,clientInline:true})).title,'Made Web3 invisible','Above wins over inline, as on the cards');
assert.equal(detailCaptionLines(data,flags({companyYear:true})).lead,'Gala · 2025','Company and year replace the results line');
assert.equal(detailCaptionLines(data,flags({companyYear:true})).results,'End-to-end 0 → 1','The results line stays on the caption, under Company · Year');
assert.equal(detailCaptionLines(data,flags({companyYear:true,showDescription:false})).results,'','A hidden description hides the results line too');
assert.equal(detailCaptionLines(data,flags({showClient:false,clientAbove:true})).eyebrow,'','A hidden company shows nowhere');
assert.deepEqual(detailCaptionLines(data,flags({showTitle:false,showDescription:false})),{eyebrow:'',title:'',lead:'',results:'',intro:'Made Web3 wiring invisible for fans'},'Title and description can be hidden; the headline sentence stays');
assert.equal(detailCaptionLines({...data,category:''},flags({showCategory:true})).title,'Made Web3 invisible','No category falls back to the title');
assert.equal(detailCaptionInner({eyebrow:'<b>',title:'T',lead:''}),'<p class="detail-caption-client">&lt;b&gt;</p><h2 class="detail-caption-title">T</h2>','The detail caption title is a semantic heading and text remains escaped');
assert(detailCaptionInner({eyebrow:'',title:'T',lead:'L',results:'R'}).endsWith('<p class="detail-caption-results">R</p>'),'The results line renders last');
assert(detailCaptionInner({eyebrow:'',title:'T',lead:'',results:'',intro:'I'}).endsWith('<p class="detail-caption-intro">I</p>'),'The headline sentence renders last, in the caption');
const detailStyles=await readFile(new URL('../dist/project-media-focus.css',import.meta.url),'utf8');
assert(detailStyles.includes('.detail-caption :is(p,h2){margin:0;font-size:var(--font-size-project-summary);')&&detailStyles.includes(':root[data-heading-style="editorial"] .detail-caption .detail-caption-title{font-size:var(--heading-title-size);'),'The semantic detail heading keeps the default caption treatment and follows Editorial heading tokens');
console.log('Detail caption passed: company position, title or category, results or company and year, hidden parts, fallbacks and escaping.');
