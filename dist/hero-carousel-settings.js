export const HERO_CAROUSEL_SETTINGS_KEY='prem-hero-carousel-settings';
export const heroCarouselControls=Object.freeze({
 size:{value:100,min:50,max:180,unit:'%'},
 gap:{value:64,min:0,max:200,unit:'px'}
});
export const defaultHeroCarouselSettings=Object.freeze({...Object.fromEntries(Object.entries(heroCarouselControls).map(([key,control])=>[key,control.value])),copy:true});

export function normaliseHeroCarouselSettings(value={}){
 const numbers=Object.entries(heroCarouselControls).map(([key,control])=>[key,typeof value?.[key]==='number'&&Number.isFinite(value[key])?Math.max(control.min,Math.min(control.max,value[key])):control.value]);
 return {...Object.fromEntries(numbers),copy:typeof value?.copy==='boolean'?value.copy:defaultHeroCarouselSettings.copy};
}
export function readHeroCarouselSettings(storage){
 try{storage??=globalThis.localStorage;return normaliseHeroCarouselSettings(JSON.parse(storage?.getItem(HERO_CAROUSEL_SETTINGS_KEY)||'null'));}
 catch(error){console.warn('Hero carousel settings could not be read; using the defaults.',error);return {...defaultHeroCarouselSettings};}
}
// The strip's size and its gap below the intro are layout, so CSS owns them through these two properties.
export function applyHeroCarouselSettings(root,settings){
 root.style.setProperty('--hero-carousel-size',String(settings.size/100));
 root.style.setProperty('--hero-carousel-gap',settings.gap+'px');
}
export function mountHeroCarouselSettings(panel,{storage,onChange=()=>{},canChange=()=>true}={}){
 try{storage??=globalThis.localStorage;}catch{}
 let value=readHeroCarouselSettings(storage);
 const inputs=[...Object.keys(heroCarouselControls),'copy'].map(key=>[key,panel.querySelector(`[data-hero-carousel-control="${key}"]`)]).filter(([,input])=>input);
 const sync=()=>{
  for(const [key,input] of inputs){
   if(key==='copy')input.checked=value.copy;else{input.value=String(value[key]);const output=panel.querySelector(`[data-hero-carousel-output="${key}"]`);if(output)output.value=value[key]+heroCarouselControls[key].unit;}
  }
 };
 sync();
 for(const [key,input] of inputs)input.addEventListener(key==='copy'?'change':'input',()=>{
  if(!canChange()){sync();return;}
  value=normaliseHeroCarouselSettings({...value,[key]:key==='copy'?input.checked:Number(input.value)});sync();
  try{storage?.setItem(HERO_CAROUSEL_SETTINGS_KEY,JSON.stringify(value));}
  catch(error){console.warn('Hero carousel settings could not be saved.',error);}
  onChange({...value});
 });
 return {get value(){return {...value};}};
}
