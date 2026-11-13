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
 glimmerDirection:choice(['ltr','rtl'],'ltr'),
 // On by default at the owner's request (2026-11-13), the one exception to ADR-005 here: page headings glimmer on
 // landing. It replaced heroGlimmer (home only, default off), whose stored false would otherwise have kept it hidden.
 pageGlimmer:toggle(true),
 pageGlimmerPlays:range(1,6,1)
});
export const DEFAULT_TEXT_EFFECTS=Object.freeze(Object.fromEntries(Object.entries(TEXT_EFFECT_CONTROLS).map(([key,control])=>[key,control.value])));

export function normalizeValue(control,value){
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
// Page headings share the glimmer's look and have their own switch and sweep count.
export const heroGlimmerOptions=settings=>({...glimmerOptions(settings),enabled:settings.pageGlimmer,plays:settings.pageGlimmerPlays});
