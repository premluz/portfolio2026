import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readDevelopmentCatalog,developmentResponse} from '../deploy/development.mjs';
import {projectContentDir,readContentSource} from '../scripts/content-source.mjs';

const source=await readContentSource(projectContentDir,'catalog');
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-dev-catalog-'));
try{
 // A one-file set: content/catalog.json.
 const filename=path.join(directory,'catalog.json');
 await fs.writeFile(filename,JSON.stringify(source));
 const first=await readDevelopmentCatalog('catalog',directory);
 assert.equal(first.documents.find(doc=>doc.id==='home').title,source.documents.find(doc=>doc.id==='home').title);
 const edited=structuredClone(source);
 edited.documents.find(doc=>doc.id==='home').title='A changed greeting after saving';
 const intro=edited.documents.find(doc=>doc.id==='home-about').blocks.find(block=>block.id==='about-introduction');
 intro.title='A different About heading';intro.label='A different muted ending';
 await fs.writeFile(filename,JSON.stringify(edited));
 const second=await readDevelopmentCatalog('catalog',directory);
 assert.equal(second.documents.find(doc=>doc.id==='home').title,'A changed greeting after saving');
 assert.equal(second.documents.find(doc=>doc.id==='home-about').blocks.find(block=>block.id==='about-introduction').label,'A different muted ending');
 assert(!second.documents.some(doc=>doc.status!=='published'));
 await fs.writeFile(filename,'{invalid');
 await assert.rejects(readDevelopmentCatalog('catalog',directory),/Cannot read development catalog/);
 // A folder set: content/catalog/, one file per page. Editing one page's file shows on the next read, without a build.
 await fs.rm(filename);
 const folder=path.join(directory,'catalog');
 await fs.cp(path.join(projectContentDir,'catalog'),folder,{recursive:true});
 assert.deepEqual(await readDevelopmentCatalog('catalog',directory),first,'The folder form reads the same catalog as the file form');
 const homeFile=path.join(folder,'pages/home.json'),home=JSON.parse(await fs.readFile(homeFile,'utf8'));
 await fs.writeFile(homeFile,JSON.stringify({...home,title:'Edited in its own file'}));
 assert.equal((await readDevelopmentCatalog('catalog',directory)).documents.find(doc=>doc.id==='home').title,'Edited in its own file');
 await fs.writeFile(path.join(folder,'pages/stray.json'),JSON.stringify({...home,id:'stray'}));
 await assert.rejects(readDevelopmentCatalog('catalog',directory),/not listed in index\.json/,'A page file left out of the index fails loudly');
 const json=await developmentResponse('/content/catalog.json');
 assert.deepEqual(JSON.parse(json.body),await readDevelopmentCatalog());
 const module=await import('data:text/javascript,'+encodeURIComponent((await developmentResponse('/content/catalog.js')).body));
 assert.deepEqual(module.catalog,JSON.parse(json.body));
 const css=await developmentResponse('/site.css');
 assert(css.body.includes(await fs.readFile(new URL('../dist/home-about.css',import.meta.url),'utf8')));
 assert.equal(await developmentResponse('/not-a-generated-route'),null);
}finally{await fs.rm(directory,{recursive:true,force:true});}
console.log('Development passed: fresh catalog reads after edits, published filtering, invalid JSON errors, live module/JSON and authored CSS.');
