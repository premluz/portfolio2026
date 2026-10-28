import assert from 'node:assert/strict';
import {APP_MAX_WIDTH,CONTENT_WIDTHS,pageTemplateForRoute,readContentWidth,contentRail,sectionRail,responsiveContentGutter} from '../dist/content-widths.js';
import {readHomeSectionSpans,initHomeSectionSettings,HOME_SECTION_DEFAULTS} from '../dist/home-sections.js';

assert.equal(APP_MAX_WIDTH,1920);assert.deepEqual(Object.keys(CONTENT_WIDTHS),['xsmall','small','medium','large']);
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
assert.equal(readContentWidth(storage,'home'),'medium');assert.equal(readContentWidth(storage,'details'),'medium');
values.set('prem-portfolio-full-width','true');assert.equal(readContentWidth(storage,'home'),'large','The old full-width preference migrates to Large');
values.set('prem-home-content-width','small');values.set('prem-detail-content-width','large');
assert.equal(readContentWidth(storage,'home'),'small');assert.equal(readContentWidth(storage,'details'),'large','The two pages retain independent widths');
values.set('prem-home-content-width','broken');assert.equal(readContentWidth(storage,'home'),'medium');
assert.equal(readContentWidth({getItem(){throw new Error('Denied');}},'home'),'medium');
for(const viewport of [320,390,800,1440,1920,2560,3840])for(const preset of Object.keys(CONTENT_WIDTHS)){
 const rail=contentRail(viewport,preset,responsiveContentGutter(viewport));
 assert(rail.app<=1920&&rail.shell<=rail.app);assert(rail.content<=CONTENT_WIDTHS[preset]);
 assert.equal(rail.content+rail.gutter*2,rail.shell,'The whole page uses one padded content container');
 for(const span of ['content','app','edge']){
  const section=sectionRail(rail,span);
  assert(section.width<=rail.app);assert.equal(section.offset+section.width/2,rail.content/2,'Breakouts stay centred on the same canvas');
  if(span==='content')assert.equal(section.width,rail.content);
  if(span==='app')assert.equal(section.width+rail.gutter*2,rail.app,'Full bleed can respect the app gutters');
  if(span==='edge')assert.equal(section.width,rail.app,'Edge-to-edge sections ignore content padding');
 }
}
assert.equal(contentRail(2560,'large',64).content,1760);
assert.equal(contentRail(2560,'xsmall',64).content,960,'Extra small is a 960px rail');
{const fs=await import('node:fs/promises'),read=file=>fs.readFile(new URL('../dist/'+file,import.meta.url),'utf8');const [css,article,html]=await Promise.all(['content-widths.css','article.css','index.html'].map(read));
assert(css.includes('--content-width-xs:960px;'),'The CSS twin of the Extra small width matches CONTENT_WIDTHS');assert(css.includes('--content-width-reading:600px;')&&article.includes('.article-section,.article-sources{max-width:var(--content-width-reading);margin-inline:auto}'),'Article text sits in a centred 600px reading column (the title does not)');
assert(article.includes(':root[data-article-images="page"] .article-section:is([data-block-type="image"],[data-block-type="video"]){max-width:none}'),'Article images can span the page width');
assert(html.includes('<select id="articleImages"><option value="text" selected>Text width · 600px</option><option value="page">Page width</option></select>'),'The Article images setting starts on the text width');
assert.equal((html.match(/<option value="xsmall">Extra small · 960px<\/option>/g)||[]).length,5,'Every page-width dropdown, including the navigation one, offers Extra small');
assert(html.includes('<select id="navContentWidth"><option value="page" selected>Same as the page</option>'),'The navigation width follows the page unless chosen');
assert(html.includes('<select id="chatWidth"><option value="default" selected>Default</option>'),'The chat page has its own width dropdown, starting on its default column');
const chatCss=await read('portfolio-assistant.css');assert(chatCss.includes('.assistant-thread{width:min(100%,var(--chat-width,900px))'),'The chat column follows --chat-width, 900px by default');}
assert.equal(sectionRail(contentRail(2560,'small',64),'edge').width,1920);
assert.equal(contentRail(320,'large',24).content,272,'Mobile fitting wins over a desktop maximum');

values.set('prem-home-section-spans',JSON.stringify({services:'edge',about:'app',experience:'invalid'}));
assert.deepEqual(readHomeSectionSpans(storage),{heading:'content',available:'content',strapline:'content',overview:'content',approach:'content',services:'edge',about:'app','about-timeline':'content',experience:'content','side-projects':'content',testimonials:'content',writing:'content'});
const nodes=Object.fromEntries(['services','about','experience','side-projects','testimonials'].map(id=>[id,{dataset:{homeSection:id},hidden:false}]));
const root={querySelectorAll:()=>Object.values(nodes),querySelector:()=>null};
const selects=Object.entries(nodes).map(([id])=>({dataset:{homeSpanControl:id},value:'content',addEventListener(type,fn){this[type]=fn;}}));
const panel={querySelectorAll:selector=>selector==='[data-home-span-control]'?selects:[]};
let allowed=true,changes=0;
const controller=initHomeSectionSettings(panel,{storage,getRoot:()=>root,canChange:()=>allowed,onChange:()=>changes++});
assert.equal(nodes.services.dataset.contentSpan,'edge');assert.equal(nodes.about.dataset.contentSpan,'app');
const experienceSelect=selects.find(select=>select.dataset.homeSpanControl==='experience');experienceSelect.value='edge';experienceSelect.change();assert.equal(nodes.experience.dataset.contentSpan,'edge','The Experience width setting applies to the independent Experience section');assert.equal(nodes['side-projects'].dataset.contentSpan,'edge','Side projects follow the Experience width setting');assert.equal(changes,1);
assert.deepEqual(controller.value,{...HOME_SECTION_DEFAULTS},'A bleed setting does not change which sections show');
assert.equal(readHomeSectionSpans(storage).experience,'edge','Breakout choices survive reload');
allowed=false;experienceSelect.value='content';experienceSelect.change();assert.equal(experienceSelect.value,'edge');assert.equal(changes,1,'In-flight route transitions retain their layout');
{const {readSections,applySections,HOME_SECTION_DEFAULTS}=await import('../dist/home-sections.js');
const mem=(entries={})=>({getItem:key=>entries[key]??null});
assert.equal(HOME_SECTION_DEFAULTS['side-projects'],true,'Side projects have their own switch, on by default');
assert.equal(readSections(mem({'prem-home-content':JSON.stringify({experience:false})}))['side-projects'],false,'A choice saved when the two shared one switch applies to both');
assert.equal(readSections(mem({'prem-home-content':JSON.stringify({experience:false,'side-projects':true})}))['side-projects'],true,'Once split, each keeps its own choice');
const node=id=>({dataset:{homeSection:id},hidden:false}),experience=node('experience'),side=node('side-projects'),list=[experience,side];
const root={querySelectorAll:()=>list,querySelector:()=>null};
applySections(root,{...HOME_SECTION_DEFAULTS,'side-projects':false},{experience:'app'});
assert.equal(experience.hidden,false);assert.equal(side.hidden,true,'Hiding Side projects leaves Experience showing');
assert.equal(experience.dataset.contentSpan,'app','The Experience width setting applies to the independent section');assert.equal(side.dataset.contentSpan,'app','Side projects follow the Experience width setting');}
console.log('Content widths passed: independent presets, legacy migration, mobile fitting, 1920px app cap, gutter and edge breakouts, centring, persistence and transition guards.');

assert.equal(readContentWidth(storage,'content'),'medium','A new content-page preset is independent of the project width');
values.set('prem-content-page-width','small');values.set('prem-detail-content-width','large');
assert.equal(readContentWidth(storage,'content'),'small');assert.equal(readContentWidth(storage,'details'),'large');
assert.equal(pageTemplateForRoute('work',['tracr']),'home');assert.equal(pageTemplateForRoute('tracr',['tracr']),'project-details');
for(const route of ['about','contact','assistant'])assert.equal(pageTemplateForRoute(route,['tracr']),'content');
