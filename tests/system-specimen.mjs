import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {clientStyles} from '../scripts/client-styles.mjs';
import {systemMarkup,SPECIMEN_PROJECTS,SPECIMEN_BLOCKS,SPECIMEN_ROUTE} from '../dist/system-specimen.js';
import {card,cardDetail} from '../dist/card-renderer.js';
import {cardIds} from '../dist/documents.js';
import {isDevMode} from '../dist/dev-mode.js';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const html=systemMarkup();
const items=[...html.matchAll(/data-specimen-item="([^"]+)"/g)].map(match=>match[1]);

// One item per component: every card fixture, every project page except the title-only one, and every block.
assert.deepEqual(items.filter(item=>item.startsWith('card:')),SPECIMEN_PROJECTS.map(p=>`card:${p.id}`),'A card per fixture');
assert.deepEqual(items.filter(item=>item.startsWith('page:')),SPECIMEN_PROJECTS.filter(p=>p.id!=='specimen-bare').map(p=>`page:${p.id}`),'A project page per fixture with a body');
assert.deepEqual(items.filter(item=>item.startsWith('block:')),SPECIMEN_BLOCKS.map(block=>`block:${block.id}`),'A page block per fixture');
assert.equal(new Set(items).size,items.length,'Item ids are unique, so each can carry its own baseline');

// The media are exact ratios: 0.46 and 2.33 are the brief's extremes, and each SVG really has the ratio its fixture claims.
for(const [name,expected] of [['tall',0.46],['wide',2.33],['square',1],['landscape',1.6]]){
 const svg=await read(`assets/specimen/${name}.svg`),width=Number(svg.match(/<svg[^>]* width="(\d+)"/)[1]),height=Number(svg.match(/<svg[^>]* height="(\d+)"/)[1]);
 assert(Math.abs(width/height-expected)<0.005,`${name}.svg is ratio ${expected}`);
}
const byId=Object.fromEntries(SPECIMEN_PROJECTS.map(p=>[p.id,p]));
assert.equal(byId['specimen-tall'].cardRatio.toFixed(2),'0.46');assert.equal(byId['specimen-wide'].cardRatio.toFixed(2),'2.33');
assert.equal(byId['specimen-tall'].cardAspect,'portrait','A tall fixture is portrait; the rest are landscape');
assert(!('image' in byId['specimen-text'])&&!('image' in byId['specimen-bare']),'The text-only and bare fixtures have no media');

// Worst-case content renders, and project pages pick their shape from the ratio (WP-05).
for(const id of ['specimen-tall','specimen-wide','specimen-square','specimen-long'])assert(html.includes(`data-card-orientation="${byId[id].cardAspect}"`),`${id} card carries its orientation`);
const shapeOf=id=>cardDetail(byId[id],'regular',{headingBesideImage:false}).match(/data-detail-shape="(\w+)"/)[1];
assert.deepEqual(['specimen-tall','specimen-wide','specimen-square','specimen-text'].map(shapeOf),['tall','wide','square','square'],'Each project page gets its shape from its hero ratio');
assert(html.includes('Supercalifragilisticexpialidocious_unbreakable_identifier'),'The unbroken string is rendered');
assert(html.includes('1,234,567,890%'),'The huge metric is rendered');
assert(html.includes('data-text-only')||html.includes('text-only-card'),'A text-only card renders');
for(const bare of ['specimen-bare'])assert.doesNotThrow(()=>card(byId[bare],0,'regular'),'A card with only a title renders');

// Everything is escaped: a hostile fixture never becomes markup.
const hostile={...byId['specimen-long'],id:'specimen-hostile',title:'<img src=x onerror=alert(1)>',client:'"><script>x</script>',summary:'<b>bold</b>'};
for(const markup of [card(hostile,0,'regular'),cardDetail(hostile,'regular',{})]){assert(!/<img src=x|<script>x|<b>bold/.test(markup),'Hostile text is escaped');assert(markup.includes('&lt;'),'and shown as text');}

// No fixture is a real project or a link, so nothing here can open a page, be cited or be indexed.
assert(SPECIMEN_PROJECTS.every(p=>p.id.startsWith('specimen-')&&!cardIds.includes(p.id)),'Fixture ids are prefixed and never real documents');
assert(!/<a\s[^>]*href=/.test(html.replace(/<a[^>]*download[^>]*>/g,'')),'The specimen has no links');

// The route exists only in developer mode, in both places that read the hash.
assert.equal(SPECIMEN_ROUTE,'system');assert.equal(isDevMode('?dev=1'),true);assert.equal(isDevMode(''),false);
const app=await read('app.js');
assert(app.includes("route===SPECIMEN_ROUTE&&isDevMode(location.search)"),'render() draws the specimen only in developer mode');
assert(/function isRoute\(route\)\{[^}]*route===SPECIMEN_ROUTE&&isDevMode\(location\.search\)/.test(app),'isRoute() accepts it only in developer mode');
assert(!(await read('index.html')).includes('#system'),'Nothing links to it');

// Its stylesheet is in the bundle, uses defined tokens, and holds no literal sizes except the card width token.
const css=await read('system-specimen.css'),tokens=await read('tokens.css'),content=await read('content-widths.css');
assert(clientStyles.includes('system-specimen.css'),'The stylesheet is in the bundle');
for(const [,name] of css.matchAll(/var\(--([a-z0-9-]+)\)/g))if(!name.startsWith('system-'))assert(new RegExp(`--${name}\\s*:`).test(tokens+content),`--${name} is defined`);
assert(!/(?<![\w.-])\d+(?:\.\d+)?(px|rem|em|vw|vh)\b/.test(css.replace(/:root\{[^}]*\}/,'')),'No literal sizes outside the :root tokens');

console.log(`System specimen passed: ${items.length} components, exact ratios 0.46 to 2.33, shapes, worst-case and hostile content, no links, developer mode only.`);
