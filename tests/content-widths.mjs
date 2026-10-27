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
assert(css.includes('--content-width-xs:960px;'),'The CSS twin of the Extra small width matches CONTENT_WIDTHS');assert(article.includes('.article-detail .article{max-width:var(--content-width-xs);'),'A blog article reads at the Extra small width');
assert.equal((html.match(/<option value="xsmall">Extra small · 960px<\/option>/g)||[]).length,3,'Every page-width dropdown offers Extra small');}
assert.equal(sectionRail(contentRail(2560,'small',64),'edge').width,1920);
assert.equal(contentRail(320,'large',24).content,272,'Mobile fitting wins over a desktop maximum');

values.set('prem-home-section-spans',JSON.stringify({services:'edge',about:'app',experience:'invalid'}));
assert.deepEqual(readHomeSectionSpans(storage),{heading:'content',available:'content',strapline:'content',overview:'content',approach:'content',services:'edge',about:'app','about-timeline':'content',experience:'content',testimonials:'content',writing:'content'});
const nodes=Object.fromEntries(['services','about','experience','testimonials'].map(id=>[id,{dataset:{homeSection:id},hidden:false}]));
const root={querySelectorAll:()=>Object.values(nodes),querySelector:()=>({querySelectorAll:()=>[nodes.about,nodes.experience]})};
const selects=Object.entries(nodes).map(([id])=>({dataset:{homeSpanControl:id},value:'content',addEventListener(type,fn){this[type]=fn;}}));
const panel={querySelectorAll:selector=>selector==='[data-home-span-control]'?selects:[]};
let allowed=true,changes=0;
const controller=initHomeSectionSettings(panel,{storage,getRoot:()=>root,canChange:()=>allowed,onChange:()=>changes++});
assert.equal(nodes.services.dataset.contentSpan,'edge');assert.equal(nodes.about.dataset.contentSpan,'app');
selects[2].value='edge';selects[2].change();assert.equal(nodes.experience.dataset.contentSpan,'edge');assert.equal(changes,1);
assert.deepEqual(controller.value,{...HOME_SECTION_DEFAULTS},'A bleed setting does not change which sections show');
assert.equal(readHomeSectionSpans(storage).experience,'edge','Breakout choices survive reload');
allowed=false;selects[2].value='content';selects[2].change();assert.equal(selects[2].value,'edge');assert.equal(changes,1,'In-flight route transitions retain their layout');
console.log('Content widths passed: independent presets, legacy migration, mobile fitting, 1920px app cap, gutter and edge breakouts, centring, persistence and transition guards.');

assert.equal(readContentWidth(storage,'content'),'medium','A new content-page preset is independent of the project width');
values.set('prem-content-page-width','small');values.set('prem-detail-content-width','large');
assert.equal(readContentWidth(storage,'content'),'small');assert.equal(readContentWidth(storage,'details'),'large');
assert.equal(pageTemplateForRoute('work',['tracr']),'home');assert.equal(pageTemplateForRoute('tracr',['tracr']),'project-details');
for(const route of ['about','contact','assistant'])assert.equal(pageTemplateForRoute(route,['tracr']),'content');
