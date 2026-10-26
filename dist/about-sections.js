import {HOME_SECTION_DEFAULTS,initSectionSettings} from './home-sections.js';

// The About page's own components come first and stay on, so the page looks as it always did until a
// Home component is switched on. The Home components reuse the same markup, so each keeps its authored content.
export const ABOUT_OWN_SECTIONS=Object.freeze(['hero','traits','unusual']);
export const ABOUT_SECTION_DEFAULTS=Object.freeze({
 hero:true,traits:true,unusual:true,
 ...Object.fromEntries(Object.keys(HOME_SECTION_DEFAULTS).map(id=>[id,false]))
});
export const ABOUT_SCOPE=Object.freeze({
 defaults:ABOUT_SECTION_DEFAULTS,spanIds:Object.keys(HOME_SECTION_DEFAULTS),storageKey:'prem-about-content',spansKey:'prem-about-section-spans',
 nodeAttribute:'data-about-section',nodeKey:'aboutSection',controlAttribute:'data-about-section-control',controlKey:'aboutSectionControl',spanAttribute:'data-about-span-control',spanKey:'aboutSpanControl'
});
export const initAboutSectionSettings=(panel,options)=>initSectionSettings(panel,ABOUT_SCOPE,options);
