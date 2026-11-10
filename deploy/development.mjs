import fs from 'node:fs/promises';
import {exportPublishedCatalog} from '../dist/content/model.js';
import {prepareCatalog} from '../dist/content/assistant-data.js';
import {clientStyles} from '../scripts/client-styles.mjs';
import {fileURLToPath} from 'node:url';
import {DEFAULT_CONTENT_SET} from '../dist/content/content-set.js';
import {contentSetNames,readContentSource} from '../scripts/content-source.mjs';
import {withMeasuredMedia} from '../scripts/media-metadata.mjs';

const contentDirectory=fileURLToPath(new URL('../content/',import.meta.url));
const distDirectory=fileURLToPath(new URL('../dist/',import.meta.url));

// Development reads content sets straight from content/ (a catalog*.json file or a catalog*/ folder), so a new set
// or an edited page file appears without a build.
export async function developmentContentSets(){
 return contentSetNames(contentDirectory);
}

export async function readDevelopmentCatalog(set=DEFAULT_CONTENT_SET,directory=contentDirectory){
 let catalog;
 try{catalog=await readContentSource(directory,set);}
 catch(error){throw new Error(`Cannot read development catalog: ${set} in ${directory}: ${error.message}`,{cause:error});}
 return exportPublishedCatalog(prepareCatalog(await withMeasuredMedia(catalog,distDirectory),await readDevelopmentAssistantData()));
}

// Read on every request in development, so edits to content/assistant.json show without a restart.
export async function readDevelopmentAssistantData(){
 try{return JSON.parse(await fs.readFile(new URL('../content/assistant.json',import.meta.url),'utf8'));}
 catch(error){if(error.code==='ENOENT')return undefined;throw new Error('Cannot read content/assistant.json',{cause:error});}
}

export async function developmentResponse(pathname){
 if(pathname==='/content/sets.js')return {type:'text/javascript; charset=utf-8',body:`export const contentSets=${JSON.stringify(await developmentContentSets())};\n`};
 const set=/^\/content\/(catalog[a-z0-9-]*)\.(js|json)$/.exec(pathname)?.[1];
 if(set&&(await developmentContentSets()).includes(set)){
  const catalog=await readDevelopmentCatalog(set);
  return pathname.endsWith('.js')
   ?{type:'text/javascript; charset=utf-8',body:`export const catalog=${JSON.stringify(catalog)};\n`}
   :{type:'application/json; charset=utf-8',body:JSON.stringify(catalog)};
 }
 if(pathname==='/site.css'){
  const styles=await Promise.all(clientStyles.map(file=>fs.readFile(new URL('../dist/'+file,import.meta.url),'utf8')));
  return {type:'text/css; charset=utf-8',body:styles.join('\n')};
 }
 return null;
}
