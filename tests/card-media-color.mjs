import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyMediaCardColor} from '../dist/card-media-color.js';

// Card colour comes from the card's own picture (the ambient sampler); Hide card colour never touches the page background.
const store=new Map([['--project-hue-start','317.72'],['--project-hue-end','276.39'],['--project-chroma-scale','1']]);
const card={dataset:{},querySelector:()=>null,style:{getPropertyValue:name=>store.get(name)||'',setProperty:(name,value)=>store.set(name,value),removeProperty:name=>store.delete(name)}};
applyMediaCardColor(card,true);
assert.deepEqual(JSON.parse(card.dataset.projectColors),['317.72','276.39','1'],'The authored colours are kept on the card');
assert.equal(card.dataset.mediaColor,undefined,'A card whose media cannot be read keeps its project colours');
store.set('--project-hue-start','63.6');card.dataset.mediaColor='on';
applyMediaCardColor(card,false);
assert.equal(store.get('--project-hue-start'),'317.72','Turning it off restores the authored colours');assert.equal(card.dataset.mediaColor,undefined);
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const [tokens,app]=await Promise.all([read('tokens.css'),read('app.js')]);
const hiddenBlocks=tokens.match(/:root(?:\[data-theme="dark"\])?\.card-color-hidden \{[^}]*\}/g)||[];
assert.equal(hiddenBlocks.length,2);assert(hiddenBlocks.every(block=>!block.includes('--page')),'Hide card colour leaves the page background alone');
assert(app.includes('const mediaCardColors=()=>ambientColorSource===\'auto\'&&!hideCardColor;')&&app.includes('applyMediaCardColors(main,mediaCardColors())'),'The app applies media colours unless card colour is hidden');
console.log('Card media colour passed: kept and restored authored colours, page background untouched by Hide card colour, wired in the app.');
