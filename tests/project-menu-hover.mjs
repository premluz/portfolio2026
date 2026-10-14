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
for(const geometry of [rows,[{top:0,height:31},{top:95,height:72}]]){
 const handlers=new Map(),writes=[],hovered=[];
 const items=geometry.map(row=>({getBoundingClientRect:()=>({top:100+row.top,height:row.height})}));
 const list={dataset:{},scrollTop:0,scrollHeight:300,style:{setProperty:(...args)=>writes.push(args),removeProperty(){}},getBoundingClientRect:()=>({top:100}),querySelectorAll:()=>items,addEventListener:(name,fn)=>handlers.set(name,fn),removeEventListener:name=>handlers.delete(name)};
 const dispose=installProjectMenuHover(list,{onHover:row=>hovered.push(row)});
 const move=y=>handlers.get('pointermove')({pointerType:'mouse',clientY:100+y});
 move(geometry[0].top+geometry[0].height/2);
 const initialWrites=writes.length;
 for(let offset=-5;offset<=5;offset++)move(geometry[0].top+geometry[0].height/2+offset);
 assert.equal(writes.length,initialWrites,'Movement within the same row does not rewrite styles');
 assert.deepEqual(hovered,[items[0]],'Movement within the same row does not reposition its preview');
 move(geometry[1].top+geometry[1].height/2);
 assert.equal(hovered.at(-1),items[1],'Crossing rows still updates the preview');
 handlers.get('keydown')();move(geometry[1].top+geometry[1].height/2);
 assert.equal(hovered.length,3,'Keyboard cleanup allows pointer hover to resume on the same row');
 const beforeScroll=writes.length;list.scrollTop=15;handlers.get('scroll')();
 assert(writes.length>beforeScroll,'Changed scroll geometry still updates the highlight');
 dispose();
}
console.log('Project menu hover passed: continuous pointer follow, magnetic row snap, touch safety and cleanup.');
