import assert from 'node:assert/strict';
import {CONTROL_STYLES,CONTROL_GROUPS,readControlPreferences,resolveControlStyle,seedControlPreferences} from '../dist/control-preferences.js';

const memory=initial=>{const values=new Map(Object.entries(initial));return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
for(const [legacy,expected,cards] of [
 [{'prem-plain-nav':'true','prem-glass-style':'true'},'ghost','true'],
 [{'prem-plain-nav':'false','prem-glass-style':'false'},'outline','false'],
 [{},'glass','true']
]){
 const storage=memory(legacy);
 assert.equal(readControlPreferences(storage).style,expected);
 seedControlPreferences(storage);
 assert.equal(storage.getItem('prem-control-style'),expected,'The legacy style is migrated once');
 assert.equal(storage.getItem('prem-card-glass-style'),cards,'Card glass migrates independently');
 storage.setItem('prem-control-style','outline');
 seedControlPreferences(storage);
 assert.equal(readControlPreferences(storage).style,'outline','Later explicit choices survive old flags');
}
for(const style of CONTROL_STYLES){
 assert.equal(resolveControlStyle(style),style);
 assert.equal(resolveControlStyle(style,'outline'),'outline');
 assert.equal(resolveControlStyle(style,'outline','ghost'),'ghost','An element or enclosing group wins over the saved group override');
 assert.equal(resolveControlStyle(style,'inherit','inherit'),style);
}
const grouped=readControlPreferences(memory({'prem-control-style':'ghost','prem-control-style-navigation':'glass','prem-control-style-suggestions':'outline'}));
assert.throws(()=>resolveControlStyle('invalid'),/Invalid global control style/);
assert.throws(()=>resolveControlStyle('glass','invalid'),/Invalid group control style/);
assert.throws(()=>resolveControlStyle('glass','inherit','invalid'),/Invalid local control style/);
assert.equal(grouped.groups.navigation,'glass');
assert.equal(grouped.groups.suggestions,'outline');
for(const group of CONTROL_GROUPS.filter(group=>!['navigation','suggestions'].includes(group)))assert.equal(grouped.groups[group],'inherit');
const warnings=[],previousWarn=console.warn;
try{
 console.warn=(...args)=>warnings.push(args);
 assert.equal(readControlPreferences(memory({'prem-control-style':'invalid'})).style,'glass');
 assert.equal(readControlPreferences({getItem(){throw Error('blocked');}}).style,'glass');
}finally{console.warn=previousWarn;}
assert.equal(warnings.length,2,'Invalid and unavailable storage report their fallback');
console.log('Control preferences passed: contrasting legacy profiles, independent cards, explicit choices, group/element precedence, inheritance and reported storage failures.');
