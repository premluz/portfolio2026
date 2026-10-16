import assert from 'node:assert/strict';
import {mountMenuIconSettings} from '../dist/menu-icon-settings.js';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
for(const id of ['showGestureControl','showInfoControl','showAnimationControl'])assert.match(html,new RegExp(`id="${id}"`));
assert.match(html,/<details class="developer-settings-group">\s*<summary>Navigation/);assert.doesNotMatch(html,/<details class="developer-settings-group" hidden>/,'Every developer settings group is visible');
const ids=['showGestureControl','showInfoControl','showAnimationControl'];
const toggles=new Map(ids.map(id=>[id,{attrs:{},listeners:{},addEventListener(type,callback){this.listeners[type]=callback;},setAttribute(name,value){this.attrs[name]=value;}}]));
const makeButton=()=>({hidden:false,disabled:false});
const buttons=new Map([['gesturePreference',makeButton()],['siteHelp',makeButton()],['animationPreference',makeButton()]]);
const panel={querySelector(selector){return toggles.get(selector.slice(1));}};
const menu={querySelector(selector){return buttons.get(selector.slice(1));}};
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
mountMenuIconSettings(panel,menu,{storage});
for(const id of ids)assert.equal(toggles.get(id).attrs['aria-checked'],'false');
for(const button of buttons.values()){assert(button.hidden);assert(button.disabled);}
toggles.get('showGestureControl').listeners.click();
assert.equal(buttons.get('gesturePreference').hidden,false);assert.equal(buttons.get('gesturePreference').disabled,false);assert.equal(values.get('prem-menu-gesture-visible'),'true');
toggles.get('showInfoControl').listeners.click();assert.equal(values.get('prem-menu-info-visible'),'true');
toggles.get('showAnimationControl').listeners.click();assert.equal(values.get('prem-menu-animation-visible'),'true');
console.log('Menu control settings passed: the three visibility switches default off and persist on/off state.');
