// Reads a content set's source. A set is either one file, content/<set>.json, or a folder, content/<set>/, with one
// file per document so a page can be edited (and its history read) on its own:
//   index.json            {schemaVersion, documents:["pages/home.json", ...]}, the document order
//   <folder>/<id>.json    one document; the folder follows its type (DOCUMENT_FOLDERS)
//   articles/<id>.md      an article as Markdown instead (article-markdown.mjs); the file name is its id
//   assets.json, presentations.json, layouts.json
//   "extends": "catalog" in index.json: the set is another set with changes. Its listed documents replace the
//   base's by id (or are added after them), "remove" names ids to drop, and a shared file it has replaces the base's.
// Both forms assemble to the same catalog object, so the build and the site never see the difference.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isContentSetName} from '../dist/content/content-set.js';
import {parseArticleMarkdown} from './article-markdown.mjs';

/** This project's content/ folder, for scripts and tests that read the sources. */
export const projectContentDir=fileURLToPath(new URL('../content/',import.meta.url));

export const DOCUMENT_FOLDERS=Object.freeze({page:'pages','portfolio-item':'projects',article:'articles',news:'news',component:'components'});
const SHARED_FILES=Object.freeze({assets:'assets.json',presentations:'presentations.json',layouts:'layouts.json'});

async function readJson(file){
 try{return JSON.parse(await fs.readFile(file,'utf8'));}
 catch(error){throw new Error(`Cannot read ${file}`,{cause:error});}
}
const exists=async file=>{try{await fs.access(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}};

/** Content set names in contentDir: every catalog*.json file and every catalog* folder with an index.json. */
export async function contentSetNames(contentDir){
 const names=new Set();
 for(const entry of await fs.readdir(contentDir,{withFileTypes:true})){
  if(entry.isFile()&&entry.name.endsWith('.json')&&isContentSetName(entry.name.slice(0,-5)))names.add(entry.name.slice(0,-5));
  else if(entry.isDirectory()&&isContentSetName(entry.name)&&await exists(path.join(contentDir,entry.name,'index.json')))names.add(entry.name);
 }
 return [...names].sort();
}

async function readDocument(folder,relative){
 const file=path.join(folder,relative);
 if(path.extname(relative)!=='.md')return readJson(file);
 const doc=parseArticleMarkdown(await fs.readFile(file,'utf8').catch(error=>{throw new Error(`Cannot read ${file}`,{cause:error});}),{file,id:path.basename(relative,'.md')});
 if(doc.type!=='article')throw new Error(`${file}: only articles can be Markdown files (its header says type "${doc.type}")`);
 return doc;
}

async function readFolder(folder,{contentDir,chain}){
 const index=await readJson(path.join(folder,'index.json'));
 if(!Array.isArray(index.documents))throw new Error(`${folder}/index.json needs a documents list`);
 const listed=new Set();
 const documents=await Promise.all(index.documents.map(async relative=>{
  if(listed.has(relative))throw new Error(`${folder}/index.json lists ${relative} twice`);
  listed.add(relative);
  const doc=await readDocument(folder,relative);
  const expected=`${DOCUMENT_FOLDERS[doc.type]}/${doc.id}${path.extname(relative)}`;
  if(!DOCUMENT_FOLDERS[doc.type])throw new Error(`${folder}/${relative}: type "${doc.type}" has no folder in DOCUMENT_FOLDERS`);
  if(relative!==expected)throw new Error(`${folder}/${relative}: a ${doc.type} with id "${doc.id}" belongs at ${expected}`);
  return doc;
 }));
 for(const sub of new Set(Object.values(DOCUMENT_FOLDERS))){
  const dir=path.join(folder,sub);if(!await exists(dir))continue;
  for(const file of await fs.readdir(dir))if(/\.(json|md)$/.test(file)&&!listed.has(`${sub}/${file}`))throw new Error(`${folder}/${sub}/${file} is not listed in index.json, so it would be left out`);
 }
 if(index.extends===undefined){
  const catalog={schemaVersion:index.schemaVersion,documents};
  for(const [key,file] of Object.entries(SHARED_FILES))catalog[key]=await readJson(path.join(folder,file));
  return catalog;
 }
 return extendSet(folder,index,documents,{contentDir,chain});
}

// A set that extends another: the base set with its own documents replacing or joining the base's, and its own
// shared files (assets.json ...) replacing the base's when present.
async function extendSet(folder,index,documents,{contentDir,chain}){
 if(typeof index.extends!=='string')throw new Error(`${folder}/index.json: "extends" names a content set`);
 const base=await readContentSource(contentDir,index.extends,chain);
 const ids=new Set(base.documents.map(doc=>doc.id)),own=new Map(documents.map(doc=>[doc.id,doc]));
 const remove=index.remove??[];
 for(const id of remove){
  if(!ids.has(id))throw new Error(`${folder}/index.json removes "${id}", which ${index.extends} does not have`);
  if(own.has(id))throw new Error(`${folder}/index.json both removes and lists "${id}"`);
 }
 const merged=base.documents.filter(doc=>!remove.includes(doc.id)).map(doc=>own.get(doc.id)??doc);
 const catalog={schemaVersion:index.schemaVersion??base.schemaVersion,documents:[...merged,...documents.filter(doc=>!ids.has(doc.id))]};
 for(const [key,file] of Object.entries(SHARED_FILES))catalog[key]=await exists(path.join(folder,file))?await readJson(path.join(folder,file)):base[key];
 return catalog;
}

/** Where a set's source lives, for messages and generated-file notes: content/<set>/ or content/<set>.json. */
export async function contentSourceLabel(contentDir,set){
 return await exists(path.join(contentDir,set,'index.json'))?`content/${set}/`:`content/${set}.json`;
}

/** The raw source catalog of one content set, from its file or its folder. */
export async function readContentSource(contentDir,set,chain=[]){
 if(!isContentSetName(set))throw new Error(`Not a content set name: ${set}`);
 if(chain.includes(set))throw new Error(`Content sets extend each other in a circle: ${[...chain,set].join(' -> ')}`);
 const folder=path.join(contentDir,set),file=folder+'.json';
 const [hasFolder,hasFile]=await Promise.all([exists(path.join(folder,'index.json')),exists(file)]);
 if(hasFolder&&hasFile)throw new Error(`Content set "${set}" exists as both ${file} and ${folder}/; keep one`);
 if(hasFolder)return readFolder(folder,{contentDir,chain:[...chain,set]});
 return readJson(file);
}
