import assert from 'node:assert/strict';
import {commitThemeChange} from '../dist/theme-change.js';

const classes=new Set(),events=[];
const root={dataset:{theme:'light'},classList:{add(name){classes.add(name);events.push('pause');},remove(name){classes.delete(name);events.push('resume');}},get offsetWidth(){assert(classes.has('theme-changing'));events.push('commit');return 1440;}};
for(const theme of ['dark','light','dark']){
 events.length=0;
 commitThemeChange(root,()=>{assert(classes.has('theme-changing'));root.dataset.theme=theme;events.push('tokens and controls');});
 assert.deepEqual(events,['pause','tokens and controls','commit','resume'],'Palette and selected control styles commit while hover transitions are paused');
 assert.equal(root.dataset.theme,theme);assert.equal(classes.size,0,'Normal hover transitions resume synchronously, with no lingering suppression timer');
}
assert.throws(()=>commitThemeChange(root,()=>{throw Error('failed update');}));assert.equal(classes.size,0,'Failure cannot leave hover transitions disabled');
console.log('Theme change passed: atomic palette/control commit, rapid reversals and transition cleanup.');
