export const CAROUSEL_SETTINGS_KEY='prem-carousel-settings';
export const carouselControls=Object.freeze({
 tilt:{value:24,min:0,max:60,unit:'°'},
 spread:{value:100,min:60,max:180,unit:'%'},
 depth:{value:100,min:0,max:200,unit:'%'},
 size:{value:100,min:70,max:130,unit:'%'},
 gap:{value:32,min:8,max:96,unit:'px'},
 peek:{value:12,min:0,max:32,unit:'px'},
 speed:{value:100,min:25,max:200,unit:'%'}
});
export const defaultCarouselSettings=Object.freeze(Object.fromEntries(Object.entries(carouselControls).map(([key,control])=>[key,control.value])));
export function normaliseCarouselSettings(value={}){
 return Object.fromEntries(Object.entries(carouselControls).map(([key,control])=>[key,typeof value?.[key]==='number'&&Number.isFinite(value[key])?Math.max(control.min,Math.min(control.max,value[key])):control.value]));
}
export function readCarouselSettings(storage){
 try{storage??=globalThis.localStorage;return normaliseCarouselSettings(JSON.parse(storage?.getItem(CAROUSEL_SETTINGS_KEY)||'null'));}catch{return {...defaultCarouselSettings};}
}
export function mountCarouselSettings(panel,{storage,onChange=()=>{},canChange=()=>true}={}){
 try{storage??=globalThis.localStorage;}catch{}
 let value=readCarouselSettings(storage);
 for(const [key,control] of Object.entries(carouselControls)){
  const input=panel.querySelector(`[data-carousel-control="${key}"]`),output=panel.querySelector(`[data-carousel-output="${key}"]`);if(!input)continue;
  const sync=()=>{input.value=String(value[key]);if(output)output.value=value[key]+control.unit;};sync();
  input.addEventListener('input',()=>{
   if(!canChange()){sync();return;}
   value=normaliseCarouselSettings({...value,[key]:Number(input.value)});sync();
   try{storage?.setItem(CAROUSEL_SETTINGS_KEY,JSON.stringify(value));}catch{}
   onChange({...value});
  });
 }
 return {get value(){return {...value};}};
}
