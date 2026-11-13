import {GLYPH_SETS,UNITS} from './text-stream-engine.js';

// Options of PremLab's StreamingText and TextGlimmer, as developer settings. Classic (the original per-character
// fade) and no glimmer are the defaults, so the live site only changes once they are switched on (ADR-005).
export const TEXT_EFFECTS_KEY='prem-text-effects';
export const TEXT_EFFECT_COLORS=Object.freeze(['blue','purple','pink','orange','teal','green','yellow','red']);
const TINTS=Object.freeze(['single','multi','none']);
const choice=(options,value)=>({type:'choice',options,value});
const range=(min,max,value,unit='')=>({type:'range',min,max,value,unit});
const toggle=value=>({type:'toggle',value});
export const TEXT_EFFECT_CONTROLS=Object.freeze({
 effect:choice(['classic','feather','scramble'],'classic'),
 tint:choice(TINTS,'single'),
 color:choice(TEXT_EFFECT_COLORS,'blue'),
 unit:choice(UNITS,'character'),
 speed:range(1,220,45),
 catchUp:toggle(true),
 edge:range(1,24,8),
 glyphs:choice(Object.keys(GLYPH_SETS),'code'),
 swap:range(30,300,70,'ms'),
 font:choice(['inherit','mono'],'inherit'),
 caret:toggle(false),
 glimmer:toggle(false),
 glimmerTint:choice(TINTS,'single'),
 glimmerColor:choice(TEXT_EFFECT_COLORS,'blue'),
 glimmerSpeed:range(.4,5,1.6,'s'),
 glimmerSpread:range(10,45,30,'%'),
 glimmerDirection:choice(['ltr','rtl'],'ltr')
});
export const DEFAULT_TEXT_EFFECTS=Object.freeze(Object.fromEntries(Object.entries(TEXT_EFFECT_CONTROLS).map(([key,control])=>[key,control.value])));

function normalizeValue(control,value){
 if(control.type==='toggle')return typeof value==='boolean'?value:control.value;
 if(control.type==='choice')return control.options.includes(value)?value:control.value;
 return typeof value==='number'&&Number.isFinite(value)?Math.max(control.min,Math.min(control.max,value)):control.value;
}
export function normalizeTextEffects(value){
 return Object.fromEntries(Object.entries(TEXT_EFFECT_CONTROLS).map(([key,control])=>[key,normalizeValue(control,value?.[key])]));
}
export function readTextEffects(storage){
 try{storage??=globalThis.localStorage;return normalizeTextEffects(JSON.parse(storage?.getItem(TEXT_EFFECTS_KEY)||'null'));}
 catch(error){console.warn('Text effect settings unreadable; using the defaults',error);return {...DEFAULT_TEXT_EFFECTS};}
}
// The glimmer controls under their component's own option names.
export const glimmerOptions=settings=>({enabled:settings.glimmer,tint:settings.glimmerTint,color:settings.glimmerColor,speed:settings.glimmerSpeed,spread:settings.glimmerSpread,direction:settings.glimmerDirection});

function bind(panel,key,control,value,save){
 const input=panel.querySelector(`[data-text-effect-control="${key}"]`),output=panel.querySelector(`[data-text-effect-output="${key}"]`);
 if(!input)throw new Error(`Text effect control "${key}" is missing from the settings panel`);
 const show=()=>{if(control.type==='toggle')input.checked=value[key];else input.value=String(value[key]);if(output)output.value=value[key]+control.unit;};
 show();
 input.addEventListener(control.type==='range'?'input':'change',()=>{
  value[key]=normalizeValue(control,control.type==='toggle'?input.checked:control.type==='range'?Number(input.value):input.value);show();save();
 });
}
export function mountTextEffectSettings(panel,{storage,onChange=()=>{}}={}){
 try{storage??=globalThis.localStorage;}catch(error){console.warn('Text effect settings cannot be saved: storage is unavailable',error);}
 const value=readTextEffects(storage);
 const save=()=>{try{storage?.setItem(TEXT_EFFECTS_KEY,JSON.stringify(value));}catch(error){console.warn('Text effect settings not saved',error);}onChange({...value});};
 for(const [key,control] of Object.entries(TEXT_EFFECT_CONTROLS))bind(panel,key,control,value,save);
 return {get value(){return {...value};}};
}
