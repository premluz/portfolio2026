// Walks the static import graph from dist/app.js: what a first visit must download before the app runs.
// Dynamic import() is not followed, which is the point: it is how a module leaves the first-load graph.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const STATIC_SPECIFIER=/\b(?:import|export)\s*(?:[\w*${}\s,]+?\s*from\s*)?['"]([^'"]+)['"]/g;
export const THREE_PATH='vendor/three/three.module.js';

export async function moduleGraph(entry,dist){
 const seen=new Map(),parents=new Map(),queue=[path.resolve(dist,entry)];
 while(queue.length){
  const file=queue.shift();
  if(seen.has(file))continue;
  let source;
  try{source=await fs.readFile(file,'utf8');}catch(error){throw new Error(`Cannot read ${file}`,{cause:error});}
  seen.set(file,Buffer.byteLength(source));
  for(const [,specifier] of source.matchAll(STATIC_SPECIFIER)){
   if(!specifier.startsWith('.'))throw new Error(`${path.relative(dist,file)} imports bare specifier ${specifier}; the browser cannot resolve it`);
   const target=path.resolve(path.dirname(file),specifier);
   if(!parents.has(target))parents.set(target,path.relative(dist,file));
   queue.push(target);
  }
 }
 const modules=[...seen].map(([file,bytes])=>({file:path.relative(dist,file),bytes,importedBy:parents.get(file)||null}));
 return {modules,count:modules.length,bytes:modules.reduce((sum,m)=>sum+m.bytes,0),threeReachable:modules.some(m=>m.file===THREE_PATH)};
}

// Lets the browser fetch the whole static graph at once instead of discovering each import one level at a time.
// Modules the page already preloads by hand are not listed twice.
export const modulePreloadTags=(graph,html='')=>graph.modules.filter(m=>m.file!=='app.js'&&!html.includes(`rel="modulepreload" href="${m.file}"`)).map(m=>`<link rel="modulepreload" href="${m.file}">`).join('');

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const dist=fileURLToPath(new URL('../dist/',import.meta.url)),graph=await moduleGraph('app.js',dist);
 console.log(`${graph.count} modules, ${(graph.bytes/1024).toFixed(0)} KB raw, three.js reachable: ${graph.threeReachable}`);
 if(process.argv.includes('--list'))for(const m of [...graph.modules].sort((a,b)=>b.bytes-a.bytes).slice(0,40))console.log(String(m.bytes).padStart(8),m.file,'<-',m.importedBy);
}
