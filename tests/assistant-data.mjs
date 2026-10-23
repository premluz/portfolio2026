import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCatalog,deriveEvidence,mergeAssistantData,readAssistantData,ASSISTANT_FIELDS} from '../dist/content/assistant-data.js';
import {contentModel} from '../dist/content/model.js';

const doc=(extra={})=>({id:'one',type:'portfolio-item',status:'published',slug:'one',title:'One',name:'One',kind:'shipped',context:'c',role:'r',keyWork:'k',heroMediaId:'img',highlights:'Lead • 0→1',impact:'Faster • Clearer',blocks:[],...extra});
const catalog=docs=>({schemaVersion:1,documents:docs,assets:[{id:'img',type:'image',status:'published',url:'https://example.com/a.png',alt:''}],presentations:[],layouts:[]});

// Facts shown on the page become evidence automatically, worded exactly as shown.
const derived=deriveEvidence(catalog([doc()])).documents[0];
assert.deepEqual(derived.evidence.map(e=>[e.id,e.text]),[['highlights','Lead • 0→1'],['impact','Faster • Clearer']]);
const quotes={id:'q',type:'component',status:'published',title:'Quotes',blocks:[{id:'quote-ana',type:'quote',text:'Clear thinker.',attribution:'Ana'}]};
const withQuotes=deriveEvidence(catalog([quotes])).documents[0];
assert.deepEqual(withQuotes.blocks[0].evidenceIds,['quote-ana'],'A quote cites itself');
assert.equal(withQuotes.evidence[0].text,'Clear thinker.','Its evidence is the quote text, so the assistant matches the page');
// Authored evidence wins over a generated one with the same id, and is kept.
const authored=deriveEvidence(catalog([doc({evidence:[{id:'impact',kind:'metric',text:'2× faster (source)',provenance:{kind:'author-provided'}}]})])).documents[0];
assert.deepEqual(authored.evidence.map(e=>[e.id,e.kind]),[['impact','metric'],['highlights','statement']]);
const source=catalog([doc()]);deriveEvidence(source);assert.equal(source.documents[0].evidence,undefined,'The source catalog is not modified');

// Assistant data merges by id, is shared across sets, and is never written twice.
const assistant={format:'prem-assistant-data',version:1,documents:{one:{aliases:['Uno'],domains:['AI']},'not-in-this-set':{aliases:['x']}}};
const merged=mergeAssistantData(catalog([doc()]),readAssistantData(assistant)).documents[0];
assert.deepEqual([merged.aliases,merged.domains],[['Uno'],['AI']]);
assert.throws(()=>mergeAssistantData(catalog([doc({aliases:['Dup']})]),readAssistantData(assistant)),/both the content file and assistant\.json/,'A field in both places is an error, not a silent override');
assert.throws(()=>readAssistantData({format:'prem-assistant-data',version:1,documents:{one:{title:'No'}}}),/unsupported fields: title/,'Only assistant fields belong in assistant.json');
assert.throws(()=>readAssistantData({documents:{}}),/must be/);
assert.deepEqual(readAssistantData(undefined),{},'No assistant file is allowed');
assert.deepEqual(ASSISTANT_FIELDS,['aliases','domains','capabilities','tags','evidence']);
assert.doesNotThrow(()=>contentModel.assert(prepareCatalog(catalog([doc(),quotes]),assistant)),'Prepared catalogs validate');

// The real content: clean files, every shown quote and highlight cited with matching text.
const files=await Promise.all(['catalog','catalog2'].map(name=>readFile(new URL(`../content/${name}.json`,import.meta.url),'utf8').then(JSON.parse)));
for(const file of files)for(const d of file.documents)for(const field of ASSISTANT_FIELDS)assert(!(field in d),`${d.id}.${field} lives in assistant.json, not the content file`);
const realAssistant=JSON.parse(await readFile(new URL('../content/assistant.json',import.meta.url),'utf8'));
const published=JSON.parse(await readFile(new URL('../dist/content/catalog.json',import.meta.url),'utf8'));
for(const d of published.documents){
 for(const b of (d.blocks||[]).filter(b=>b.type==='quote'))assert(d.evidence.some(e=>b.evidenceIds.includes(e.id)&&e.text===b.text),`${d.id}.${b.id} cites its own text`);
 for(const id of ['highlights','impact'])if(d.type==='portfolio-item'&&d[id])assert.equal(d.evidence.find(e=>e.id===id)?.text,d[id],`${d.id}.${id} evidence matches the page`);
}
assert(Object.keys(realAssistant.documents).length>0,'Assistant keywords moved into assistant.json');
console.log('Assistant data passed: generated evidence, self-citing quotes, authored evidence kept, shared merge, no duplicates, clean content files and matching citations.');
