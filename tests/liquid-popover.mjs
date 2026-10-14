import assert from 'node:assert/strict';
import {DockMorph,dockGeometry,popoverGeometry} from '../dist/dock-morph.js';
import {LiquidPopover} from '../dist/liquid-popover.js';
import {handleEscapeKey} from '../dist/escape-key.js';

for(const metrics of [{main:252,context:120,height:48,gap:12,radius:24},{main:180,context:106,height:48,gap:8,radius:0}]){
 for(let i=0;i<=200;i++){
  const shape=dockGeometry(1,metrics,{position:i/200,left:-30,width:288,height:430});
  assert(!/NaN|Infinity|undefined/.test(shape.path));
  if(shape.popover.connected)assert.equal((shape.path.match(/M /g)||[]).length,2,'The panel and arrow menu share one outline while attached');
 }
 const middle=popoverGeometry(.6),end=dockGeometry(1,metrics,{position:1,width:288,height:430,left:-30});
 assert(middle.connected&&middle.neck>0,'A stretched neck is visible before separation');
 assert.equal(end.popover.neck,0);assert.equal(end.popover.reveal,1);
 assert.equal((end.path.match(/M /g)||[]).length,3,'Panel separates from context and main navigation');
 assert.equal(end.popover.height,430);
}

// Site settings must sprout from the main surface, even with no arrow lobe.
for(const phase of [0,.35,.65,1])for(let i=0;i<=200;i++){
 const shape=dockGeometry(phase,{main:284,context:120,height:48,gap:12,radius:24},{anchor:'main',position:i/200,left:-16,width:330,height:216});
 assert(shape.popover,'Main popover exists on both home and details');
 assert(!/NaN|Infinity|undefined/.test(shape.path));
 if(phase===0&&shape.popover.connected)assert.equal((shape.path.match(/M /g)||[]).length,1,'Settings grows from the actual main perimeter');
}
const separated=dockGeometry(0,undefined,{anchor:'main',position:1,width:330,height:216,left:-30});
assert.equal((separated.path.match(/M /g)||[]).length,2);

let now=0,id=0,reduced=false;const frames=new Map(),listeners=new Map();
globalThis.performance={now:()=>now};globalThis.innerWidth=390;
globalThis.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.addEventListener=(type,fn)=>{const handlers=listeners.get(type)||[];handlers.push(fn);listeners.set(type,handlers);};
globalThis.removeEventListener=()=>{};
const node=()=>({style:{setProperty(key,value){this[key]=value;}},children:[],attrs:{},classList:{add(){},toggle(){}},setAttribute(key,value){this.attrs[key]=value;},append(...nodes){this.children.push(...nodes);},remove(){},contains(target){return target===this||this.children.includes(target);},focus(){document.activeElement=this;}});
globalThis.document={createElement:node,createElementNS:node,activeElement:null};
globalThis.getComputedStyle=()=>({getPropertyValue:()=>''});
const context=node(),main=node(),el=node();el.querySelector=s=>s==='.context-nav'?context:s==='nav'?main:null;el.prepend=(...children)=>el.children.unshift(...children);el.getBoundingClientRect=()=>({left:3,top:580});
const dock=new DockMorph(el,{reduced:()=>reduced});dock.setSplit(true,{immediate:true});
const menu=node(),toggle=node(),buttons=[node(),node(),node()];menu.id='projectMenu';menu.hidden=true;menu.scrollHeight=620;menu.children=buttons;menu.querySelectorAll=()=>buttons;menu.querySelector=s=>s==='.active'?buttons[1]:buttons[0];
const popup=new LiquidPopover(dock,menu,toggle,{reduced:()=>reduced});
const step=(ms=16)=>{now+=ms;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));};
const finish=()=>{for(let i=0;frames.size&&i<200;i++)step();assert.equal(frames.size,0,'No animation work runs after settling');};
// RAF timestamps can equal (or precede) performance.now() at scheduling.
// A zero-time first frame must not latch the content into display:none.
for(const firstFrame of [0,-1]){
 popup.setOpen(true);popup.resize();step(firstFrame);finish();
 assert(!menu.hidden,'A zero-time opening frame must still reveal menu content');
 assert.equal(menu.style.opacity,'1');assert(!menu.inert);
 popup.setOpen(false);finish();
}

for(const elapsed of [32,96,192,304]){
 popup.setOpen(true);for(let t=0;t<elapsed;t+=16)step();
 const {position,velocity}=popup;const before=dock.path.attrs.d;
 popup.keys({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(popup.position,position,'Escape preserves the current silhouette');assert.equal(popup.velocity,velocity,'Escape preserves physical velocity');assert.equal(dock.path.attrs.d,before,'Reversal never teleports the outline');
 assert(!menu.hidden,'Closing content remains mounted while glass merges back');finish();assert(menu.hidden);assert(menu.inert);assert.equal(dock.popover,null);
}
popup.setOpen(true);finish();popup.setOpen(false,{restoreFocus:false});
let backs=0;const escapeWhileClosing={key:'Escape',defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){throw Error('A closing popup must not swallow Escape');}};
popup.keys(escapeWhileClosing);handleEscapeKey(escapeWhileClosing,()=>backs++);
assert.equal(backs,1,'After choosing a project, Escape passes through the closing popup to page navigation.');finish();
popup.setOpen(true);finish();assert.equal(popup.position,1);assert.equal(menu.style.height,'550px','Tall menus fit above the dock and scroll');assert(!menu.inert);assert.equal(document.activeElement,buttons[1]);
document.getElementById=()=>({getBoundingClientRect:()=>({height:120})});popup.measure();assert.equal(menu.style.height,'550px','Overlay notifications never shrink the open menu');
assert.equal(el.children.length,3,'Popover reuses dock glass instead of layering another skin underneath');
assert.match(dock.glass.style.clipPath,/url\(#dock-liquid-popover-clip\)/);
assert.equal(menu.style.opacity,'1');
popup.keys({key:'ArrowDown',target:buttons[1],preventDefault(){}});assert.equal(document.activeElement,buttons[2]);
popup.outside({target:node()});finish();assert(menu.hidden);assert.equal(toggle.attrs['aria-expanded'],'false');
reduced=true;popup.setOpen(true);assert.equal(popup.position,1);assert.equal(frames.size,0);popup.setOpen(false);assert(menu.hidden);assert.equal(frames.size,0);
// Initial letters also work before the glass has finished opening.
buttons.forEach((button,index)=>button.querySelector=()=>({textContent:['Alpha','Beta','Bravo'][index]}));
reduced=false;popup.setOpen(true);document.activeElement=toggle;
const letter={key:'b',target:toggle,preventDefault(){}};popup.keys(letter);assert.equal(popup.pendingKeyFocus,buttons[1]);popup.keys(letter);assert.equal(popup.pendingKeyFocus,buttons[2]);finish();assert.equal(document.activeElement,buttons[2]);
popup.setOpen(false);finish();popup.setOpen(true);document.activeElement=toggle;popup.keys({key:'ArrowUp',target:toggle,preventDefault(){}});assert.equal(popup.pendingKeyFocus,buttons[2]);finish();assert.equal(document.activeElement,buttons[2]);popup.setOpen(false);finish();
popup.destroy();
main.getBoundingClientRect=()=>({left:135});
const settingsMenu=node(),settingsToggle=node();settingsMenu.id='siteSettings';settingsMenu.scrollHeight=216;settingsMenu.querySelector=()=>buttons[0];settingsMenu.querySelectorAll=()=>buttons;settingsMenu.children=buttons;
reduced=false;dock.setSplit(false,{immediate:true});
const settings=new LiquidPopover(dock,settingsMenu,settingsToggle,{anchor:'main',onOpen:()=>popup.setOpen(false,{immediate:true,restoreFocus:false})});
for(const firstFrame of [0,-1,16]){
 settings.setOpen(true);settings.resize();step(firstFrame);assert.equal(dock.popover.anchor,'main');finish();
 assert(!settingsMenu.hidden,'Settings content remains visible after an early frame');assert.equal(settingsMenu.style.opacity,'1');assert(!settingsMenu.inert);
 settings.setOpen(false,{immediate:true});
}
settings.setOpen(true);step(96);settings.setOpen(false);step(16);settings.setOpen(true);finish();
assert(!settingsMenu.hidden,'A quick close/reopen reveals content');assert.equal(settingsMenu.style.opacity,'1');
settings.setOpen(false,{immediate:true});assert(settingsMenu.hidden);assert.equal(frames.size,0,'Popover switching cancels the old spring');
const composerToggle=node();composerToggle.getBoundingClientRect=()=>({left:28,width:36});
settings.setTrigger(composerToggle);settings.anchor='main-start';settings.setOpen(true,{immediate:true});
settings.outside({target:composerToggle});assert.equal(settings.target,1,'Pointerdown on the current composer trigger must not close the menu before its click toggles it');
settings.setOpen(!settings.target,{immediate:true});assert.equal(settings.target,0,'The second menu click closes, rather than reopening after an outside dismissal');
settings.setOpen(true,{immediate:true});
settings.outside({target:buttons[0]});assert.equal(settings.target,1,'Menu controls keep the menu open');
document.activeElement=buttons.at(-1);settings.keys({key:'Tab',target:buttons.at(-1),preventDefault(){}});
assert.equal(document.activeElement,buttons[0]);assert.equal(settings.target,1,'Tab cycles controls without closing the persistent menu');
document.querySelector=()=>({open:true});settings.outside({target:node()});assert.equal(settings.target,1,'The site guide can be used without dismissing the menu behind it');
settings.keys({key:'Escape',preventDefault(){throw Error('Modal Escape belongs to the guide');}});assert.equal(settings.target,1);
document.querySelector=()=>null;
assert.equal(dock.popover.anchor,'main');assert.equal(dock.popover.rootX,43);
settings.setOpen(false,{immediate:true});
globalThis.innerWidth=1200;
el.getBoundingClientRect=()=>({left:300,top:580});
main.getBoundingClientRect=()=>({left:300});
composerToggle.getBoundingClientRect=()=>({left:310,width:36});
dock.setComposer(true,{immediate:true});
settings.setOpen(true,{immediate:true});
assert.equal(dock.metrics.main,520,'Composer caps at 520px on wide screens.');
assert.equal(settings.metrics.width,520,'Index matches the composer width.');
assert.equal(settings.metrics.left,0,'Index sits directly above the composer.');
assert.equal(settings.metrics.rootX,28,'Liquid neck still grows from the menu button.');
settings.setOpen(false,{immediate:true});
// A menu can grow during the action row's recession without dropping its glass.
dock.setAccessory({anchor:'main',position:1,width:240,height:48,left:140,gap:12,radius:24,split:1,splitAts:[.3,.55]});
settings.beforeOpen=()=>{dock.setAccessory({...dock.accessory,position:.8});};settings.setOpen(true);await Promise.resolve();assert.equal(settings.target,1,'A synchronous preparation hook starts menu and row motion together');assert(dock.accessory&&dock.popover);assert(dock.path.attrs.d.includes(dockGeometry(dock.position,dock.metrics,dock.accessory).path),'Receding contextual glass remains rendered while the menu grows');finish();dock.setAccessory(null);settings.setOpen(false,{immediate:true});
let releaseOpening,closedCalls=0;settings.beforeOpen=()=>new Promise(resolve=>releaseOpening=resolve);settings.onClosed=()=>closedCalls++;
settings.setOpen(true);assert(settings.opening);assert(settings.active);assert(settingsMenu.hidden,'Menu content waits until contextual buttons have merged');
settings.keys({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert(!settings.opening);assert.equal(closedCalls,1);releaseOpening();await Promise.resolve();assert.equal(settings.target,0,'A late context-close promise cannot reopen an escaped menu');
settings.setOpen(true);releaseOpening();await Promise.resolve();finish();assert.equal(settings.position,1);settings.setOpen(false);finish();assert.equal(closedCalls,2,'The contextual row returns only after the menu outline has closed');
settings.destroy();dock.destroy();
console.log('Liquid popover passed: shared outline, neck split/merge, reversible Escape, focus, outside dismissal, viewport fit, reduced motion and idle cleanup.');
