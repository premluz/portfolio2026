import {normaliseSectionSpan} from './content-widths.js';
export const HOME_SECTION_DEFAULTS=Object.freeze({approach:true,services:true,about:true,'about-timeline':true,experience:true,testimonials:true});
const storageKey='prem-home-content';
const spansKey='prem-home-section-spans';

export function readHomeSections(storage){
 let saved;try{saved=JSON.parse(storage?.getItem(storageKey)||'null');}catch{}
 return Object.fromEntries(Object.entries(HOME_SECTION_DEFAULTS).map(([id,value])=>[id,typeof saved?.[id]==='boolean'?saved[id]:value]));
}

export function readHomeSectionSpans(storage){
 let saved;try{saved=JSON.parse(storage?.getItem(spansKey)||'null');}catch{}
 return Object.fromEntries(Object.keys(HOME_SECTION_DEFAULTS).map(id=>[id,normaliseSectionSpan(saved?.[id])]));
}
export function applyHomeSections(root,sections,spans={}){
 for(const node of root.querySelectorAll('[data-home-section]')){
  const id=node.dataset.homeSection;if(id in HOME_SECTION_DEFAULTS){node.hidden=sections[id]===false;node.dataset.contentSpan=id==='testimonials'?'content':normaliseSectionSpan(spans[id]);}
 }
 const about=root.querySelector('.home-about');
 if(about)about.hidden=[...about.querySelectorAll('[data-home-section]')].every(node=>node.hidden);
}

export function initHomeSectionSettings(panel,{getRoot,canChange=()=>true,onChange=()=>{},storage}={}){
 if(storage===undefined)try{storage=globalThis.localStorage;}catch{}
 const sections=readHomeSections(storage),spans=readHomeSectionSpans(storage),controls=[...panel.querySelectorAll('[data-home-section-control]')],spanControls=[...panel.querySelectorAll('[data-home-span-control]')];
 const sync=()=>{for(const input of controls)input.checked=sections[input.dataset.homeSectionControl];for(const input of spanControls)input.value=spans[input.dataset.homeSpanControl];const root=getRoot?.();if(root)applyHomeSections(root,sections,spans);};
 for(const input of controls)input.addEventListener('change',()=>{
  if(!canChange()){sync();return;}
  const id=input.dataset.homeSectionControl;if(!(id in HOME_SECTION_DEFAULTS))return;
  sections[id]=input.checked;try{storage?.setItem(storageKey,JSON.stringify(sections));}catch{}
  sync();onChange({...sections});
 });
 for(const input of spanControls)input.addEventListener('change',()=>{
  if(!canChange()){sync();return;}
  const id=input.dataset.homeSpanControl;if(!(id in HOME_SECTION_DEFAULTS))return;
  spans[id]=normaliseSectionSpan(input.value);try{storage?.setItem(spansKey,JSON.stringify(spans));}catch{}
  sync();onChange({...sections});
 });
 sync();return {sync,get value(){return {...sections};},get spans(){return {...spans};}};
}
