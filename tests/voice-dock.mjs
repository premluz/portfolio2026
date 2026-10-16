import assert from 'node:assert/strict';
import {VoiceDock} from '../dist/voice-dock.js';
class Node{
 constructor(){this.children=[];this.dataset={};this.attributes={};this.classes=new Set();this.classList={toggle:(key,on)=>on?this.classes.add(key):this.classes.delete(key),add:key=>this.classes.add(key),remove:key=>this.classes.delete(key)};}
 append(node){this.children.push(node);}setAttribute(key,value){this.attributes[key]=value;}querySelector(selector){return selector==='canvas'?this.canvas??=new Node():null;}focus(){this.focused=true;}remove(){this.removed=true;}
}
globalThis.document={createElement:()=>new Node()};
const el=new Node(),nav=new Node(),input={value:'A draft question',blur(){this.blurred=true;}},form=new Node();form.querySelector=()=>input;el.querySelector=selector=>selector==='nav'?nav:form;
let requests=[],created=0,destroyed=0,phases=[],compact=[],actions=[];
class Wave{constructor(){created++;}destroy(){destroyed++;}setPhase(phase){phases.push(phase);}}
const voice=new VoiceDock({el,setVoiceCompact:value=>compact.push(value)},{onMic:()=>actions.push('mic'),onStop:()=>actions.push('stop'),onSound:()=>actions.push('sound'),onClose:()=>actions.push('close'),loadWave:()=>new Promise(resolve=>requests.push(resolve))});
const first=voice.setActive(true);assert(form.inert);assert(input.blurred);assert.equal(input.value,'A draft question');assert(voice.close.focused);
voice.setActive(false);requests.shift()({SiriWave:Wave});await first;assert.equal(created,0,'Late shader loading cannot reopen a closed dock');assert(!form.inert);
const next=voice.setActive(true);requests.shift()({SiriWave:Wave});await next;assert.equal(created,1);voice.sync({paused:true,sound:false,phase:'paused'});assert.equal(voice.mic.attributes['aria-pressed'],'false');assert.equal(voice.sound.attributes['aria-pressed'],'false');assert(voice.stop.hidden);assert.equal(phases.at(-1),'paused');assert(voice.mic.innerHTML.includes('voice-off-slash'));assert(voice.sound.innerHTML.includes('voice-off-slash'));voice.sync({paused:false,sound:true,phase:'speaking'});assert.equal(voice.stop.hidden,false,'Voice mode exposes a stop control while the answer is being read');assert(!voice.mic.innerHTML.includes('voice-off-slash'));assert(!voice.sound.innerHTML.includes('voice-off-slash'));
voice.mic.onclick();voice.stop.onclick();voice.sound.onclick();voice.close.onclick();assert.deepEqual(actions,['mic','stop','sound','close']);
voice.setActive(false);assert.equal(destroyed,1);assert.equal(input.value,'A draft question');assert.equal(compact.at(-1),false);voice.destroy();assert(voice.el.removed);
console.log('Voice dock passed: compact controls, independent toggles, phase updates, preserved draft, stale-load cancellation and renderer cleanup.');
