// Reads a content set's source. A set is either one file, content/<set>.json, or a folder, content/<set>/, with one
// file per document so a page can be edited (and its history read) on its own:
//   index.json            {schemaVersion, documents:["pages/home.json", ...]}, the document order
//   <folder>/<id>.json    one document; the folder follows its type (DOCUMENT_FOLDERS)
//   assets.json, presentations.json, layouts.json
// Both forms assemble to the same catalog object, so the build and the site never see the difference.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isContentSetName} from '../dist/content/content-set.js';

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

async function readFolder(folder){
 const index=await readJson(path.join(folder,'index.json'));
 if(!Array.isArray(index.documents))throw new Error(`${folder}/index.json needs a documents list`);
 const listed=new Set();
 const documents=await Promise.all(index.documents.map(async relative=>{
  if(listed.has(relative))throw new Error(`${folder}/index.json lists ${relative} twice`);
  listed.add(relative);
  const doc=await readJson(path.join(folder,relative));
  const expected=`${DOCUMENT_FOLDERS[doc.type]}/${doc.id}.json`;
  if(!DOCUMENT_FOLDERS[doc.type])throw new Error(`${folder}/${relative}: type "${doc.type}" has no folder in DOCUMENT_FOLDERS`);
  if(relative!==expected)throw new Error(`${folder}/${relative}: a ${doc.type} with id "${doc.id}" belongs at ${expected}`);
  return doc;
 }));
 for(const sub of new Set(Object.values(DOCUMENT_FOLDERS))){
  const dir=path.join(folder,sub);if(!await exists(dir))continue;
  for(const file of await fs.readdir(dir))if(file.endsWith('.json')&&!listed.has(`${sub}/${file}`))throw new Error(`${folder}/${sub}/${file} is not listed in index.json, so it would be left out`);
 }
 const catalog={schemaVersion:index.schemaVersion,documents};
 for(const [key,file] of Object.entries(SHARED_FILES))catalog[key]=await readJson(path.join(folder,file));
 return catalog;
}

/** Where a set's source lives, for messages and generated-file notes: content/<set>/ or content/<set>.json. */
export async function contentSourceLabel(contentDir,set){
 return await exists(path.join(contentDir,set,'index.json'))?`content/${set}/`:`content/${set}.json`;
}

/** The raw source catalog of one content set, from its file or its folder. */
export async function readContentSource(contentDir,set){
 if(!isContentSetName(set))throw new Error(`Not a content set name: ${set}`);
 const folder=path.join(contentDir,set),file=folder+'.json';
 const [hasFolder,hasFile]=await Promise.all([exists(path.join(folder,'index.json')),exists(file)]);
 if(hasFolder&&hasFile)throw new Error(`Content set "${set}" exists as both ${file} and ${folder}/; keep one`);
 if(hasFolder)return readFolder(folder);
 return readJson(file);
}
