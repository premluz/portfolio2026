import assert from 'node:assert/strict';
import {installHoverTrail} from '../dist/hover-trail.js';

let next=0,reduced=false;const timers=new Map();
globalThis.setTimeout=(fn,delay)=>{timers.set(++next,{fn,delay});return next;};
globalThis.clearTimeout=id=>timers.delete(id);
const listeners=new Map(),nodes=[];
const root={contains:node=>nodes.includes(node),addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
const node=()=>{const classes=new Set(),n={classes,closest:()=>n,contains:target=>target===n,classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}};nodes.push(n);return n;};
const first=node(),second=node(),third=node();
const cleanup=installHoverTrail(root,{reduced:()=>reduced});
const fire=(type,target,relatedTarget=null,pointerType='mouse')=>listeners.get(type)({target,relatedTarget,pointerType});
for(const n of nodes){fire('pointerover',n);fire('pointerout',n);}
assert(nodes.every(n=>n.classes.has('hover-trail')),'Rapid passes latch every visited row before a browser paint');
assert.equal(timers.size,3);assert([...timers.values()].every(t=>t.delay===32),'Only a short latch precedes the CSS fade');
fire('pointerover',second);assert.equal(timers.size,2,'Re-entry cancels an old exit rather than flashing off');
for(const [id,{fn}] of [...timers]){timers.delete(id);fn();}
assert(!first.classes.has('hover-trail'));assert(!third.classes.has('hover-trail'));assert(second.classes.has('hover-trail'));assert.equal(timers.size,0,'No idle animation or timer loop');
fire('pointerover',second,second);assert.equal(timers.size,0,'Moving over child content does not restart hover');
reduced=true;fire('pointerout',second);assert(!second.classes.has('hover-trail'));assert.equal(timers.size,0);
fire('pointerover',first,null,'touch');assert(!first.classes.has('hover-trail'),'Touch does not leave sticky hover');
reduced=false;fire('pointerover',third);fire('pointerout',third);cleanup();assert.equal(timers.size,0);assert.equal(listeners.size,0);assert(!third.classes.has('hover-trail'));
console.log('Hover trail passed: rapid sweeps, re-entry, child events, reduced motion, touch and idle cleanup.');
