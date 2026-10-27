import assert from 'node:assert/strict';
import {LAB_DEFAULTS,normaliseLabSettings,readLabSettings,mountLabSettings} from '../dist/lab-settings.js';

assert.deepEqual(LAB_DEFAULTS,{layout:'masonry',columns:4,featuredLarger:false,cardDetails:true,fullWidth:false},'The Lab is a four-column masonry grid with equal-width cards and details shown');
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
assert.deepEqual(readLabSettings(storage),LAB_DEFAULTS,'Nothing saved reads as the defaults');
assert.deepEqual(normaliseLabSettings({layout:'alternating',columns:'7',featuredLarger:'yes',cardDetails:'false',fullWidth:'true'}),{layout:'masonry',columns:4,featuredLarger:false,cardDetails:false,fullWidth:true},'Unknown values fall back, saved flags are read');
const control=type=>({type,value:'',checked:false,onchange:null});
const controls={labLayout:control('select-one'),labColumns:control('select-one'),labFeaturedLarger:control('checkbox'),labCardDetails:control('checkbox'),labFullWidth:control('checkbox')};
const root={querySelector:selector=>controls[selector.slice(1)]};const changes=[];
const state=mountLabSettings(root,{storage,onChange:value=>changes.push({...value})});
assert.equal(controls.labLayout.value,'masonry');assert.equal(controls.labColumns.value,'4');assert.equal(controls.labCardDetails.checked,true);
controls.labCardDetails.checked=false;controls.labCardDetails.onchange();
assert.equal(state.cardDetails,false);assert.equal(values.get('prem-lab-card-details'),'false','The Lab override is saved');
controls.labColumns.value='3';controls.labColumns.onchange();assert.equal(state.columns,3);assert.equal(values.get('prem-lab-columns'),'3');
controls.labFullWidth.checked=true;controls.labFullWidth.onchange();assert.equal(state.fullWidth,true);assert.equal(values.get('prem-lab-full-width'),'true','Lab full width is saved');
assert.equal(changes.length,3,'Each change notifies the app once');
console.log('Lab settings passed: defaults, normalising, saving and change notices.');
