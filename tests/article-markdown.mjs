import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseArticleMarkdown} from '../scripts/article-markdown.mjs';
import {formatArticleMarkdown} from '../scripts/article-markdown-format.mjs';
import {projectContentDir} from '../scripts/content-source.mjs';

const parse=(body,header='{"type":"article","title":"T","blocks":"below","sources":[]}')=>parseArticleMarkdown(`---\n${header}\n---\n\n${body}`,{file:'a.md',id:'a'});
const literal=text=>new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
const bad=(body,text,message)=>assert.throws(()=>parse(body),literal(text),message);

// Text: paragraphs before a heading, headings with and without ids, hard-wrapped paragraphs.
let doc=parse('First line\nof one paragraph.\n\nSecond paragraph.\n\n## Heading one {#one}\n\nUnder one.\n\n## Heading two\n\nUnder two.\n');
assert.deepEqual(Object.keys(doc),['id','type','title','blocks','sources'],'The "blocks" marker keeps the blocks where the header puts them');
assert.deepEqual(doc.blocks,[
 {id:'a-1',type:'text',paragraphs:['First line of one paragraph.','Second paragraph.']},
 {id:'one',type:'text',title:'Heading one',paragraphs:['Under one.']},
 {id:'a-2',type:'text',title:'Heading two',paragraphs:['Under two.']}
],'Untitled text first, headings start text blocks, blank lines separate paragraphs, ids are explicit or numbered');
assert.deepEqual(parse('Body.').blocks[0].paragraphs,['Body.']);
assert.deepEqual(Object.keys(parseArticleMarkdown('---\n{"type":"article"}\n---\nText.',{file:'a.md',id:'a'})),['id','type','blocks'],'Without a marker the blocks come last');

// Structured blocks.
doc=parse([
 '::section{#key-work title="Key work" label="Chapter"}','','## Inside {#inside}','','Para.','',
 '::image{id="flow" media="ps-content" alt="The \\"flow\\"" caption="Publishing flow" width="960"}','',
 '::video{media="ps-demo" poster="ps-cover" caption="Terms of sale" width="page"}','',
 '::section{title="Nested"}','','::image{media="x"}','','::end','','::end','',
 '::table{id="grid" title="Grid"}','| Product | Design |','| --- | --- |','| Ask | The \\| question |','| Confirm | Earbud |','',
 '::text{id="labelled" title="T" label="L"}','','Para two.',''
].join('\n'));
const [section,table,labelled]=doc.blocks;
assert.deepEqual(section,{id:'key-work',type:'section',title:'Key work',label:'Chapter',items:[
 {id:'inside',type:'text',title:'Inside',paragraphs:['Para.']},
 {id:'flow',type:'image',mediaId:'ps-content',alt:'The "flow"',caption:'Publishing flow',layout:{width:'960'}},
 {id:'a-1',type:'video',mediaId:'ps-demo',posterMediaId:'ps-cover',caption:'Terms of sale',layout:{width:'page'}},
 {id:'a-2',type:'section',title:'Nested',items:[{id:'a-3',type:'image',mediaId:'x'}]}
]},'Sections nest; images and videos carry media, caption and width');
assert.deepEqual(table,{id:'grid',type:'table',title:'Grid',columns:['Product','Design'],rows:[['Ask','The | question'],['Confirm','Earbud']]},'A pipe table, with \\| for a bar');
assert.deepEqual(labelled,{id:'labelled',type:'text',title:'T',label:'L',paragraphs:['Para two.']},'A text block can carry a label through its directive');

// Mistakes fail loudly, with the file and line.
bad('::nope','a.md:5: Unknown block ::nope','An unknown block is named');
bad('::section{title="x"}\n\nText.','a.md:5: ::section is never closed','An unclosed section points at where it opened');
bad('::end','::end without an open ::section');
bad('::image{alt="x"}','needs media=','An image needs its media');
bad('::image{media="x" width="4000"}','width must be one of content, 960, 1280, page');
bad('::image{media="x" colour="red"}','no "colour" attribute');
bad('::image{media=x}','Cannot read the attributes');
bad('::table\n| a | b |\n| c | d |','header row, then a | --- | --- | row','A table needs its rule row');
bad('::table\n| a | b |\n| --- | --- |\n| c |','same number of cells','Table rows match the header');
assert.throws(()=>parseArticleMarkdown('no header',{file:'a.md',id:'a'}),/starts with a --- fenced JSON header/);
assert.throws(()=>parse('x','{not json}'),/header is not valid JSON/);
assert.throws(()=>parse('x','{"id":"other"}'),/id comes from the file name/);
assert.throws(()=>parse('x','{"blocks":[]}'),/write "blocks": "below"/);

// Writing it back is exact, or refused.
const sample={id:'a',type:'article',title:'T',blocks:[
 {id:'t1',type:'text',paragraphs:['Intro.']},
 {id:'s',type:'section',title:'S',items:[{id:'i',type:'image',mediaId:'m',alt:'A "quoted" alt',caption:'C',layout:{width:'1280'}},{id:'v',type:'video',mediaId:'m2',posterMediaId:'p',layout:{width:'960'}}]},
 {id:'t2',type:'text',title:'Heading',paragraphs:['One.','Two.']},
 {id:'t3',type:'text',title:'T',label:'L',paragraphs:['Labelled.']},
 {id:'g',type:'table',columns:['A','B'],rows:[['x | y','z']]}
],sources:[{label:'L'}]};
assert.deepEqual(parseArticleMarkdown(formatArticleMarkdown(sample),{file:'a.md',id:'a'}),sample,'Every supported block survives writing and reading');
assert.equal(JSON.stringify(parseArticleMarkdown(formatArticleMarkdown(sample),{file:'a.md',id:'a'})),JSON.stringify(sample),'...in the same key order');
const refuse=(block,pattern,message)=>assert.throws(()=>formatArticleMarkdown({id:'a',type:'article',blocks:[block]}),pattern,message);
refuse({id:'q',type:'quote',text:'x',attribution:'y'},/only text, section, image, video and table blocks/,'Other block types keep the article as JSON');
refuse({id:'t',type:'text',paragraphs:['x'],evidenceIds:['e']},/evidenceIds, which Markdown does not carry/,'Extra fields are never dropped silently');
refuse({id:'t',type:'text',paragraphs:['Two\nlines']},/one trimmed line/);
refuse({id:'t',type:'text',paragraphs:['## Not a heading']},/cannot start with/);
refuse({id:'i',type:'image',mediaId:'m',alt:'',layout:{width:'960'}},/alt must be one trimmed line/,'An empty alt text is refused rather than turned into a missing one');
refuse({id:'i',type:'image',mediaId:'m',layout:{width:'960',columns:2}},/only layout\.width/);

// The real articles are in Markdown and are stable: writing what was read gives the same file back.
for(const id of ['desire-and-lived-experience','design-after-the-screen']){
 const text=await fs.readFile(new URL(`../content/catalog/articles/${id}.md`,import.meta.url),'utf8');
 assert.equal(formatArticleMarkdown(parseArticleMarkdown(text,{file:id,id})),text,`${id}.md reads and writes back unchanged`);
}
assert(projectContentDir.endsWith('/content/'));
console.log('Article Markdown passed: text and headings, sections, images, videos, tables, loud errors, exact write-back and the real articles.');
