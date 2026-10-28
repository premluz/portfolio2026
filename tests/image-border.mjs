import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';
import {fittedCardRadius,CARD_RADIUS_SIDE_SHARE} from '../dist/image-frame.js';

// A separate Cards switch gives card images a thin border; Plain cards no longer decides it. The carousel follows Card rounding,
// and its size and gap sliders work in every presentation.
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const [html,app,transfer,design,gallery,plain]=await Promise.all(['index.html','app.js','settings-transfer.js','design-system.css','card-gallery.css','plain-cards.css'].map(read));
assert.equal(DEFAULT_STORAGE_VALUES['prem-image-border'],'false');assert(transfer.includes("imageBorder:'prem-image-border'"),'Exported with the other settings');
assert(html.includes('<input id="imageBorder" type="checkbox"> Thin border on card images'),'The page carries the switch');
assert(app.includes("document.documentElement.dataset.imageBorder=imageBorder?'on':'off'"),'It sets the root attribute');
assert(design.includes(':root[data-image-border="on"] .project-card>.visual :is(img,video){outline:1px solid'),'The border is an inset outline on the picture itself, not its padded frame');
assert(!plain.includes('outline'),'Plain cards no longer add a border');
assert(gallery.includes('.spatial-gallery-pose .project-card{--gallery-card-radius:var(--radius-card)}')&&gallery.includes('border-radius:var(--gallery-card-radius)'),'Card rounding reaches the carousel');
const arc=html.slice(html.indexOf('<div id="carouselArcSettings"'));
assert(!arc.slice(0,arc.indexOf('Motion and mobile')).includes('id="carouselSize"')&&html.indexOf('id="carouselSize"')<html.indexOf('<div id="carouselArcSettings"'),'Card size sits outside the circular-only group');
assert(html.indexOf('id="carouselGap"')<html.indexOf('<div id="carouselArcSettings"')&&gallery.includes('gap:var(--carousel-gap,var(--space-6))'),'Gap works for the scroll presentation too');
// Card rounding is a ceiling relative to the card: large cards keep it, small cards never round past a share of their shorter side.
assert.equal(fittedCardRadius(128,1000,700),128,'A large card keeps the setting');
assert.equal(fittedCardRadius(128,1000,600),128,'A card past the reference side keeps the setting');
const small=fittedCardRadius(128,317,198);assert(small<198*CARD_RADIUS_SIDE_SHARE/1.3&&small>0,'A small card rounds much less than its share cap');
assert(fittedCardRadius(128,317,198)<fittedCardRadius(128,420,300)&&fittedCardRadius(128,420,300)<fittedCardRadius(128,600,420),'Rounding grows with the card');
assert(fittedCardRadius(40,317,198)<40,'A small setting also shrinks on a small card');
assert.equal(fittedCardRadius(64,0,0),0,'An empty box has no radius');
console.log('Image border passed: default off, exported, outline on the image frame, plain cards add none, carousel rounding, size and gap for every presentation.');
