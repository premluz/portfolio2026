import assert from 'node:assert/strict';
import {iconSwitchMarkup,setIconSwitchState,nextSwitchState} from '../dist/icon-switch.js';
const states=['light','dark','system'];let current='light';
for(const expected of ['dark','system','light']){current=nextSwitchState(states,current);assert.equal(current,expected);}
const attrs={},button={dataset:{iconSwitch:'',switchStates:'off,on',switchIcons:'muted,sound',switchLabel:'Sound'},setAttribute:(key,value)=>attrs[key]=value};
setIconSwitchState(button,'on');assert.equal(attrs['aria-checked'],'true');assert.equal(button.dataset.state,'on');assert(button.innerHTML.includes('svg'));assert.equal(attrs['aria-label'],'Sound: on');
const sound=button.innerHTML;setIconSwitchState(button,'off');assert.equal(attrs['aria-checked'],'false');assert.notEqual(button.innerHTML,sound,'The icon indicates muted sound as well as its accessible state');
button.dataset.switchStates='light,dark,system';button.dataset.switchIcons='light,dark,system';button.dataset.switchLabel='Theme';
for(const state of states){setIconSwitchState(button,state);assert.equal(button.dataset.state,state);assert(button.dataset.tooltip.includes(state));assert(button.innerHTML.includes('svg'));}
const unsafe=iconSwitchMarkup({id:'x"',label:'<script>',icons:['hand','hand']});assert(unsafe.includes('&lt;script&gt;'));assert(!unsafe.includes('<script>'));
console.log('Icon switches passed: binary state, distinct glyphs, accessible labels, safe text and three-state theme cycling.');
