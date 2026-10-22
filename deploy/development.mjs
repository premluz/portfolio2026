import fs from 'node:fs/promises';
import {exportPublishedCatalog} from '../dist/content/model.js';
import {clientStyles} from '../scripts/client-styles.mjs';
import {DEFAULT_CONTENT_SET,isContentSetName} from '../dist/content/content-set.js';

const contentDirectory=new URL('../content/',import.meta.url);

// Development reads content sets straight from content/, so a new catalog*.json appears without a build.
export async function developmentContentSets(){
 return (await fs.readdir(contentDirectory)).filter(file=>file.endsWith('.json')).map(file=>file.slice(0,-5)).filter(isContentSetName).sort();
}

export async function readDevelopmentCatalog(filename=new URL(DEFAULT_CONTENT_SET+'.json',contentDirectory)){
 let catalog;
 try{catalog=JSON.parse(await fs.readFile(filename,'utf8'));}
 catch(error){throw new Error(`Cannot read development catalog: ${filename}`,{cause:error});}
 return exportPublishedCatalog(catalog);
}

export async function developmentResponse(pathname){
 if(pathname==='/content/sets.js')return {type:'text/javascript; charset=utf-8',body:`export const contentSets=${JSON.stringify(await developmentContentSets())};\n`};
 const set=/^\/content\/(catalog[a-z0-9-]*)\.(js|json)$/.exec(pathname)?.[1];
 if(set&&(await developmentContentSets()).includes(set)){
  const catalog=await readDevelopmentCatalog(new URL(set+'.json',contentDirectory));
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
