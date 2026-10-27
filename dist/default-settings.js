export const DEFAULT_STORAGE_VALUES=Object.freeze({
 'prem-home-content-width':'small','prem-content-page-width':'small','prem-detail-content-width':'large',
 'prem-home-product-display':'carousel','prem-hero-carousel':'false','prem-hero-timeline-enabled':'false','prem-hero-description-enabled':'true','prem-hero-timeline-mode':'drag',
 'prem-home-view':'current','prem-home-layout':'masonry','prem-home-columns':'1','prem-one-column-card-position':'alternating','prem-multi-column-card-position':'bottom','prem-card-copy-hover-desktop':'false',
 'prem-about-gallery-variant':'circular','prem-about-gallery-orientation':'horizontal','prem-carousel-description-in-card':'false','prem-carousel-native-snap':'false','prem-services-layout':'carousel','prem-services-carousel-alignment':'content','prem-testimonial-card-background':'false','prem-footer-contact-links':'false',
 'prem-card-show-client':'true','prem-show-footer':'true','prem-card-client-inline':'false','prem-card-client-above':'false','prem-card-details':'false','prem-card-show-title':'true','prem-card-show-description':'true','prem-card-title-scale':'3','prem-hide-card-background':'true','prem-hide-card-color':'false','prem-hide-card-hover':'true','prem-card-hover-effect':'glow',
 'prem-card-padding-uniform':'true','prem-card-padding-all':'32','prem-card-padding-top':'32','prem-card-padding-right':'32','prem-card-padding-bottom':'32','prem-card-padding-left':'32','prem-card-rounding':'46','prem-card-gap':'56',
 'prem-ambient-light-movement':'true','prem-ambient-hover-speed':'65','prem-ambient-color-source':'auto','prem-ambient-glow-strength':'100','prem-project-backdrop':'false','prem-nav-position':'bottom','prem-plain-nav':'false','prem-plain-cards':'false','prem-feature-stage':'false','prem-ambient-detail-glow':'true','prem-composer-glow':'false','prem-full-bleed':'false','prem-image-rounding':'25','prem-show-full-screen-option':'true',
 'prem-detail-heading-beside':'true','prem-wide-hero':'false','prem-hide-branding':'true','prem-glass-style':'true','prem-assistant-presentation':'page','prem-simple-transitions':'false','prem-simple-transitions-skip-exit':'false','prem-nav-rounding':'100','prem-nav-item-padding':'13','prem-nav-container-padding':'0','prem-nav-item-font-size':'12',
 'prem-split-project-controls':'true','prem-contextual-buttons':'composer','prem-contextual-composer':'true','prem-always-dark-glass':'true','prem-menu-gesture-visible':'false','prem-menu-info-visible':'false','prem-menu-animation-visible':'false',
 'prem-image-ripple-enabled':'false','prem-image-blur-enabled':'false','prem-glassOpacity':'40','prem-roomBlur':'11','prem-roomShade':'6','prem-edge-shade-top':'false','prem-edge-shade-bottom':'true','prem-edge-shade-left':'false','prem-edge-shade-right':'false','prem-edge-shade-retreat':'false','prem-edge-shade-depth':'70',
 'prem-assistant-sound':'true','prem-animations':'true','prem-theme':'light'
});

export const DEFAULT_JSON_STORAGE_VALUES=Object.freeze({
 'prem-home-content':{approach:false,services:false,about:true,'about-timeline':false,experience:true,testimonials:false},
 'prem-home-section-spans':{approach:'content',services:'content',about:'content',experience:'content',testimonials:'content'},
 'prem-about-content':{hero:true,traits:true,unusual:true,approach:false,services:false,about:false,'about-timeline':false,experience:false,testimonials:false,writing:false},
 'prem-about-section-spans':{approach:'content',services:'content',about:'content',experience:'content',testimonials:'content'},
 'prem-design-system':{typeSize:'small',spaceSize:'large',headingWeight:'bold',bodyWeight:'thin',typeTracking:'small',typeLeading:'small'},
 'prem-hero-carousel-settings':{size:100,gap:64,copy:true},
 'prem-carousel-settings':{tilt:47,spread:60,depth:200,size:100,gap:96,speed:100,peek:12},
 'prem-motion-settings':{intensity:46,duration:400,slow:false,stretch:100,lag:38,stiffness:62,damping:39,reflections:0,glow:0,overshoot:0,ripple:65,motionBlur:55},
 'prem-bleed-image':{top:28,side:0,bottom:8,backing:true,settingsVersion:1}
});

const productDisplayDefaultKey='prem-home-product-display-default';
const productDisplayKey='prem-home-product-display';
const splitControlsKey='prem-split-project-controls';
const splitControlsDefaultKey='prem-split-project-controls-default';

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
  for(const [key,value] of Object.entries(DEFAULT_STORAGE_VALUES))if(storage.getItem(key)===null)storage.setItem(key,value);
  for(const [key,value] of Object.entries(DEFAULT_JSON_STORAGE_VALUES))if(storage.getItem(key)===null)storage.setItem(key,JSON.stringify(value));
 }catch(error){console.warn('Portfolio defaults could not be applied.',error);}
}
