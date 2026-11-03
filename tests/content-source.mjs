import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {contentSetNames,contentSourceLabel,readContentSource,projectContentDir} from '../scripts/content-source.mjs';

// A content set is one file (content/<set>.json) or a folder with one file per document; both read the same.
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'content-source-'));
const write=async(file,value)=>{const target=path.join(dir,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,JSON.stringify(value));};
const home={id:'home',type:'page',title:'Home'},merlin={id:'merlin',type:'portfolio-item',title:'Merlin'};
const shared={assets:[{id:'a'}],presentations:[{id:'p'}],layouts:[{id:'l'}]};
const catalog={schemaVersion:1,documents:[merlin,home],...shared};
try{
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json']});
 await write('catalog/projects/merlin.json',merlin);await write('catalog/pages/home.json',home);
 for(const [key,value] of Object.entries(shared))await write(`catalog/${key}.json`,value);
 await write('catalog2.json',catalog);await write('assistant.json',{});await write('notes/index.json',{});
 assert.deepEqual(await contentSetNames(dir),['catalog','catalog2'],'Sets are catalog* files and catalog* folders with an index; other files are ignored');
 assert.deepEqual(await readContentSource(dir,'catalog'),catalog,'The folder assembles in index order, with the shared files');
 assert.equal(JSON.stringify(await readContentSource(dir,'catalog')),JSON.stringify(await readContentSource(dir,'catalog2')),'Folder and file forms serialise identically');
 assert.equal(await contentSourceLabel(dir,'catalog'),'content/catalog/');assert.equal(await contentSourceLabel(dir,'catalog2'),'content/catalog2.json');

 await write('catalog/pages/merlin.json',merlin);
 await write('catalog/index.json',{schemaVersion:1,documents:['pages/merlin.json','pages/home.json']});
 await assert.rejects(readContentSource(dir,'catalog'),/belongs at projects\/merlin\.json/,'A document sits in its type folder');
 await fs.rm(path.join(dir,'catalog/pages/merlin.json'));
 await write('catalog/projects/other.json',merlin);
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/other.json','pages/home.json']});
 await assert.rejects(readContentSource(dir,'catalog'),/belongs at projects\/merlin\.json/,'A file is named after its id');
 await fs.rm(path.join(dir,'catalog/projects/other.json'));
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','projects/merlin.json','pages/home.json']});
 await assert.rejects(readContentSource(dir,'catalog'),/lists projects\/merlin\.json twice/);
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json']});
 await write('catalog/notes/x.json',{id:'x',type:'note'});
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json','notes/x.json']});
 await assert.rejects(readContentSource(dir,'catalog'),/type "note" has no folder/,'An unknown type is named, not dropped');
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json']});
 // An article may be a Markdown file; its file name is its id.
 const writeText=async(file,text)=>{const target=path.join(dir,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text);};
 const article='---\n{"type":"article","status":"published","title":"Hello","blocks":"below"}\n---\n\n## Part one {#one}\n\nText.\n';
 await writeText('catalog/articles/hello.md',article);
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json','articles/hello.md']});
 assert.deepEqual((await readContentSource(dir,'catalog')).documents.at(-1),{id:'hello',type:'article',status:'published',title:'Hello',blocks:[{id:'one',type:'text',title:'Part one',paragraphs:['Text.']}]},'A Markdown article assembles like a JSON one');
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json']});
 await assert.rejects(readContentSource(dir,'catalog'),/articles\/hello\.md is not listed in index\.json/,'A Markdown file left out of the index fails loudly');
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json','articles/hello.md']});
 await writeText('catalog/articles/hello.md',article.replace('"article"','"page"'));
 await assert.rejects(readContentSource(dir,'catalog'),/only articles can be Markdown files/,'Only articles are Markdown');
 await fs.rm(path.join(dir,'catalog/articles/hello.md'));await writeText('catalog/articles/other.md',article);
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json','articles/hello.md']});
 await assert.rejects(readContentSource(dir,'catalog'),/hello\.md/,'A listed file that is missing is named');
 await fs.rm(path.join(dir,'catalog/articles'),{recursive:true});
 await write('catalog/index.json',{schemaVersion:1,documents:['projects/merlin.json','pages/home.json']});
 // A set can extend another: its documents replace the base's by id (keeping the base's place) or join after it.
 const merlin2={...merlin,title:'Merlin, changed'},extra={id:'extra',type:'page',title:'Extra'};
 await write('catalog3/index.json',{extends:'catalog',documents:['projects/merlin.json','pages/extra.json']});
 await write('catalog3/projects/merlin.json',merlin2);await write('catalog3/pages/extra.json',extra);
 assert.deepEqual(await readContentSource(dir,'catalog3'),{schemaVersion:1,documents:[merlin2,home,extra],...shared},'Replaced documents keep their place, new ones follow, everything else is the base\'s');
 assert.equal((await readContentSource(dir,'catalog')).documents[0].title,'Merlin','The base is not changed by the set that extends it');
 await write('catalog3/assets.json',[{id:'own'}]);
 assert.deepEqual((await readContentSource(dir,'catalog3')).assets,[{id:'own'}],'A shared file in the set replaces the base\'s');
 assert.deepEqual((await readContentSource(dir,'catalog3')).presentations,shared.presentations,'...and the others still come from the base');
 await fs.rm(path.join(dir,'catalog3/pages'),{recursive:true});await fs.rm(path.join(dir,'catalog3/projects'),{recursive:true});
 await write('catalog3/index.json',{extends:'catalog',documents:[],remove:['home']});
 assert.deepEqual((await readContentSource(dir,'catalog3')).documents,[merlin],'A set can drop documents');
 await write('catalog3/index.json',{extends:'catalog',documents:[],remove:['nope']});
 await assert.rejects(readContentSource(dir,'catalog3'),/removes "nope", which catalog does not have/,'Removing something the base lacks fails loudly');
 await write('catalog3/projects/merlin.json',merlin2);
 await write('catalog3/index.json',{extends:'catalog',documents:['projects/merlin.json'],remove:['merlin']});
 await assert.rejects(readContentSource(dir,'catalog3'),/both removes and lists "merlin"/);
 await fs.rm(path.join(dir,'catalog3/projects'),{recursive:true});
 await write('catalog3/index.json',{extends:'catalog3',documents:[]});
 await assert.rejects(readContentSource(dir,'catalog3'),/extend each other in a circle: catalog3 -> catalog3/,'A set cannot extend itself');
 await write('catalog3/index.json',{extends:'catalog9',documents:[]});
 await assert.rejects(readContentSource(dir,'catalog3'),/catalog9/,'An unknown base is named');
 await fs.rm(path.join(dir,'catalog3'),{recursive:true});
 await write('catalog.json',catalog);
 await assert.rejects(readContentSource(dir,'catalog'),/exists as both/,'A set is never read from two places');
 await assert.rejects(readContentSource(dir,'../etc'),/Not a content set name/);
}finally{await fs.rm(dir,{recursive:true,force:true});}

// The project's own default set is the folder form.
assert.equal(await contentSourceLabel(projectContentDir,'catalog'),'content/catalog/');
console.log('Content source passed: file and folder sets, index order, type folders, id file names, duplicates, unknown types, one source per set.');
