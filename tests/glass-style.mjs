import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readGlassStyle,applyGlassStyle,mountGlassStyle} from '../dist/glass-style.js';

const memory=(initial={})=>{const values={...initial};return {values,getItem:key=>key in values?values[key]:null,setItem:(key,value)=>{values[key]=value;}};};
assert.equal(readGlassStyle(memory()),true,'Glass style defaults on');
assert.equal(readGlassStyle(memory({'prem-glass-style':'false'})),false);
assert.equal(readGlassStyle({getItem:()=>{throw new Error('blocked');}}),true,'Blocked storage falls back to the default');
const root={dataset:{}};applyGlassStyle(root,false);assert.equal(root.dataset.glassStyle,'off');

const storage=memory({'prem-glass-style':'false'}),input={checked:true},mounted={dataset:{}};
assert.equal(mountGlassStyle(input,{root:mounted,storage}),false);assert.equal(input.checked,false);assert.equal(mounted.dataset.glassStyle,'off');
input.checked=true;input.onchange();assert.equal(mounted.dataset.glassStyle,'on');assert.equal(storage.values['prem-glass-style'],'true','Toggling persists the choice');

const css=await readFile(new URL('../dist/glass-style.css',import.meta.url),'utf8');
const rules=css.split('\n').filter(line=>line&&!line.startsWith('/*'));
assert(rules.every(rule=>/^(@media\([^)]*\)\{)?:root(\[data-animation="off"\])?(\[data-glass-style="on"\]|:not\(\[data-glass-style="on"\]\))/.test(rule)),'Every glass rule is gated by the toggle');
assert(!/#[0-9a-f]{3,8}\b/i.test(css.replace(/#dock/g,'')),'Glass colors come from tokens');
for(const selector of ['.glass-utility-button','.composer-suggestions button.glass-surface','.detail-media-actions button','.card-rail-controls button','.visual>.image-edge','.dock-glass-light','.assistant-composer button'])assert(css.includes(selector),selector+' is covered');
const styles=await readFile(new URL('../scripts/client-styles.mjs',import.meta.url),'utf8');assert(styles.includes("'glass-style.css'"),'Glass style ships in the bundled stylesheet');
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert(html.includes('id="glassStyle"'));
console.log('Glass style passed: default, persistence, blocked storage, toggle gating, tokens and coverage.');
