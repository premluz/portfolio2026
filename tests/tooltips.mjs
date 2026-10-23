import assert from 'node:assert/strict';
import {installTooltips} from '../dist/tooltips.js';

const events=new Map();let tip;
globalThis.document={createElement:()=>({style:{},setAttribute(){},getBoundingClientRect:()=>({width:80,height:20})}),body:{append:node=>tip=node},activeElement:null};
globalThis.innerWidth=1200;globalThis.addEventListener=()=>{};
const root={addEventListener:(name,fn)=>events.set(name,fn)};
const node=dataset=>({dataset,attributes:new Map(),closest(){return this;},contains(other){return other===this;},getAttribute(name){return this.attributes.get(name);},setAttribute(name,value){this.attributes.set(name,value);},removeAttribute(name){this.attributes.delete(name);},getBoundingClientRect:()=>({left:200,top:200,width:38,bottom:238})});
let clock=0,timers=[];const advance=ms=>{clock+=ms;for(const timer of timers.filter(item=>item.at<=clock&&!item.done)){timer.done=true;timer.fn();}};
installTooltips(root,{delay:350,warm:600,schedule:(fn,ms)=>{const timer={fn,at:clock+ms,done:false};timers.push(timer);return timer;},cancel:timer=>{timer.done=true;},now:()=>clock});
const home=node({tooltip:'Home',tooltipPointerOnly:''});
events.get('focusin')({target:home});assert(tip.hidden,'Programmatic menu autofocus never covers a project row with the Home tooltip');
events.get('pointerover')({target:home,pointerType:'mouse',relatedTarget:null});assert(tip.hidden,'Hover alone does not show the tooltip yet');advance(349);assert(tip.hidden,'Still waiting just before the delay');advance(1);assert(!tip.hidden);assert.equal(tip.textContent,'Home','Intentional pointer hover shows the tooltip after a slight delay');
events.get('focusout')({target:home});assert(tip.hidden);
// Passing over a control and leaving before the delay shows nothing.
const passing=node({tooltip:'Passing'});events.get('pointerover')({target:passing,pointerType:'mouse',relatedTarget:null});advance(200);events.get('pointerout')({target:passing,relatedTarget:null});advance(1000);assert(tip.hidden,'A quick pass never shows a tooltip');
// Right after one tooltip closes, the next control shows at once; after a pause it waits again.
events.get('pointerover')({target:home,pointerType:'mouse',relatedTarget:null});advance(350);assert(!tip.hidden);events.get('pointerout')({target:home,relatedTarget:null});assert(tip.hidden);
const next=node({tooltip:'Next'});events.get('pointerover')({target:next,pointerType:'mouse',relatedTarget:null});assert(!tip.hidden&&tip.textContent==='Next','A neighbouring control shows immediately after a tooltip closed');events.get('pointerout')({target:next,relatedTarget:null});advance(2000);
const later=node({tooltip:'Later'});events.get('pointerover')({target:later,pointerType:'mouse',relatedTarget:null});assert(tip.hidden,'After a pause the delay applies again');advance(350);assert.equal(tip.textContent,'Later');events.get('pointerout')({target:later,relatedTarget:null});
// A tooltip dismissed by a click stays hidden while the pointer rests on the control.
advance(2000);const rest=node({tooltip:'Rest'});
events.get('pointerover')({target:rest,pointerType:'mouse',relatedTarget:null});advance(350);assert(!tip.hidden);
events.get('pointerdown')({target:rest,pointerType:'mouse'});assert(tip.hidden,'A press dismisses the tooltip');
events.get('focusin')({target:rest});assert(tip.hidden,'The focus a mouse click causes does not bring it back');
events.get('pointerover')({target:rest,pointerType:'mouse',relatedTarget:null});advance(2000);assert(tip.hidden,'A stray hover event on the same control stays quiet');
// Leaving and coming back shows it again after the delay.
events.get('pointerout')({target:rest,relatedTarget:null});events.get('pointerover')({target:rest,pointerType:'mouse',relatedTarget:null});assert(tip.hidden);advance(350);assert(!tip.hidden&&tip.textContent==='Rest','Re-entering the control shows the tooltip again');
events.get('pointerout')({target:rest,relatedTarget:null});assert(tip.hidden);
// A mouse click does not suppress later keyboard focus on the same control.
events.get('pointerdown')({target:rest,pointerType:'mouse'});events.get('focusin')({target:rest});assert(tip.hidden);events.get('focusout')({target:rest});
events.get('focusin')({target:rest});assert(!tip.hidden&&tip.textContent==='Rest','Keyboard focus still shows the tooltip');events.get('focusout')({target:rest});assert(tip.hidden);
// A touch never starts the hover timer.
const touched=node({tooltip:'Touch'});events.get('pointerover')({target:touched,pointerType:'touch',relatedTarget:null});advance(1000);assert(tip.hidden);
const email=node({tooltip:'Copy email'});events.get('focusin')({target:email});assert(!tip.hidden);assert.equal(tip.textContent,'Copy email','Keyboard users retain action tooltips');
console.log('Tooltips passed: no automatic Home tooltip, delayed pointer hover, quick passes stay quiet, neighbouring controls switch at once, a dismissed tooltip stays hidden until the pointer re-enters and keyboard focus is immediate.');
