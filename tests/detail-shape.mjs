import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {detailShape,DETAIL_WIDE_MIN_RATIO,DETAIL_TALL_MAX_RATIO,DETAIL_RATIO_ATTRIBUTE} from '../dist/detail-shape.js';
import {cardDetail} from '../dist/card-renderer.js';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');

// Shapes at, either side of, and far from each threshold, so no single sample sets the rule.
for(const [ratio,shape] of [[0.46,'tall'],[0.75,'tall'],[0.7999,'tall'],[0.8,'square'],[1,'square'],[1.1999,'square'],[1.2,'wide'],[1.6,'wide'],[2.33,'wide']])assert.equal(detailShape(ratio),shape,`ratio ${ratio}`);
for(const missing of [null,undefined,NaN,0,-1,Infinity])assert.equal(detailShape(missing),'square','No usable ratio keeps the even split');

// A project page carries its shape, and a text-only page still renders without one failing.
const project=(cardRatio,extra={})=>({id:'p',title:'P',name:'P',bg:'#fff',cardAspect:'landscape',image:'assets/p.png',imageAlt:'P',cardRatio,...extra});
for(const [ratio,shape] of [[0.46,'tall'],[1,'square'],[1.6,'wide'],[2.33,'wide']])assert(cardDetail(project(ratio)).includes(`data-detail-shape="${shape}"`),`Markup carries ${shape} for ${ratio}`);
assert(cardDetail(project(null,{image:undefined,imageAlt:undefined})).includes('data-detail-shape="square"'),'A text-only page renders with the neutral shape');
assert(cardDetail(project(1.6,{cardAspect:'portrait'})).includes('data-card-orientation="portrait"'),'The shape never rewrites an authored orientation');

// The CSS twins of the thresholds.
const tokens=await read('tokens.css');
const token=name=>Number(tokens.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s*;`))?.[1]);
assert.equal(token('detail-wide-min-ratio'),DETAIL_WIDE_MIN_RATIO,'Wide threshold token equals the module');
assert.equal(token('detail-tall-max-ratio'),DETAIL_TALL_MAX_RATIO,'Tall threshold token equals the module');
assert(/--detail-tall-media-cap-narrow:\s*70svh;/.test(tokens),'Narrow tall cap is 70svh');

// The rules apply only with the setting on, only above 750px for the two-column and across-the-rail shapes, and never use literal sizes.
const css=await read('detail-shape.css'),setting=`html[data-${DETAIL_RATIO_ATTRIBUTE.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="on"]`;
const rules=css.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').filter(line=>line.includes('{')&&!line.startsWith('@media'));
assert(rules.length>10&&rules.every(line=>line.startsWith(setting)),'Every rule is keyed on the setting');
// Breakpoints stay literal, as in every stylesheet; only declarations are held to tokens.
assert(!/\d+px|\d+svh|\d+vh/.test(rules.join('\n')),'Sizes come from tokens');
const wide750=css.slice(css.indexOf('@media(min-width:751px)'));
for(const shape of ['wide','tall','square'])assert(wide750.includes(`data-detail-shape="${shape}"`),`${shape} has a wide-screen layout`);
assert(css.includes('position:sticky'),'The tall image is sticky');
assert(css.includes('aspect-ratio:var(--image-source-ratio'),'Every shape keeps the hero ratio, so the card-to-page handoff ends on the ratio it started with');
assert(!css.slice(0,css.indexOf('@media(min-width:751px)')).includes('position:sticky'),'Narrow screens do not stick the image');
assert((await read('../scripts/client-styles.mjs')).includes("'detail-shape.css'"),'The stylesheet is in the bundle');

// The setting is off by default, persisted, and exported.
assert.equal(DEFAULT_STORAGE_VALUES['prem-detail-ratio-layout'],'false','Off by default');
assert((await read('settings-transfer.js')).includes("detailRatioLayout:'prem-detail-ratio-layout'"),'Exported with the other settings');
assert((await read('index.html')).includes('id="detailRatioLayout"'),'The developer panel has the control');
assert((await read('app.js')).includes("dataset.detailRatioLayout="),'app.js sets the attribute the CSS reads');

console.log('Detail shape passed: thresholds, markup attribute, token twins, setting-gated CSS, default off and export.');
