// Finds and reads the project memory documents: top-level Markdown files plus everything under docs/.
import fs from 'node:fs/promises';
import path from 'node:path';
import {hash,parseFrontMatter,scanBody} from './memory-parse.mjs';

export const CONFIG_FILE='docs/memory.config.json';
export const INDEX_FILE='docs/memory-index.json';

async function markdownUnder(directory,root){
 const found=[];
 for(const entry of await fs.readdir(path.join(root,directory),{withFileTypes:true})){
  const relative=path.posix.join(directory,entry.name);
  if(entry.isDirectory())found.push(...await markdownUnder(relative,root));
  else if(entry.name.endsWith('.md'))found.push(relative);
 }
 return found;
}

export async function memoryFiles(root){
 const top=(await fs.readdir(root,{withFileTypes:true})).filter(entry=>entry.isFile()&&entry.name.endsWith('.md')).map(entry=>entry.name);
 const docs=await fs.readdir(path.join(root,'docs')).then(()=>markdownUnder('docs',root),error=>{if(error.code==='ENOENT')return [];throw error;});
 return [...top,...docs].sort();
}

export async function readConfig(root){
 try{return JSON.parse(await fs.readFile(path.join(root,CONFIG_FILE),'utf8'));}
 catch(error){throw new Error(`Cannot read ${CONFIG_FILE}`,{cause:error});}
}

export async function loadDocs(root){
 const docs=[];
 for(const file of await memoryFiles(root)){
  const text=await fs.readFile(path.join(root,file),'utf8'),front=parseFrontMatter(text);
  docs.push({path:file,text,hash:hash(text),front:front.data,frontErrors:front.errors,...scanBody(text,front.bodyStart)});
 }
 return docs;
}
