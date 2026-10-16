import fs from 'node:fs/promises';
import {exportPublishedCatalog} from '../dist/content/model.js';
import {clientStyles} from '../scripts/client-styles.mjs';

const catalogFile=new URL('../content/catalog.json',import.meta.url);

export async function readDevelopmentCatalog(filename=catalogFile){
 let catalog;
 try{catalog=JSON.parse(await fs.readFile(filename,'utf8'));}
 catch(error){throw new Error(`Cannot read development catalog: ${filename}`,{cause:error});}
 return exportPublishedCatalog(catalog);
}

export async function developmentResponse(pathname){
 if(pathname==='/content/catalog.js'||pathname==='/content/catalog.json'){
  const catalog=await readDevelopmentCatalog();
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
