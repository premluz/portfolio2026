import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {moduleGraph,modulePreloadTags,THREE_PATH} from '../scripts/module-graph.mjs';
import {CARD_WORLD_ARRANGEMENTS,CARD_WORLD_ROUTES,loadedCardWorlds} from '../dist/card-world-loader.js';
import {getDocument} from '../dist/documents.js';
import {cardDetail} from '../dist/card-renderer.js';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));

// First-load budget: measured 2026-11-10 after card worlds became a dynamic import (174 modules, 859,316 bytes), plus 5%.
const MEASURED_BYTES=859316,MEASURED_MODULES=174,HEADROOM=1.05;
const graph=await moduleGraph('app.js',dist);
assert.equal(graph.threeReachable,false,'three.js is not part of the first-load graph; a card world imports it on first use');
assert(graph.bytes<=Math.ceil(MEASURED_BYTES*HEADROOM),`First load is ${graph.bytes} bytes; budget ${Math.ceil(MEASURED_BYTES*HEADROOM)}. Load the new code by route, or raise the budget with the owner.`);
assert(graph.count<=Math.ceil(MEASURED_MODULES*HEADROOM),`First load is ${graph.count} modules`);
for(const file of ['card-world.js','card-spiral.js','card-sphere.js','card-world-mount.js'])assert(!graph.modules.some(m=>m.file===file),`${file} loads with its card world, not with the app`);
assert(graph.modules.every(m=>!m.file.startsWith('vendor/three/')),'No three.js file is statically reachable');

// The loader's names are the mount module's, and the routes it preloads for really render a card world.
const mount=await import('../dist/card-world-mount.js');
assert.deepEqual([...CARD_WORLD_ARRANGEMENTS].sort(),Object.keys(mount.CARD_ARRANGEMENTS).sort(),'Loader and mount list the same arrangements');
for(const route of CARD_WORLD_ROUTES)assert(cardDetail(getDocument(route)).includes('data-card-world='),`${route} renders a card world`);
assert.equal(loadedCardWorlds(),null,'Nothing loaded the card worlds just by importing the loader');
await assert.rejects(()=>moduleGraph('missing-entry.js',dist),/Cannot read .*missing-entry\.js/,'A missing module fails loudly');

// Preload tags: every static module once, none already hand-listed, no entry.
const tags=modulePreloadTags({modules:[{file:'app.js'},{file:'a.js'},{file:'b.js'}]},'<link rel="modulepreload" href="b.js">');
assert.equal(tags,'<link rel="modulepreload" href="a.js">');
const hosted=await fs.readFile(new URL('../dist/client/index.html',import.meta.url),'utf8');
for(const m of graph.modules)if(m.file!=='app.js')assert(hosted.includes(`rel="modulepreload" href="${m.file}"`),`${m.file} is preloaded in the hosted page`);
assert(!hosted.includes(THREE_PATH),'The hosted page does not preload three.js');
assert(!(await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8')).includes('href="liquid-surface.js"'),'The authored page carries no generated preload list');

console.log('Module graph passed: three.js off the first-load path, budget, loader/mount agreement, card-world routes, preload list.');
