import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {clientStyles} from '../scripts/client-styles.mjs';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const tokens=await read('tokens.css'),css=await read('type-floor.css'),rules=css.replace(/\/\*[\s\S]*?\*\//g,'');
const token=(name,text=tokens)=>text.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();

// The Medium twin: the default --type-scale is Medium, so the reading size is 16px there and scales with the steps.
assert.equal(token('type-scale-medium'),token('type-scale'),'--type-scale-medium equals the default --type-scale');
assert.equal(token('type-floor-min'),'12px');assert.equal(token('type-floor-reading'),'16px');assert.equal(token('type-floor-reading-min'),'13px','The reading floor matches the body floor');
const scale=Number(token('type-scale')),readerScale=Number(token('reader-text-scale'));
const reading=(typeScale,reader=readerScale)=>Math.max(13,16*typeScale/scale*reader);
assert.equal(Math.round(reading(scale)*100)/100,16,'Reading text is 16px at Medium');
assert(reading(.82)<16&&reading(1)>16,'It still follows the Text size steps');
const caption=typeScale=>Math.max(12,11*typeScale),note=typeScale=>Math.max(12,12*typeScale);
for(const typeScale of [.82,scale,1])assert(caption(typeScale)>=12&&note(typeScale)>=12,`Captions and notes are at least 12px at scale ${typeScale}`);

// Every rule is keyed on the setting; sizes come from tokens; the stack leads with system-ui; figures are tabular.
const blocks=rules.match(/[^{}]+\{[^}]*\}/g)||[];
assert(blocks.length>=2&&blocks.every(block=>block.trim().startsWith('html[data-type-floor="on"]')),'Every rule is gated on the attribute');
assert(/--font-family-sans:system-ui,/.test(rules),'system-ui leads the sans stack');
assert(rules.includes('font-variant-numeric:tabular-nums'),'Tabular figures are set');
for(const selector of ['.detail-caption-lead','.home-about-years','.content-metric','time'])assert(rules.includes(selector),`${selector} gets tabular figures`);
assert(!/(?<![\w.-])\d+px/.test(rules.replace(/--font-family-sans:[^;]*;/,'').replace(/calc\(\d+px \*/g,'')),'No other literal sizes except the 11px and 12px scale bases');
const order=clientStyles;assert(order.indexOf('type-floor.css')>order.indexOf('design-system.css')&&order.indexOf('type-floor.css')>order.indexOf('tokens.css'),'It loads after the tokens and the type presets so it wins');

// Off by default, persisted, exported, in the panel, and applied by app.js.
assert.equal(DEFAULT_STORAGE_VALUES['prem-type-floor'],'false','Off by default');
assert((await read('settings-transfer.js')).includes("typeFloor:'prem-type-floor'"),'Exported with the other settings');
assert((await read('index.html')).includes('id="typeFloor"'),'The developer panel has the control');
assert((await read('app.js')).includes('dataset.typeFloor='),'app.js sets the attribute the CSS reads');

console.log('Type floor passed: Medium twin, 16px reading and 12px floors across the steps, setting-gated rules, tokens only, default off and export.');
