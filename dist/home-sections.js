import {normaliseSectionSpan} from './content-widths.js';
// heading (the hero h1) and available (the badge) are on because they are shown today; Flip and Flat reuse the h1 for the active project, so they ignore the switch; strapline and overview (At a glance) start off so the live site only changes once they are switched on.
export const HOME_SECTION_DEFAULTS=Object.freeze({heading:true,available:true,strapline:false,overview:false,approach:true,services:true,about:true,'about-timeline':true,experience:true,'side-projects':true,testimonials:true,writing:true});


// A scope names one page's sections: where its choices persist and which attributes tie its markup to the dev panel.
// Home and About share this machinery; only the scope differs.
export const HOME_SCOPE=Object.freeze({
 defaults:HOME_SECTION_DEFAULTS,spanIds:Object.keys(HOME_SECTION_DEFAULTS),storageKey:'prem-home-content',spansKey:'prem-home-section-spans',
 nodeAttribute:'data-home-section',nodeKey:'homeSection',controlAttribute:'data-home-section-control',controlKey:'homeSectionControl',spanAttribute:'data-home-span-control',spanKey:'homeSpanControl'
});

export function readSections(storage,scope=HOME_SCOPE){
 let saved;try{saved=JSON.parse(storage?.getItem(scope.storageKey)||'null');}catch{}
 const sections=Object.fromEntries(Object.entries(scope.defaults).map(([id,value])=>[id,typeof saved?.[id]==='boolean'?saved[id]:value]));
 // Side projects used to share the Experience switch, so a choice saved before they were split applies to both.
 if('side-projects' in scope.defaults&&typeof saved?.['side-projects']!=='boolean'&&typeof saved?.experience==='boolean')sections['side-projects']=saved.experience;
 return sections;
}

export function readSectionSpans(storage,scope=HOME_SCOPE){
 let saved;try{saved=JSON.parse(storage?.getItem(scope.spansKey)||'null');}catch{}
 return Object.fromEntries(scope.spanIds.map(id=>[id,normaliseSectionSpan(saved?.[id])]));
}

export function applySections(root,sections,spans={},scope=HOME_SCOPE){
 for(const node of root.querySelectorAll(`[${scope.nodeAttribute}]`)){
  const id=node.dataset[scope.nodeKey];if(!(id in scope.defaults))continue;
  node.hidden=sections[id]===false;
  // Side projects follow the Experience width setting ("Experience & side projects width").
  if(scope.spanIds.includes(id))node.dataset.contentSpan=id==='testimonials'?'content':normaliseSectionSpan(spans[id==='side-projects'?'experience':id]);
 }
 // The shared About block wraps several toggled parts; it leaves no spacing behind once all of them are hidden.
 const about=root.querySelector('.home-about'),parts=about?[...about.querySelectorAll(`[${scope.nodeAttribute}]`)]:[];
 if(parts.length)about.hidden=parts.every(node=>node.hidden);
}

export function initSectionSettings(panel,scope,{getRoot,canChange=()=>true,onChange=()=>{},storage}={}){
 if(storage===undefined)try{storage=globalThis.localStorage;}catch{}
 const sections=readSections(storage,scope),spans=readSectionSpans(storage,scope),controls=[...panel.querySelectorAll(`[${scope.controlAttribute}]`)],spanControls=[...panel.querySelectorAll(`[${scope.spanAttribute}]`)];
 const sync=()=>{for(const input of controls)input.checked=sections[input.dataset[scope.controlKey]];for(const input of spanControls)input.value=spans[input.dataset[scope.spanKey]];const root=getRoot?.();if(root)applySections(root,sections,spans,scope);};
 for(const input of controls)input.addEventListener('change',()=>{
  if(!canChange()){sync();return;}
  const id=input.dataset[scope.controlKey];if(!(id in scope.defaults))return;
  sections[id]=input.checked;try{storage?.setItem(scope.storageKey,JSON.stringify(sections));}catch{}
  sync();onChange({...sections});
 });
 for(const input of spanControls)input.addEventListener('change',()=>{
  if(!canChange()){sync();return;}
  const id=input.dataset[scope.spanKey];if(!scope.spanIds.includes(id))return;
  spans[id]=normaliseSectionSpan(input.value);try{storage?.setItem(scope.spansKey,JSON.stringify(spans));}catch{}
  sync();onChange({...sections});
 });
 sync();return {sync,get value(){return {...sections};},get spans(){return {...spans};}};
}

export const readHomeSections=storage=>readSections(storage,HOME_SCOPE);
export const readHomeSectionSpans=storage=>readSectionSpans(storage,HOME_SCOPE);
export const applyHomeSections=(root,sections,spans={})=>applySections(root,sections,spans,HOME_SCOPE);
export const initHomeSectionSettings=(panel,options)=>initSectionSettings(panel,HOME_SCOPE,options);
