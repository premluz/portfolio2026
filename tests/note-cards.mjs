import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {contentModel} from '../dist/content/model.js';
import {card} from '../dist/card-renderer.js';
import {cards} from '../dist/documents.js';
import catalog from '../content/catalog.json' with {type:'json'};

// A project's card sets validate like the rest of the model: unique card ids, media that exists and is an image or video.
const clone=()=>structuredClone(catalog),issuesFor=doc=>contentModel.validate(doc).filter(issue=>/Cards|card/i.test(issue));
assert.deepEqual(contentModel.validate(clone()).filter(issue=>/homeCards|detailCards/.test(issue)),[],'The shipped placeholders are valid');
let doc=clone();doc.documents.find(d=>d.id==='tracr').homeCards.push({id:'tracr-home-1',mediaId:'tracr-cover'});
assert(issuesFor(doc).some(issue=>/duplicate card ID tracr-home-1/.test(issue)),'Card ids are unique within a set');
doc=clone();doc.documents.find(d=>d.id==='tracr').detailCards=[{id:'x',mediaId:'no-such-asset'}];
assert(contentModel.validate(doc).some(issue=>/detailCards\.x/.test(issue)),'Media must exist');
doc=clone();doc.documents.find(d=>d.id==='tracr').homeCards=[{id:'x',mediaId:'about'}];
assert(contentModel.validate(doc).length>0,'A document is not a media asset');
doc=clone();doc.documents.find(d=>d.id==='tracr').homeCards=[{id:'x',mediaId:'tracr-cover',extra:true}];
assert(contentModel.validate(doc).length>0,'Unknown card properties are rejected');
doc=clone();doc.documents.find(d=>d.id==='tracr').homeCards=[{id:'x',mediaId:'tracr-walkthrough',title:'Video card'}];
assert.deepEqual(contentModel.validate(doc).filter(issue=>/homeCards/.test(issue)),[],'A video asset is a valid card');

// Every featured project ships three placeholder cards on its own cover image, with no invented copy.
for(const item of cards.filter(entry=>entry.projectStatus)){
 assert.equal(item.homeCards.length,3,`${item.id} has three home cards`);
 assert(item.homeCards.every(entry=>entry.media?.type==='image'&&entry.title===''&&entry.description===''),`${item.id} placeholders are image-only`);
 assert.equal(item.homeCards[0].media.url,item.image,`${item.id} placeholders use its cover image`);
 assert.deepEqual(item.detailCards,[],`${item.id} detail cards are not authored yet`);
}

// Markup: media always, caption only when authored, escaped, video lazy and muted.
const tracr=cards.find(item=>item.id==='tracr');
let html=card(tracr,0,'regular',{link:false});
assert.equal((html.match(/<figure class="note-card">/g)||[]).length,3);assert(html.includes('<div class="card-notes" data-count="3">'));
assert(!/note-card-title|note-card-description/.test(html),'No caption without a title or description');
html=card({...tracr,homeCards:[{id:'a',title:'T <b>',description:'D & d',media:{type:'image',url:tracr.image,alt:'A'}},{id:'b',title:'',description:'',media:{type:'video',url:'assets/tracr.mp4',alt:''}}]},0,'regular',{link:false});
assert(html.includes('<h3 class="note-card-title">T &lt;b&gt;</h3>')&&html.includes('<p class="note-card-description">D &amp; d</p>'),'Title and description are escaped');
assert(/<video class="note-card-video" muted loop playsinline autoplay preload="none" data-media-src="assets\/tracr\.mp4"/.test(html),'A video card is muted, looping and loaded lazily');
assert(!card({...tracr,homeCards:[]},0,'regular',{link:false}).includes('card-notes'),'No cards, no wrapper');

// CSS: hidden by default, shown only in the stage, and the backdrop is pinned to the first row with an explicit end line.
const css=await readFile(new URL('../dist/note-cards.css',import.meta.url),'utf8');
assert(css.includes('.project-card .card-notes{display:none}'),'Hidden outside Featured stage mode');
assert(/data-feature-stage="true"\] \.card-notes\{display:grid/.test(css),'Shown for staged cards');
assert(/\.card-backdrop\{grid-row:1\/2;/.test(css),'The backdrop spans only the first row (an open end line would run to the container edge)');
console.log('Note cards passed: model validation, placeholders, markup and escaping, video cards, and stage-only styling.');
