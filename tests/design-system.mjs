import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyDesignSettings,normalizeDesignSettings,initDesignSystem} from '../dist/design-system.js';

const defaults=normalizeDesignSettings();
assert.equal(Object.keys(defaults).length,6);assert.equal(defaults.headingWeight,'regular');assert.equal(defaults.bodyWeight,'regular');assert(Object.entries(defaults).filter(([key])=>!['headingWeight','bodyWeight'].includes(key)).every(([,value])=>value==='medium'));
for(const size of ['small','medium','large']){
 const input=Object.fromEntries(Object.keys(defaults).filter(key=>!['headingWeight','bodyWeight'].includes(key)).map(key=>[key,size]));input.headingWeight='bold';input.bodyWeight='thin';const root={dataset:{}};
 assert.deepEqual(applyDesignSettings(root,input),input);assert.deepEqual(root.dataset,input,'All six choices map to their CSS preset attributes');
}
assert.deepEqual(normalizeDesignSettings(null),defaults);assert.deepEqual(normalizeDesignSettings({typeSize:'giant',headingWeight:'heavy',bodyWeight:900}),defaults);assert.deepEqual(normalizeDesignSettings({typeWeight:'large'}),{...defaults,headingWeight:'bold',bodyWeight:'bold'},'Prior shared weight settings migrate into both new controls');
const root={dataset:{}},selects=Object.keys(defaults).map(key=>({dataset:{designControl:key},value:''}));
let inserted,stored=JSON.stringify({typeSize:'small',spaceSize:'large'}),allowed=true,changes=0;
globalThis.document={documentElement:root,createElement:()=>({className:'',innerHTML:'',querySelectorAll:()=>selects})};
globalThis.localStorage={getItem:()=>stored,setItem:(key,value)=>{assert.equal(key,'prem-design-system');stored=value;}};
const panel={querySelector:selector=>selector==='[data-settings-slot="design-system"]'?null:{after:element=>inserted=element}};
initDesignSystem(panel,{canChange:()=>allowed,onChange:()=>changes++});
assert(inserted.innerHTML.includes('Type and spacing'));assert(inserted.innerHTML.includes('Header weight'));assert(inserted.innerHTML.includes('Body weight'));assert(inserted.innerHTML.includes('Bold (500)'));assert.equal((inserted.innerHTML.match(/<option /g)||[]).length,18,'Every typography and spacing knob offers three options');
assert.equal(root.dataset.typeSize,'small');assert.equal(root.dataset.spaceSize,'large');assert.equal(root.dataset.typeLeading,'medium');assert.equal(root.dataset.headingWeight,'regular');assert.equal(root.dataset.bodyWeight,'regular');
selects[2].value='bold';selects[2].onchange();assert.equal(root.dataset.headingWeight,'bold');assert.equal(root.dataset.bodyWeight,'regular');assert.equal(JSON.parse(stored).headingWeight,'bold');assert.equal(changes,1,'Header weight can change independently of body weight');
selects[3].value='thin';selects[3].onchange();assert.equal(root.dataset.bodyWeight,'thin');assert.equal(root.dataset.headingWeight,'bold');assert.equal(JSON.parse(stored).bodyWeight,'thin');
allowed=false;selects[0].value='large';selects[0].onchange();assert.equal(selects[0].value,'small');assert.equal(root.dataset.typeSize,'small');assert.equal(changes,2,'Changing layout metrics mid-transition is blocked without remounting content');
stored='invalid json';allowed=true;initDesignSystem(panel);assert.deepEqual(root.dataset,defaults,'Damaged storage restores balanced presets');
let slotted;initDesignSystem({querySelector:selector=>selector==='[data-settings-slot="design-system"]'?{append:element=>slotted=element}:null});
assert(slotted?.innerHTML.includes('Type and spacing'),'Design system controls mount inside their matching feature section.');
const css=await readFile(new URL('../dist/design-system.css',import.meta.url),'utf8');assert(css.includes(':root[data-heading-weight="thin"]{--font-weight-heading:300}')&&css.includes(':root[data-heading-weight="bold"]{--font-weight-heading:500}')&&css.includes(':root[data-body-weight="thin"]{--font-weight-body:300}')&&css.includes(':root[data-body-weight="bold"]{--font-weight-body:500}'),'Header and body weight choices map independently to 300, 400 and 500');
console.log('Design system passed: independent typography weights, persistence, migration, defaults, invalid values and motion-safe updates.');
