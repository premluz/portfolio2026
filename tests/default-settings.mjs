import assert from 'node:assert/strict';
import {DEFAULT_JSON_STORAGE_VALUES,DEFAULT_STORAGE_VALUES,applyDefaultSettings} from '../dist/default-settings.js';

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
console.log('Default settings passed: every preset value is applied for new storage and existing preferences remain unchanged.');
