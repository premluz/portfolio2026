import assert from 'node:assert/strict';
import {installTooltips} from '../dist/tooltips.js';

const events=new Map();let tip;
globalThis.document={createElement:()=>({style:{},setAttribute(){},getBoundingClientRect:()=>({width:80,height:20})}),body:{append:node=>tip=node},activeElement:null};
globalThis.innerWidth=1200;globalThis.addEventListener=()=>{};
const root={addEventListener:(name,fn)=>events.set(name,fn)};
const node=dataset=>({dataset,attributes:new Map(),closest(){return this;},contains(other){return other===this;},getAttribute(name){return this.attributes.get(name);},setAttribute(name,value){this.attributes.set(name,value);},removeAttribute(name){this.attributes.delete(name);},getBoundingClientRect:()=>({left:200,top:200,width:38,bottom:238})});
installTooltips(root);
const home=node({tooltip:'Home',tooltipPointerOnly:''});
events.get('focusin')({target:home});assert(tip.hidden,'Programmatic menu autofocus never covers a project row with the Home tooltip');
events.get('pointerover')({target:home,pointerType:'mouse',relatedTarget:null});assert(!tip.hidden);assert.equal(tip.textContent,'Home','Intentional pointer hover still shows the tooltip');
events.get('focusout')({target:home});assert(tip.hidden);
const email=node({tooltip:'Copy email'});events.get('focusin')({target:email});assert(!tip.hidden);assert.equal(tip.textContent,'Copy email','Keyboard users retain action tooltips');
console.log('Tooltips passed: no automatic Home tooltip, deliberate pointer hover and accessible copy-email focus.');
