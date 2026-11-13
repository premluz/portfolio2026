import {seedControlPreferences} from './control-preferences.js';
import {DEFAULT_TEXT_EFFECTS} from './text-effects-settings.js';

export const DEFAULT_STORAGE_VALUES=Object.freeze({
 'prem-control-style':'glass','prem-card-glass-style':'true','prem-control-style-navigation':'inherit','prem-control-style-projects':'inherit','prem-control-style-carousels':'inherit','prem-control-style-suggestions':'inherit','prem-control-style-utilities':'inherit',
 'prem-home-content-width':'small','prem-content-page-width':'small','prem-nav-content-width':'page','prem-detail-content-width':'large',
 'prem-home-product-display':'carousel','prem-hero-carousel':'false','prem-hero-timeline-enabled':'false','prem-hero-description-enabled':'true','prem-hero-timeline-mode':'drag',
 'prem-home-view':'current','prem-home-layout':'masonry','prem-home-columns':'1','prem-one-column-card-position':'alternating','prem-multi-column-card-position':'bottom','prem-card-copy-hover-desktop':'false',
 'prem-about-gallery-variant':'scroll','prem-about-gallery-orientation':'horizontal','prem-carousel-description-in-card':'false','prem-carousel-native-snap':'false','prem-services-layout':'carousel','prem-services-carousel-alignment':'content','prem-testimonial-card-background':'false','prem-footer-contact-links':'false',
 'prem-card-show-client':'true','prem-show-footer':'true','prem-footer-invitation':'true','prem-footer-links-text':'false','prem-card-client-inline':'false','prem-card-client-above':'false','prem-card-show-category':'false','prem-card-details':'false','prem-card-show-title':'true','prem-card-show-description':'true','prem-hide-card-background':'true','prem-hide-card-color':'false','prem-hide-card-hover':'true','prem-card-hover-effect':'glow',
 'prem-card-padding-uniform':'true','prem-card-padding-all':'32','prem-card-padding-top':'32','prem-card-padding-right':'32','prem-card-padding-bottom':'32','prem-card-padding-left':'32','prem-card-rounding':'46','prem-card-gap':'56',
 'prem-ambient-light-movement':'true','prem-ambient-hover-speed':'65','prem-ambient-color-source':'auto','prem-ambient-glow-strength':'100','prem-project-backdrop':'false','prem-nav-position':'bottom','prem-plain-cards':'false','prem-feature-stage':'false','prem-ambient-detail-glow':'true','prem-composer-glow':'false','prem-full-bleed':'false','prem-image-rounding':'25','prem-show-full-screen-option':'true',
 'prem-hero-heading-center':'false','prem-hero-heading-space':'default','prem-card-heading-style':'true','prem-card-hover-video':'true','prem-detail-hero-video':'true','prem-detail-heading-beside':'true','prem-detail-heading-body':'false','prem-detail-heading-center':'false','prem-detail-heading-space':'default','prem-wide-hero':'false','prem-hero-full-screen':'false','prem-hide-branding':'true','prem-plain-images':'false','prem-hide-page-card-background':'false','prem-image-border':'false','prem-card-company-year':'false','prem-card-instant-hover':'false','prem-masonry-ratio':'false','prem-detail-ratio-layout':'false','prem-hide-brand-avatar':'false','prem-brand-one-line':'false','prem-nav-show-work':'true','prem-nav-show-about':'true','prem-nav-show-lab':'true','prem-nav-show-contact':'true','prem-nav-show-settings':'false','prem-reader-text-size':'medium','prem-nav-show-assistant':'true','prem-show-mascot':'true','prem-character-assistant':'true','prem-chat-inline-composer':'true','prem-chat-width':'default','prem-character-assistant':'true','prem-content-start-first':'false','prem-article-images':'text','prem-editorial-headings':'false','prem-contact-title':'false','prem-featured-larger':'true','prem-lab-layout':'masonry','prem-lab-columns':'4','prem-lab-featured-larger':'false','prem-lab-card-details':'true','prem-lab-full-width':'false','prem-lab-heading':'true','prem-assistant-presentation':'page','prem-simple-transitions':'false','prem-simple-transitions-skip-exit':'false','prem-card-text-travel':'true','prem-page-image-cards':'false','prem-page-image-card-share':'16','prem-nav-rounding':'100','prem-nav-item-padding':'13','prem-nav-container-padding':'0','prem-nav-item-font-size':'12',
 'prem-split-project-controls':'true','prem-contextual-buttons':'composer','prem-contextual-composer':'true','prem-always-dark-glass':'true','prem-menu-gesture-visible':'false','prem-menu-info-visible':'false','prem-menu-animation-visible':'false',
 'prem-image-ripple-enabled':'false','prem-image-blur-enabled':'false','prem-glassOpacity':'40','prem-roomBlur':'11','prem-roomShade':'6','prem-edge-shade-top':'false','prem-edge-shade-bottom':'true','prem-edge-shade-left':'false','prem-edge-shade-right':'false','prem-edge-shade-retreat':'false','prem-edge-shade-depth':'70',
 'prem-assistant-sound':'true','prem-animations':'true','prem-theme':'light'
});

export const DEFAULT_JSON_STORAGE_VALUES=Object.freeze({
 'prem-home-content':{approach:false,services:false,about:true,'about-timeline':false,experience:true,'side-projects':true,testimonials:false},
 'prem-home-section-spans':{approach:'content',services:'content',about:'content',experience:'content',testimonials:'content'},
 'prem-about-content':{hero:true,title:true,traits:true,unusual:true,approach:false,services:false,about:false,'about-timeline':false,experience:false,'side-projects':false,testimonials:false,writing:false},
 'prem-about-section-spans':{approach:'content',services:'content',about:'content',experience:'content',testimonials:'content'},
 'prem-design-system':{typeSize:'small',headingSize:'auto',spaceSize:'large',headingWeight:'bold',bodyWeight:'thin',typeTracking:'small',typeLeading:'small'},
 'prem-hero-carousel-settings':{size:100,gap:64,copy:true},
 'prem-carousel-settings':{tilt:47,spread:60,depth:200,size:100,gap:96,speed:100,peek:12},
 'prem-text-effects':DEFAULT_TEXT_EFFECTS,
 'prem-motion-settings':{intensity:46,duration:400,slow:false,stretch:100,lag:38,stiffness:62,damping:39,reflections:0,glow:0,overshoot:0,ripple:65,motionBlur:55},
 'prem-bleed-image':{top:28,side:0,bottom:8,backing:true,settingsVersion:1}
});

const productDisplayDefaultKey='prem-home-product-display-default';
const productDisplayKey='prem-home-product-display';
const splitControlsKey='prem-split-project-controls';
const splitControlsDefaultKey='prem-split-project-controls-default';

// Controls hidden from the panel (`setting-retired`, Flip/Flat layouts) that have no menu replacing them. A value
// saved before they were retired would keep applying with nothing left to turn it off, so it returns to the
// preset once. The marker lets later explicit choices (an import, say) persist.
export const RETIRED_STORAGE_KEYS=Object.freeze(['prem-hero-timeline-enabled','prem-feature-stage','prem-hero-carousel','prem-hero-timeline-mode','prem-carousel-native-snap','prem-control-style-navigation','prem-control-style-projects','prem-control-style-carousels','prem-control-style-suggestions','prem-control-style-utilities','prem-card-glass-style','prem-image-blur-enabled','prem-image-ripple-enabled','prem-home-view']);
const retiredResetKey='prem-retired-settings-reset';

export function applyDefaultSettings(storage){
 if(storage===undefined)try{storage=globalThis.localStorage;}catch(error){console.warn('Portfolio defaults could not access browser storage.',error);return;}
 if(!storage)return;
 try{
  // Correct the previously shipped Text default once, then preserve later choices.
  if(storage.getItem(productDisplayDefaultKey)===null){
   if(storage.getItem(productDisplayKey)==='text')storage.setItem(productDisplayKey,DEFAULT_STORAGE_VALUES[productDisplayKey]);
   storage.setItem(productDisplayDefaultKey,DEFAULT_STORAGE_VALUES[productDisplayKey]);
  }
  if(storage.getItem(splitControlsDefaultKey)===null){
   if(storage.getItem(splitControlsKey)==='false')storage.setItem(splitControlsKey,DEFAULT_STORAGE_VALUES[splitControlsKey]);
   storage.setItem(splitControlsDefaultKey,DEFAULT_STORAGE_VALUES[splitControlsKey]);
  }
  if(storage.getItem(retiredResetKey)===null){
   for(const key of RETIRED_STORAGE_KEYS)if(storage.getItem(key)!==null)storage.setItem(key,DEFAULT_STORAGE_VALUES[key]);
   storage.setItem(retiredResetKey,'true');
  }
  seedControlPreferences(storage);
  for(const [key,value] of Object.entries(DEFAULT_STORAGE_VALUES))if(storage.getItem(key)===null)storage.setItem(key,value);
  for(const [key,value] of Object.entries(DEFAULT_JSON_STORAGE_VALUES))if(storage.getItem(key)===null)storage.setItem(key,JSON.stringify(value));
 }catch(error){console.warn('Portfolio defaults could not be applied.',error);}
}
