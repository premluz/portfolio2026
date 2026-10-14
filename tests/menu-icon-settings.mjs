import assert from 'node:assert/strict';
import {menuIconPreset,mountMenuIconSettings} from '../dist/menu-icon-settings.js';
import {readFile} from 'node:fs/promises';

assert.deepEqual(menuIconPreset('menuGestureIcon','fingers'),['fingers','fingers']);
assert.deepEqual(menuIconPreset('menuGestureIcon','unknown'),['hand','hand']);
assert.equal(menuIconPreset('menuInfoIcon','info'),'info');
assert.deepEqual(menuIconPreset('menuAnimationIcon','play'),['play','pause']);

const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
for(const id of ['menuGestureIcon','menuInfoIcon','menuAnimationIcon'])assert.match(html,new RegExp(`id="${id}"`));
const ids=['menuGestureIcon','menuInfoIcon','menuAnimationIcon'];
const selects=new Map(ids.map(id=>[id,{value:'',listeners:{},addEventListener(type,callback){this.listeners[type]=callback;}}]));
const makeButton=(state)=>({dataset:{iconSwitch:'',switchStates:'off,on',switchIcons:'default,default',switchLabel:'Icon',state},attrs:{},setAttribute(name,value){this.attrs[name]=value;}});
const buttons=new Map([['gesturePreference',makeButton('off')],['siteHelp',{dataset:{},innerHTML:''}],['animationPreference',makeButton('on')]]);
const panel={querySelector(selector){return selects.get(selector.slice(1));}};
const menu={querySelector(selector){return buttons.get(selector.slice(1));}};
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
mountMenuIconSettings(panel,menu,{storage});
assert.equal(selects.get('menuGestureIcon').value,'hand');
assert.equal(buttons.get('gesturePreference').dataset.switchIcons,'hand,hand');
assert(buttons.get('siteHelp').innerHTML.includes('circle'));
assert.equal(buttons.get('animationPreference').dataset.switchIcons,'still,motion');

selects.get('menuGestureIcon').value='fingers';selects.get('menuGestureIcon').listeners.change();
assert.equal(buttons.get('gesturePreference').dataset.switchIcons,'fingers,fingers');
assert.equal(values.get('prem-menu-gesture-icon'),'fingers');
selects.get('menuInfoIcon').value='info';selects.get('menuInfoIcon').listeners.change();
assert(buttons.get('siteHelp').innerHTML.includes('M12 11v5'));
selects.get('menuAnimationIcon').value='play';selects.get('menuAnimationIcon').listeners.change();
assert.equal(buttons.get('animationPreference').dataset.switchIcons,'play,pause');
assert(values.get('prem-menu-animation-icon')==='play');
console.log('Menu icon settings passed: the three curated choices update and persist their menu glyphs.');
