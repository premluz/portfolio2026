import assert from 'node:assert/strict';
import {installProjectMenuHover,magneticHoverTarget} from '../dist/project-menu-hover.js';

const rows=[{top:20,height:40},{top:76,height:40},{top:132,height:40}];
const passing=magneticHoverTarget(82,rows);
assert.equal(passing.y,96,'The hover field stays aligned to the nearest item, including its edges');
const snapped=magneticHoverTarget(102,rows);
assert.equal(snapped.index,1);assert.equal(snapped.y,96);assert(snapped.snapped,'The field snaps to a row when the pointer reaches its centre');
assert.equal(magneticHoverTarget(10,rows).y,40,'The field snaps to the first item above the list');
for(let y=0;y<200;y++){const target=magneticHoverTarget(y,rows);assert.equal(target.y,rows[target.index].top+rows[target.index].height/2,'The field never floats between rows');}

const listeners=new Map(),properties=new Map(),dataset={};
const bounds={top:100,left:0,width:260,height:190};
const buttons=rows.map(row=>({getBoundingClientRect:()=>({top:bounds.top+row.top,height:row.height})}));
const root={dataset,scrollTop:0,scrollHeight:190,style:{setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key)},
 getBoundingClientRect:()=>bounds,querySelectorAll:()=>buttons,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
const cleanup=installProjectMenuHover(root);
listeners.get('pointermove')({pointerType:'mouse',clientY:140});
const first=properties.get('--project-menu-hover-y');
listeners.get('pointermove')({pointerType:'mouse',clientY:202});
assert.equal(properties.get('--project-menu-hover-y'),'76.00px','The indicator follows the cursor and snaps over the next row');
assert.notEqual(first,properties.get('--project-menu-hover-y'));
assert.equal(dataset.cursorTracking,'true');assert.equal(dataset.cursorSnap,'true');
listeners.get('pointermove')({pointerType:'touch',clientY:140});assert.equal(dataset.cursorTracking,'true','Touch does not replace hover state');
listeners.get('pointerleave')();assert.equal(dataset.cursorTracking,undefined,'Pointer leave fades the shared field');
cleanup();assert.equal(listeners.size,0);assert.equal(properties.size,0,'Cleanup removes pointer handlers and temporary styles');
console.log('Project menu hover passed: continuous pointer follow, magnetic row snap, touch safety and cleanup.');
