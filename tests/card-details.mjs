import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {card} from '../dist/card-renderer.js';
import {cards} from '../dist/documents.js';

// Projects carry a status and discipline tags into their card markup (hidden by CSS until Card details is on).
const tracr=cards.find(item=>item.id==='tracr');
assert.equal(tracr.projectStatus,'Launched');assert.deepEqual(tracr.disciplines,['Design system','Product','Brand']);
const html=card(tracr,0,'regular',{link:false});
assert(html.includes('<span class="card-status" data-status="launched">Launched</span>'),'Status pill is in the markup');
assert(html.indexOf('card-status')<html.indexOf('card-client')&&html.indexOf('card-client')<html.indexOf('<h2>')&&html.indexOf('project-summary')<html.indexOf('card-tags'),'Order is status, client, title, results, tags');
assert((html.match(/<span>[^<]+<\/span>/g)||[]).some(span=>span==='<span>Design system</span>'),'Each discipline is its own span');
const hostile=card({...tracr,projectStatus:'R&D',disciplines:['<b>x</b>']},0,'regular',{link:false});
assert(hostile.includes('data-status="randd"')&&hostile.includes('&lt;b&gt;x&lt;/b&gt;'),'Status and tags are escaped');
assert(!card({...tracr,projectStatus:undefined,disciplines:[]},0,'regular',{link:false}).match(/card-status|card-tags/),'Missing data renders neither element');
assert(html.includes('<p class="card-tags text-eyebrow">'),'The tag row uses the eyebrow role, not mono');
const detail=(await import('../dist/card-renderer.js')).cardDetail(tracr,'regular');
assert(/<dt class="text-eyebrow">Context<\/dt>/.test(detail),'Detail fact labels use the eyebrow role');
for(const item of cards.filter(entry=>!entry.body&&entry.id!=='about'))assert(item.disciplines.length>0,`${item.id} has disciplines`);

// One gradient class: the About tint and the card results share it, and its colours are tokens in both themes.
const [design,about,tokens,card_css]=await Promise.all(['design-system.css','about-page.css','tokens.css','card-details.css'].map(file=>readFile(new URL('../dist/'+file,import.meta.url),'utf8')));
const eyebrow=(await readFile(new URL('../dist/design-system.css',import.meta.url),'utf8')).match(/\.text-eyebrow\{[^}]*\}/)?.[0]||'';
for(const part of ['--font-size-caption','--eyebrow-weight','--eyebrow-tracking','--line-height-label','--eyebrow-ink','uppercase'])assert(eyebrow.includes(part),`.text-eyebrow sets ${part}`);
assert(/\.text-gradient,\.about-highlight,body\.card-details[^{]*\.project-summary\{[^}]*linear-gradient\(90deg,var\(--text-gradient-from\),var\(--text-gradient-to\)\)/.test(design),'The gradient is defined once, as .text-gradient');
assert(!/about-highlight\{/.test(about)&&!/--about-highlight/.test(about),'About no longer carries its own copy');
assert((tokens.match(/--text-gradient-from:/g)||[]).length===2&&(tokens.match(/--text-gradient-to:/g)||[]).length===2,'Light and dark values exist');
assert(/body\.card-client-above:not\(\.card-client-hidden\)[^{]*\.card-title-hidden|body\.card-client-above:not\(\.card-client-hidden\) \.project-card\.image-card>\.card-copy>h2>\.card-title-client\{display:none\}/.test(card_css),'Above hides the inline client prefix so it wins over inline');
console.log('Card details passed: status and tags markup and order, escaping, missing data, every project has disciplines, one shared gradient class.');
