import {EASE,LAB_RIPPLE} from './motion-tokens.js';
import {applyDefaultSettings} from './default-settings.js';
import {applyActiveSettings} from './site-settings.js';
import {siteConfig} from './content/site-config-client.js';
import {mountDevMode} from './dev-mode.js';
import {revealPage} from './page-ready.js';
import {previewMorphProxy,previewReturnProxy,visiblePreviewImage,fadeOutProxy} from './preview-morph.js';
import {CardWorld} from './card-world.js';
import {createSpiralArrangement} from './card-spiral.js';
import {createInfiniteArrangement} from './card-infinite.js';
import {createSphereArrangement} from './card-sphere.js';
const CARD_ARRANGEMENTS={spiral:createSpiralArrangement,infinite:createInfiniteArrangement,sphere:createSphereArrangement};
import {copyContactEmail,mountContactEmailCopy} from './contact-actions.js';
import {VoiceDock} from './voice-dock.js';
import {ComposerContext,readContextualButtons} from './composer-context.js';
import {CardRail,applySectionPresentation} from './card-rail.js';
import {CardGallery} from './card-gallery.js';
import {readCarouselSettings,mountCarouselSettings} from './carousel-settings.js';
import {mountContextualPopovers} from './contextual-popovers.js';
import {mountAgent} from './agent.js';
import {ProjectMenuPreview} from './project-menu-preview.js';
import {handleSiteIndexShortcut} from './menu-keyboard.js';
import {ProjectMediaFocus} from './project-media-focus.js';
import {mountPortfolioAssistant} from './portfolio-assistant.js';
import {createCommandCatalog,CommandBus} from './interaction-commands.js';
import {SpatialNavigation} from './spatial-navigation.js';
import {SummaryStream,attachSummaryStream,projectRevealMode} from './summary-stream.js';
import {createDetailContentReveal} from './detail-content-reveal.js';
import {handleProjectArrowKey} from './project-arrow-keys.js';
import {readImageEffectPreferences} from './image-effect-preferences.js';
import {installTooltips} from './tooltips.js';
import {pauseVideoPreviews,playingVideoState} from './hover-video.js';
import {DockMorph} from './dock-morph.js';
import {LiquidPopover} from './liquid-popover.js';
import {projectMenuMarkup,projectMenuProjectsMarkup} from './project-menu.js';
import {setIconSwitchState} from './icon-switch.js';
import {mountMenuIconSettings} from './menu-icon-settings.js';
import {createSiteToast} from './site-toast.js';
import {mountStatusStack} from './status-stack.js';
import {installHoverTrail} from './hover-trail.js';
import {installProjectMenuHover} from './project-menu-hover.js';
import {initDesignSystem} from './design-system.js';
import {mountGlassStyle} from './glass-style.js';
import {mountSimpleTransitions} from './simple-transitions.js';
import {mountAssistantPresentation,setAssistantFloating} from './assistant-floating.js';
import {createLabRipple} from './lab-transition.js';
import {mountLabSettings} from './lab-settings.js';
import {labHeadingMarkup} from './lab-page.js';
import {mountAssistantUpload} from './assistant-upload.js';
import {assistantLimits} from './assistant-limits.js';
import {heroImageEntrance} from './hero-image-entrance.js';
import {projectPageExit,pageFadeExit} from './project-page-exit.js';
import {mountHeroCarouselSettings,readHeroCarouselSettings,applyHeroCarouselSettings} from './hero-carousel-settings.js';
import {mountContentSetControl} from './content-set-control.js';
import {EdgeShades} from './edge-shades.js';
import {initEnvironment} from './environment.js';
import { LiquidImage,pulseImages,getImageMotion,configureImageEffects } from './liquid-image.js';
import {ImageFrame,readImagePadding,readFrameRadius,updateImageShade} from './image-frame.js';
import { flow } from './liquid-surface.js';
import { TransitionControl,morphProgress } from './transition-control.js';
import { MotionMaterial,prepareSkin } from './motion-material.js';
import {configureSurfaceHover,mountSurfaceRenderer} from './surface-hover.js';
import {createLiquidReveal} from './liquid-reveal.js';
import {createProjectBackdrop} from './project-backdrop.js';
import {AmbientLight} from './ambient-light.js';
import { materialSettings,imageEffects } from './material-settings.js';
import { ProjectDrag } from './project-drag.js';
import {stepProject,cardNavigation} from './card-navigation.js';
import {retainHome} from './retained-home.js';
import {stageHomeReturn} from './home-return-stage.js';
import {captureSharedWords,copyOpacity,copyScale,sharedCopyNode} from './shared-copy.js';
import {stageMotion} from './motion-viewport.js';
import {projects,homeProjects,informationCards,cards,cardIds,projectIds} from './documents.js';
import {mountProjectRouteAliases} from './project-route-aliases.js';
import {card,cardDetail,streamWords as cardCopyWords} from './card-renderer.js';
import {homeMarkup,HomeLayout,readHomeLayout} from './home-layout.js';
import {HeroTimeline} from './hero-timeline.js';
import {initHomeSectionSettings} from './home-sections.js';
import {initAboutSectionSettings} from './about-sections.js';
import {mountSettingsTransfer} from './settings-transfer.js';
import {mountSettingsPublish} from './settings-publish-control.js';
import {APP_MAX_WIDTH,CONTENT_WIDTHS,pageTemplateForRoute,readContentWidth,normaliseContentWidth,contentRail,responsiveContentGutter} from './content-widths.js';
import {hydrateFooter} from './home-content.js';
import {handleEscapeKey} from './escape-key.js';
import {capturePlacement,neighborPush} from './placement.js';
import {AssistantNavigationMemory} from './assistant-navigation-memory.js';
import {ProjectEntryMemory} from './project-entry-memory.js';
import {MediaLoader} from './media-loading.js';
import {presentedImage,clearImageHandoffs} from './image-handoff.js';
applyDefaultSettings();
applyActiveSettings(siteConfig.settings);
mountProjectRouteAliases(window);
const $=s=>document.querySelector(s), main=$('#main'), systemReduce=matchMedia('(prefers-reduced-motion: reduce)'), desktopLabelMode=matchMedia('(min-width:601px)');
const mediaLoader=new MediaLoader();
addEventListener('gallery-selection-change',()=>mediaLoader.refresh(main));
hydrateFooter();
let showFullScreenOption=true;try{showFullScreenOption=localStorage.getItem('prem-show-full-screen-option')!=='false';}catch{}
const mediaFocus=new ProjectMediaFocus(main,{dock:()=>dockMorph,duration:()=>duration*(slow?2.5:1),reduced:()=>reduce.matches});
function syncMediaFocusControls(){composerContext?.refresh();main.querySelectorAll('[data-media-focus=fullscreen]').forEach(button=>button.hidden=!showFullScreenOption);$('#showFullScreenOption').checked=showFullScreenOption;}
$('#showFullScreenOption').onchange=e=>{showFullScreenOption=e.target.checked;try{localStorage.setItem('prem-show-full-screen-option',String(showFullScreenOption));}catch{}syncMediaFocusControls();};
function openMediaAction(kind,button){if(busy||mediaFocus.active)return;if(summaryStream){summaryStream.position=1;summaryStream.paint();summaryStream.destroy();summaryStream=null;}detailContentReveal?.cancel();const p=cards.find(p=>p.id===current),media=kind==='prototype'?p?.prototype:kind==='watch-prototype'?p?.watchPrototype:undefined;mediaFocus.open(button,{detail:main.querySelector('.detail'),prototypeUrl:media?.url,prototypeTitle:media?.label});}
main.addEventListener('click',e=>{const button=e.target.closest('[data-media-focus]');if(button)openMediaAction(button.dataset.mediaFocus,button);});
let animationsEnabled=true;try{animationsEnabled=localStorage.getItem('prem-animations')!=='false';}catch{}
const reduce={get matches(){return systemReduce.matches||!animationsEnabled;}};
document.documentElement.dataset.animation=animationsEnabled?'on':'off';
function refreshImageEffectPreferences(){let storage;try{storage=localStorage;}catch{}configureImageEffects(readImageEffectPreferences(storage));}
refreshImageEffectPreferences();
function syncImageEffectControls(){
 for(const [effect,id,slider] of [['ripple','imageRippleEnabled','ripple'],['blur','imageBlurEnabled','motionBlur']]){
  $('#'+id).checked=imageEffects[effect];$('#'+slider).disabled=!imageEffects[effect];$('#'+slider).closest('label').classList.toggle('setting-disabled',!imageEffects[effect]);
 }
}
let navRounding=24;
try{const saved=localStorage.getItem('prem-nav-rounding');if(saved!==null&&Number.isFinite(Number(saved)))navRounding=Math.max(0,Math.min(100,Number(saved)));}catch{}
function applyNavRounding(){document.documentElement.style.setProperty('--nav-rounding',navRounding+'px');$('#navRounding').value=navRounding;$('#navRoundingValue').value=navRounding+'px';dockMorph.refresh();}
let navItemPadding=9,navItemFontSize=12,navContainerPadding=0;
try{const padding=localStorage.getItem('prem-nav-item-padding'),fontSize=localStorage.getItem('prem-nav-item-font-size'),containerPadding=localStorage.getItem('prem-nav-container-padding');if(padding!==null&&Number.isFinite(Number(padding)))navItemPadding=Math.max(4,Math.min(14,Number(padding)));if(fontSize!==null&&Number.isFinite(Number(fontSize)))navItemFontSize=Math.max(10,Math.min(16,Number(fontSize)));if(containerPadding!==null&&Number.isFinite(Number(containerPadding)))navContainerPadding=Math.max(0,Math.min(12,Number(containerPadding)));}catch{}
// The menu dock is as wide as its visible links plus the composer's inset on each side, never narrower than before.
function navContentWidth(){const nav=document.querySelector('#dock .dock-content>nav');if(!nav)return 0;const style=getComputedStyle(nav),items=[...nav.children].filter(item=>item.id!=='askForm'&&item.getClientRects().length&&getComputedStyle(item).position!=='absolute');return Math.ceil(items.reduce((width,item)=>width+item.getBoundingClientRect().width,0)+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+(parseFloat(style.columnGap)||0)*Math.max(0,items.length-1));}
// Lab, Contact and the Assistant item follow their settings; the dock is re-measured because its width follows its links.
function applyNavItems(){const nav=document.querySelector('#dock .dock-content>nav'),lab=nav.querySelector('a[data-nav="lab"]'),contact=nav.querySelector('a[data-nav="contact"]'),chat=$('#assistantNavItem');lab.hidden=!navShowLab;contact.hidden=!navShowContact;chat.textContent=navChatLabel;chat.setAttribute('aria-label',navChatLabel);document.documentElement.classList.toggle('mascot-hidden',!showMascot);$('#navShowLab').checked=navShowLab;$('#navShowContact').checked=navShowContact;$('#navChatLabel').value=navChatLabel;$('#showMascot').checked=showMascot;applyNavTypography();}
function applyNavTypography(){const root=document.documentElement;root.style.setProperty('--nav-item-padding',navItemPadding+'px');root.style.setProperty('--nav-item-font-size',navItemFontSize+'px');root.style.setProperty('--nav-container-padding',navContainerPadding+'px');root.style.setProperty('--nav-height',48+navContainerPadding*2+'px');const baseWidth=(innerWidth<=380?210:innerWidth<=600?228:252)+navContainerPadding*2;root.style.setProperty('--nav-main-width',Math.max(baseWidth,navContentWidth())+'px');$('#navItemPadding').value=navItemPadding;$('#navItemPaddingValue').value=navItemPadding+'px';$('#navContainerPadding').value=navContainerPadding;$('#navContainerPaddingValue').value=navContainerPadding+'px';$('#navItemFontSize').value=navItemFontSize;$('#navItemFontSizeValue').value=navItemFontSize+'px';dockMorph.refresh();}
let navSlideTarget=null,homeOpenTarget=null,assistantProjectTarget=null,assistantProjectOrigin=null,homeScene=null,labMode=false,previewProjectTarget=null,previewProjectOrigin=null,chromeTransition=false,navigationPreparing=false;
const assistantNavigation=new AssistantNavigationMemory();
const projectEntry=new ProjectEntryMemory();
let galleryProjectTarget=null,galleryProjectOrigin=null;
let current='',layout='masonry',intensity=.7,duration=400,slow=false,busy=false,instances=[],hoverEffects=[],assistantSurfaceEffects=new Map(),filterCounter=0,homeScroll=0,travelDirection=0,activeTransition=null,homeLayout=null,summaryStream=null,detailContentReveal=null,detachDragSummary=null,dragReveals=new Map(),dragAmbientEffects=[];
const homeSections=initHomeSectionSettings($('#settings'),{getRoot:()=>main,canChange:()=>!busy,onChange:()=>homeLayout?.flush(true)});
const aboutSections=initAboutSectionSettings($('#settings'),{getRoot:()=>main,canChange:()=>!busy});
let showFooterContactLinks=false;try{showFooterContactLinks=localStorage.getItem('prem-footer-contact-links')==='true';}catch{} let showFooter=true;try{showFooter=localStorage.getItem('prem-show-footer')!=='false';}catch(error){console.warn('Footer preference unreadable; showing it',error);}
$('.footer-links').hidden=!showFooterContactLinks;$('#showFooterContactLinks').checked=showFooterContactLinks;$('#showFooter').checked=showFooter;
$('#showFooter').onchange=e=>{showFooter=e.target.checked;$('.site-footer').hidden=!showFooter;try{localStorage.setItem('prem-show-footer',String(showFooter));}catch(error){console.warn('Footer preference not saved',error);}};$('#showFooterContactLinks').onchange=e=>{showFooterContactLinks=e.target.checked;$('.footer-links').hidden=!showFooterContactLinks;try{localStorage.setItem('prem-footer-contact-links',String(showFooterContactLinks));}catch{}};
$('#dock').dataset.separateSettings='false';
const assistantBack=document.createElement('button');assistantBack.id='assistantBack';assistantBack.type='button';assistantBack.className='assistant-back';assistantBack.hidden=true;assistantBack.textContent='Go Back';assistantBack.dataset.tooltip='Go Back [Esc]';$('#dock').append(assistantBack);
const dockMorph=new DockMorph($('#dock'),{reduced:()=>reduce.matches});
// Liquid blend is the fillet size in px; Pinch point is how far through a move the neck starts to thin.
const readLiquid=(key,fallback,min,max)=>{try{const saved=localStorage.getItem(key);if(saved!==null&&Number.isFinite(Number(saved)))return Math.max(min,Math.min(max,Number(saved)));}catch{}return fallback;};
let dockLiquidBlend=readLiquid('prem-dock-liquid-blend',28,0,60),dockLiquidPinch=readLiquid('prem-dock-liquid-pinch',60,30,95);
function applyDockLiquid(){dockMorph.setLiquid({blend:dockLiquidBlend,pinch:dockLiquidPinch/100});$('#dockLiquidBlend').value=dockLiquidBlend;$('#dockLiquidBlendValue').value=dockLiquidBlend+'px';$('#dockLiquidPinch').value=dockLiquidPinch;$('#dockLiquidPinchValue').value=dockLiquidPinch+'%';}
applyDockLiquid();
$('#dockLiquidBlend').oninput=e=>{dockLiquidBlend=+e.target.value;applyDockLiquid();try{localStorage.setItem('prem-dock-liquid-blend',String(dockLiquidBlend));}catch{}};
$('#dockLiquidPinch').oninput=e=>{dockLiquidPinch=+e.target.value;applyDockLiquid();try{localStorage.setItem('prem-dock-liquid-pinch',String(dockLiquidPinch));}catch{}};
let voiceDock=null;
let characterAssistant=true,characterButton=null;try{characterAssistant=localStorage.getItem('prem-character-assistant')!=='false';}catch(error){console.warn('Preference prem-character-assistant unreadable; using on',error);}
// Menu items: Work and About always show; Lab and Contact are optional, and Chat is the mascot or a text item after Contact.
const NAV_CHAT_LABELS=['Assistant','Call Assistant','Ask Assistant'];
let navShowLab=true,navShowContact=true,showMascot=true,navChatLabel=NAV_CHAT_LABELS[0];
try{navShowLab=localStorage.getItem('prem-nav-show-lab')!=='false';navShowContact=localStorage.getItem('prem-nav-show-contact')!=='false';showMascot=localStorage.getItem('prem-show-mascot')!=='false';const savedLabel=localStorage.getItem('prem-nav-chat-label');if(NAV_CHAT_LABELS.includes(savedLabel))navChatLabel=savedLabel;}catch(error){console.warn('Menu item preferences unreadable; showing every item',error);}
let composerContext=null,contextualButtons=readContextualButtons(localStorage),splitProjectControls=false;try{splitProjectControls=localStorage.getItem('prem-split-project-controls')==='true';}catch{}
// Stored as 'composer' (above the dock) or 'inline' (within the page) for older settings files.
const contextualPlacement=()=>contextualButtons==='composer'?'above':'page';
let contextualComposer=true,alwaysDarkGlass=false;try{const savedComposer=localStorage.getItem('prem-contextual-composer');contextualComposer=savedComposer===null?true:savedComposer==='true';alwaysDarkGlass=localStorage.getItem('prem-always-dark-glass')==='true';}catch{}
let assistantFloating=false;const assistantLauncher=document.getElementById('assistantLauncher');
// The dock shows the composer on the chat page, when the composer is always on, or while the floating assistant is open.
// With the menu in the dock, the chat page keeps the menu and takes the composer into the page under the welcome.
let chatInlineComposer=true;try{chatInlineComposer=localStorage.getItem('prem-chat-inline-composer')!=='false';}catch(error){console.warn('Preference prem-chat-inline-composer unreadable; using on',error);}
const inlineChat=route=>route==='assistant'&&chatInlineComposer&&!contextualComposer;
const composerShown=route=>route==='assistant'&&!inlineChat(route)||contextualComposer||assistantFloating;
const askForm=document.getElementById('askForm'),askFormHome={parent:askForm.parentElement,next:askForm.nextElementSibling};
function syncInlineComposer(){
 const inline=inlineChat(current),slot=document.getElementById('assistantInlineComposer');
 document.documentElement.classList.toggle('assistant-inline-open',inline);slot.hidden=!inline;document.getElementById('assistantMascot').hidden=!inline;
 if(inline&&askForm.parentElement!==slot)slot.append(askForm);
 else if(!inline&&askForm.parentElement===slot)askFormHome.parent.insertBefore(askForm,askFormHome.next);
}
function applyDockPreferences(){dockMorph.el.classList.toggle('contextual-composer',contextualComposer);dockMorph.el.classList.toggle('always-dark-glass',alwaysDarkGlass);$('#contextualComposerPreference').setAttribute('aria-checked',String(contextualComposer));$('#alwaysDarkGlassPreference').setAttribute('aria-checked',String(alwaysDarkGlass));}
applyDockPreferences();
const showProjectControls=route=>projectIds.includes(route);
// With the nav on top, a project or article page swaps the header's avatar and name for Go Back and Previous/Next, in one fade.
const articleIds=cards.filter(card=>card._article).map(card=>card.id);
const headerDetail=route=>navPosition==='top'&&(projectIds.includes(route)||articleIds.includes(route));
function syncHeaderDetailNav(route){const active=headerDetail(route),nav=$('#headerDetailNav');document.documentElement.classList.toggle('header-detail-active',active);nav.inert=!active;nav.setAttribute('aria-hidden',String(!active));// Only a page that shows the nav sets the arrows, so they never jump in from display:none mid-swap.
if(active)for(const button of nav.querySelectorAll('[data-header-action="previous"],[data-header-action="next"]'))button.hidden=!showProjectControls(route);}
// About and Contact are in the dock's own menu, so they get no Back pill morphing in and out of it.
const showBackControl=route=>route==='assistant'&&!inlineChat(route)||projectIds.includes(route);
function syncDockActions(route,options={}){const composer=composerShown(route);syncHeaderDetailNav(route);dockMorph.setBack(!composer&&showBackControl(route)&&!headerDetail(route),options);dockMorph.setSplit(!composer&&showProjectControls(route)&&!headerDetail(route),options);composerContext?.refresh();}
installHoverTrail($('#dock'),{reduced:()=>reduce.matches});
const edgeShades=new EdgeShades($('.page-edge-shades'),{reduced:()=>reduce.matches});
try{layout=readHomeLayout(localStorage.getItem('prem-home-layout'));}catch{}
let layoutStorage;try{layoutStorage=localStorage;}catch{}
let homeContentWidth=readContentWidth(layoutStorage,'home'),detailContentWidth=readContentWidth(layoutStorage,'details'),contentPageWidth=readContentWidth(layoutStorage,'content');
function applyContentWidths(){
 const root=document.documentElement,template=pageTemplateForRoute(current,projectIds),preset=template==='home'?homeContentWidth:template==='project-details'?detailContentWidth:contentPageWidth,viewport=root.clientWidth||innerWidth,rail=contentRail(viewport,preset,responsiveContentGutter(viewport));
 root.style.setProperty('--content-width',CONTENT_WIDTHS[preset]+'px');root.style.setProperty('--content-rail-width',rail.content+'px');root.dataset.pageTemplate=template;
 root.style.setProperty('--app-max-width',APP_MAX_WIDTH+'px');root.style.setProperty('--app-canvas-width',rail.app+'px');
 root.style.setProperty('--content-shell-width',rail.shell+'px');root.style.setProperty('--content-gutter',rail.gutter+'px');
 root.dataset.contentWidth=preset;$('#homeContentWidth').value=homeContentWidth;$('#detailContentWidth').value=detailContentWidth;$('#contentPageWidth').value=contentPageWidth;
}
addEventListener('resize',applyContentWidths,{passive:true});
let homeColumns=2;try{homeColumns=Math.max(1,Math.min(4,Number(localStorage.getItem('prem-home-columns'))||2));}catch{}
let oneColumnPosition='top';try{const saved=localStorage.getItem('prem-one-column-card-position');if(['top','bottom','left','right','alternating'].includes(saved))oneColumnPosition=saved;}catch{}
let multiColumnPosition='top';try{const saved=localStorage.getItem('prem-multi-column-card-position');if(['top','bottom'].includes(saved))multiColumnPosition=saved;}catch{}
let showCardCopyOnHover=false;try{showCardCopyOnHover=localStorage.getItem('prem-card-copy-hover-desktop')==='true';}catch{}
function syncOneColumnPosition(){$('#heroCarouselSetting').hidden=homeView!=='current'||homeProductDisplay!=='cards';$('#heroCarouselKnobs').hidden=$('#heroCarouselSetting').hidden||!$('#heroCarousel').checked;for(const id of ['homeViewSelect','homeLayoutSelect','gridColumns'])$('#'+id).closest('label').hidden=homeProductDisplay!=='cards';$('#gridColumns').closest('label').hidden||=layout==='alternating';const alternating=layout==='alternating';const usesCards=['cards','carousel'].includes(homeProductDisplay),setting=$('#singleColumnCardPositionSetting');setting.hidden=homeColumns!==1||alternating||homeView!=='current'||!usesCards;$('#singleColumnCardPosition').value=oneColumnPosition;const multiHidden=homeColumns<=1&&!alternating||homeView!=='current'||!usesCards;$('#multiColumnCardPositionSetting').hidden=multiHidden;$('#multiColumnCardPosition').value=multiColumnPosition;$('#cardCopyHoverSetting').hidden=multiHidden||homeProductDisplay!=='cards';$('#cardCopyHover').checked=showCardCopyOnHover;}
let cardRounding=64,cardGap=28;try{const savedRounding=localStorage.getItem('prem-card-rounding'),savedGap=localStorage.getItem('prem-card-gap');if(savedRounding!==null)cardRounding=Math.max(0,Math.min(128,Number(savedRounding)||0));if(savedGap!==null)cardGap=Math.max(0,Math.min(160,Number(savedGap)||0));}catch{}
let cardPadding={top:56,right:null,bottom:60,left:null},cardPaddingAll=56,cardPaddingUniform=false;try{for(const side of ['top','right','bottom','left']){const saved=localStorage.getItem('prem-card-padding-'+side);if(saved!==null&&Number.isFinite(Number(saved)))cardPadding[side]=Math.max(0,Math.min(160,Number(saved)));}cardPaddingUniform=localStorage.getItem('prem-card-padding-uniform')==='true';const all=localStorage.getItem('prem-card-padding-all');if(all!==null&&Number.isFinite(Number(all)))cardPaddingAll=Math.max(0,Math.min(160,Number(all)));else cardPaddingAll=cardPadding.top;if(cardPaddingUniform)cardPadding={top:cardPaddingAll,right:cardPaddingAll,bottom:cardPaddingAll,left:cardPaddingAll};}catch{}
function refreshImageFrames(){for(const instance of instances)(instance.imageFrame||instance).resize();for(const item of assistantSurfaceEffects.values())item.frame?.resize();mediaLoader.refresh(main);}
let imageRounding=6;try{const saved=localStorage.getItem('prem-image-rounding');if(saved!==null&&Number.isFinite(Number(saved)))imageRounding=Math.max(0,Math.min(32,Number(saved)));}catch{}
function applyImageRounding(){document.documentElement.style.setProperty('--image-rounding',imageRounding+'px');$('#imageRounding').value=imageRounding;$('#imageRoundingValue').value=imageRounding+'px';refreshImageFrames();}

function applyCardPadding(){const root=document.documentElement;for(const side of ['top','right','bottom','left']){const value=cardPaddingUniform?cardPaddingAll:cardPadding[side];if(value===null)root.style.removeProperty('--card-padding-'+side);else root.style.setProperty('--card-padding-'+side,value+'px');}$('#cardPaddingSame').checked=cardPaddingUniform;$('#cardPaddingAllSettings').hidden=!cardPaddingUniform;$('#cardPaddingSidesSettings').hidden=cardPaddingUniform;$('#cardPaddingAll').value=cardPaddingAll;$('#cardPaddingAllValue').value=cardPaddingAll+'px';for(const side of ['top','right','bottom','left']){const fallback=side==='top'?56:side==='bottom'?60:40,value=cardPadding[side]??fallback;$('#cardPadding'+side[0].toUpperCase()+side.slice(1)).value=value;$('#cardPadding'+side[0].toUpperCase()+side.slice(1)+'Value').value=value+'px';}homeLayout?.flush(true);refreshImageFrames();cardGalleries.forEach(gallery=>gallery.refresh?.());main.querySelectorAll('.image-card>.visual').forEach(updateImageShade);}
let heroContent={timeline:true,timelineText:true,description:true};try{const savedTimeline=localStorage.getItem('prem-hero-timeline-enabled'),savedTimelineText=localStorage.getItem('prem-hero-timeline-text-enabled'),savedDescription=localStorage.getItem('prem-hero-description-enabled'),legacy=localStorage.getItem('prem-hero-content');if(savedTimeline!==null)heroContent.timeline=savedTimeline==='true';else if(legacy==='paragraph')heroContent.timeline=false;heroContent.timelineText=savedTimelineText!==null?savedTimelineText==='true':heroContent.timeline;if(savedDescription!==null)heroContent.description=savedDescription==='true';else if(legacy==='paragraph')heroContent.description=true;}catch{}
const syncHeroContent=()=>{$('#heroTimelineEnabled').checked=heroContent.timeline;$('#heroTimelineTextEnabled').checked=heroContent.timelineText;$('#heroDescriptionEnabled').checked=heroContent.description;$('#heroTimelineModeSetting').hidden=false;homeLayout?.setHeroContent({...heroContent});try{localStorage.setItem('prem-hero-timeline-enabled',String(heroContent.timeline));localStorage.setItem('prem-hero-timeline-text-enabled',String(heroContent.timelineText));localStorage.setItem('prem-hero-description-enabled',String(heroContent.description));}catch{}};
$('#heroTimelineEnabled').onchange=e=>{heroContent={...heroContent,timeline:e.target.checked};syncHeroContent();};$('#heroTimelineTextEnabled').onchange=e=>{heroContent={...heroContent,timelineText:e.target.checked};syncHeroContent();};$('#heroDescriptionEnabled').onchange=e=>{heroContent={...heroContent,description:e.target.checked};syncHeroContent();};syncHeroContent();
let heroTimelineMode='cursor';try{heroTimelineMode=localStorage.getItem('prem-hero-timeline-mode')==='drag'?'drag':'cursor';}catch{}
$('#heroTimelineMode').value=heroTimelineMode;$('#heroTimelineMode').onchange=e=>{heroTimelineMode=e.target.value==='drag'?'drag':'cursor';homeLayout?.setTimelineMode(heroTimelineMode);pageTimelines.forEach(timeline=>timeline.setMode(heroTimelineMode));try{localStorage.setItem('prem-hero-timeline-mode',heroTimelineMode);}catch{}};
const homeCarouselState={offset:0};
let homeProductDisplay='carousel';try{homeProductDisplay=['cards','text'].includes(localStorage.getItem('prem-home-product-display'))?localStorage.getItem('prem-home-product-display'):'carousel';}catch{}
// A page such as Lab can pin its own presentation without changing the saved home preference.
const pageProductDisplay=document.documentElement.dataset.pageProductDisplay;if(['cards','text','carousel'].includes(pageProductDisplay))homeProductDisplay=pageProductDisplay;
$('#homeProductDisplay').value=homeProductDisplay;$('#homeProductDisplay').onchange=e=>{if(busy){e.target.value=homeProductDisplay;return;}homeProductDisplay=['cards','text'].includes(e.target.value)?e.target.value:'carousel';homeLayout?.setProductDisplay(homeProductDisplay);homeLayout?.apply({mode:homeView});syncOneColumnPosition();syncCardGalleries();refreshImageFrames();try{localStorage.setItem('prem-home-product-display',homeProductDisplay);}catch{}};
let heroCarouselEnabled=false;try{heroCarouselEnabled=localStorage.getItem('prem-hero-carousel')==='true';}catch{}
let heroCarouselSettings=readHeroCarouselSettings();applyHeroCarouselSettings(document.documentElement,heroCarouselSettings);
const syncHeroCarouselKnobs=()=>{$('#heroCarouselKnobs').hidden=$('#heroCarouselSetting').hidden||!$('#heroCarousel').checked;};
$('#heroCarousel').checked=heroCarouselEnabled;syncHeroCarouselKnobs();$('#heroCarousel').onchange=e=>{if(busy){e.target.checked=heroCarouselEnabled;return;}heroCarouselEnabled=e.target.checked;syncHeroCarouselKnobs();homeLayout?.setHeroCarousel(heroCarouselEnabled);refreshImageFrames();try{localStorage.setItem('prem-hero-carousel',String(heroCarouselEnabled));}catch{}};
let scrollingMaterial=false;
let homeView='current';try{homeView=['flip','flat'].includes(localStorage.getItem('prem-home-view'))?localStorage.getItem('prem-home-view'):'current';}catch{}
let fullBleed=false,hideBranding=true,hideCardBackground=false,hideCardColor=false,hideCardHover=false,cardHoverEffect='reveal',ambientDetailGlow=false,ambientLightMovement=true,showCardClient=true,cardClientInline=false,cardClientAbove=false,cardDetails=false,showCardCategory=false,showCardTitle=true,showCardDescription=true,edgeShadeTop=true,edgeShadeBottom=true,edgeShadeLeft=true,edgeShadeRight=true,edgeShadeRetreat=true,edgeShadeDepth=100;try{fullBleed=localStorage.getItem('prem-full-bleed')==='true';hideBranding=localStorage.getItem('prem-hide-branding')!=='false';hideCardBackground=localStorage.getItem('prem-hide-card-background')==='true';hideCardColor=localStorage.getItem('prem-hide-card-color')==='true';hideCardHover=localStorage.getItem('prem-hide-card-hover')==='true';cardHoverEffect=['reveal','reveal-soft','tint','glow'].includes(localStorage.getItem('prem-card-hover-effect'))?localStorage.getItem('prem-card-hover-effect'):'reveal';ambientDetailGlow=localStorage.getItem('prem-ambient-detail-glow')==='true';ambientLightMovement=localStorage.getItem('prem-ambient-light-movement')!=='false';showCardClient=localStorage.getItem('prem-card-show-client')!=='false';cardClientInline=localStorage.getItem('prem-card-client-inline')==='true';cardClientAbove=localStorage.getItem('prem-card-client-above')==='true';cardDetails=localStorage.getItem('prem-card-details')==='true';showCardCategory=localStorage.getItem('prem-card-show-category')==='true';const savedCardTitle=localStorage.getItem('prem-card-show-title');showCardTitle=savedCardTitle!==null?savedCardTitle!=='false':(localStorage.getItem('prem-hide-card-titles')??localStorage.getItem('prem-hide-card-labels-desktop'))!=='true';showCardDescription=localStorage.getItem('prem-card-show-description')!=='false';edgeShadeTop=localStorage.getItem('prem-edge-shade-top')!=='false';edgeShadeBottom=localStorage.getItem('prem-edge-shade-bottom')!=='false';edgeShadeLeft=localStorage.getItem('prem-edge-shade-left')!=='false';edgeShadeRight=localStorage.getItem('prem-edge-shade-right')!=='false';edgeShadeRetreat=localStorage.getItem('prem-edge-shade-retreat')!=='false';const savedDepth=localStorage.getItem('prem-edge-shade-depth');if(savedDepth!==null)edgeShadeDepth=Math.max(0,Math.min(200,Number(savedDepth)||0));}catch{}
let ambientHoverSpeed=60;try{const saved=localStorage.getItem('prem-ambient-hover-speed');if(saved!==null&&Number.isFinite(Number(saved)))ambientHoverSpeed=Math.max(20,Math.min(150,Number(saved)));}catch{}
// 'auto' samples card media (a project's authored ambient pair still wins); 'project' uses surface hues.
let ambientColorSource='auto';try{ambientColorSource=localStorage.getItem('prem-ambient-color-source')==='project'?'project':'auto';}catch(error){console.warn('Ambient colour preference unreadable; using automatic',error);}
// Multiplies the glow's colour-mix amounts; 100 keeps the authored look.
let ambientGlowStrength=100;try{const saved=Number(localStorage.getItem('prem-ambient-glow-strength'));if(localStorage.getItem('prem-ambient-glow-strength')!==null&&Number.isFinite(saved))ambientGlowStrength=Math.max(25,Math.min(400,saved));}catch(error){console.warn('Glow strength preference unreadable; using 100%',error);}
const applyAmbientGlowStrength=()=>document.documentElement.style.setProperty('--ambient-glow-strength',String(ambientGlowStrength/100));applyAmbientGlowStrength();
let showComposerGlow=true;try{showComposerGlow=localStorage.getItem('prem-composer-glow')!=='false';}catch{}
const ambientLight=new AmbientLight({reduced:()=>reduce.matches,controls:()=>({duration:duration*(slow?2.5:1),intensity,hoverSpeed:ambientHoverSpeed,colorSource:ambientColorSource})});
const ambientMovementEnabled=()=>ambientLightMovement&&cardHoverEffect==='glow'&&!hideCardHover;
let bleedImage={top:0,side:0,bottom:0,backing:true};
try{const saved=JSON.parse(localStorage.getItem('prem-bleed-image')||'null');if(saved){for(const [key,max] of [['top',240],['side',100],['bottom',120]])if(Number.isFinite(saved[key]))bleedImage[key]=Math.max(0,Math.min(max,saved[key]));if(saved.settingsVersion!==1&&saved.top===96&&saved.bottom===74){bleedImage.top=0;bleedImage.bottom=0;}if(!Number.isFinite(saved.bottom)&&Number.isFinite(saved.side))bleedImage.bottom=Math.max(0,Math.min(100,saved.side));if(typeof saved.backing==='boolean')bleedImage.backing=saved.backing;if(/^#[0-9a-f]{6}$/i.test(saved.color||''))bleedImage.color=saved.paletteVersion!==2&&saved.color.toLowerCase()==='#17171f'?'#0a0911':saved.color;}}catch{}
function applyBleedImageSettings(){
 const root=document.documentElement;for(const key of ['top','side','bottom']){root.style.setProperty('--full-bleed-padding-'+key,bleedImage[key]+'px');root.style.setProperty('--image-inset-'+key,bleedImage[key]+'px');const label=key[0].toUpperCase()+key.slice(1);$('#bleed'+label).value=bleedImage[key];$('#bleed'+label+'Value').value=bleedImage[key]+'px';}
 document.body.classList.toggle('image-backing-disabled',!bleedImage.backing);$('#bleedBacking').checked=bleedImage.backing;$('#bleedSettings').hidden=!fullBleed;$('#bleedTop').disabled=false;$('#bleedTop').closest('label').classList.remove('setting-disabled');
 for(const instance of instances)(instance.imageFrame||instance).resize();
}
desktopLabelMode.addEventListener('change',applyBleedImageSettings);
function updateBleedImage(key,value){if(busy){applyBleedImageSettings();return;}bleedImage[key]=value;applyBleedImageSettings();homeLayout?.flush(true);try{localStorage.setItem('prem-bleed-image',JSON.stringify(bleedImage));}catch{}}
// Each card heading carries its title and short category; this shows the chosen one (the category falls back to the project name).
function applyCardTextSource(){document.querySelectorAll('.card-title-text').forEach(el=>{const source=showCardCategory&&el.dataset.category?'category':'title';if(el.dataset.source===source)return;el.dataset.source=source;el.innerHTML=cardCopyWords(el.dataset[source],Number(el.dataset.offset)||0);});}
function applyCardAppearance(){applyCardTextSource();ambientLight.setEnabled(ambientMovementEnabled());main.querySelectorAll('.image-card').forEach(el=>el.dataset.imageMode=fullBleed?'bleed':'inset');const hoverSurfaces=main.querySelectorAll('.project-card[data-hover-effect]');hoverSurfaces.forEach(el=>el.dataset.hoverEffect=cardHoverEffect);configureSurfaceHover(hoverSurfaces,{rest:hideCardBackground?'page':'surface',enabled:!hideCardHover});const detailSurface=main.querySelector('.detail:not(.info-detail)');if(detailSurface){if((ambientDetailGlow||ambientLightMovement)&&cardHoverEffect==='glow'){detailSurface.dataset.hoverEffect='glow';detailSurface.toggleAttribute('data-hover-persistent',ambientDetailGlow);configureSurfaceHover([detailSurface],{rest:hideCardBackground?'page':'surface',enabled:!hideCardHover});}else{detailSurface.removeAttribute('data-hover-effect');detailSurface.removeAttribute('data-hover-persistent');}}document.body.classList.toggle('branding-hidden',hideBranding);document.body.classList.toggle('card-background-hidden',hideCardBackground);document.documentElement.classList.toggle('card-color-hidden',hideCardColor);document.body.classList.toggle('card-hover-hidden',hideCardHover);document.body.classList.toggle('card-client-hidden',!showCardClient);document.body.classList.toggle('card-client-inline',cardClientInline);document.body.classList.toggle('card-client-above',cardClientAbove);document.body.classList.toggle('card-details',cardDetails);document.body.classList.toggle('card-title-hidden',!showCardTitle);document.body.classList.toggle('card-description-hidden',!showCardDescription);syncAssistantCardAppearance();$('#fullBleed').checked=fullBleed;$('#hideBranding').checked=hideBranding;$('#cardBackground').checked=!hideCardBackground;$('#hideCardColor').checked=hideCardColor;$('#hideCardHover').checked=hideCardHover;$('#cardHoverEffect').value=cardHoverEffect;$('#ambientDetailGlow').checked=ambientDetailGlow;$('#ambientDetailGlowSetting').hidden=cardHoverEffect!=='glow';$('#ambientLightMovement').checked=ambientLightMovement;$('#ambientLightMovementSetting').hidden=cardHoverEffect!=='glow';$('#ambientColorSource').value=ambientColorSource;$('#ambientColorSourceSetting').hidden=cardHoverEffect!=='glow';$('#ambientGlowStrength').value=ambientGlowStrength;$('#ambientGlowStrengthValue').value=ambientGlowStrength+'%';$('#ambientGlowStrengthSetting').hidden=cardHoverEffect!=='glow';$('#ambientHoverSpeedSetting').hidden=cardHoverEffect!=='glow'||!ambientLightMovement;$('#ambientHoverSpeed').value=ambientHoverSpeed;$('#ambientHoverSpeedValue').value=ambientHoverSpeed+'%';$('#cardShowClient').checked=showCardClient;$('#cardClientInline').checked=cardClientInline;$('#cardClientAbove').checked=cardClientAbove;$('#cardDetails').checked=cardDetails;$('#cardShowCategory').checked=showCardCategory;$('#cardShowTitle').checked=showCardTitle;$('#cardShowDescription').checked=showCardDescription;applyBleedImageSettings();}
function applyEdgeShades(){edgeShades.setRetreat(edgeShadeRetreat);$('#edgeShadeRetreat').checked=edgeShadeRetreat;document.body.classList.toggle('edge-shade-top',edgeShadeTop);document.body.classList.toggle('edge-shade-bottom',edgeShadeBottom);document.body.classList.toggle('edge-shade-left',edgeShadeLeft);document.body.classList.toggle('edge-shade-right',edgeShadeRight);const factor=edgeShadeDepth/100;document.documentElement.style.setProperty('--edge-shade-top-depth',`${23*factor}vh`);document.documentElement.style.setProperty('--edge-shade-bottom-depth',`${31*factor}vh`);document.documentElement.style.setProperty('--edge-shade-side-depth',`${18*factor}vw`);$('#edgeShadeTop').checked=edgeShadeTop;$('#edgeShadeBottom').checked=edgeShadeBottom;$('#edgeShadeLeft').checked=edgeShadeLeft;$('#edgeShadeRight').checked=edgeShadeRight;$('#edgeShadeDepth').value=edgeShadeDepth;$('#edgeShadeDepthValue').value=edgeShadeDepth+'%';}
function applyGeometryTokens(){const root=document.documentElement,scale=cardRounding/64;root.style.setProperty('--radius-card',`${cardRounding}px`);root.style.setProperty('--radius-card-compact',`${44*scale}px`);root.style.setProperty('--radius-card-flip',`${44*scale}px`);root.style.setProperty('--radius-card-flip-compact',`${36*scale}px`);root.style.setProperty('--radius-card-wide-min',`${48*scale}px`);root.style.setProperty('--radius-card-wide-fluid',`${7*scale}vw`);root.style.setProperty('--radius-card-wide-max',`${140*scale}px`);root.style.setProperty('--radius-card-simple',`${42*scale}px`);root.style.setProperty('--card-gap-desktop',`${cardGap}px`);root.style.setProperty('--card-gap-mobile',`${cardGap*18/28}px`);$('#cardRounding').value=cardRounding;$('#cardRoundingValue').value=cardRounding+'px';$('#cardGap').value=cardGap;$('#cardGapValue').value=cardGap+'px';homeLayout?.flush(true);refreshImageFrames();}
let detailHeadingBeside=false;try{detailHeadingBeside=localStorage.getItem('prem-detail-heading-beside')==='true';}catch{}
function applyDetailHeading(){
 $('#detailHeadingBeside').checked=detailHeadingBeside;const el=main.querySelector('.detail:not(.info-detail)');if(!el)return;
 el.classList.toggle('heading-beside-image',detailHeadingBeside);
 if(detailHeadingBeside){const visual=el.querySelector('.detail-layout>.detail-media-column>.visual');document.documentElement.style.setProperty('--detail-image-top-inset',Math.max(0,visual.getBoundingClientRect().top+scrollY)+'px');}
 for(const instance of instances)(instance.imageFrame||instance).resize();
}
addEventListener('resize',applyDetailHeading);
let wideHero=true;try{wideHero=localStorage.getItem('prem-wide-hero')!=='false';}catch{}
// Off by default: a project's backdrop photo behind its detail page, and the Home featured stage.
const readFlag=key=>{try{return localStorage.getItem(key)==='true';}catch(error){console.warn('Preference '+key+' unreadable; using off',error);return false;}};
const saveFlag=(key,value)=>{try{localStorage.setItem(key,String(value));}catch(error){console.warn('Preference '+key+' not saved',error);}};
// Article images sit in the reading column or span the page; the root attribute drives article.css.
let articleImages='text';try{articleImages=localStorage.getItem('prem-article-images')==='page'?'page':'text';}catch(error){console.warn('Article images preference unreadable; using the text width',error);}
document.documentElement.dataset.articleImages=articleImages;$('#articleImages').value=articleImages;$('#articleImages').onchange=e=>{articleImages=e.target.value==='page'?'page':'text';document.documentElement.dataset.articleImages=articleImages;try{localStorage.setItem('prem-article-images',articleImages);}catch(error){console.warn('Article images preference not saved',error);}};
// Featured cards take two columns in a 3+ column masonry grid unless this is off; the Lab has its own value.
let featuredLarger=true;try{featuredLarger=localStorage.getItem('prem-featured-larger')!=='false';}catch(error){console.warn('Featured cards preference unreadable; using larger',error);}
$('#featuredLarger').checked=featuredLarger;$('#featuredLarger').onchange=e=>{featuredLarger=e.target.checked;saveFlag('prem-featured-larger',featuredLarger);if(!labMode)homeLayout?.setFeaturedLarger(featuredLarger);};
const labSettings=mountLabSettings($('#settings'),{onChange:()=>{if(labMode&&!busy)render('lab',{stream:false});}});
// One heading style for the whole site: body size (default) or editorial (large titles, small-caps section labels).
let editorialHeadings=readFlag('prem-editorial-headings');document.documentElement.dataset.headingStyle=editorialHeadings?'editorial':'body';
$('#editorialHeadings').checked=editorialHeadings;$('#editorialHeadings').onchange=e=>{editorialHeadings=e.target.checked;document.documentElement.dataset.headingStyle=editorialHeadings?'editorial':'body';saveFlag('prem-editorial-headings',editorialHeadings);for(const instance of instances)(instance.imageFrame||instance).resize();};
let contactTitle=readFlag('prem-contact-title');document.documentElement.classList.toggle('contact-title-hidden',!contactTitle);
$('#contactTitle').checked=contactTitle;$('#contactTitle').onchange=e=>{contactTitle=e.target.checked;document.documentElement.classList.toggle('contact-title-hidden',!contactTitle);saveFlag('prem-contact-title',contactTitle);};
let contentStartFirst=readFlag('prem-content-start-first');document.documentElement.classList.toggle('content-start-first',contentStartFirst);
$('#contentStartFirst').checked=contentStartFirst;$('#contentStartFirst').onchange=e=>{contentStartFirst=e.target.checked;document.documentElement.classList.toggle('content-start-first',contentStartFirst);saveFlag('prem-content-start-first',contentStartFirst);};
let projectBackdropEnabled=readFlag('prem-project-backdrop'),featureStage=readFlag('prem-feature-stage');
let navPosition='bottom';try{navPosition=localStorage.getItem('prem-nav-position')==='top'?'top':'bottom';}catch(error){console.warn('Navigation position unreadable; using bottom',error);}
document.documentElement.dataset.navPosition=navPosition;
let plainNav=readFlag('prem-plain-nav');document.documentElement.dataset.plainNav=plainNav?'on':'off';
let plainCards=readFlag('prem-plain-cards');document.documentElement.dataset.plainCards=plainCards?'on':'off';
const projectBackdrop=createProjectBackdrop({reduced:()=>reduce.matches,duration:()=>duration*(slow?2.5:1),before:$('.room-shade')?.nextSibling||null});
function applyHeroLayout(){applyContentWidths();const enabled=wideHero&&cardIds.includes(current);main.classList.toggle('wide-project-hero',enabled);main.querySelector('.detail')?.classList.toggle('wide-hero-card',enabled);document.body.classList.toggle('wide-project-hero-page',enabled);$('#wideHero').checked=wideHero;applyDetailHeading();}
const motionMaterial=new MotionMaterial(()=>intensity,()=>reduce.matches);
let cardGalleries=[],pageTimelines=[];
let carouselSettings=readCarouselSettings();
document.documentElement.style.setProperty('--carousel-card-scale',String(carouselSettings.size/100));
let servicesLayout='carousel',servicesCarouselAlignment='full-bleed',servicesCardBackground=true,testimonialCardBackground=true;try{servicesLayout=localStorage.getItem('prem-services-layout')==='grid'?'grid':'carousel';servicesCardBackground=localStorage.getItem('prem-services-card-background')!=='false';testimonialCardBackground=localStorage.getItem('prem-testimonial-card-background')!=='false';servicesCarouselAlignment=localStorage.getItem('prem-services-carousel-alignment')==='content'?'content':'full-bleed';}catch{}
let aboutGalleryVariant='scroll';try{const stored=localStorage.getItem('prem-about-gallery-variant');if(['perspective','circular'].includes(stored))aboutGalleryVariant=stored;}catch{}
let aboutGalleryOrientation='horizontal';try{aboutGalleryOrientation=localStorage.getItem('prem-about-gallery-orientation')==='vertical'?'vertical':'horizontal';}catch{}
let carouselDescriptionInCard=false;try{carouselDescriptionInCard=localStorage.getItem('prem-carousel-description-in-card')==='true';}catch{}
let carouselNativeSnap=false;try{carouselNativeSnap=localStorage.getItem('prem-carousel-native-snap')==='true';}catch(error){console.warn('Native snap setting could not be read.',error);}
let cardTitleScale=3;try{const saved=Number(localStorage.getItem('prem-card-title-scale'));if([2,3,4].includes(saved))cardTitleScale=saved;}catch{}
function applyCardTitleScale(){const className=`h${cardTitleScale}`;for(const heading of main.querySelectorAll('.project-card h2,.spatial-gallery-copy h3')){heading.classList.remove('h2','h3','h4');heading.classList.add(className);}$('#cardTitleScale').value=cardTitleScale;$('#cardTitleScaleValue').value=className;}
function syncCardGalleries(){
 for(const gallery of cardGalleries)if(gallery instanceof CardGallery){gallery.setArcSettings(carouselSettings);gallery.setDescriptionInCard(carouselDescriptionInCard);if(gallery.root.dataset.cardGallery==='home-projects')gallery.setCardCopyPosition(multiColumnPosition);if(gallery.root.dataset.galleryReduced!==String(reduce.matches))gallery.setVariant(gallery.variant);}
 applySectionPresentation(main,{servicesLayout,servicesCarouselAlignment,servicesCardBackground,testimonialCardBackground});
 cardGalleries=cardGalleries.filter(gallery=>{if(main.contains(gallery.root))return true;gallery.destroy();return false;});
 for(const root of main.querySelectorAll('[data-hero-timeline]'))if(!root.closest('.home-hero')&&!pageTimelines.some(timeline=>timeline.root===root))pageTimelines.push(new HeroTimeline(root,{mode:heroTimelineMode,reduced:()=>reduce.matches}));
 // Card worlds (spiral, infinite space) open a project from the card's exact on-screen spot, through the thumbnail morph.
 for(const root of main.querySelectorAll('[data-card-world]'))if(!cardGalleries.some(gallery=>gallery.root===root)&&CARD_ARRANGEMENTS[root.dataset.cardWorld])cardGalleries.push(new CardWorld(root,{items:JSON.parse(root.querySelector('[data-card-world-items]')?.textContent||'[]'),arrangement:CARD_ARRANGEMENTS[root.dataset.cardWorld](),reduced:()=>reduce.matches,onOpen:openFromSpiral}));
 for(const root of main.querySelectorAll('[data-card-gallery],[data-card-rail]'))if(!cardGalleries.some(gallery=>gallery.root===root)){const gallery=new (root.dataset.cardGallery?CardGallery:CardRail)(root,{reduced:()=>reduce.matches,arcSettings:carouselSettings,nativeSnap:carouselNativeSnap});if(gallery instanceof CardGallery)gallery.setDescriptionInCard(carouselDescriptionInCard);if(['about-gallery','home-projects'].includes(root.dataset.cardGallery)){gallery.setVariant(aboutGalleryVariant);gallery.setOrientation(aboutGalleryOrientation);}cardGalleries.push(gallery);}
 for(const gallery of cardGalleries)if(gallery instanceof CardGallery&&gallery.root.dataset.cardGallery==='home-projects')gallery.setCardCopyPosition(multiColumnPosition);applyCardTitleScale();composerContext?.refresh();
}
function cleanup(){clearImageHandoffs();pageTimelines.forEach(timeline=>timeline.destroy());pageTimelines=[];cardGalleries.forEach(gallery=>gallery.destroy());cardGalleries=[];mediaFocus.destroy();summaryStream?.destroy();summaryStream=null;detailContentReveal?.cancel();detailContentReveal=null;scrollingMaterial=false;homeLayout?.destroy();homeLayout=null;hoverEffects.forEach(dispose=>dispose());hoverEffects=[];instances.forEach(i=>i.destroy());instances=[];document.querySelectorAll('filter[data-dynamic]').forEach(f=>f.remove())}
function render(route,{stream=true,reveal='fade',progress=0,direction=1}={}){cleanup();labMode=route==='lab';if(labMode)discardHomeScene();applyLabCardDetails();main.classList.toggle('lab-canvas',labMode);const view=labMode?labView():{layout,columns:homeColumns,productDisplay:homeProductDisplay,featuredLarger};main.classList.remove('home-view-flip','home-view-flat','home-view-split');current=route;const assistant=route==='assistant';main.hidden=assistant;document.body.classList.toggle('assistant-route',assistant);portfolioAssistant.setActive(assistant,{focus:assistant&&!activeTransition,scroll:!activeTransition});if(assistant){main.innerHTML='';main.classList.remove('home-canvas');applyCardAppearance();syncRouteChrome(null);return;}main.classList.toggle('home-canvas',!cards.some(card=>card.id===route));const p=cards.find(p=>p.id===route);let restoredHome=null,restoredPage=false;if(p){if(galleryProjectOrigin?.route===route&&galleryProjectOrigin.scene){const saved=galleryProjectOrigin.scene;saved.restore();instances=saved.images;cardGalleries=galleryProjectOrigin.galleries;galleryProjectOrigin.scene=null;instances.forEach(image=>reduce.matches?image.suspend?.():image.resume?.());restoredPage=true;}else main.innerHTML=cardDetail(p,layout,{headingBesideImage:detailHeadingBeside});const back=$('#back');if(back)back.onclick=()=>dispatchCommand({id:'navigation.back',source:'pointer'});}else{current='work';if(homeScene){restoredHome=homeScene;homeScene=null;restoredHome.scene.restore();homeLayout=restoredHome.layout;instances=restoredHome.scene.images;cardGalleries=restoredHome.scene.galleries||[];}else{main.innerHTML=homeMarkup(cards,view.layout,{heroContent});if(labMode)main.querySelector('.homepage-layout').insertAdjacentHTML('afterbegin',labHeadingMarkup());}document.querySelectorAll('[data-card]').forEach(el=>el.onclick=()=>dispatchCommand({id:'project.open',target:el.dataset.card,source:'pointer'}));document.querySelectorAll('[data-layout]').forEach(el=>el.onclick=()=>switchLayout(el.dataset.layout));}
applyCardAppearance();applyContentWidths();homeSections.sync();aboutSections.sync();syncRouteChrome(p);if(!p&&!restoredHome)homeLayout=new HomeLayout(main,homeProjects,{mode:homeView,layout:view.layout,columns:view.columns,featuredLarger:view.featuredLarger,oneColumnPosition,multiColumnPosition,showCopyOnHover:showCardCopyOnHover,productDisplay:view.productDisplay,heroContent,timelineMode:heroTimelineMode,heroCarousel:heroCarouselEnabled,carouselState:homeCarouselState,heroCarouselSettings:()=>heroCarouselSettings,reduced:()=>reduce.matches,onMotion:homeScrollMotion});if(!p)homeLayout.setFeatureStage(featureStage&&!labMode);if(restoredHome){instances.forEach(image=>reduce.matches?image.suspend?.():image.resume?.());refreshImageFrames();homeLayout.setProductDisplay(homeProductDisplay);const options={mode:homeView,layout,columns:homeColumns,oneColumnPosition,multiColumnPosition,showCopyOnHover:showCardCopyOnHover};if(homeLayout.heroContent.timeline!==heroContent.timeline||homeLayout.heroContent.timelineText!==heroContent.timelineText||homeLayout.heroContent.description!==heroContent.description)homeLayout.setHeroContent(heroContent);if(homeLayout.timelineMode!==heroTimelineMode)homeLayout.setTimelineMode(heroTimelineMode);if(homeLayout.heroCarousel!==heroCarouselEnabled)homeLayout.setHeroCarousel(heroCarouselEnabled);if(homeLayout.mode!==(homeProductDisplay!=='cards'?'current':homeView)||homeLayout.layout!==layout||homeLayout.columns!==homeColumns||homeLayout.oneColumnPosition!==oneColumnPosition||homeLayout.multiColumnPosition!==multiColumnPosition||homeLayout.showCopyOnHover!==showCardCopyOnHover)homeLayout.apply(options);attachHoverEffects();}else if(!restoredPage)enhance();else{attachHoverEffects();refreshImageFrames();}if(p&&!p.body){detailContentReveal=createDetailContentReveal(main,{reduced:reduce.matches||!stream});const paragraph=main.querySelector('.detail>.project-summary');summaryStream=new SummaryStream(paragraph,{reduced:reduce.matches||!stream,control:activeTransition,mode:reveal,progress,onReveal:()=>detailContentReveal?.start(),onReverse:()=>detailContentReveal?.reverse()});if(!paragraph)detailContentReveal.start();}}
function syncRouteChrome(p){syncCardGalleries();const showBack=showBackControl(current);if(!activeTransition)edgeShades.sync(!!p);document.documentElement.dataset.homeView=homeView;$('#homeViewSelect').value=homeView;$('#homeLayoutSelect').value=layout;$('#heroCarouselSetting').hidden=homeView!=='current';$('#heroCarousel').checked=heroCarouselEnabled;syncOneColumnPosition();const options={duration:duration*(slow?2.5:1),immediate:!activeTransition&&!chromeTransition};syncDockActions(current,options);syncDockComposer(options);renderProjectMenu();const footer=$('.site-footer');if(footer)footer.hidden=!showFooter;document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(labMode?'lab':p&&!p.body?'work':current);a.classList.toggle('active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});applyHeroLayout();const pageName=labMode?'Lab':current;$('#announcer').textContent=p?p.name:pageName;document.title=`${p?p.name:pageName[0].toUpperCase()+pageName.slice(1)} — Prem`;projectBackdrop.sync(projectBackdropEnabled&&p&&!p.body?p:null);}
function createSurfaceEffect(context){return ambientMovementEnabled()&&context.host.dataset.hoverEffect==='glow'?ambientLight.register(context.host,context.layer):createLiquidReveal(context);}
function syncAssistantCardAppearance(cards=document.querySelectorAll('#askMessages .ask-cards .project-card')){for(const [card,effect] of assistantSurfaceEffects){if(!card.isConnected){effect.dispose();assistantSurfaceEffects.delete(card);}}for(const card of cards){if(!card?.matches?.('.ask-cards .project-card'))continue;card.dataset.hoverEffect=cardHoverEffect;configureSurfaceHover([card],{rest:hideCardBackground?'page':'surface',enabled:!hideCardHover});let mounted=assistantSurfaceEffects.get(card);if(mounted&&mounted.name!==cardHoverEffect){mounted.dispose();assistantSurfaceEffects.delete(card);mounted=null;}if(mounted)mounted.frame?.resize();if(!mounted){prepareSkin(card);const visual=card.querySelector('.visual'),frame=visual?new ImageFrame(visual):null,disposeEffect=mountSurfaceRenderer(card,createSurfaceEffect);assistantSurfaceEffects.set(card,{name:cardHoverEffect,frame,dispose:()=>{disposeEffect();frame?.destroy();}});}}mediaLoader.refresh(document.querySelector('#askMessages'));}
function attachHoverEffects(){hoverEffects.forEach(dispose=>dispose());hoverEffects=[];// Only skinned surfaces take a hover effect; the carousel's ambient backdrop shares the attribute but owns its light separately.
 main.querySelectorAll('[data-hover-effect]:has(> .liquid-skin)').forEach(el=>hoverEffects.push(mountSurfaceRenderer(el,createSurfaceEffect)));}
function enhance(){syncMediaFocusControls();main.querySelectorAll('.surface').forEach(prepareSkin);attachHoverEffects();main.querySelectorAll('.visual').forEach(el=>instances.push(reduce.matches?new ImageFrame(el):new LiquidImage(el,()=>intensity)));mediaLoader.refresh(main);}
async function morph(from,to){if(reduce.matches||!from||!to)return;await flow(from,to,{duration:duration*(slow?2.5:1),intensity,control:activeTransition,ambientGlow:ambientDetailGlow&&cardHoverEffect==='glow'&&!hideCardHover,ambientLight:ambientMovementEnabled()?ambientLight:null});}
function snapshot(el){if(!el)return null;const playingVideo=playingVideoState(el);pauseVideoPreviews(playingVideo?.element);const sourceImage=el.querySelector('.visual img');if(sourceImage?.dataset.mediaSrc)mediaLoader.load(sourceImage,true);const clone=el.cloneNode(true);clone.querySelectorAll('canvas,video,.surface-effect-layer').forEach(c=>c.remove());clone.removeAttribute('data-card');clone.removeAttribute('data-surface');const copy=!el.morphCopyRoot&&el.classList.contains('image-card')?el.querySelector(':scope > .card-copy'):null,copyStyle=copy?getComputedStyle(copy):null,hiddenCopy=!!copyStyle&&(copyStyle.visibility==='hidden'||Number(copyStyle.opacity)===0),v=el.querySelector('.visual'),img=presentedImage(v);const shared={};for(const [key,selector] of [['title','h1,h2'],['client','.card-client,.project-client'],['category','.eyebrow'],['summary','.project-summary,.info-summary']]){const node=sharedCopyNode(el,key);if(node){const style=getComputedStyle(node),scale=copyScale(node);shared[key]={node:node.cloneNode(true),words:captureSharedWords(node,key),opacity:copyOpacity(node,el),scale,rect:node.getBoundingClientRect(),fontSize:parseFloat(style.fontSize)*scale.y,letterSpacing:(parseFloat(style.letterSpacing)||0)*scale.y,fontFamily:style.fontFamily,fontWeight:style.fontWeight,lineHeight:parseFloat(style.lineHeight)/parseFloat(style.fontSize),color:style.color,hidden:style.visibility==='hidden'||Number(style.opacity)===0||hiddenCopy};}}return {element:el,video:playingVideo,copyRoot:el.morphCopyRoot,placement:capturePlacement(el),rect:capturePlacement(el).screenRect,clone,shared,projectId:el.dataset.card,ambientActive:!!el.querySelector(':scope > .surface-effect-layer.is-active'),background:getComputedStyle(el.querySelector(':scope > .liquid-skin')||el).backgroundColor,backgroundImage:getComputedStyle(el.querySelector(':scope > .liquid-skin')||el).backgroundImage,radius:parseFloat(getComputedStyle(el.querySelector(':scope > .liquid-skin')||el).borderTopLeftRadius),reflectionTransform:getComputedStyle(el.querySelector(':scope > .liquid-skin > .material-reflection')||el).transform,cornerRadii:{left:parseFloat(getComputedStyle(el.querySelector(':scope > .liquid-skin')||el).borderTopLeftRadius),right:parseFloat(getComputedStyle(el.querySelector(':scope > .liquid-skin')||el).borderTopRightRadius)},image:img?{src:img.currentSrc||img.src,loaded:img.complete&&img.naturalWidth>0,originalSrc:img.dataset?.originalImage||img.currentSrc||img.src,originalWidth:Number(img.getAttribute?.('width'))||img.naturalWidth,originalHeight:Number(img.getAttribute?.('height'))||img.naturalHeight,rounding:parseFloat(getComputedStyle(img).borderTopLeftRadius)||0,motion:getImageMotion(v),shade:hiddenCopy?0:Number(getComputedStyle(v).getPropertyValue('--image-overlay'))||0,padding:readImagePadding(v),sizeLimit:parseFloat(getComputedStyle(v).getPropertyValue('--image-size-limit'))||1,shadeHeight:hiddenCopy?0:parseFloat(getComputedStyle(v).getPropertyValue('--image-shade-height'))||0,backing:getComputedStyle(v).backgroundColor,backingGradient:getComputedStyle(v).backgroundImage,rect:v.getBoundingClientRect(),radius:readFrameRadius(v),contentRect:img.getBoundingClientRect()}:null};}
function freeze(el){pauseVideoPreviews();const rect=el.getBoundingClientRect(),clone=el.cloneNode(true);clone.querySelectorAll('canvas,video').forEach(c=>c.remove());clone.removeAttribute('id');Object.assign(clone.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',minHeight:'0',margin:'0',pointerEvents:'none',zIndex:'18',clipPath:'none',filter:'none'});return {el,clone,rect};}
function pushCards(items,selected,returning=false){
 const ms=duration*(slow?2.5:1);
 return Promise.all(items.map(item=>{
  const {x,y}=neighborPush(item.rect,selected,{width:innerWidth,height:innerHeight});
  // Returning cards remain in their grid with their original content and canvas.
  const retained=returning||item.live,node=retained?item.el:item.clone;if(!retained)document.body.append(node);
  // Keep the settled card on the same layer: cancelling the slide must not
  // demote its glass and WebGL image together at the last docking frame.
  if(retained)node.classList.add('docked-card');
  const basis=node.classList.contains('spatial-gallery-item')?getComputedStyle(node).transform:null,pose=basis&&basis!=='none'?' '+basis:'';
  const origin='translate3d(0px,0px,0px)'+pose,displaced=`translate3d(${x}px,${y}px,0px)`+pose;
  const frames=returning?[{transform:displaced},{transform:origin}]:[{transform:origin},{transform:displaced}];
  // Linear keyframes are sought through the exact expansion curve of flow.
  const animation=activeTransition.track(node.animate(frames,{duration:ms,easing:'linear',fill:'both'}),morphProgress);
  return animation.finished.then(()=>{if(!retained)node.remove();});
 }));
}
async function slideCards(old,direction){pulseImages(main,1.3);const ms=duration*(slow?2.5:1),distance=innerWidth+48;if(ambientMovementEnabled())ambientLight.beginSlide(main.querySelector('.detail'),direction);const removeViewport=stageMotion(old.clone,20);old.clone.style.zIndex='20';const a=old.clone.animate([{transform:'translateX(0)'},{transform:`translateX(${-direction*distance}px)`}],{duration:ms,easing:EASE.settle,fill:'forwards'});const entrance=current==='about'?[{opacity:0,transform:`translate3d(${direction*distance}px,${pageEntranceLift}px,0)`},{opacity:1,transform:'translate3d(0,0,0)'}]:[{transform:`translateX(${direction*distance}px)`},{transform:'translateX(0)'}];const b=main.animate(entrance,{duration:ms,easing:EASE.settle});activeTransition.track(a);activeTransition.track(b);try{await Promise.all([a.finished,b.finished]);}finally{removeViewport();}}
// The default page transition: the incoming page fades in while sliding up.
function fadeUpIn(target){if(reduce.matches)return null;return target.animate([{opacity:0,transform:`translateY(${pageEntranceLift}px)`},{opacity:1,transform:'translateY(0)'}],{duration:Math.max(240,duration),easing:EASE.settle});}
function scrollPage(top){
 const root=document.documentElement,previous=root.style.getPropertyValue('scroll-behavior'),priority=root.style.getPropertyPriority('scroll-behavior');root.style.setProperty('scroll-behavior','auto','important');window.scrollTo({top,behavior:'auto'});
 if(previous)root.style.setProperty('scroll-behavior',previous,priority);else root.style.removeProperty('scroll-behavior');
 globalThis.requestAnimationFrame?.(()=>{root.style.setProperty('scroll-behavior','auto','important');window.scrollTo({top,behavior:'auto'});if(previous)root.style.setProperty('scroll-behavior',previous,priority);else root.style.removeProperty('scroll-behavior');});
}
function navigateAssistant(route){
 if(current==='work')homeScroll=scrollY;
 chromeTransition=true;render(route,{stream:false});chromeTransition=false;
 scrollPage(route==='work'?homeScroll:0);
 fadeUpIn(route==='assistant'?$('#askPage'):main);
 globalThis.dispatchEvent?.(new Event('portfolio-route-settled'));
}
// About and Contact have no card in the home grid, so there is nothing to morph back into.
function returnHomeFromInformation(){
 chromeTransition=true;render('work',{stream:false});chromeTransition=false;
 scrollPage(homeScroll);
 edgeShades.sync(false);if(ambientMovementEnabled())ambientLight.finishNavigation(null);
 fadeUpIn(main);
}
// The simple page transition, used for every route when the dev switch is on and as the fallback for a project
// reached by link or refresh (no card to morph from): the current page fades out in place (unless the skip-exit setting is on), the next fades in rising.
async function simplePageTransition(route){
 busy=true;
 try{
  const leaving=current==='assistant'?$('#askPage'):main;
  // The Lab answers the click with a short ring at once (never awaited, so it delays nothing) and fades in like any
  // page; the full landing ripple is off unless LAB_RIPPLE.landing is set (ADR-004).
  const ripple=!reduce.matches&&route==='lab'?(labRipple??=createLabRipple()):null;
  if(ripple)void ripple.click();
  let exit=null;
  if(!reduce.matches&&!simpleTransitions.skipExit){
   // A project page recedes towards the current view with its visible text stepping out; other pages fade in place.
   exit=projectIds.includes(current)?projectPageExit(main,{duration}):pageFadeExit(leaving,{duration});
   await exit?.finished;
  }
  if(current==='work')homeScroll=labMode?0:scrollY;
  // Back and Escape return to wherever this project was opened from, as with the animated transitions.
  if(projectIds.includes(route)){if(!projectIds.includes(current))projectEntry.capture(labMode?'lab':current);}else projectEntry.clear();
  disposeGalleryOrigin();previewProjectOrigin=null;assistantProjectOrigin=null;galleryProjectTarget=null;previewProjectTarget?.remove();previewProjectTarget=null;assistantProjectTarget=null;homeOpenTarget=null;navSlideTarget=null;travelDirection=0;
  // Streaming keeps a project's staggered text reveal (title, summary, then each fact); the hero image grows in.
  chromeTransition=true;render(route,{stream:true});chromeTransition=false;
  scrollPage(route==='work'?homeScroll:0);
  edgeShades.sync(cardIds.includes(route));if(ambientMovementEnabled())ambientLight.finishNavigation(null);
  const landing=fadeUpIn(route==='assistant'?$('#askPage'):main);
  if(ripple&&LAB_RIPPLE.landing)void Promise.resolve(landing?.finished).then(()=>ripple.land());
  heroImageEntrance(main,{reduced:reduce.matches,duration});
  exit?.cancel();
 }finally{busy=false;globalThis.dispatchEvent?.(new Event('portfolio-route-settled'));}
}
// A transition that throws must not leave the page inert half-way: report it, drop every transient motion
// layer and retained scene, and show the requested page without animation.
function recoverNavigation(error){
 console.error('Page transition failed; showing the page without its transition.',error);
 activeTransition=null;motionMaterial.stop();scrollingMaterial=false;
 for(const node of document.querySelectorAll('.motion-viewport,.retained-home,.motion-afterglow,.preview-morph-proxy'))node.remove();
 discardHomeScene();
 disposeGalleryOrigin();projectEntry.clear();previewProjectOrigin=null;assistantProjectOrigin=null;galleryProjectTarget=null;assistantProjectTarget=null;
 document.body.classList.remove('in-motion');document.documentElement.classList.remove('route-transition');
 const hash=location.hash.slice(1)||'work',route=isRoute(hash)?hash:'work';
 render(route,{stream:false});edgeShades.sync(cardIds.includes(current));scrollPage(0);
 busy=false;navigationPreparing=false;globalThis.dispatchEvent?.(new Event('portfolio-route-settled'));
}
const pageEntranceLift=14;
// The Lab is the home page's cards under its own grid rules (Developer settings → Lab), whatever the home settings are.
function labView(){return {layout:labSettings.layout,columns:labSettings.columns,productDisplay:'cards',featuredLarger:labSettings.featuredLarger};}
function applyLabCardDetails(){document.documentElement.classList.toggle('lab-card-details-hidden',labMode&&!labSettings.cardDetails);document.documentElement.classList.toggle('lab-grid-full',labMode&&labSettings.fullWidth);document.documentElement.classList.toggle('lab-heading-hidden',labMode&&!labSettings.heading);}
function isRoute(route){return ['work','assistant','lab',...cardIds].includes(route);}
function discardHomeScene(){if(!homeScene)return;homeScene.scene.galleries?.forEach(gallery=>gallery.destroy());homeScene.scene.dispose();homeScene.layout?.destroy();homeScene=null;}
let labRipple=null;
async function navigate(){if(location.hash==='#about'&&current!=='about'&&current!=='assistant'&&projectEntry.route!=='about'&&galleryProjectOrigin?.route!=='about'){navSlideTarget='about';travelDirection=travelDirection||1;}else if(location.hash==='#work'&&current==='about'){navSlideTarget='work';travelDirection=-1;}try{await runNavigation();}catch(error){recoverNavigation(error);}}
async function runNavigation(){if(busy||navigationPreparing)return;mediaFocus.destroy();if(assistantFloating)closeAssistantFloating({focus:false});let route=location.hash.slice(1)||'work';if(!isRoute(route))route='work';if(route===(labMode?'lab':current))return;if(route!=='assistant'){navigationPreparing=true;try{await portfolioAssistant.prepareNavigation();}finally{navigationPreparing=false;}const latestHash=location.hash.slice(1)||'work',latest=isRoute(latestHash)?latestHash:'work';if(latest!==route){void navigate();return;}}if(simpleTransitions.enabled||route==='lab'||labMode){await simplePageTransition(route);return;}const entryHistory=projectEntry.snapshot(),galleryHistory=galleryProjectOrigin;const galleryProjectSource=galleryProjectTarget&&projectIds.includes(route)?galleryProjectTarget:null,galleryProject=!!galleryProjectSource,galleryReturn=!!(galleryProjectOrigin&&route===galleryProjectOrigin.route&&projectIds.includes(current));if(galleryProject){galleryProjectOrigin={route:current,project:route,element:galleryProjectSource,scroll:scrollY,galleryId:galleryProjectSource.closest('[data-card-gallery]')?.dataset.cardGallery,index:Number(galleryProjectSource.closest('[data-card-gallery]')?.dataset.galleryIndex)||0,scene:null,galleries:[]};projectEntry.capture(current);}const previewProjectSource=previewProjectTarget&&!projectIds.includes(current)&&current!=='assistant'&&projectIds.includes(route)?previewProjectTarget:null,previewProject=!!previewProjectSource,previewReturn=!!(previewProjectOrigin&&route==='work'&&projectIds.includes(current)&&!galleryReturn);if(previewProjectTarget&&!previewProject)previewProjectTarget.remove();previewProjectTarget=null;if(previewProject){previewProjectOrigin={project:route};if(current!=='work')projectEntry.capture(current);}const assistantProjectSource=current==='assistant'&&projectIds.includes(route)?assistantProjectTarget||document.querySelector(`#askMessages [data-content-card="${route}"]`):null,assistantProject=Boolean(assistantProjectSource),assistantReturnTarget=route==='assistant'&&projectIds.includes(current)&&assistantProjectOrigin?(assistantProjectOrigin.project===current&&assistantProjectOrigin.element.isConnected?assistantProjectOrigin.element:document.querySelector(`#askMessages [data-content-card="${current}"]`)):null,assistantHistory={...assistantNavigation};if(assistantProject){assistantProjectOrigin={project:route,element:assistantProjectSource,scroll:scrollY};projectEntry.capture('assistant');}if(current==='work'&&homeOpenTarget===route)projectEntry.capture('work');assistantNavigation.beforeNavigate(current,route);if(route==='assistant'&&!assistantReturnTarget||current==='assistant'&&!assistantProject){navSlideTarget=null;homeOpenTarget=null;travelDirection=0;navigateAssistant(route);return;}const navSlide=navSlideTarget===route;navSlideTarget=null;homeOpenTarget=null;if(route===current){travelDirection=0;return;}if(route==='work'&&!navSlide&&informationCards.some(card=>card.id===current)){travelDirection=0;returnHomeFromInformation();return;}if(route==='work'&&!navSlide&&projectIds.includes(current)&&!homeScene&&!projectEntry.route&&!galleryProjectOrigin&&!previewProjectOrigin){await simplePageTransition('work');return;}busy=true;document.documentElement.classList.add('route-transition');activeTransition=new TransitionControl();document.body.classList.add('in-motion');motionMaterial.start();const previousScroll=scrollY;const currentBefore=current;activeTransition.register(()=>{const options={duration:duration*(slow?2.5:1)};syncDockActions(currentBefore,options);});const previousCard=current,wasHome=current==='work',wasCard=cardIds.includes(current),isCard=cardIds.includes(route);const navigation=cardNavigation(current,route,projectIds,{slide:navSlide||homeProductDisplay==='text'&&!previewProject&&!previewReturn&&(current==='work'||route==='work'),direction:travelDirection}),sliding=navigation.kind==='slide';if(ambientMovementEnabled()&&!reduce.matches)ambientLight.hold(wasHome?main.querySelector(`[data-card="${route}"]`):main.querySelector('.detail'));const oldMain=sliding?freeze(main):null;const direction=navigation.direction;travelDirection=0;
 if(wasHome){homeScroll=scrollY;homeLayout?.pause();}const selected=sliding?null:galleryProject?galleryProjectSource:previewProject?previewProjectSource:assistantProject?assistantProjectSource:wasHome?main.querySelector(`[data-card="${route}"]`):main.querySelector('.surface');assistantProjectTarget=null;galleryProjectTarget=null;const source=snapshot(selected);if(previewProjectSource)previewProjectSource.style.visibility='hidden';const outgoing=wasHome&&isCard&&!sliding?(galleryProject?[...galleryProjectSource.closest('[data-card-gallery]').querySelectorAll('[data-gallery-item]')].filter(el=>!el.contains(selected)):previewProject?[]:[...document.querySelectorAll('[data-card]')].filter(el=>el!==selected)).map(el=>({el,rect:el.getBoundingClientRect(),live:true})):[];
 const retainedHome=wasHome&&isCard&&!sliding&&!reduce.matches?retainHome(main,instances):null;const retainedLayout=retainedHome?homeLayout:null;if(retainedHome){retainedHome.galleries=cardGalleries;cardGalleries=[];instances=[];homeLayout=null;}const retainedDetail=wasCard&&!sliding&&!reduce.matches&&source?retainHome(main,instances):null;if(retainedDetail){if(galleryProject){retainedDetail.galleries=cardGalleries;galleryProjectOrigin.galleries=cardGalleries;cardGalleries=[];}retainedDetail.summary=summaryStream;retainedDetail.reveal=detailContentReveal;summaryStream?.pause();detailContentReveal?.pause();summaryStream=null;detailContentReveal=null;instances=[];}
 render(route,{reveal:projectRevealMode(),direction});scrollPage(route==='work'?homeScroll:galleryReturn?galleryProjectOrigin.scroll:assistantReturnTarget?assistantProjectOrigin.scroll:0);if(galleryReturn&&!galleryProjectOrigin.element.isConnected){galleryProjectOrigin.element=main.querySelector(`[data-content-card="${galleryProjectOrigin.project}"]`);const gallery=cardGalleries.find(g=>g.root.dataset.cardGallery===galleryProjectOrigin.galleryId);gallery?.go(galleryProjectOrigin.index,false);gallery?.paint();}if(route==='work'){homeLayout?.flush(true);homeLayout?.holdCard(previousCard);homeLayout?.pause();scrollPage(homeScroll);}const restoreReturningHome=route==='work'&&wasCard&&!reduce.matches?stageHomeReturn(main):null;
 // Back from a thumbnail-opened project docks into the hover thumbnail of the project now open.
 const previewReturnTarget=previewReturn&&!sliding&&!reduce.matches?previewReturnProxy(main,projects.find(project=>project.id===previousCard)||{}):null;if(previewReturnTarget)previewReturnTarget.style.visibility='hidden';
 try{
 if(!reduce.matches&&sliding){edgeShades.animateTo(isCard,activeTransition,duration*(slow?2.5:1));await slideCards(oldMain,direction);}else{const destination=(galleryReturn?galleryProjectOrigin.element:null)||previewReturnTarget||assistantReturnTarget|| (route==='work'?main.querySelector(`[data-card="${previousCard}"]`)||main.querySelector('.project-card'):main.querySelector('.surface'));const incoming=route==='work'&&wasCard?(galleryReturn?[...destination.closest('[data-card-gallery]').querySelectorAll('[data-gallery-item]')].filter(el=>!el.contains(destination)):previewReturnTarget?[]:[...document.querySelectorAll('[data-card]')].filter(el=>el!==destination)).map(el=>({el,rect:el.getBoundingClientRect()})):[];if(!reduce.matches&&source&&destination)activeTransition.synchronize(duration*(slow?2.5:1));edgeShades.animateTo(isCard,activeTransition,duration*(slow?2.5:1));const tasks=[morph(source,destination)];if(retainedHome)tasks.push(...retainedHome.fadeChrome(activeTransition,duration*(slow?2.5:1)));if(retainedDetail)tasks.push(...retainedDetail.fadeRest(activeTransition,selected,duration*(slow?2.5:1)));if(!reduce.matches){if(outgoing.length&&source)tasks.push(pushCards(outgoing,source.rect));if(incoming.length)tasks.push(pushCards(incoming,destination.getBoundingClientRect(),true));const extra=main.querySelector(':scope > .story');if(extra&&wasHome)tasks.push(activeTransition.track(extra.animate([{opacity:0,transform:'translateY(90px)'},{opacity:1,transform:'translateY(0)'}],{duration:duration*(slow?2.5:1),easing:EASE.settle})).finished);}await Promise.all(tasks);}
 await activeTransition.wait();
 }finally{restoreReturningHome?.();previewProjectSource?.remove();fadeOutProxy(previewReturnTarget,reduce.matches);}
 if(activeTransition.reversed){projectEntry.restore(entryHistory);Object.assign(assistantNavigation,assistantHistory);if(previousCard==='assistant')assistantProjectOrigin=null;if(retainedHome){cleanup();retainedHome.restore();instances=retainedHome.images;homeLayout=retainedLayout;cardGalleries=retainedHome.galleries||[];attachHoverEffects();current=previousCard;main.classList.add('home-canvas');syncRouteChrome(null);}else if(retainedDetail){if(current==='work'&&homeLayout){const scene=retainHome(main,instances);scene.galleries=cardGalleries;cardGalleries=[];scene.stash();homeScene={scene,layout:homeLayout};instances=[];homeLayout=null;}if(galleryReturn&&current!=='work'){const scene=retainHome(main,instances);scene.stash();galleryProjectOrigin.scene=scene;galleryProjectOrigin.galleries=cardGalleries;instances=[];cardGalleries=[];}cleanup();retainedDetail.restore();instances=retainedDetail.images;if(retainedDetail.galleries)cardGalleries=retainedDetail.galleries;summaryStream=retainedDetail.summary;detailContentReveal=retainedDetail.reveal;current=previousCard;main.hidden=false;document.body.classList.remove('assistant-route');portfolioAssistant.setActive(false);syncRouteChrome(cards.find(card=>card.id===current));attachHoverEffects();refreshImageFrames();summaryStream?.resume();detailContentReveal?.resume();}else render(previousCard,{stream:false});window.scrollTo({top:previousScroll,behavior:'instant'});history.replaceState(null,'','#'+previousCard);if(galleryProject)galleryProjectOrigin=galleryHistory;}else{if(retainedHome){retainedHome.stash();homeScene={scene:retainedHome,layout:retainedLayout};}if(galleryProject&&retainedDetail){retainedDetail.stash();galleryProjectOrigin.scene=retainedDetail;}else{retainedDetail?.summary?.destroy();retainedDetail?.reveal?.cancel();retainedDetail?.dispose();}if(assistantReturnTarget)assistantProjectOrigin=null;if(!projectIds.includes(current)){projectEntry.clear();disposeGalleryOrigin();previewProjectOrigin=null;}else syncGalleryOrigin(current);}if(ambientMovementEnabled())ambientLight.finishNavigation(current==='work'?main.querySelector(`[data-card="${wasHome?route:previousCard}"]`):main.querySelector('.detail'));edgeShades.sync(cardIds.includes(current));activeTransition.complete();activeTransition=null;motionMaterial.stop();homeLayout?.resume();document.body.classList.remove('in-motion');document.documentElement.classList.remove('route-transition');globalThis.dispatchEvent?.(new Event('portfolio-route-settled'));if(!reduce.matches)pulseImages(main,1.3,{onlyIfIdle:true});busy=false;if(location.hash.slice(1)!==current&&location.hash)navigate();}
function homeScrollMotion(active){
 if(busy||current!=='work'||!homeLayout||homeLayout.paused)return;
 if(active){if(!scrollingMaterial){scrollingMaterial=true;document.body.classList.add('in-motion');motionMaterial.start();}}
 else{scrollingMaterial=false;motionMaterial.stop();document.body.classList.remove('in-motion');}
}
async function openHomeCard(id){
 if(busy||current!=='work')return;navSlideTarget=null;
 if(homeLayout?.mode==='flip'&&!reduce.matches){
  busy=true;activeTransition=new TransitionControl();scrollingMaterial=false;document.body.classList.add('in-motion');motionMaterial.start();
  await homeLayout.prepareOpen(id,activeTransition,duration*(slow?2.5:1));await activeTransition.wait();
  const reversed=activeTransition.reversed;activeTransition.complete();activeTransition=null;motionMaterial.stop();document.body.classList.remove('in-motion');busy=false;
  if(reversed){homeLayout.resume();return;}
 }
 homeLayout?.pause();homeOpenTarget=id;location.hash=id;
}
async function reflowHome({view=homeView,layout:nextLayout=layout,columns=homeColumns,contentWidth=homeContentWidth,cardPosition=oneColumnPosition,multiPosition=multiColumnPosition}={}){
 if(busy||current!=='work'||!homeLayout)return;
 if(view===homeView&&nextLayout===layout&&columns===homeColumns&&contentWidth===homeContentWidth&&cardPosition===oneColumnPosition&&multiPosition===multiColumnPosition)return;
 busy=true;activeTransition=new TransitionControl();scrollingMaterial=false;
 const previous={view:homeView,layout,columns:homeColumns,contentWidth:homeContentWidth,cardPosition:oneColumnPosition,multiPosition:multiColumnPosition,scroll:scrollY};
 homeLayout.pause();const chrome=[...main.querySelectorAll('.hero-about,.hero-news')].map(node=>({node,rect:node.getBoundingClientRect()}));const activeId=homeLayout.mode!=='current'?homeLayout.activeId:[...main.querySelectorAll('[data-card]')].reduce((best,el)=>{const center=node=>{const r=node.getBoundingClientRect();return Math.abs(r.top+r.height/2-innerHeight*.55);};return !best||center(el)<center(best)?el:best;},null)?.dataset.card||cards[0].id;
 const elements=[...main.querySelectorAll('[data-card]')],sources=new Map(elements.map(el=>[el,snapshot(el)]));
 homeView=view;layout=nextLayout;homeColumns=columns;homeContentWidth=contentWidth;oneColumnPosition=cardPosition;multiColumnPosition=multiPosition;applyContentWidths();homeLayout.apply({mode:view,layout,columns,oneColumnPosition,multiColumnPosition,showCopyOnHover:showCardCopyOnHover});refreshImageFrames();
 if(view!==previous.view)homeLayout.focus(activeId);else window.scrollTo({top:previous.scroll,behavior:'instant'});
 homeLayout.flush(true);homeLayout.holdCard(activeId);syncRouteChrome(null);$('#gridColumns').value=homeColumns;$('#homeLayoutSelect').value=layout;
 if(!reduce.matches){
  document.body.classList.add('in-motion');motionMaterial.start();const movements=chrome.map(({node,rect})=>{const target=node.getBoundingClientRect();return activeTransition.track(node.animate([{transform:`translate3d(${rect.left-target.left}px,${rect.top-target.top}px,0)`},{transform:'translate3d(0px,0px,0px)'}],{duration:duration*(slow?2.5:1),easing:EASE.settle,fill:'both'})).finished;});
  for(const element of elements){
   const source=sources.get(element),target=element.getBoundingClientRect();
   const visible=source.rect.bottom>0&&source.rect.top<innerHeight||target.bottom>0&&target.top<innerHeight;
   if(!visible)continue;
   if(element.dataset.card===activeId)movements.push(morph(source,element));
   else movements.push(activeTransition.track(element.animate([{transform:`translate3d(${source.rect.left-target.left}px,${source.rect.top-target.top}px,0)`},{transform:'translate3d(0px,0px,0px)'}],{duration:duration*(slow?2.5:1),easing:EASE.settle,fill:'both'})).finished);
  }
  await Promise.all(movements);await activeTransition.wait();
 }
 if(activeTransition.reversed){homeView=previous.view;layout=previous.layout;homeColumns=previous.columns;homeContentWidth=previous.contentWidth;oneColumnPosition=previous.cardPosition;multiColumnPosition=previous.multiPosition;applyContentWidths();homeLayout.apply({mode:homeView,layout,columns:homeColumns,oneColumnPosition,multiColumnPosition,showCopyOnHover:showCardCopyOnHover});refreshImageFrames();window.scrollTo({top:previous.scroll,behavior:'instant'});homeLayout.flush(true);}
 activeTransition.complete();activeTransition=null;homeLayout.resume();syncRouteChrome(null);$('#gridColumns').value=homeColumns;$('#homeLayoutSelect').value=layout;motionMaterial.stop();document.body.classList.remove('in-motion');busy=false;
 try{localStorage.setItem('prem-home-view',homeView);localStorage.setItem('prem-home-layout',layout);localStorage.setItem('prem-home-columns',String(homeColumns));localStorage.setItem('prem-home-content-width',String(homeContentWidth));localStorage.setItem('prem-one-column-card-position',oneColumnPosition);localStorage.setItem('prem-multi-column-card-position',multiColumnPosition);}catch{}
 if(location.hash&&location.hash.slice(1)!==current)navigate();
}
function switchLayout(next){return reflowHome({layout:next});}
$('#homeViewSelect').onchange=e=>{if(busy){e.target.value=homeView;return;}if(current==='work')reflowHome({view:e.target.value});else{homeView=e.target.value;document.documentElement.dataset.homeView=homeView;syncOneColumnPosition();try{localStorage.setItem('prem-home-view',homeView);}catch{}}};
$('#homeLayoutSelect').onchange=e=>{if(busy||current!=='work'||labMode){e.target.value=layout;return;}switchLayout(e.target.value);};
$('#homeContentWidth').onchange=e=>{if(busy){applyContentWidths();return;}const width=normaliseContentWidth(e.target.value);if(current==='work')reflowHome({contentWidth:width});else{homeContentWidth=width;applyContentWidths();try{localStorage.setItem('prem-home-content-width',width);}catch{}}};
$('#gridColumns').value=homeColumns;$('#gridColumns').onchange=e=>{if(busy||current!=='work'||labMode){e.target.value=homeColumns;return;}reflowHome({columns:+e.target.value});};
$('#singleColumnCardPosition').onchange=e=>{if(busy||current!=='work'||homeColumns!==1||layout==='alternating'||homeView!=='current'){e.target.value=oneColumnPosition;return;}reflowHome({cardPosition:e.target.value});};
$('#multiColumnCardPosition').onchange=e=>{if(busy||homeView!=='current'||homeColumns<=1&&layout!=='alternating'||!['cards','carousel'].includes(homeProductDisplay)){e.target.value=multiColumnPosition;return;}if(current==='work'&&homeProductDisplay==='cards'){reflowHome({multiPosition:e.target.value});return;}multiColumnPosition=e.target.value;try{localStorage.setItem('prem-multi-column-card-position',multiColumnPosition);}catch{}homeLayout?.syncCardComposition();for(const gallery of cardGalleries)if(gallery instanceof CardGallery&&gallery.root.dataset.cardGallery==='home-projects')gallery.setCardCopyPosition(multiColumnPosition);syncOneColumnPosition();};
$('#cardTitleScale').oninput=e=>{if(busy){e.target.value=cardTitleScale;return;}const value=Number(e.target.value);if(![2,3,4].includes(value))return;cardTitleScale=value;applyCardTitleScale();try{localStorage.setItem('prem-card-title-scale',String(value));}catch{}};
$('#cardCopyHover').onchange=e=>{if(busy){e.target.checked=showCardCopyOnHover;return;}showCardCopyOnHover=e.target.checked;homeLayout?.setCopyHover(showCardCopyOnHover);try{localStorage.setItem('prem-card-copy-hover-desktop',String(showCardCopyOnHover));}catch{}};
async function setDetailLayout({hero=wideHero,contentWidth=detailContentWidth,heading=detailHeadingBeside}={}){
 if(busy){$('#wideHero').checked=wideHero;$('#detailHeadingBeside').checked=detailHeadingBeside;applyContentWidths();return;}if(hero===wideHero&&contentWidth===detailContentWidth&&heading===detailHeadingBeside)return;
 const previous={hero:wideHero,contentWidth:detailContentWidth,heading:detailHeadingBeside},el=main.querySelector('.detail'),source=el?snapshot(el):null;
 const siblings=el?[...main.querySelectorAll('.detail-footer,.story')].map(node=>({node,rect:node.getBoundingClientRect()})):[];
 wideHero=hero;detailContentWidth=contentWidth;detailHeadingBeside=heading;applyHeroLayout();
 if(el&&!reduce.matches){
  busy=true;activeTransition=new TransitionControl();activeTransition.synchronize(duration*(slow?2.5:1));document.body.classList.add('in-motion');motionMaterial.start();
  const movements=siblings.map(({node,rect})=>{const target=node.getBoundingClientRect();return activeTransition.track(node.animate([{transform:`translate(${rect.left-target.left}px,${rect.top-target.top}px)`},{transform:'translate(0,0)'}],{duration:duration*(slow?2.5:1),easing:EASE.settle,fill:'both'})).finished;});
  await Promise.all([morph(source,el),...movements]);await activeTransition.wait();
  if(activeTransition.reversed){wideHero=previous.hero;detailContentWidth=previous.contentWidth;detailHeadingBeside=previous.heading;applyHeroLayout();}
  activeTransition.complete();
  activeTransition=null;motionMaterial.stop();document.body.classList.remove('in-motion');busy=false;
 }
 try{localStorage.setItem('prem-wide-hero',String(wideHero));localStorage.setItem('prem-detail-content-width',String(detailContentWidth));localStorage.setItem('prem-detail-heading-beside',String(detailHeadingBeside));}catch{}
 if(location.hash&&location.hash.slice(1)!==current)navigate();
}
for(const [effect,id] of [['ripple','imageRippleEnabled'],['blur','imageBlurEnabled']])$('#'+id).onchange=e=>{
 configureImageEffects({[effect]:e.target.checked});syncImageEffectControls();
 try{localStorage.setItem('prem-image-'+effect+'-enabled',String(e.target.checked));}catch{}
};
syncImageEffectControls();
addEventListener('storage',e=>{if(e.key===null||['prem-image-ripple-enabled','prem-image-blur-enabled'].includes(e.key)){refreshImageEffectPreferences();syncImageEffectControls();}});
addEventListener('pageshow',()=>{refreshImageEffectPreferences();syncImageEffectControls();});
applyNavRounding();
$('#navRounding').oninput=e=>{navRounding=+e.target.value;applyNavRounding();try{localStorage.setItem('prem-nav-rounding',String(navRounding));}catch{}};
applyNavTypography();applyNavItems();
addEventListener('resize',applyNavTypography,{passive:true});document.fonts?.ready.then(applyNavTypography,error=>console.warn('Fonts did not load; the menu keeps its measured width',error));
$('#navItemPadding').oninput=e=>{navItemPadding=+e.target.value;applyNavTypography();try{localStorage.setItem('prem-nav-item-padding',String(navItemPadding));}catch{}};
$('#navContainerPadding').oninput=e=>{navContainerPadding=+e.target.value;applyNavTypography();try{localStorage.setItem('prem-nav-container-padding',String(navContainerPadding));}catch{}};
$('#navItemFontSize').oninput=e=>{navItemFontSize=+e.target.value;applyNavTypography();try{localStorage.setItem('prem-nav-item-font-size',String(navItemFontSize));}catch{}};
$('#cardPaddingSame').onchange=e=>{if(busy){applyCardPadding();return;}cardPaddingUniform=e.target.checked;if(cardPaddingUniform){cardPaddingAll=cardPadding.top??56;cardPadding={top:cardPaddingAll,right:cardPaddingAll,bottom:cardPaddingAll,left:cardPaddingAll};}applyCardPadding();try{localStorage.setItem('prem-card-padding-uniform',String(cardPaddingUniform));localStorage.setItem('prem-card-padding-all',String(cardPaddingAll));for(const side of ['top','right','bottom','left'])localStorage.setItem('prem-card-padding-'+side,String(cardPadding[side]??(side==='right'||side==='left'?40:side==='top'?56:60)));}catch{}};
$('#cardPaddingAll').oninput=e=>{if(busy){applyCardPadding();return;}cardPaddingAll=+e.target.value;cardPadding={top:cardPaddingAll,right:cardPaddingAll,bottom:cardPaddingAll,left:cardPaddingAll};applyCardPadding();try{localStorage.setItem('prem-card-padding-all',String(cardPaddingAll));for(const side of ['top','right','bottom','left'])localStorage.setItem('prem-card-padding-'+side,String(cardPaddingAll));}catch{}};
for(const side of ['top','right','bottom','left'])$('#cardPadding'+side[0].toUpperCase()+side.slice(1)).oninput=e=>{if(busy){applyCardPadding();return;}cardPadding[side]=+e.target.value;applyCardPadding();try{localStorage.setItem('prem-card-padding-'+side,String(cardPadding[side]));}catch{}};
$('#detailHeadingBeside').onchange=e=>setDetailLayout({heading:e.target.checked});
$('#wideHero').onchange=e=>setDetailLayout({hero:e.target.checked});
$('#projectBackdrop').checked=projectBackdropEnabled;$('#projectBackdrop').onchange=e=>{projectBackdropEnabled=e.target.checked;saveFlag('prem-project-backdrop',projectBackdropEnabled);const p=cards.find(card=>card.id===current);projectBackdrop.sync(projectBackdropEnabled&&p&&!p.body?p:null);};
$('#plainCards').checked=plainCards;$('#plainCards').onchange=e=>{plainCards=e.target.checked;document.documentElement.dataset.plainCards=plainCards?'on':'off';saveFlag('prem-plain-cards',plainCards);};
$('#plainNav').checked=plainNav;$('#plainNav').onchange=e=>{plainNav=e.target.checked;document.documentElement.dataset.plainNav=plainNav?'on':'off';saveFlag('prem-plain-nav',plainNav);};
$('#headerDetailNav').addEventListener('click',event=>{const button=event.target.closest('[data-header-action]');if(!button)return;const action=button.dataset.headerAction;void dispatchCommand({id:action==='back'?'navigation.back':'project.'+action,source:'pointer'});});
$('#navPosition').value=navPosition;$('#navPosition').onchange=e=>{navPosition=e.target.value==='top'?'top':'bottom';document.documentElement.dataset.navPosition=navPosition;syncDockActions(current,{duration:duration*(slow?2.5:1)});try{localStorage.setItem('prem-nav-position',navPosition);}catch(error){console.warn('Navigation position not saved',error);}};
$('#featureStage').checked=featureStage;$('#featureStage').onchange=e=>{if(busy){e.target.checked=featureStage;return;}featureStage=e.target.checked;saveFlag('prem-feature-stage',featureStage);homeLayout?.setFeatureStage(featureStage);refreshImageFrames();};
$('#detailContentWidth').onchange=e=>{const width=normaliseContentWidth(e.target.value);if(busy){applyContentWidths();return;}if(projectIds.includes(current))setDetailLayout({contentWidth:width});else{detailContentWidth=width;applyContentWidths();try{localStorage.setItem('prem-detail-content-width',width);}catch{}}};
for(const key of ['top','side','bottom'])$('#bleed'+key[0].toUpperCase()+key.slice(1)).oninput=e=>updateBleedImage(key,+e.target.value);
$('#bleedBacking').onchange=e=>updateBleedImage('backing',e.target.checked);
$('#fullBleed').onchange=e=>{if(busy){e.target.checked=fullBleed;return;}fullBleed=e.target.checked;applyCardAppearance();homeLayout?.flush(true);try{localStorage.setItem('prem-full-bleed',String(fullBleed));}catch{}};
$('#hideBranding').onchange=e=>{hideBranding=e.target.checked;applyCardAppearance();try{localStorage.setItem('prem-hide-branding',String(hideBranding));}catch{}};
$('#cardBackground').onchange=e=>{hideCardBackground=!e.target.checked;applyCardAppearance();try{localStorage.setItem('prem-hide-card-background',String(hideCardBackground));}catch{}};$('#hideCardColor').onchange=e=>{hideCardColor=e.target.checked;applyCardAppearance();try{localStorage.setItem('prem-hide-card-color',String(hideCardColor));}catch{}};$('#hideCardHover').onchange=e=>{hideCardHover=e.target.checked;applyCardAppearance();try{localStorage.setItem('prem-hide-card-hover',String(hideCardHover));}catch{}};$('#cardHoverEffect').onchange=e=>{cardHoverEffect=['reveal','reveal-soft','tint','glow'].includes(e.target.value)?e.target.value:'reveal';applyCardAppearance();attachHoverEffects();try{localStorage.setItem('prem-card-hover-effect',cardHoverEffect);}catch{}};$('#ambientDetailGlow').onchange=e=>{ambientDetailGlow=e.target.checked;applyCardAppearance();attachHoverEffects();try{localStorage.setItem('prem-ambient-detail-glow',String(ambientDetailGlow));}catch{}};$('#ambientLightMovement').onchange=e=>{if(busy){e.target.checked=ambientLightMovement;return;}ambientLightMovement=e.target.checked;applyCardAppearance();attachHoverEffects();try{localStorage.setItem('prem-ambient-light-movement',String(ambientLightMovement));}catch{}};$('#ambientGlowStrength').oninput=e=>{ambientGlowStrength=+e.target.value;$('#ambientGlowStrengthValue').value=ambientGlowStrength+'%';applyAmbientGlowStrength();try{localStorage.setItem('prem-ambient-glow-strength',String(ambientGlowStrength));}catch(error){console.warn('Glow strength preference not saved',error);}};$('#ambientColorSource').onchange=e=>{ambientColorSource=e.target.value==='project'?'project':'auto';ambientLight.refresh();try{localStorage.setItem('prem-ambient-color-source',ambientColorSource);}catch(error){console.warn('Ambient colour preference not saved',error);}};$('#ambientHoverSpeed').oninput=e=>{ambientHoverSpeed=+e.target.value;$('#ambientHoverSpeedValue').value=ambientHoverSpeed+'%';try{localStorage.setItem('prem-ambient-hover-speed',String(ambientHoverSpeed));}catch{}};for(const [id,key,storage,get,set,legacy] of [['cardShowClient','client','prem-card-show-client',()=>showCardClient,value=>showCardClient=value],['cardClientInline','inline','prem-card-client-inline',()=>cardClientInline,value=>cardClientInline=value],['cardClientAbove','above','prem-card-client-above',()=>cardClientAbove,value=>cardClientAbove=value],['cardDetails','details','prem-card-details',()=>cardDetails,value=>cardDetails=value],['cardShowCategory','category','prem-card-show-category',()=>showCardCategory,value=>showCardCategory=value],['cardShowTitle','title','prem-card-show-title',()=>showCardTitle,value=>showCardTitle=value,'prem-hide-card-titles'],['cardShowDescription','description','prem-card-show-description',()=>showCardDescription,value=>showCardDescription=value]])$('#'+id).onchange=e=>{if(busy){e.target.checked=get();return;}const value=e.target.checked;set(value);applyCardAppearance();homeLayout?.flush(true);try{localStorage.setItem(storage,String(value));if(legacy)localStorage.setItem(legacy,String(!value));}catch{}};
$('#edgeShadeRetreat').onchange=e=>{if(busy){e.target.checked=edgeShadeRetreat;return;}edgeShadeRetreat=e.target.checked;applyEdgeShades();try{localStorage.setItem('prem-edge-shade-retreat',String(edgeShadeRetreat));}catch{}};
$('#edgeShadeTop').onchange=e=>{edgeShadeTop=e.target.checked;applyEdgeShades();try{localStorage.setItem('prem-edge-shade-top',String(edgeShadeTop));}catch{}};
$('#edgeShadeBottom').onchange=e=>{edgeShadeBottom=e.target.checked;applyEdgeShades();try{localStorage.setItem('prem-edge-shade-bottom',String(edgeShadeBottom));}catch{}};$('#edgeShadeLeft').onchange=e=>{edgeShadeLeft=e.target.checked;applyEdgeShades();try{localStorage.setItem('prem-edge-shade-left',String(edgeShadeLeft));}catch{}};$('#edgeShadeRight').onchange=e=>{edgeShadeRight=e.target.checked;applyEdgeShades();try{localStorage.setItem('prem-edge-shade-right',String(edgeShadeRight));}catch{}};$('#edgeShadeDepth').oninput=e=>{edgeShadeDepth=+e.target.value;applyEdgeShades();try{localStorage.setItem('prem-edge-shade-depth',String(edgeShadeDepth));}catch{}};$('#imageRounding').oninput=e=>{if(busy){applyImageRounding();return;}imageRounding=+e.target.value;applyImageRounding();try{localStorage.setItem('prem-image-rounding',String(imageRounding));}catch{}};$('#cardRounding').oninput=e=>{cardRounding=+e.target.value;applyGeometryTokens();try{localStorage.setItem('prem-card-rounding',String(cardRounding));}catch{}};$('#cardGap').oninput=e=>{cardGap=+e.target.value;applyGeometryTokens();try{localStorage.setItem('prem-card-gap',String(cardGap));}catch{}};
document.querySelectorAll('[data-nav]').forEach(link=>link.onclick=e=>{e.preventDefault();if(link.dataset.nav==='assistant'){assistantLauncher.onclick();return;}dispatchCommand({id:'route.'+link.dataset.nav,source:'pointer'});});
const canonicalProjectRoute=route=>homeProjects.find(project=>project.id===route)?.documentId||route;
function moveCard(direction){if(busy)return;const next=stepProject(projects,canonicalProjectRoute(current),direction);if(!next)return;navSlideTarget=null;travelDirection=direction;location.hash=next.id;}
const projectMenu=$('#projectMenu'),projectMenuToggle=$('#projectMenuToggle');
projectMenu.innerHTML=projectMenuMarkup(projects,canonicalProjectRoute(current));
mountMenuIconSettings($('#settings'),projectMenu);
const siteToast=createSiteToast($('#interactionFeedback'),{reduced:()=>reduce.matches});
mountContactEmailCopy(projectMenu,siteToast.show);
const statusStack=mountStatusStack({dock:$('#dock'),hud:$('#interactionHud'),messages:$('#interactionFeedback'),obstacles:()=>[$('#dock .composer-suggestions'),$('#dock .composer-context-actions')]});
const menuPreview=new ProjectMenuPreview(projectMenu,projects,{reduced:()=>reduce.matches});
installProjectMenuHover(projectMenu,{reduced:()=>reduce.matches,onHover:row=>menuPreview.show(row),onLeave:()=>menuPreview.hide()});
function renderProjectMenu(){const focusId=projectMenu.contains(document.activeElement)?document.activeElement?.dataset?.projectMenuItem:null;menuPreview.hide();projectMenu.querySelector('.project-menu-projects').innerHTML=projectMenuProjectsMarkup(projects,canonicalProjectRoute(current));projectMenu.querySelectorAll('[data-project-menu-item]').forEach(button=>button.onclick=()=>dispatchCommand({id:'project.open',target:button.dataset.projectMenuItem,source:'pointer'}));projectMenu.querySelectorAll('[data-page-menu-item]').forEach(button=>button.onclick=()=>dispatchCommand({id:'route.'+button.dataset.pageMenuItem,source:'pointer'}));projectMenu.querySelectorAll('[data-page-menu-item]').forEach(button=>{const active=button.dataset.pageMenuItem===(labMode?'lab':current);button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current','page');});if(projectPopover.active){projectPopover.measure();projectPopover.paint();if(focusId)projectMenu.querySelector(`[data-project-menu-item="${focusId}"]`)?.focus({preventScroll:true});}}
const projectPopover=new LiquidPopover(dockMorph,projectMenu,projectMenuToggle,{reduced:()=>reduce.matches,duration:()=>duration*(slow?2.5:1),beforeOpen:()=>{void composerContext?.setBlocked(true);void portfolioAssistant.dismissSuggestions();},onClosed:()=>composerContext?.setBlocked(false),onClose:()=>menuPreview.hide(),returnFocus:()=>composerShown(current)?$('#assistantIndexToggle'):showProjectControls(current)?projectMenuToggle:document.querySelector('#dock [data-nav=work]')});

function syncDockComposer(options={}){
 syncAssistantLauncher();
 const active=composerShown(current);
 projectPopover.setTrigger(active?$('#assistantIndexToggle'):projectMenuToggle);projectPopover.anchor=active?'main-start':'main';
 syncInlineComposer();dockMorph.setComposer(active,options);portfolioAssistant.setComposerAvailable(active||inlineChat(current));composerContext?.refresh();
}
// The Assistant button sits beside the dock, and only when the menu, not the composer, fills the dock.
const assistantPresentation=mountAssistantPresentation($('#assistantPresentation'),{onChange:()=>closeAssistantFloating({focus:false})});
// The sidebar pushes the page aside and takes the dock's composer to its foot; both are root-level states.
const setAssistantSidebar=on=>{document.documentElement.classList.toggle('assistant-sidebar-open',on);$('#dock').classList.toggle('assistant-sidebar-dock',on);dockMorph.refresh();};
function syncAssistantLauncher(){
 const available=!contextualComposer,character=available&&characterAssistant&&showMascot&&Boolean(characterButton),shown=available&&!character,item=$('#assistantNavItem');
 // The Assistant button that sat beside the dock is now a menu item after Contact; the old pill stays hidden.
 if(item.hidden===shown||!assistantLauncher.hidden||projectMenuToggle.hidden!==character){assistantLauncher.hidden=true;item.hidden=!shown;projectMenuToggle.hidden=character;applyNavTypography();}
 applyCharacterAssistant(character);
 if(!available)closeAssistantFloating({focus:false});
}
// With the menu in the dock, the character stands in for the Assistant button and the index button steps aside.
function applyCharacterAssistant(active){
 if(!characterButton)return;
 characterButton.classList.toggle('agent-assistant',active);
 if(active){characterButton.setAttribute('role','button');characterButton.tabIndex=0;characterButton.setAttribute('aria-label','Open assistant');characterButton.removeAttribute('aria-hidden');}
 else{characterButton.removeAttribute('role');characterButton.removeAttribute('tabindex');characterButton.removeAttribute('aria-label');characterButton.setAttribute('aria-hidden','true');}
}
function syncFloatingDock(){const options={duration:duration*(slow?2.5:1)};syncDockActions(current,options);syncDockComposer(options);}
function openAssistantFloating(){
 if(assistantFloating||busy)return;
 assistantFloating=true;const sidebar=assistantPresentation.value==='sidebar';setAssistantFloating($('#askPage'),true,sidebar?'sidebar':'panel');setAssistantSidebar(sidebar);$('#dock').classList.add('assistant-floating-open');void composerContext?.setBlocked(true);assistantLauncher.setAttribute('aria-expanded','true');
 syncFloatingDock();portfolioAssistant.setActive(true,{focus:true});
 // The dock reveals the composer over its transition, and a hidden field cannot take focus, so keep offering
 // focus each frame until the field accepts it or the transition is over.
 const input=$('#askInput'),deadline=performance.now()+duration*(slow?2.5:1)+200;
 const focusInput=()=>{if(!assistantFloating||document.activeElement===input)return;input.focus({preventScroll:true});if(document.activeElement!==input&&performance.now()<deadline)requestAnimationFrame(focusInput);};
 requestAnimationFrame(focusInput);
}
function closeAssistantFloating({focus=true}={}){
 if(!assistantFloating)return;
 assistantFloating=false;setAssistantFloating($('#askPage'),false);setAssistantSidebar(false);$('#dock').classList.remove('assistant-floating-open');void composerContext?.setBlocked(false);assistantLauncher.setAttribute('aria-expanded','false');
 portfolioAssistant.setActive(false);syncFloatingDock();
 if(focus&&!$('#assistantNavItem').hidden)$('#assistantNavItem').focus({preventScroll:true});
 else if(focus&&!assistantLauncher.hidden)assistantLauncher.focus({preventScroll:true});
 else if(focus&&characterButton?.classList.contains('agent-assistant'))characterButton.focus({preventScroll:true});
}
assistantLauncher.onclick=()=>{if(['floating','sidebar'].includes(assistantPresentation.value))openAssistantFloating();else dispatchCommand({id:'route.assistant',source:'pointer'});};
$('#assistantMaximize').onclick=()=>{closeAssistantFloating({focus:false});dispatchCommand({id:'route.assistant',source:'pointer'});};
$('#assistantFloatingClose').onclick=()=>closeAssistantFloating();
mountAssistantUpload({button:$('#assistantAttach'),picker:$('#assistantAttachFile'),input:$('#askInput'),form:$('#askForm'),maxCharacters:assistantLimits.questionCharacters,onError:message=>siteToast.show(message,{tone:'error'})});
// Evidence that points at a home section (a testimonial, the approach) lands on that section, not the top of home.
let pendingHomeSection=null;
function scrollToHomeSection(){
 const id=pendingHomeSection;pendingHomeSection=null;
 const section=id&&main.querySelector(`[data-home-section="${CSS.escape(id)}"]`);
 if(section&&!section.hidden)section.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
}
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[data-scroll-section]');if(!link)return;
 pendingHomeSection=link.dataset.scrollSection;
 if(current==='work'&&!busy){event.preventDefault();if(assistantFloating)closeAssistantFloating({focus:false});scrollToHomeSection();}
},true);
addEventListener('portfolio-route-settled',()=>{if(pendingHomeSection&&current==='work')requestAnimationFrame(scrollToHomeSection);});
// One command gateway for pointer, voice and gestures. These adapters keep the
// established card-opening, route, swipe and reversible liquid transitions.
const commandCatalog=createCommandCatalog([...homeProjects,...projects.filter(project=>project.listOnly)]);
addEventListener('keydown',e=>handleSiteIndexShortcut(e,{canOpen:()=>!busy&&!mediaFocus.active&&$('#settings').hidden&&!document.querySelector('dialog[open]'),open:()=>dispatchCommand({id:'overlay.projects',source:'keyboard'})}),{capture:true});
function closeInputPopovers(){projectPopover.setOpen(false,{restoreFocus:false});}
async function activateProject(id){
 spatialNavigation.cancelScroll();
 if(!galleryProjectTarget&&!previewProjectTarget&&current==='work'&&homeProductDisplay==='carousel')galleryProjectTarget=main.querySelector(`[data-home-product-gallery] [data-content-card="${id}"]`);
 if(galleryProjectTarget){const gallery=cardGalleries.find(g=>g.root.contains(galleryProjectTarget));if(gallery&&!reduce.matches){busy=true;activeTransition=new TransitionControl();await gallery.prepareOpen(galleryProjectTarget,activeTransition,duration*(slow?2.5:1));await activeTransition.wait();const reversed=activeTransition.reversed;activeTransition.complete();activeTransition=null;busy=false;if(reversed){galleryProjectTarget=null;return {ok:true,message:'Transition reversed'};}}navSlideTarget=null;location.hash=id;}else if(previewProjectTarget&&!projectIds.includes(current)){if(current==='work')homeOpenTarget=id;navSlideTarget=null;location.hash=id;}else if(current==='work'&&(homeProductDisplay==='text'||![...main.querySelectorAll('[data-card]')].some(card=>card.dataset.card===id))){homeOpenTarget=id;navSlideTarget=id;travelDirection=1;location.hash=id;}else if(current==='work'){await openHomeCard(id);}else{if(current==='assistant')assistantProjectTarget=document.querySelector(`#askMessages [data-content-card="${id}"]`);navSlideTarget=null;location.hash=id;}
 await navigate();return {ok:true,message:'Opened '+projects.find(project=>project.id===id).name};
}
async function activateRoute(route,{slideHome=false}={}){
 spatialNavigation.cancelScroll();
 const slidingHome=slideHome&&route==='work'&&informationCards.some(card=>card.id===current);
 navSlideTarget=slidingHome||informationCards.some(card=>card.id===route)&&!(galleryProjectOrigin?.route===route&&projectIds.includes(current))?route:null;travelDirection=slidingHome?-1:navSlideTarget?1:0;
 location.hash=route;await navigate();return {ok:true,message:route==='work'?'All work':route==='about'?'About':route==='lab'?'Lab':route==='assistant'?'Assistant':'Contact'};
}
async function activateHome(){
 spatialNavigation.cancelScroll();homeScroll=0;navSlideTarget=null;homeOpenTarget=null;travelDirection=0;assistantProjectTarget=null;assistantNavigation.prepareHomeNavigation();
 if(current==='work'&&!labMode){homeLayout?.flush(true);scrollPage(0);return {ok:true,message:'All work'};}
 return activateRoute('work',{slideHome:true});
}
// A detail opened from a carousel keeps that carousel turned to the current project while
// stepping Next/Previous, so Back docks into the card that is actually centred.
function openFromSpiral({projectId,src,rect}){
 if(busy||navigationPreparing||!projectIds.includes(projectId))return;
 previewProjectTarget?.remove();previewProjectTarget=reduce.matches?null:previewMorphProxy(rect,src);
 void dispatchCommand({id:'project.open',target:projectId,source:'pointer'});
}
function galleryOriginTarget(origin,project){
 const gallery=[...(origin.galleries||[]),...(homeScene?.scene?.galleries||[])].find(item=>item.root?.dataset.cardGallery===origin.galleryId);if(!gallery)return null;
 const items=[...gallery.root.querySelectorAll('[data-gallery-item]')],count=items.length,distance=index=>{const d=Math.abs(index-origin.index)%count;return Math.min(d,count-d);};
 const index=items.map((item,i)=>item.querySelector(`[data-content-card="${project}"]`)?i:-1).filter(i=>i>=0).sort((a,b)=>distance(a)-distance(b))[0];
 return index===undefined?null:{gallery,index,element:items[index].querySelector(`[data-content-card="${project}"]`)};
}
function syncGalleryOrigin(project){
 const origin=galleryProjectOrigin;if(!origin||origin.project===project||!projectIds.includes(project))return;
 const target=galleryOriginTarget(origin,project);if(!target)return;
 target.gallery.go(target.index,false);target.gallery.paint?.();
 Object.assign(origin,{project,index:target.index,element:target.element});
}
function disposeGalleryOrigin(){if(galleryProjectOrigin?.scene){galleryProjectOrigin.galleries.forEach(gallery=>gallery.destroy());galleryProjectOrigin.scene.dispose();}galleryProjectOrigin=null;}
main.addEventListener('click',event=>{const link=event.target.closest('[data-text-project]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();const preview=current==='work'&&!busy&&!reduce.matches?visiblePreviewImage():null;if(preview){previewProjectTarget?.remove();previewProjectTarget=previewMorphProxy(preview.rect,preview.src);}void dispatchCommand({id:'project.open',target:link.dataset.textProject,source:'pointer'});});
main.addEventListener('click',event=>{const link=event.target.closest('[data-content-card]');if(!link?.closest('[data-card-gallery]')||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const id=link.dataset.contentCard;if(!projectIds.includes(id))return;event.preventDefault();if(busy||navigationPreparing||commandBus.pending)return;galleryProjectTarget=link.morphImageRoot||link;void dispatchCommand({id:'project.open',target:id,source:'pointer'});});
async function openAssistantProject(documentId,element){
 const project=projects.find(item=>item.documentId===documentId&&!item.sourceProjectId)||projects.find(item=>item.id===documentId);
 if(!project)return {ok:false,message:'Project not found.'};
 spatialNavigation.cancelScroll();assistantProjectTarget=element;navSlideTarget=null;location.hash=project.id;await navigate();
 return {ok:true,message:'Opened '+project.name};
}
async function activateBack(){
 spatialNavigation.cancelScroll();
 const sphereViewer=document.querySelector('.sphere-viewer[open]');if(sphereViewer){sphereViewer.dispatchEvent(new Event('cancel',{cancelable:true}));return {ok:true,message:'Returning to sphere'};}
 if(portfolioAssistant.dictating){portfolioAssistant.stopDictation();return {ok:true,message:'Dictation stopped'};}
 if(assistantFloating){closeAssistantFloating();return {ok:true,message:'Assistant closed'};}
 if(mediaFocus.active){mediaFocus.close();return {ok:true,message:'Returning to project details'};}
 if(projectDrag.active){projectDrag.cancel();return {ok:true,message:'Returning to the current project'};}
 if(activeTransition){activeTransition.reverse();await activeTransition.wait();return {ok:true,message:'Transition reversed'};}
 if(projectPopover.target||projectPopover.opening){closeInputPopovers();return {ok:true,message:'Closed'};}
 if(!$('#settings').hidden){$('#settings').hidden=true;return {ok:true,message:'Closed settings'};}
 const sourceRoute=projectEntry.backTarget(current,projectIds);if(sourceRoute)return activateRoute(sourceRoute);
 const returnRoute=assistantNavigation.backTarget(current);if(returnRoute)return activateRoute(returnRoute);
 return activateRoute('work');
}
function openSiteIndex(command){spatialNavigation.cancelScroll();projectPopover.anchor=composerShown(current)?'main-start':'main';const open=command.source==='voice'?true:!(projectPopover.target||projectPopover.opening);projectPopover.setOpen(open);return {ok:true,message:open?'Site index':'Closed index'};}
const commandBus=new CommandBus(commandCatalog,{
 'project.open':command=>activateProject(command.target),
 'project.next':async()=>{spatialNavigation.cancelScroll();moveCard(1);await navigate();return {ok:true,message:'Next project'};},
 'project.previous':async()=>{spatialNavigation.cancelScroll();moveCard(-1);await navigate();return {ok:true,message:'Previous project'};},
 'route.work':activateHome,'route.about':()=>activateRoute('about'),'route.lab':()=>activateRoute('lab'),'route.contact':()=>activateRoute('contact'),'route.assistant':command=>{if(command.source==='voice')portfolioAssistant.stopResponse();return activateRoute('assistant');},
 'navigation.back':()=>activateBack(),
 'assistant.ask':async command=>{if(current!=='assistant')await activateRoute('assistant');return portfolioAssistant.submitQuestion(command.text,{spoken:true});},
 'viewport.scroll.up':()=>spatialNavigation.scrollPage(-1,{smooth:!reduce.matches}),
 'viewport.scroll.down':()=>spatialNavigation.scrollPage(1,{smooth:!reduce.matches}),
 'overlay.settings':command=>openSiteIndex(command),
 'overlay.projects':command=>openSiteIndex(command),
 'overlay.projects.close':()=>{closeInputPopovers();return {ok:true,message:'Closed menu'};},
 'assistant.speech.stop':()=>{portfolioAssistant.stopResponse();spatialNavigation.voice.setOutputActive(false);spatialNavigation.voice.resume();return {ok:true,message:'Listening'};},
 'input.voice.stop':()=>{spatialNavigation.voice.stop();return {ok:true,message:'Voice navigation off'};}
},{getState:()=>({busy,isProject:projectIds.includes(current),isWork:current==='work',route:current})});
const spatialNavigation=new SpatialNavigation(commandCatalog,commandBus,{beforeGuide:()=>portfolioAssistant.stopDictation(),scrollSurface:()=>projectPopover.active?projectMenu:null,onNotify:(message,options)=>siteToast.show(message,options),onStop:()=>siteToast.hide(),reduced:()=>reduce.matches,onVoiceState:({phase})=>voiceDock?.sync({paused:spatialNavigation.voice.paused,sound:portfolioAssistant.soundEnabled,phase}),onModeChange:(mode,on)=>{if(mode==='voice'){const conversation=on&&spatialNavigation.voice.conversation;portfolioAssistant.setVoiceMode(conversation);voiceDock?.setActive(conversation);voiceDock?.sync({paused:spatialNavigation.voice.paused,sound:portfolioAssistant.soundEnabled});siteToast.clear('voice');}else siteToast.show(`Gestures ${on?'on':'off'}`,{key:mode});},onAssistantQuestion:async text=>{if(current!=='assistant'){const opened=await activateRoute('assistant');if(opened?.ok===false)return opened;}return portfolioAssistant.submitQuestion(text,{spoken:true});}});
function dispatchCommand(command){return commandBus.dispatch(command).catch(error=>{console.error('Command failed: '+command.id,error);spatialNavigation.notify('Could not complete that action. Please try again.',{tone:'error'});return {ok:false};});}
projectMenuToggle.onclick=()=>dispatchCommand({id:'overlay.projects',source:'pointer'});
assistantBack.onclick=()=>dispatchCommand({id:'navigation.back',source:'pointer'});
$('#assistantIndexToggle').onclick=()=>dispatchCommand({id:'overlay.projects',source:'pointer'});
$('#siteHelp').onclick=()=>spatialNavigation.showGuide('help');

const portfolioAssistant=mountPortfolioAssistant(document,{onOpen:()=>dispatchCommand({id:'route.assistant',source:'pointer'}),onOpenProject:openAssistantProject,onCardsAdded:syncAssistantCardAppearance,onComposerFocus:focused=>composerContext?.setFocused(focused),onVoiceToggle:async()=>{if(spatialNavigation.voice.enabled&&spatialNavigation.voice.conversation){spatialNavigation.disable('voice');return;}void portfolioAssistant.prepareVoice();const opened=await dispatchCommand({id:'route.assistant',source:'pointer'});if(opened?.ok!==false)await spatialNavigation.startConversation();},onDictationStart:()=>spatialNavigation.voice.pause(),onDictationEnd:()=>spatialNavigation.voice.resume(),onInputError:message=>siteToast.show(message,{tone:'error'}),onStatus:(key,message,{tone='neutral'}={})=>{if(message)siteToast.show(message,{key,duration:0,tone});else siteToast.clear(key);statusStack.refresh();},reducedMotion:()=>reduce.matches,onSoundChange:on=>{voiceDock?.sync({paused:spatialNavigation.voice.paused,sound:on});siteToast.clear('sound');},onSpeechStart:text=>{spatialNavigation.voice.setOutputActive(true,text);voiceDock?.sync({paused:spatialNavigation.voice.paused,sound:portfolioAssistant.soundEnabled,phase:'speaking'});},onSpeechWorking:()=>{voiceDock?.sync({paused:spatialNavigation.voice.paused,sound:portfolioAssistant.soundEnabled,phase:'working'});},onSpeechEnd:()=>{spatialNavigation.voice.setOutputActive(false);voiceDock?.sync({paused:spatialNavigation.voice.paused,sound:portfolioAssistant.soundEnabled,phase:'listening'});if(!portfolioAssistant.dictating&&!spatialNavigation.dialog.open&&!spatialNavigation.voice.paused)spatialNavigation.voice.resume();}});
voiceDock=new VoiceDock(dockMorph,{reduced:()=>reduce.matches,onMic:()=>{const voice=spatialNavigation.voice;if(voice.paused)voice.resume();else voice.pause();voiceDock.sync({paused:voice.paused,sound:portfolioAssistant.soundEnabled,phase:voice.paused?'paused':'listening'});},onSound:()=>portfolioAssistant.setSoundEnabled(!portfolioAssistant.soundEnabled),onClose:()=>{spatialNavigation.disable('voice');requestAnimationFrame(()=>$('#askInput').focus({preventScroll:true}));}});
composerContext=new ComposerContext(dockMorph,{mode:contextualComposer?'composer':'inline',placement:contextualPlacement(),splitProjectControls,reduced:()=>reduce.matches,duration:()=>duration*(slow?2.5:1),getScene:()=>({route:current,headerNav:headerDetail(current),project:projectIds.includes(current)?cards.find(p=>p.id===current):null,back:showBackControl(current),fullScreen:showFullScreenOption,galleries:cardGalleries.filter(gallery=>gallery instanceof CardGallery&&main.contains(gallery.root)),contextSections:[...main.querySelectorAll('[data-component="testimonials"]')].map(root=>({root,kind:'testimonials',href:'https://www.linkedin.com/in/premluczak/details/recommendations/'})).concat({root:$('.home-about'),kind:'about'},{root:$('.site-footer'),kind:'footer',linkedin:$('.footer-links a:first-child').href,email:$('.footer-links a:nth-child(2)').href})}),onAction:(action,scene,button)=>{
 if(busy||navigationPreparing||commandBus.pending||mediaFocus.active)return;
 if(action==='view')scene.carousel?.details?.click();
 else if(action==='previous'&&scene.carousel)scene.carousel.previous?.click();
 else if(action==='next'&&scene.carousel)scene.carousel.next?.click();
 else if(action==='prototype'||action==='watch-prototype'||action==='fullscreen')openMediaAction(action,button);
 else if(action==='contact-email')void copyContactEmail(siteToast.show);
 else void dispatchCommand({id:action==='back'?'navigation.back':'project.'+action,source:'pointer'});
}});
$('#chatInlineComposer').checked=chatInlineComposer;$('#chatInlineComposer').onchange=e=>{chatInlineComposer=e.target.checked;saveFlag('prem-chat-inline-composer',chatInlineComposer);syncFloatingDock();};
$('#splitProjectControls').checked=splitProjectControls;$('#splitProjectControls').onchange=e=>{splitProjectControls=e.target.checked;composerContext.setSplitProjectControls(splitProjectControls);try{localStorage.setItem('prem-split-project-controls',String(splitProjectControls));}catch{}};
$('#contextualButtons').value=contextualButtons;$('#contextualButtons').onchange=e=>{if(busy){e.target.value=contextualButtons;return;}contextualButtons=e.target.value==='composer'?'composer':'inline';composerContext.setPlacement(contextualPlacement());syncDockActions(current,{duration:duration*(slow?2.5:1)});syncDockComposer({duration:duration*(slow?2.5:1)});try{localStorage.setItem('prem-contextual-buttons',contextualButtons);}catch{}};
portfolioAssistant.setComposerGlowEnabled(showComposerGlow);$('#showComposerGlow').checked=showComposerGlow;$('#showComposerGlow').onchange=e=>{showComposerGlow=e.target.checked;portfolioAssistant.setComposerGlowEnabled(showComposerGlow);try{localStorage.setItem('prem-composer-glow',String(showComposerGlow));}catch{}};
mountContextualPopovers({reduced:()=>reduce.matches,onRoute:id=>dispatchCommand({id:'project.open',target:id,source:'pointer'})});
mountAgent({reduced:()=>reduce.matches});
characterButton=document.querySelector('.agent');
if(characterButton){characterButton.addEventListener('click',()=>{if(characterButton.classList.contains('agent-assistant'))assistantLauncher.onclick();});characterButton.addEventListener('keydown',event=>{if(!characterButton.classList.contains('agent-assistant')||!['Enter',' '].includes(event.key))return;event.preventDefault();assistantLauncher.onclick();});}
$('#characterAssistant').checked=characterAssistant;$('#characterAssistant').onchange=e=>{characterAssistant=e.target.checked;saveFlag('prem-character-assistant',characterAssistant);syncAssistantLauncher();};
$('#navShowLab').onchange=e=>{navShowLab=e.target.checked;saveFlag('prem-nav-show-lab',navShowLab);applyNavItems();};
$('#navShowContact').onchange=e=>{navShowContact=e.target.checked;saveFlag('prem-nav-show-contact',navShowContact);applyNavItems();};
$('#navChatLabel').onchange=e=>{navChatLabel=NAV_CHAT_LABELS.includes(e.target.value)?e.target.value:NAV_CHAT_LABELS[0];try{localStorage.setItem('prem-nav-chat-label',navChatLabel);}catch(error){console.warn('Chat item label not saved',error);}applyNavItems();};
$('#showMascot').onchange=e=>{showMascot=e.target.checked;saveFlag('prem-show-mascot',showMascot);applyNavItems();syncAssistantLauncher();};
syncAssistantLauncher();
installTooltips();
const animationButton=$('#animationPreference');
$('#contextualComposerPreference').onclick=()=>{contextualComposer=!contextualComposer;applyDockPreferences();composerContext?.setMode(contextualComposer?'composer':'inline');try{localStorage.setItem('prem-contextual-composer',String(contextualComposer));}catch{}syncDockComposer({duration:duration*(slow?2.5:1)});};
$('#alwaysDarkGlassPreference').onclick=()=>{alwaysDarkGlass=!alwaysDarkGlass;applyDockPreferences();try{localStorage.setItem('prem-always-dark-glass',String(alwaysDarkGlass));}catch{}};
function syncAnimationPreference(){animationButton.setAttribute('aria-checked',String(animationsEnabled));setIconSwitchState(animationButton,animationsEnabled?'on':'off');document.documentElement.dataset.animation=animationsEnabled?'on':'off';}
function refreshAnimationPreference(){motionMaterial.reset();render(labMode?'lab':current||'work',{stream:false});syncDockActions(current,{immediate:true});composerContext?.refresh();if(projectPopover.active)projectPopover.setOpen(!!projectPopover.target,{immediate:true,restoreFocus:false});}
animationButton.onclick=()=>{if(busy)return;animationsEnabled=!animationsEnabled;syncAnimationPreference();try{localStorage.setItem('prem-animations',String(animationsEnabled));}catch{}
 // Swap image effects for native fitted frames, without changing hover colour.
 motionMaterial.reset();summaryStream?.destroy();detailContentReveal?.cancel();detailContentReveal=null;summaryStream=new SummaryStream(main.querySelector('.detail>.project-summary'),{reduced:true,mode:'fade'});instances.forEach(i=>i.destroy());instances=[];enhance();syncCardGalleries();homeLayout?.flush(true);syncDockActions(current,{immediate:true});composerContext?.refresh();edgeShades.sync(cardIds.includes(current));if(projectPopover.active)projectPopover.setOpen(!!projectPopover.target,{immediate:true,restoreFocus:false});siteToast.show(`Animation ${animationsEnabled?'on':'off'}`,{key:'animation'});
};
syncAnimationPreference();systemReduce.addEventListener('change',()=>{if(!busy)refreshAnimationPreference();});
renderProjectMenu();
mountGlassStyle($('#glassStyle'));const simpleTransitions=mountSimpleTransitions({enabled:$('#simpleTransitions'),skipExit:$('#simpleTransitionsSkipExit')});initDesignSystem($('#settings'),{canChange:()=>!busy,onChange:()=>{homeLayout?.flush(true);applyDetailHeading();main.querySelectorAll('.image-card>.visual').forEach(updateImageShade);dockMorph.refresh();if(!projectMenu.hidden){projectPopover.measure();projectPopover.paint();}}});
mountHeroCarouselSettings($('#settings'),{canChange:()=>!busy&&!navigationPreparing,onChange:settings=>{heroCarouselSettings=settings;applyHeroCarouselSettings(document.documentElement,settings);homeLayout?.carousel.measure();}});
mountCarouselSettings($('#settings'),{canChange:()=>!busy&&!navigationPreparing,onChange:settings=>{carouselSettings=settings;document.documentElement.style.setProperty('--carousel-card-scale',String(settings.size/100));for(const gallery of cardGalleries)if(gallery instanceof CardGallery)gallery.setArcSettings(settings);}});
$('#previous').onclick=()=>dispatchCommand({id:'project.previous',source:'pointer'});$('#next').onclick=()=>dispatchCommand({id:'project.next',source:'pointer'});for(const key of Object.keys(materialSettings)){const input=document.getElementById(key);input.value=materialSettings[key];input.oninput=()=>{materialSettings[key]=+input.value;document.getElementById(key+'Value').value=input.value+'%';document.documentElement.style.setProperty('--reflection-strength',String(materialSettings.reflections/100));document.documentElement.style.setProperty('--glow-strength',String(materialSettings.glow/100));};}document.documentElement.style.setProperty('--reflection-strength',String(materialSettings.reflections/100));
$('#contentPageWidth').onchange=e=>{if(busy){applyContentWidths();return;}contentPageWidth=normaliseContentWidth(e.target.value);applyContentWidths();refreshImageFrames();try{localStorage.setItem('prem-content-page-width',contentPageWidth);}catch{}};
$('#servicesCarouselAlignment').value=servicesCarouselAlignment;$('#servicesCarouselAlignment').onchange=e=>{if(busy){e.target.value=servicesCarouselAlignment;return;}servicesCarouselAlignment=e.target.value;syncCardGalleries();cardGalleries.forEach(gallery=>gallery.refresh?.());try{localStorage.setItem('prem-services-carousel-alignment',servicesCarouselAlignment);}catch{}};
$('#servicesLayout').value=servicesLayout;$('#servicesLayout').onchange=e=>{if(busy){e.target.value=servicesLayout;return;}servicesLayout=e.target.value;syncCardGalleries();cardGalleries.forEach(gallery=>gallery.refresh?.());try{localStorage.setItem('prem-services-layout',servicesLayout);}catch{}};
$('#servicesCardBackground').checked=servicesCardBackground;$('#servicesCardBackground').onchange=e=>{if(busy){e.target.checked=servicesCardBackground;return;}servicesCardBackground=e.target.checked;syncCardGalleries();try{localStorage.setItem('prem-services-card-background',String(servicesCardBackground));}catch{}};
$('#testimonialCardBackground').checked=testimonialCardBackground;$('#testimonialCardBackground').onchange=e=>{if(busy){e.target.checked=testimonialCardBackground;return;}testimonialCardBackground=e.target.checked;syncCardGalleries();try{localStorage.setItem('prem-testimonial-card-background',String(testimonialCardBackground));}catch{}};
$('#aboutGalleryVariant').value=aboutGalleryVariant;$('#carouselArcSettings').hidden=aboutGalleryVariant!=='circular';$('#aboutGalleryVariant').onchange=e=>{if(busy||navigationPreparing){e.target.value=aboutGalleryVariant;return;}aboutGalleryVariant=e.target.value;$('#carouselArcSettings').hidden=aboutGalleryVariant!=='circular';for(const gallery of cardGalleries)if(['about-gallery','home-projects'].includes(gallery.root.dataset.cardGallery))gallery.setVariant(aboutGalleryVariant);try{localStorage.setItem('prem-about-gallery-variant',aboutGalleryVariant);}catch{}};
$('#aboutGalleryOrientation').value=aboutGalleryOrientation;$('#aboutGalleryOrientation').onchange=e=>{aboutGalleryOrientation=e.target.value;for(const gallery of cardGalleries)if(['about-gallery','home-projects'].includes(gallery.root.dataset.cardGallery))gallery.setOrientation(aboutGalleryOrientation);try{localStorage.setItem('prem-about-gallery-orientation',aboutGalleryOrientation);}catch{}};
$('#carouselDescriptionInCard').checked=carouselDescriptionInCard;$('#carouselDescriptionInCard').onchange=e=>{if(busy||navigationPreparing){e.target.checked=carouselDescriptionInCard;return;}carouselDescriptionInCard=e.target.checked;for(const gallery of cardGalleries)if(gallery instanceof CardGallery)gallery.setDescriptionInCard(carouselDescriptionInCard);try{localStorage.setItem('prem-carousel-description-in-card',String(carouselDescriptionInCard));}catch{}};
$('#carouselNativeSnap').checked=carouselNativeSnap;
$('#carouselNativeSnap').onchange=e=>{if(busy||navigationPreparing){e.target.checked=carouselNativeSnap;return;}carouselNativeSnap=e.target.checked;for(const gallery of cardGalleries)if(gallery instanceof CardGallery)gallery.setNativeSnap(carouselNativeSnap);try{localStorage.setItem('prem-carousel-native-snap',String(carouselNativeSnap));}catch(error){console.warn('Native snap setting could not be saved.',error);}};
if(mountDevMode($('.corner-controls'),location.search))void mountContentSetControl($('#contentSet'),$('#contentSetStatus'));$('#settingsToggle').onclick=()=>{$('#settings').hidden=!$('#settings').hidden};$('#settingsClose').onclick=()=>$('#settings').hidden=true;$('#intensity').oninput=e=>{intensity=e.target.value/100;$('#intensityValue').value=e.target.value+'%'};$('#duration').oninput=e=>{duration=+e.target.value;$('#durationValue').value=(duration/1000).toFixed(2)+'s'};$('#slow').onchange=e=>slow=e.target.checked;$('#replay').onclick=async()=>{if(busy)return;busy=true;const el=document.querySelector('.surface'),snap=snapshot(el);if(snap){const old=snap.rect;const ratio=Math.min(innerWidth*.3/old.width,innerHeight*.4/old.height);snap.rect={...old.toJSON(),left:innerWidth*.35,top:innerHeight*.3,width:old.width*ratio,height:old.height*ratio};for(const part of Object.values(snap.shared||{})){const sr=part.rect;part.rect={left:snap.rect.left+(sr.left-old.left)*ratio,top:snap.rect.top+(sr.top-old.top)*ratio,width:sr.width*ratio,height:sr.height*ratio};part.fontSize*=ratio;part.letterSpacing*=ratio;}if(snap.image){const ir=snap.image.rect;snap.image.rect={left:snap.rect.left+(ir.left-old.left)*ratio,top:snap.rect.top+(ir.top-old.top)*ratio,width:ir.width*ratio,height:ir.height*ratio};}await morph(snap,el)}busy=false;};addEventListener('keydown',e=>handleEscapeKey(e,()=>dispatchCommand({id:'navigation.back',source:'keyboard'})),{capture:true});addEventListener('keydown',e=>handleProjectArrowKey(e,{canNavigate:()=>!busy&&(current==='work'||projectIds.includes(current))&&!mediaFocus.active&&!projectPopover.active&&!portfolioAssistant.active&&!document.activeElement?.closest('[data-hero-timeline],[data-card-gallery]')&&!document.querySelector('dialog[open]')&&$('#settings').hidden,move:direction=>dispatchCommand({id:direction<0?'project.previous':'project.next',source:'keyboard'})}),{capture:true});addEventListener('hashchange',navigate);const projectDrag=new ProjectDrag(main,{canStart:()=>!mediaFocus.active&&!busy&&!reduce.matches&&projectIds.includes(current),motion:motionMaterial,settleDuration:()=>duration*(slow?2.5:1),prepareSkin,createRipple:el=>reduce.matches?null:new LiquidImage(el,()=>intensity),onStart:()=>{busy=true;if(ambientMovementEnabled())ambientLight.hold(main.querySelector('.detail'));},onStage:layers=>{for(const {node,side} of layers){const paragraph=node.querySelector('.detail>.project-summary');if(side){dragReveals.set(side,new SummaryStream(paragraph,{mode:'fade',paused:true}));if(ambientDetailGlow&&cardHoverEffect==='glow'&&!hideCardHover&&!ambientMovementEnabled()){const detail=node.querySelector('.detail');detail.dataset.hoverEffect='glow';detail.setAttribute('data-hover-persistent','');dragAmbientEffects.push(mountSurfaceRenderer(detail,createLiquidReveal));}}else detachDragSummary=attachSummaryStream(main.querySelector('.detail>.project-summary'),paragraph);}if(ambientMovementEnabled())ambientLight.beginDrag(layers);},onMove:state=>ambientLight.drag(state),onCommit:direction=>dragReveals.get(direction)?.start(),neighbour:side=>{const p=adjacentCard(projects,canonicalProjectRoute(current),side);const html=cardDetail(p,layout,{headingBesideImage:detailHeadingBeside});return wideHero?html.replace('surface detail','surface detail wide-hero-card'):html;},onFinish:direction=>{detachDragSummary?.();detachDragSummary=null;if(direction){const route=adjacentCard(projects,canonicalProjectRoute(current),direction).id;render(route,{reveal:'fade',progress:dragReveals.get(direction)?.position||0,direction});history.pushState(null,'','#'+route);syncGalleryOrigin(route);}for(const reveal of dragReveals.values())reveal.destroy();dragReveals.clear();dragAmbientEffects.forEach(dispose=>dispose());dragAmbientEffects=[];if(ambientMovementEnabled())ambientLight.finishNavigation(main.querySelector('.detail'));if(!reduce.matches)pulseImages(main,1.3);busy=false;if(location.hash.slice(1)!==current&&location.hash)navigate();}});initEnvironment({onThemeChange:theme=>siteToast.show(theme==='system'?'System theme':`${theme==='light'?'Light':'Dark'} mode`,{key:'theme'})});applyEdgeShades();applyImageRounding();applyGeometryTokens();applyCardPadding();render(location.hash.slice(1)||'work');
revealPage().then(()=>{if((current==='work'||current==='about')&&!busy)fadeUpIn(main);});

const settingsTransfer=mountSettingsTransfer($('#settings'),{canChange:()=>!busy&&!navigationPreparing});
mountSettingsPublish($('#settings'),{schema:settingsTransfer.schema,writable:siteConfig.writable,canChange:()=>!busy&&!navigationPreparing});
