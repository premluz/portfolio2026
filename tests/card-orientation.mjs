import assert from 'node:assert/strict';
import {catalog} from '../dist/content/catalog.js';
import {contentModel} from '../dist/content/model.js';
import {createContentStore} from '../dist/content/provider.js';
import {card} from '../dist/card-renderer.js';

const withoutOrientation=source=>{
 const copy=structuredClone(source);
 for(const presentation of copy.presentations)delete presentation.card.orientation;
 return copy;
};
const orientationOf=(source,id)=>createContentStore(source).getCard(id).cardAspect;

// An authored orientation still wins; every project's derived value is compared with it so drift is visible.
const authored=createContentStore(catalog),derived=createContentStore(withoutOrientation(catalog));
assert.deepEqual(contentModel.validate(withoutOrientation(catalog)),[],'Presentations validate without orientation');
const differing=[];
for(const presentation of catalog.presentations){
 const id=presentation.documentId,document=catalog.documents.find(doc=>doc.id===id);
 if(document?.type!=='portfolio-item')continue;
 assert.equal(authored.getCard(id).cardAspect,presentation.card.orientation,`${id}: an authored orientation is used as written`);
 if(derived.getCard(id).cardAspect!==presentation.card.orientation)differing.push(`${id}: authored ${presentation.card.orientation}, derived ${derived.getCard(id).cardAspect}`);
}
assert.deepEqual(differing,[],'Derived orientation matches every authored one');

// Fixtures with ratios unlike the real projects; the real ones are all landscape-ish or phone-shaped.
const fixture=(ratio,{authoredOrientation}={})=>{
 const source=withoutOrientation(catalog),document=source.documents.find(doc=>doc.id==='playstation');
 const asset=source.assets.find(item=>item.id===document.heroMediaId);asset.width=Math.round(ratio*1000);asset.height=1000;
 if(authoredOrientation)source.presentations.find(item=>item.documentId==='playstation').card.orientation=authoredOrientation;
 return source;
};
for(const [ratio,expected] of [[0.46,'portrait'],[1,'landscape'],[1.6,'landscape'],[2.33,'landscape']]){
 const source=fixture(ratio);assert.deepEqual(contentModel.validate(source),[]);
 const projected=createContentStore(source).getCard('playstation');
 assert.equal(projected.cardAspect,expected,`ratio ${ratio} derives ${expected}`);
 assert(Math.abs(projected.cardRatio-ratio)<0.001,`ratio ${ratio} is projected onto the card`);
 assert(card(projected,0,'regular',{link:true}).includes(`data-card-orientation="${expected}"`),`ratio ${ratio} renders data-card-orientation="${expected}"`);
}
assert.equal(orientationOf(fixture(0.46,{authoredOrientation:'landscape'}),'playstation'),'landscape','An authored landscape beats a portrait-shaped image');
assert.equal(orientationOf(fixture(1.6,{authoredOrientation:'portrait'}),'playstation'),'portrait','An authored portrait beats a landscape-shaped image');

// A card with no hero media has no ratio and falls back to landscape.
const textOnly=withoutOrientation(catalog),porter=textOnly.documents.find(doc=>doc.id==='porter');
delete porter.heroMediaId;delete porter.hoverVideoId;porter.listOnly=true;
textOnly.presentations.push({documentId:'porter',card:{surface:['#101010','#202020']},detail:{columns:2}});
assert.deepEqual(contentModel.validate(textOnly),[]);
const textCard=createContentStore(textOnly).getCard('porter');
assert.equal(textCard.cardRatio,null);assert.equal(textCard.cardAspect,'landscape');
console.log('Card orientation passed: optional in the schema, authored value wins, derived from the measured hero ratio, text-only falls back to landscape.');
