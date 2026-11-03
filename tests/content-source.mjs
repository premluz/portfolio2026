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
 await write('catalog.json',catalog);
 await assert.rejects(readContentSource(dir,'catalog'),/exists as both/,'A set is never read from two places');
 await assert.rejects(readContentSource(dir,'../etc'),/Not a content set name/);
}finally{await fs.rm(dir,{recursive:true,force:true});}

// The project's own default set is the folder form.
assert.equal(await contentSourceLabel(projectContentDir,'catalog'),'content/catalog/');
console.log('Content source passed: file and folder sets, index order, type folders, id file names, duplicates, unknown types, one source per set.');
