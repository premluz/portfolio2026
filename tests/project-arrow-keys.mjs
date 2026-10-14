import assert from 'node:assert/strict';
import {handleProjectArrowKey} from '../dist/project-arrow-keys.js';

const moved=[];
function key(key,options={}){
 let prevented=0;
 const event={key,target:{tagName:'MAIN'},preventDefault(){prevented++;},...options};
 return {event,prevented:()=>prevented};
}
for(const [name,direction] of [['ArrowLeft',-1],['ArrowRight',1]]){
 const sample=key(name);
 assert.equal(handleProjectArrowKey(sample.event,{move:value=>moved.push(value)}),true);
 assert.deepEqual(moved.splice(0),[direction]);assert.equal(sample.prevented(),1);
}
for(const sample of [
 key('ArrowLeft',{target:{tagName:'INPUT'}}),
 key('ArrowRight',{target:{tagName:'TEXTAREA'}}),
 key('ArrowLeft',{target:{tagName:'DIV',isContentEditable:true}}),
 key('ArrowRight',{altKey:true}),key('ArrowLeft',{ctrlKey:true}),key('ArrowRight',{metaKey:true}),
 key('ArrowLeft',{isComposing:true}),key('ArrowRight',{defaultPrevented:true}),key('ArrowDown')
]){
 assert.equal(handleProjectArrowKey(sample.event,{move:value=>moved.push(value)}),false);
 assert.equal(sample.prevented(),0);
}
const inactive=key('ArrowLeft');assert.equal(handleProjectArrowKey(inactive.event,{canNavigate:()=>false,move:value=>moved.push(value)}),false);
assert.deepEqual(moved,[],'Ignored input never navigates');

const app=await (await import('node:fs/promises')).readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes('handleProjectArrowKey(e,{canNavigate:()=>!busy&&(current===\'work\'||projectIds.includes(current))'), 'Keyboard navigation stays on Work and project detail routes');
assert(app.includes("id:direction<0?'project.previous':'project.next'"),'Left and right route through the existing arrow commands');
console.log('Project arrow keys passed: directional routing, form/editing safety, dialog/route guards and existing carousel commands.');
