import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readSimpleTransitions,readSkipExit,mountSimpleTransitions} from '../dist/simple-transitions.js';

const memory=(initial={})=>{const values={...initial};return {values,getItem:key=>key in values?values[key]:null,setItem:(key,value)=>{values[key]=value;}};};
assert.equal(readSimpleTransitions(memory()),false,'Off by default, so the animated transitions stay');
assert.equal(readSimpleTransitions(memory({'prem-simple-transitions':'true'})),true);
assert.equal(readSimpleTransitions({getItem:()=>{throw new Error('blocked');}}),false,'Blocked storage falls back to off');
const storage=memory(),input={checked:false};
const skip={checked:false};const state=mountSimpleTransitions({enabled:input,skipExit:skip},{storage});assert.equal(state.enabled,false);assert.equal(state.skipExit,false,'The fade out is kept by default');
input.checked=true;input.onchange();assert.equal(state.enabled,true);assert.equal(storage.values['prem-simple-transitions'],'true','The choice persists');
skip.checked=true;skip.onchange();assert.equal(state.skipExit,true);assert.equal(storage.values['prem-simple-transitions-skip-exit'],'true','Skipping the fade out persists separately');assert.equal(readSkipExit(storage),true);
assert.equal(storage.values['prem-simple-transitions'],'true','The two options are independent');
assert.deepEqual(mountSimpleTransitions({},{storage}),{enabled:true,skipExit:true},'Missing controls still read the saved choices');
assert.equal(readSkipExit({getItem:()=>{throw new Error('blocked');}}),false);

const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),transfer=await readFile(new URL('../dist/settings-transfer.js',import.meta.url),'utf8');
assert(html.includes('id="simpleTransitions"')&&html.includes('id="simpleTransitionsSkipExit"'),'Both options are in the dev panel');
assert(transfer.includes("simpleTransitions:'prem-simple-transitions'")&&transfer.includes("simpleTransitionsSkipExit:'prem-simple-transitions-skip-exit'"),'Both options export, import and publish with other settings');
assert(app.includes('if(!reduce.matches&&!simpleTransitions.skipExit){'),'The exit fade is skipped when the option is on');
assert(app.includes('if(simpleTransitions.enabled){await simplePageTransition(route);return;}'),'Every route change takes the simple transition when on');
console.log('Simple transitions passed: default, persistence, blocked storage, panel control, settings export and routing.');
