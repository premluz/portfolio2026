import assert from 'node:assert/strict';
import {DEFAULT_JSON_STORAGE_VALUES,DEFAULT_STORAGE_VALUES,RETIRED_STORAGE_KEYS,applyDefaultSettings} from '../dist/default-settings.js';

const values=new Map();
const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
applyDefaultSettings(storage);

for(const [key,value] of Object.entries(DEFAULT_STORAGE_VALUES))assert.equal(storage.getItem(key),value,`Missing scalar default: ${key}`);
for(const [key,value] of Object.entries(DEFAULT_JSON_STORAGE_VALUES))assert.deepEqual(JSON.parse(storage.getItem(key)),value,`Missing grouped default: ${key}`);

storage.setItem('prem-home-layout','user-choice');
storage.setItem('prem-motion-settings',JSON.stringify({duration:999}));
applyDefaultSettings(storage);
assert.equal(storage.getItem('prem-home-layout'),'user-choice','Existing scalar preferences are preserved');
assert.deepEqual(JSON.parse(storage.getItem('prem-motion-settings')),{duration:999},'Existing grouped preferences are preserved');
assert.equal(storage.getItem('prem-home-product-display'),'carousel');
assert.equal(storage.getItem('prem-split-project-controls'),'true');
const legacySplit=new Map([['prem-split-project-controls','false']]);
const splitStorage={getItem:key=>legacySplit.get(key)??null,setItem:(key,value)=>legacySplit.set(key,String(value))};
applyDefaultSettings(splitStorage);assert.equal(legacySplit.get('prem-split-project-controls'),'true');
legacySplit.set('prem-split-project-controls','false');applyDefaultSettings(splitStorage);assert.equal(legacySplit.get('prem-split-project-controls'),'false','Later explicit control-layout choices persist');
for(const [previous,expected] of [['text','carousel'],['cards','cards']]){
 const saved=new Map([['prem-home-product-display',previous]]);
 const existing={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,String(value))};
 applyDefaultSettings(existing);
 assert.equal(saved.get('prem-home-product-display'),expected);
 saved.set('prem-home-product-display','text');
 applyDefaultSettings(existing);
 assert.equal(saved.get('prem-home-product-display'),'text','Later explicit choices survive the one-time correction');
}
const legacyCarousel=new Map([['prem-carousel-description-in-card','true']]);
const carouselStorage={getItem:key=>legacyCarousel.get(key)??null,setItem:(key,value)=>legacyCarousel.set(key,String(value))};
applyDefaultSettings(carouselStorage);assert.equal(legacyCarousel.get('prem-carousel-description-in-card'),'true','Saved per-card carousel captions remain enabled');
for(const key of RETIRED_STORAGE_KEYS)assert(key in DEFAULT_STORAGE_VALUES,`Retired setting ${key} has a preset to return to`);
const retired=new Map(RETIRED_STORAGE_KEYS.map(key=>[key,'stale']));
const retiredStorage={getItem:key=>retired.get(key)??null,setItem:(key,value)=>retired.set(key,String(value))};
applyDefaultSettings(retiredStorage);
for(const key of RETIRED_STORAGE_KEYS)assert.equal(retired.get(key),DEFAULT_STORAGE_VALUES[key],`${key} returns to its preset once`);
retired.set('prem-hero-carousel','true');applyDefaultSettings(retiredStorage);
assert.equal(retired.get('prem-hero-carousel'),'true','A retired value saved after the one-time reset persists');
console.log('Default settings passed: every preset value is applied for new storage and existing preferences remain unchanged.');
