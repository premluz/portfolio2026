import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {settingsSchema,exportSettings,parseSettings,importSettings,mountSettingsTransfer,MAX_SETTINGS_BYTES} from '../dist/settings-transfer.js';

const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const utilityCSS=await readFile(new URL('../dist/portfolio-assistant.css',import.meta.url),'utf8');
assert(html.includes('<div class="corner-controls" hidden'),'Public utility controls remain hidden in the HTML');
assert(utilityCSS.includes('.corner-controls[hidden]{display:none!important}'),'The utility container keeps its hidden state despite the display rule');
const panelHTML=html.slice(html.indexOf('<aside id="settings"'),html.indexOf('</aside>'));
const attributes=text=>Object.fromEntries([...text.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(match=>[match[1],match[2]??'']));
const camel=text=>text.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
function control(tag,attrs,body=''){
 const input={tagName:tag.toUpperCase(),id:attrs.id||'',type:attrs.type,value:attrs.value||'',checked:'checked' in attrs,min:attrs.min||'',max:attrs.max||'',dataset:Object.fromEntries(Object.entries(attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[camel(key.slice(5)),value])),attributes:attrs,listeners:new Map(),files:[],clicks:0,
  getAttribute(key){return this.attributes[key];},click(){this.clicks++;},addEventListener(type,fn){this.listeners.set(type,fn);},dispatchEvent(event){this.events??=[];this.events.push(event.type);this.listeners.get(event.type)?.(event);this['on'+event.type]?.(event);}};
 if(tag==='select'){input.options=[...body.matchAll(/<option([^>]*)>/g)].map(match=>attributes(match[1]));input.value=input.options.find(option=>'selected' in option)?.value||input.options[0].value;}
 return input;
}
const controls=[];
for(const match of panelHTML.matchAll(/<input\b([^>]*)>/g)){const attrs=attributes(match[1]);if(['checkbox','range'].includes(attrs.type))controls.push(control('input',attrs));}
for(const match of panelHTML.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g))controls.push(control('select',attributes(match[1]),match[2]));
for(const match of panelHTML.matchAll(/<button\b([^>]*)>/g)){const attrs=attributes(match[1]);if(attrs.role==='switch')controls.push(control('button',attrs));}
for(const key of ['typeSize','spaceSize','typeTracking','typeLeading'])controls.push(control('select',{'data-design-control':key},'<option value="small">Small</option><option value="medium" selected>Medium</option><option value="large">Large</option>'));
for(const key of ['headingWeight','bodyWeight'])controls.push(control('select',{'data-design-control':key},'<option value="thin">Thin (300)</option><option value="regular" selected>Regular (400)</option><option value="bold">Bold (500)</option>'));
const status={textContent:''},file={value:'',files:[],click(){}},exportButton={},importButton={},extras=new Map([['#settingsTransferStatus',status],['#settingsImportFile',file],['#settingsExport',exportButton],['#settingsImport',importButton]]);
const panel={querySelectorAll:()=>controls,querySelector:selector=>extras.get(selector),addEventListener(){}};
const rootControls=new Map([['#themeToggle',{}],['#soundPreference',control('button',{'aria-checked':'false'})],['#animationPreference',control('button',{'aria-checked':'true'})]]);
const root={documentElement:{dataset:{themePreference:'system'}},querySelector:selector=>rootControls.get(selector)};
const map=new Map([['prem-assistant-session','keep conversation'],['unrelated-key','keep'],['prem-card-padding-left','24']]);
const storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};
const schema=settingsSchema(panel,root);
assert.equal(schema.size,controls.length+3,'Every developer control is covered, including hidden and generated controls');
const preset=exportSettings(schema,storage,new Date('2026-10-12T12:00:00Z'));
assert.equal(preset.settings.theme,'system');assert.equal(preset.settings.cardPaddingRight,null,'Automatic design-system padding stays automatic');assert.equal(preset.settings.cardPaddingLeft,40);
assert.equal(preset.settings.cardShowClient,true);assert.equal(preset.settings.cardShowTitle,true);assert.equal(preset.settings.cardShowDescription,true,'Card text visibility controls are included in exported settings');
assert(!JSON.stringify(preset).includes('conversation'));assert(!schema.has('roomFile')&&!schema.has('gesturePreference'));
const values=parseSettings(JSON.stringify(preset),schema);assert.equal(values.size,schema.size);
importSettings(values,schema,storage);
assert.equal(map.get('prem-home-product-display'),'carousel','Carousel is the default product display and travels with presets');assert.equal(map.get('prem-home-layout'),'masonry');assert.equal(map.get('prem-home-columns'),'2');assert.equal(map.get('prem-theme'),'system');assert.equal(map.get('prem-hide-card-background'),'false');assert.equal(map.get('prem-hero-timeline-enabled'),'true');assert.equal(map.get('prem-hero-description-enabled'),'false');assert(!map.has('prem-card-padding-right'));
assert.equal(map.get('prem-card-show-client'),'true');assert.equal(map.get('prem-card-show-title'),'true');assert.equal(map.get('prem-card-show-description'),'true');
assert.deepEqual(JSON.parse(map.get('prem-carousel-settings')),{tilt:24,spread:100,depth:100,gap:32,speed:100,peek:12},'Carousel knobs travel together in exported and imported presets');
const legacyCard=parseSettings(JSON.stringify({...preset,settings:{hideCardTitles:true}}),schema);importSettings(legacyCard,schema,storage);assert.equal(map.get('prem-card-show-title'),'false','Older presets with the combined title toggle migrate to the project-title control');
const legacyHero=parseSettings(JSON.stringify({...preset,settings:{heroTimelineEnabled:false}}),schema);importSettings(legacyHero,schema,storage);assert.equal(map.get('prem-hero-timeline-enabled'),'false');assert.equal(map.get('prem-hero-description-enabled'),'true','Old single-toggle presets retain their paragraph selection as the new description');assert.equal(map.get('prem-hero-timeline-text-enabled'),'false','Presets without the text toggle make it follow the old timeline toggle');
assert.equal(map.get('prem-composer-glow'),'true','Composer ambience defaults on and travels with settings presets');
assert.equal(map.get('prem-contextual-buttons'),'inline','Contextual button placement is included in settings exports');const integrated=parseSettings(JSON.stringify({...preset,settings:{contextualButtons:'composer'}}),schema);importSettings(integrated,schema,storage);assert.equal(map.get('prem-contextual-buttons'),'composer');
assert.equal(map.get('prem-menu-gesture-visible'),'false');assert.equal(map.get('prem-menu-info-visible'),'false');assert.equal(map.get('prem-menu-animation-visible'),'false');
const noComposerGlow=parseSettings(JSON.stringify({...preset,settings:{showComposerGlow:false}}),schema);importSettings(noComposerGlow,schema,storage);assert.equal(map.get('prem-composer-glow'),'false','The ambient composer glow preference can be imported as hidden');
assert.deepEqual(JSON.parse(map.get('prem-design-system')),{typeSize:'medium',spaceSize:'medium',typeTracking:'medium',typeLeading:'medium',headingWeight:'regular',bodyWeight:'regular'});
const legacyTypography=parseSettings(JSON.stringify({...preset,settings:{'design.typeWeight':'large'}}),schema);importSettings(legacyTypography,schema,storage);assert.deepEqual(JSON.parse(map.get('prem-design-system')),{typeSize:'medium',spaceSize:'medium',typeTracking:'medium',typeLeading:'medium',headingWeight:'bold',bodyWeight:'bold'},'Earlier settings with one shared weight migrate to both independent weight choices');
assert.equal(JSON.parse(map.get('prem-motion-settings')).duration,400);assert.equal(map.get('prem-assistant-session'),'keep conversation');assert.equal(map.get('unrelated-key'),'keep');

const before=JSON.stringify([...map]);
for(const settings of [{duration:99},{cardRounding:129},{intensity:'70'},{fullBleed:'true'},{homeViewSelect:'unknown'},{'design.typeSize':'huge'}]){
 assert.throws(()=>parseSettings(JSON.stringify({...preset,settings:{cardGap:20,...settings}}),schema),/Invalid setting/);assert.equal(JSON.stringify([...map]),before,'Invalid files cannot partially apply valid fields');
}
assert.throws(()=>parseSettings('{',schema),/valid JSON/);assert.throws(()=>parseSettings(JSON.stringify({...preset,version:2}),schema),/not supported/);assert.throws(()=>parseSettings(JSON.stringify({settings:{}}),schema),/portfolio settings/);assert.throws(()=>parseSettings(' '.repeat(MAX_SETTINGS_BYTES+1),schema),/64 KB/);
assert.throws(()=>parseSettings(JSON.stringify({...preset,settings:[]}),schema),/missing/);
const partial=parseSettings(JSON.stringify({...preset,settings:{bleedTop:96,bleedBottom:120,unknownFutureSetting:'ignored'}}),schema);assert.equal(partial.size,2);importSettings(partial,schema,storage);assert.equal(JSON.parse(map.get('prem-bleed-image')).bottom,120);assert.equal(JSON.parse(map.get('prem-bleed-image')).settingsVersion,1);
assert(!map.has('unknownFutureSetting'));assert.throws(()=>importSettings(values,schema,null),/unavailable/);

// A storage quota error rolls back earlier writes; unrelated data is untouched.
const saved=new Map(map);let writes=0;
const quota={...storage,setItem(key,value){if(++writes===2)throw Error('quota');storage.setItem(key,value);}};
assert.throws(()=>importSettings(new Map([['homeViewSelect','flip'],['cardRounding',10]]),schema,quota),/cancelled/);assert.deepEqual(map,saved);

// Reload import avoids competing reflows and works from any route. Motion knobs
// restore via their real input event path, including disabled image controls.
let reloads=0,ready=true;mountSettingsTransfer(panel,{root,storage,canChange:()=>ready,reload:()=>reloads++});
for(const key of ['duration','stretch','ripple','slow'])assert(schema.get(key).input.events?.includes(key==='slow'?'change':'input'));
file.files=[{size:100,text:async()=>JSON.stringify({...preset,settings:{homeLayoutSelect:'regular',gridColumns:'4',cardBackground:false}})}];await file.onchange();assert.equal(reloads,1);assert.equal(map.get('prem-home-layout'),'regular');assert.equal(map.get('prem-home-columns'),'4');assert.equal(map.get('prem-hide-card-background'),'true');
ready=false;await file.onchange();assert.equal(reloads,1);assert(status.textContent.includes('transition'));ready=true;
file.files=[{size:1,text:async()=>'{'}];await file.onchange();assert.equal(reloads,1);assert(status.textContent.includes('valid JSON'));assert.equal(file.value,'');

const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes("saved.settingsVersion!==1&&saved.top===96&&saved.bottom===74"),'Explicit imported image padding bypasses the old-default migration');
assert(app.includes("['bottom',120]"),'Imported bottom padding keeps the exposed slider range after reload');
assert(app.indexOf('mountSettingsTransfer($(\'#settings\')')>app.lastIndexOf('initEnvironment('),'Restoration runs after handlers and environment are ready');
console.log('Settings transfer passed: complete control coverage, validated JSON, exact storage mappings, automatic padding, motion restoration, partial/future files, quota rollback, import reload and chat isolation.');

assert.equal(map.get('prem-content-page-width'),'medium');
assert.equal(map.get('prem-services-carousel-alignment'),'full-bleed');
