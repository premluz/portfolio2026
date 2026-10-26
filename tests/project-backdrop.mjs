import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {BACKDROP_WIDTHS,GENERIC_BACKDROP_ID,backdropCopy,backdropSources} from '../dist/backdrop-sources.js';
import {cards} from '../dist/documents.js';
import catalog from '../content/catalog.json' with {type:'json'};

assert.equal(backdropSources(null),null,'No backdrop, no sources');
const sources=backdropSources('assets/merlin-bg.jpg');
assert.equal(sources.src,'assets/backgrounds/merlin-bg-3840.jpg','The largest copy is the fallback src');
assert.equal(sources.srcset,'assets/backgrounds/merlin-bg-1920.jpg 1920w, assets/backgrounds/merlin-bg-3840.jpg 3840w');

// Linked by asset id, not by filename: vodafone-iot's backdrop is the vodafone-bg asset.
const byId=Object.fromEntries(cards.map(card=>[card.id,card]));
const assetUrl=id=>catalog.assets.find(asset=>asset.id===id).url;
for(const presentation of catalog.presentations.filter(item=>item.card.backgroundMediaId))
 assert.equal(byId[presentation.documentId].background,assetUrl(presentation.card.backgroundMediaId),`${presentation.documentId} uses its authored backdrop`);
assert.equal(byId['vodafone-iot'].background,'assets/vodafone-bg.jpg');
const generic=assetUrl(GENERIC_BACKDROP_ID),unauthored=cards.filter(card=>!card.body&&!catalog.presentations.some(item=>item.documentId===card.documentId&&item.card.backgroundMediaId));
assert(unauthored.length>0,'The fallback check covers at least one project');
for(const card of unauthored)assert.equal(card.background,generic,`${card.id} falls back to the generic backdrop`);

for(const asset of catalog.assets.filter(item=>item.url.endsWith('-bg.jpg')))for(const width of BACKDROP_WIDTHS)await access(new URL('../dist/'+backdropCopy(asset.url,width),import.meta.url));
console.log('Project backdrop passed: sources, id-linked backdrops, generic fallback and web copies on disk.');
