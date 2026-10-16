import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readDevelopmentCatalog,developmentResponse} from '../deploy/development.mjs';

const source=JSON.parse(await fs.readFile(new URL('../content/catalog.json',import.meta.url),'utf8'));
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-dev-catalog-'));
try{
 const filename=path.join(directory,'catalog.json');
 await fs.writeFile(filename,JSON.stringify(source));
 const first=await readDevelopmentCatalog(filename);
 assert.equal(first.documents.find(doc=>doc.id==='home').title,source.documents.find(doc=>doc.id==='home').title);
 const edited=structuredClone(source);
 edited.documents.find(doc=>doc.id==='home').title='A changed greeting after saving';
 const intro=edited.documents.find(doc=>doc.id==='home-about').blocks.find(block=>block.id==='about-introduction');
 intro.title='A different About heading';intro.label='A different muted ending';
 await fs.writeFile(filename,JSON.stringify(edited));
 const second=await readDevelopmentCatalog(filename);
 assert.equal(second.documents.find(doc=>doc.id==='home').title,'A changed greeting after saving');
 assert.equal(second.documents.find(doc=>doc.id==='home-about').blocks.find(block=>block.id==='about-introduction').label,'A different muted ending');
 assert(!second.documents.some(doc=>doc.status!=='published'));
 await fs.writeFile(filename,'{invalid');
 await assert.rejects(readDevelopmentCatalog(filename),/Cannot read development catalog/);
 const json=await developmentResponse('/content/catalog.json');
 assert.deepEqual(JSON.parse(json.body),await readDevelopmentCatalog());
 const module=await import('data:text/javascript,'+encodeURIComponent((await developmentResponse('/content/catalog.js')).body));
 assert.deepEqual(module.catalog,JSON.parse(json.body));
 const css=await developmentResponse('/site.css');
 assert(css.body.includes(await fs.readFile(new URL('../dist/home-about.css',import.meta.url),'utf8')));
 assert.equal(await developmentResponse('/not-a-generated-route'),null);
}finally{await fs.rm(directory,{recursive:true,force:true});}
console.log('Development passed: fresh catalog reads after edits, published filtering, invalid JSON errors, live module/JSON and authored CSS.');
