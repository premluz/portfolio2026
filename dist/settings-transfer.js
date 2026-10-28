import {designSettingControls} from './design-system.js';

const FORMAT='prem-portfolio-settings';
const VERSION=1;
export const MAX_SETTINGS_BYTES=64*1024;
const motionKey='prem-motion-settings';
const direct={
 showFooterContactLinks:'prem-footer-contact-links',showFooter:'prem-show-footer',splitProjectControls:'prem-split-project-controls',
 homeProductDisplay:'prem-home-product-display',contentPageWidth:'prem-content-page-width',servicesCarouselAlignment:'prem-services-carousel-alignment',servicesLayout:'prem-services-layout',servicesCardBackground:'prem-services-card-background',testimonialCardBackground:'prem-testimonial-card-background',aboutGalleryOrientation:'prem-about-gallery-orientation',aboutGalleryVariant:'prem-about-gallery-variant',carouselDescriptionInCard:'prem-carousel-description-in-card',heroCarousel:'prem-hero-carousel',heroTimelineEnabled:'prem-hero-timeline-enabled',heroTimelineTextEnabled:'prem-hero-timeline-text-enabled',heroDescriptionEnabled:'prem-hero-description-enabled',heroTimelineMode:'prem-hero-timeline-mode',homeViewSelect:'prem-home-view',homeLayoutSelect:'prem-home-layout',gridColumns:'prem-home-columns',singleColumnCardPosition:'prem-one-column-card-position',multiColumnCardPosition:'prem-multi-column-card-position',cardCopyHover:'prem-card-copy-hover-desktop',homeContentWidth:'prem-home-content-width',
 carouselNativeSnap:'prem-carousel-native-snap',hideCardColor:'prem-hide-card-color',cardClientInline:'prem-card-client-inline',cardClientAbove:'prem-card-client-above',cardShowCategory:'prem-card-show-category',cardDetails:'prem-card-details',hideCardHover:'prem-hide-card-hover',cardHoverEffect:'prem-card-hover-effect',ambientLightMovement:'prem-ambient-light-movement',ambientHoverSpeed:'prem-ambient-hover-speed',ambientColorSource:'prem-ambient-color-source',ambientGlowStrength:'prem-ambient-glow-strength',projectBackdrop:'prem-project-backdrop',navPosition:'prem-nav-position',plainNav:'prem-plain-nav',plainCards:'prem-plain-cards',featureStage:'prem-feature-stage',showComposerGlow:'prem-composer-glow',cardShowClient:'prem-card-show-client',cardShowTitle:'prem-card-show-title',cardShowDescription:'prem-card-show-description',cardTitleScale:'prem-card-title-scale',cardPaddingSame:'prem-card-padding-uniform',cardPaddingAll:'prem-card-padding-all',cardRounding:'prem-card-rounding',cardGap:'prem-card-gap',
 fullBleed:'prem-full-bleed',imageRounding:'prem-image-rounding',showFullScreenOption:'prem-show-full-screen-option',detailHeadingBeside:'prem-detail-heading-beside',wideHero:'prem-wide-hero',detailContentWidth:'prem-detail-content-width',ambientDetailGlow:'prem-ambient-detail-glow',
 hideBranding:'prem-hide-branding',glassStyle:'prem-glass-style',assistantPresentation:'prem-assistant-presentation',chatInlineComposer:'prem-chat-inline-composer',chatWidth:'prem-chat-width',characterAssistant:'prem-character-assistant',navShowWork:'prem-nav-show-work',navShowAbout:'prem-nav-show-about',navShowLab:'prem-nav-show-lab',navShowContact:'prem-nav-show-contact',navShowIndex:'prem-nav-show-index',navChatLabel:'prem-nav-chat-label',showMascot:'prem-show-mascot',contentStartFirst:'prem-content-start-first',articleImages:'prem-article-images',editorialHeadings:'prem-editorial-headings',contactTitle:'prem-contact-title',featuredLarger:'prem-featured-larger',labLayout:'prem-lab-layout',labColumns:'prem-lab-columns',labFeaturedLarger:'prem-lab-featured-larger',labCardDetails:'prem-lab-card-details',labFullWidth:'prem-lab-full-width',labHeading:'prem-lab-heading',simpleTransitions:'prem-simple-transitions',simpleTransitionsSkipExit:'prem-simple-transitions-skip-exit',navRounding:'prem-nav-rounding',dockLiquidBlend:'prem-dock-liquid-blend',dockLiquidPinch:'prem-dock-liquid-pinch',navItemPadding:'prem-nav-item-padding',navContainerPadding:'prem-nav-container-padding',navItemFontSize:'prem-nav-item-font-size',contextualComposerPreference:'prem-contextual-composer',contextualButtons:'prem-contextual-buttons',alwaysDarkGlassPreference:'prem-always-dark-glass',showGestureControl:'prem-menu-gesture-visible',showInfoControl:'prem-menu-info-visible',showAnimationControl:'prem-menu-animation-visible',imageRippleEnabled:'prem-image-ripple-enabled',imageBlurEnabled:'prem-image-blur-enabled',
 glassOpacity:'prem-glassOpacity',roomBlur:'prem-roomBlur',roomShade:'prem-roomShade',edgeShadeTop:'prem-edge-shade-top',edgeShadeBottom:'prem-edge-shade-bottom',edgeShadeLeft:'prem-edge-shade-left',edgeShadeRight:'prem-edge-shade-right',edgeShadeRetreat:'prem-edge-shade-retreat',edgeShadeDepth:'prem-edge-shade-depth'
};
const motionIds=['intensity','duration','slow','stretch','lag','stiffness','damping','reflections','glow','overshoot','ripple','motionBlur'];
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

// The same controls define the export values and the import constraints. Only
// this allowlist can write storage; chat, credentials and input modes are absent.
export function settingsSchema(panel,root=document){
 const schema=new Map();
 for(const input of panel.querySelectorAll('input[type="checkbox"],input[type="range"],select,button[role="switch"]')){
  let key=input.id,storage=direct[key],path,invert=false,nullable=false,encode;
  if(input.dataset.homeSectionControl){key='section.'+input.dataset.homeSectionControl;storage='prem-home-content';path=input.dataset.homeSectionControl;}
  if(input.dataset.homeSpanControl){key='span.'+input.dataset.homeSpanControl;storage='prem-home-section-spans';path=input.dataset.homeSpanControl;}
  if(input.dataset.aboutSectionControl){key='aboutSection.'+input.dataset.aboutSectionControl;storage='prem-about-content';path=input.dataset.aboutSectionControl;}
  if(input.dataset.aboutSpanControl){key='aboutSpan.'+input.dataset.aboutSpanControl;storage='prem-about-section-spans';path=input.dataset.aboutSpanControl;}
  if(input.dataset.designControl){key='design.'+input.dataset.designControl;storage='prem-design-system';path=input.dataset.designControl;}
  if(input.dataset.carouselControl){key='carousel.'+input.dataset.carouselControl;storage='prem-carousel-settings';path=input.dataset.carouselControl;}
  if(input.dataset.heroCarouselControl){key='heroCarousel.'+input.dataset.heroCarouselControl;storage='prem-hero-carousel-settings';path=input.dataset.heroCarouselControl;}
  if(motionIds.includes(key)){storage=motionKey;path=key;}
  if(/^cardPadding(Top|Right|Bottom|Left)$/.test(key)){storage='prem-card-padding-'+key.slice(11).toLowerCase();nullable=['cardPaddingRight','cardPaddingLeft'].includes(key);}
  if(key==='cardBackground'){storage='prem-hide-card-background';invert=true;}
  if(['bleedTop','bleedSide','bleedBottom','bleedBacking'].includes(key)){storage='prem-bleed-image';path=key.slice(5).toLowerCase();}
  if(!storage)continue;
  const kind=input.tagName==='SELECT'?'enum':input.type==='range'?'number':'boolean';
  schema.set(key,{key,input,storage,path,invert,nullable,encode,kind,min:Number(input.min),max:Number(input.max),options:kind==='enum'?[...input.options].map(option=>option.value):null});
 }
 for(const [path,,options] of designSettingControls){
  const key='design.'+path;
  if(!schema.has(key))schema.set(key,{key,storage:'prem-design-system',path,kind:'enum',options});
 }
 for(const [key,id,storage] of [['sound','soundPreference','prem-assistant-sound'],['animation','animationPreference','prem-animations']]){
  const input=root.querySelector('#'+id);schema.set(key,{key,input,storage,kind:'boolean'});
 }
 schema.set('theme',{key:'theme',storage:'prem-theme',kind:'enum',options:['light','dark','system'],read:()=>root.documentElement.dataset.themePreference||'light'});
 return schema;
}
function readValue(field,storage){
 if(field.read)return field.read();
 if(field.nullable){try{if(storage?.getItem(field.storage)===null)return null;}catch{}}
 if(field.kind==='boolean')return field.input.type==='checkbox'?field.input.checked:field.input.getAttribute('aria-checked')==='true';
 return field.kind==='number'?Number(field.input.value):field.input.value;
}
function validValue(field,value){
 if(value===null)return !!field.nullable;
 if(field.kind==='boolean')return typeof value==='boolean';
 if(field.kind==='enum')return field.options.includes(value);
 return typeof value==='number'&&Number.isFinite(value)&&value>=field.min&&value<=field.max;
}
export function exportSettings(schema,storage,now=new Date()){
 return {format:FORMAT,version:VERSION,exportedAt:now.toISOString(),settings:Object.fromEntries([...schema].map(([key,field])=>[key,readValue(field,storage)]))};
}
export function parseSettings(text,schema){
 if(new TextEncoder().encode(text).byteLength>MAX_SETTINGS_BYTES)throw Error('Choose a settings file smaller than 64 KB.');
 let value;try{value=JSON.parse(text);}catch{throw Error('This file is not valid JSON.');}
 if(!plain(value)||value.format!==FORMAT)throw Error('Choose a Prem portfolio settings file.');
 if(value.version!==VERSION)throw Error('This settings version is not supported.');
 if(!plain(value.settings))throw Error('The settings file is missing its settings.');
 const values=new Map();
 for(const [key,next] of Object.entries(value.settings)){
  if(key==='design.typeWeight'&&(schema.has('design.headingWeight')||schema.has('design.bodyWeight'))){
   if(!['small','medium','large'].includes(next))throw Error('Invalid setting: '+key+'. Nothing was changed.');
   const weight={small:'thin',medium:'regular',large:'bold'}[next];
   if(!Object.hasOwn(value.settings,'design.headingWeight')&&schema.has('design.headingWeight'))values.set('design.headingWeight',weight);
   if(!Object.hasOwn(value.settings,'design.bodyWeight')&&schema.has('design.bodyWeight'))values.set('design.bodyWeight',weight);
   continue;
  }
  if(key==='hideCardTitles'&&schema.has('cardShowTitle')&&!Object.hasOwn(value.settings,'cardShowTitle')){
   if(typeof next!=='boolean')throw Error('Invalid setting: '+key+'. Nothing was changed.');
   values.set('cardShowTitle',!next);continue;
  }
  const field=schema.get(key);if(!field)continue;
  if(!validValue(field,next))throw Error('Invalid setting: '+key+'. Nothing was changed.');
  values.set(key,next);
 }
 if(Object.hasOwn(value.settings,'heroTimelineEnabled')&&!Object.hasOwn(value.settings,'heroDescriptionEnabled'))values.set('heroDescriptionEnabled',!value.settings.heroTimelineEnabled);
 if(Object.hasOwn(value.settings,'heroTimelineEnabled')&&!Object.hasOwn(value.settings,'heroTimelineTextEnabled'))values.set('heroTimelineTextEnabled',value.settings.heroTimelineEnabled);
 if(!values.size)throw Error('This file contains no supported settings.');
 return values;
}
export function importSettings(values,schema,storage){
 if(!storage)throw Error('Browser storage is unavailable. Settings were not imported.');
 const writes=new Map();
 for(const [key,value] of values){
  const field=schema.get(key);if(!field||!validValue(field,value))throw Error('Invalid setting: '+key+'. Nothing was changed.');
  const next=field.encode?field.encode(value):field.invert?!value:value;
  if(field.path){
   if(!writes.has(field.storage)){
    let previous;try{previous=JSON.parse(storage.getItem(field.storage)||'null');}catch{}
    writes.set(field.storage,plain(previous)?{...previous}:{});
   }
   writes.get(field.storage)[field.path]=next;
  }else writes.set(field.storage,next===null?null:String(next));
 }
 if(writes.has('prem-bleed-image'))writes.get('prem-bleed-image').settingsVersion=1;
 const before=new Map([...writes.keys()].map(key=>[key,storage.getItem(key)]));
 try{for(const [key,value] of writes)value===null?storage.removeItem(key):storage.setItem(key,typeof value==='object'?JSON.stringify(value):value);}
 catch{
  for(const [key,value] of before)try{value===null?storage.removeItem(key):storage.setItem(key,value);}catch{}
  throw Error('Could not save the settings. The import was cancelled.');
 }
 return values.size;
}

export function mountSettingsTransfer(panel,{root=document,storage,canChange=()=>true,reload=()=>location.reload()}={}){
 if(storage===undefined)try{storage=globalThis.localStorage;}catch{}
 const schema=settingsSchema(panel,root),status=panel.querySelector('#settingsTransferStatus'),file=panel.querySelector('#settingsImportFile');
 const report=text=>status.textContent=text;
 // Motion knobs used to be session-only. Persist them through the same handlers
 // as a manual change, so imported values also survive future page loads.
 let saved;try{saved=JSON.parse(storage?.getItem(motionKey)||'null');}catch{}
 for(const field of schema.values())if(field.storage===motionKey&&validValue(field,saved?.[field.key])){
  if(field.kind==='boolean')field.input.checked=saved[field.key];else field.input.value=saved[field.key];
  field.input.dispatchEvent(new Event(field.kind==='boolean'?'change':'input',{bubbles:true}));
 }
 const persistMotion=event=>{
  const field=schema.get(event.target.id);if(field?.storage!==motionKey)return;
  const value=Object.fromEntries([...schema].filter(([,item])=>item.storage===motionKey).map(([key,item])=>[key,readValue(item)]));
  try{storage?.setItem(motionKey,JSON.stringify(value));}catch{}
 };
 panel.addEventListener('input',persistMotion);panel.addEventListener('change',persistMotion);
 panel.querySelector('#settingsExport').onclick=()=>{
  if(!canChange()){report('Wait for the current transition to finish.');return;}
  const json=JSON.stringify(exportSettings(schema,storage),null,2)+'\n',url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  const link=root.createElement('a');link.href=url;link.download='prem-portfolio-settings-'+new Date().toISOString().slice(0,10)+'.json';
  root.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);report('Settings exported.');
 };
 panel.querySelector('#settingsImport').onclick=()=>{
  if(!canChange()){report('Wait for the current transition to finish.');return;}
  file.value='';file.click();
 };
 file.onchange=async()=>{
  const selected=file.files?.[0];if(!selected)return;
  try{
   if(selected.size>MAX_SETTINGS_BYTES)throw Error('Choose a settings file smaller than 64 KB.');
   const values=parseSettings(await selected.text(),schema);
   if(!canChange())throw Error('Wait for the current transition to finish, then import again.');
   importSettings(values,schema,storage);report('Settings imported. Reloading…');reload();
  }catch(error){report(error.message||'Could not read that settings file.');}
  finally{file.value='';}
 };
 return {schema};
}
