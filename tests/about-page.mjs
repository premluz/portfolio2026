import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {content} from '../dist/content/local.js';
import {aboutBodyMarkup,aboutHeroMarkup,aboutTraitsMarkup,aboutUnusualMarkup,highlightedText,ABOUT_HIGHLIGHTS} from '../dist/about-page.js';
import {traitIllustration} from '../dist/about-illustrations.js';
import {cardDetail} from '../dist/card-renderer.js';

const card=content.getCard('about'),traits=content.get('about-traits'),unusual=content.get('about-unusual');
const html=aboutBodyMarkup(card);
assert.equal(card.body.length,3,'The intro keeps its three authored paragraphs');
assert(html.indexOf('about-hero')<html.indexOf('about-traits')&&html.indexOf('about-traits')<html.indexOf('about-unusual'),'Hero, traits and unusual things render in the authored order');
assert(aboutHeroMarkup(card).includes('class="about-portrait"')&&aboutHeroMarkup(card).includes('prem'),'The portrait image renders beside the intro');
assert.equal((html.match(/class="about-highlight"/g)||[]).length,ABOUT_HIGHLIGHTS.length,'Both authored phrases are tinted');
assert.equal(highlightedText('<b>x</b> & Web3, DeFi, blockchain, IoT & Telco, y'),'&lt;b&gt;x&lt;/b&gt; &amp; <span class="about-highlight">Web3, DeFi, blockchain, IoT &amp; Telco,</span> y','Text is escaped around highlights');

const traitIds=traits.blocks.map(block=>block.id);
assert.equal(traitIds.length,6);
for(const id of traitIds){assert(traitIllustration(id).startsWith('<svg'),'Every trait has a drawn illustration: '+id);assert(aboutTraitsMarkup(traits).includes(traitIllustration(id)));}
const traitsHTML=aboutTraitsMarkup(traits);
assert(traitsHTML.includes('data-component="services"')&&traitsHTML.includes('class="home-content-section home-services about-traits"')&&(traitsHTML.match(/class="home-service-card about-trait"/g)||[]).length===6,'Traits reuse the global card section, so Card layout and Show card apply');
assert(traitsHTML.includes('data-card-rail')&&traitsHTML.includes('aria-label="Previous traits"'),'Traits can switch between grid and carousel');
assert(!/<svg[^>]*style=|#[0-9a-f]{3,6}\b/i.test(traitIdsMarkup()),'Illustrations carry no inline style or hex colours');
function traitIdsMarkup(){return traitIds.map(traitIllustration).join('');}

const items=unusual.blocks.filter(block=>block.type==='info-card'),list=aboutUnusualMarkup(unusual);
assert.equal(items.length,5);
assert.equal((list.match(/<li class="about-unusual-item"/g)||[]).length,5,'Each unusual thing renders as one item');
for(const block of items){const asset=content.getAsset(block.mediaId);assert(asset?.url.startsWith('assets/'),'Photo asset is registered: '+block.id);assert(list.includes(block.title));}
assert(list.includes('data-original-image="assets/hipnotherapy.jpg"')&&list.includes('data-media-srcset'),'Photos use responsive variants');

const detail=cardDetail(card);
assert(detail.includes('about-detail')&&detail.includes('about-traits'),'The About page renders its own sections');
const aboutIds=[...detail.matchAll(/data-about-section="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(aboutIds,['hero','title','traits','unusual','approach','services','about','about-timeline','experience','side-projects','writing','testimonials'],'Every About component, including the Home ones, is addressable by the About settings in page order');
assert(!detail.includes('data-home-section'),'Home components on About answer to the About settings, never the Home ones');
assert(!new RegExp('id="([^"]+)"[\\s\\S]*id="\\1"').test(detail),'Reusing Home components adds no duplicate ids');
const css=await readFile(new URL('../dist/about-page.css',import.meta.url),'utf8'),styles=await readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8');
assert(styles.includes("'about-page.css'")&&styles.includes("'about-illustrations.css'"),'About stylesheets ship in the client bundle');
assert(css.includes('.surface.detail.about-detail{padding-inline:0}'),'About content spans the page content width');
for(const rule of ['.about-unusual-caption h3{','.about-unusual-caption p{'])assert(css.slice(css.indexOf(rule)).split('}')[0].includes('font-size:var(--font-size-body)'),'Unusual captions use body-size text: '+rule);
const sections=await readFile(new URL('../dist/home-sections.css',import.meta.url),'utf8');
assert(sections.includes('.home-service-card h3{margin:0 0 var(--space-3);font-size:var(--font-size-body)'),'Card titles are body-size text');
assert(sections.includes('.home-services[data-card-background="false"] .home-service-card{padding:0;background:transparent;border:0;border-radius:0}'),'Show card off removes the card surface');
console.log('About page passed: authored order, escaped highlights, six drawn traits in the shared card section, body-size text, full content width, five responsive photos and bundled styles.');

const {ABOUT_SECTION_DEFAULTS,initAboutSectionSettings}=await import('../dist/about-sections.js');
const store=new Map(),aboutStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
const aboutNodes=Object.fromEntries(Object.keys(ABOUT_SECTION_DEFAULTS).map(id=>[id,{dataset:{aboutSection:id},hidden:false}]));
const aboutRoot={querySelectorAll:selector=>selector==='[data-about-section]'?Object.values(aboutNodes):[],querySelector:()=>null};
const aboutControls=Object.fromEntries(Object.keys(ABOUT_SECTION_DEFAULTS).map(id=>[id,{dataset:{aboutSectionControl:id},checked:false,addEventListener(type,listener){this[type]=listener;}}]));
const aboutPanel={querySelectorAll:selector=>selector==='[data-about-section-control]'?Object.values(aboutControls):[]};
const aboutSettings=initAboutSectionSettings(aboutPanel,{storage:aboutStorage,getRoot:()=>aboutRoot});
assert.deepEqual(['hero','title','traits','unusual'].filter(id=>!aboutNodes[id].hidden),['hero','title','traits','unusual'],'About keeps its own components on by default');
assert(Object.keys(aboutNodes).filter(id=>!['hero','title','traits','unusual'].includes(id)).every(id=>aboutNodes[id].hidden),'Home components start hidden on About');
aboutControls.title.checked=false;aboutControls.title.change();assert(aboutNodes.title.hidden&&!aboutNodes.hero.hidden,'The About heading switches off on its own, keeping the intro and portrait');aboutControls.title.checked=true;aboutControls.title.change();
aboutControls.testimonials.checked=true;aboutControls.testimonials.change();
assert(!aboutNodes.testimonials.hidden&&JSON.parse(store.get('prem-about-content')).testimonials===true,'A Home component can be shown on About and the choice persists under its own key');
assert(!store.has('prem-home-content'),'Changing About never writes the Home settings');
assert.equal(aboutSettings.value.hero,true);
