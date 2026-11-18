import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normaliseHeroCarouselSettings,readHeroCarouselSettings,mountHeroCarouselSettings,applyHeroCarouselSettings,defaultHeroCarouselSettings} from '../dist/hero-carousel-settings.js';

assert.deepEqual(normaliseHeroCarouselSettings(),{size:100,gap:64,copy:true},'Defaults leave a larger gap and keep the description');
assert.deepEqual(normaliseHeroCarouselSettings({size:999,gap:-5,copy:'no'}),{size:180,gap:0,copy:true},'Out-of-range or wrong-type values are clamped to safe ones');
assert.deepEqual(normaliseHeroCarouselSettings({size:70,gap:120,copy:false}),{size:70,gap:120,copy:false});
const memory=(initial={})=>{const values={...initial};return {values,getItem:key=>key in values?values[key]:null,setItem:(key,value)=>{values[key]=value;}};};
assert.deepEqual(readHeroCarouselSettings(memory({'prem-hero-carousel-settings':'{"size":120}'})),{...defaultHeroCarouselSettings,size:120});
{const warn=console.warn;const warned=[];console.warn=(...args)=>warned.push(args[0]);assert.deepEqual(readHeroCarouselSettings({getItem:()=>{throw new Error('blocked');}}),{...defaultHeroCarouselSettings});console.warn=warn;assert.match(warned[0],/could not be read/,'Unreadable storage is reported');}
const style={};applyHeroCarouselSettings({style:{setProperty:(name,value)=>{style[name]=value;}}},{size:150,gap:80,copy:true});
assert.deepEqual(style,{'--hero-carousel-size':'1.5','--hero-carousel-gap':'80px'},'Size and gap reach CSS as two properties');

// The panel controls persist and report each change.
const listeners=new Map(),inputs={size:{value:'100'},gap:{value:'64'},copy:{checked:true}},outputs={size:{},gap:{}};
for(const [key,input] of Object.entries(inputs))input.addEventListener=(type,fn)=>listeners.set(key,fn);
const panel={querySelector:selector=>{const m=/data-hero-carousel-(control|output)="(\w+)"/.exec(selector);return m[1]==='control'?inputs[m[2]]:outputs[m[2]];}};
const storage=memory(),changes=[];mountHeroCarouselSettings(panel,{storage,onChange:value=>changes.push(value)});
inputs.size.value='140';listeners.get('size')();inputs.copy.checked=false;listeners.get('copy')();
assert.deepEqual(changes.at(-1),{size:140,gap:64,copy:false});assert.deepEqual(JSON.parse(storage.values['prem-hero-carousel-settings']),{size:140,gap:64,copy:false},'Knobs persist together');assert.equal(outputs.size.value,'140%');

const css=await readFile(new URL('../dist/hero-carousel.css',import.meta.url),'utf8'),html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
assert(css.includes('margin:var(--hero-carousel-gap,64px) calc(50% - 50vw) 0'),'The filmstrip leaves the gap knob below the intro');
assert(css.includes('width:calc(var(--filmstrip-standard) * var(--hero-carousel-size,1))')&&css.includes('height:calc(var(--filmstrip-height) * var(--hero-carousel-size,1))'),'The size knob scales every card');
for(const key of ['size','gap','copy'])assert(html.includes(`data-hero-carousel-control="${key}"`),key+' knob is in the dev panel');
console.log('Hero carousel settings passed: defaults, clamping, persistence, CSS properties, size and gap reaching the filmstrip, and panel controls.');
