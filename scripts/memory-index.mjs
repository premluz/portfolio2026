// The memory index (docs/memory-index.json), its freshness check, search, and "what is next" for tasks.
// The index is deterministic (no timestamps), so rebuilding unchanged documents produces no diff.
import fs from 'node:fs/promises';
import path from 'node:path';
import {INDEX_FILE} from './memory-load.mjs';

const entryOf=doc=>({
 path:doc.path,id:doc.front?.id||null,title:doc.front?.title||null,type:doc.front?.type||null,status:doc.front?.status||null,
 updated:doc.front?.updated||null,summary:doc.front?.summary||null,tags:doc.front?.tags||[],related:doc.front?.related||[],hash:doc.hash,
 items:doc.items.map(item=>({id:item.id,title:item.title,status:item.fields.status||null,tags:item.fields.tags||[]}))
});

export const buildIndex=docs=>({format:'project-memory-index',version:1,documents:docs.map(entryOf)});
export const writeIndex=async(root,docs)=>fs.writeFile(path.join(root,INDEX_FILE),JSON.stringify(buildIndex(docs),null,2)+'\n');

/** Messages for index entries that no longer match the documents on disk (changed, added or removed). */
export async function staleIndexIssues(root,docs){
 let index;
 try{index=JSON.parse(await fs.readFile(path.join(root,INDEX_FILE),'utf8'));}
 catch(error){if(error.code==='ENOENT')return [`${INDEX_FILE} is missing`];throw new Error(`Cannot read ${INDEX_FILE}`,{cause:error});}
 const indexed=new Map(index.documents.map(entry=>[entry.path,entry.hash])),current=new Map(docs.map(doc=>[doc.path,doc.hash]));
 const issues=[];
 for(const [file,digest] of current){
  if(!indexed.has(file))issues.push(`${file} is not in the index`);
  else if(indexed.get(file)!==digest)issues.push(`${file} changed since the index was built`);
 }
 for(const file of indexed.keys())if(!current.has(file))issues.push(`${file} is in the index but no longer exists`);
 return issues;
}

const matches=(values,wanted)=>!wanted||values.includes(wanted);

/** Filter by tag/type/status, then rank by where the query terms appear. Each hit carries path:line of the first body match. */
export function searchMemory(docs,{query='',tag,type,status}={}){
 const terms=query.toLowerCase().split(/\s+/).filter(Boolean),results=[];
 for(const doc of docs){
  const front=doc.front||{};
  if(!matches(front.tags||[],tag)||(type&&front.type!==type)||(status&&front.status!==status))continue;
  const lines=doc.text.split('\n'),weighted=[[front.title,3],[front.summary,2],[(front.tags||[]).join(' '),2],[doc.items.map(item=>item.title).join(' '),2]];
  let score=0,line=1;
  for(const term of terms){
   for(const [field,weight] of weighted)if(field?.toLowerCase().includes(term))score+=weight;
   const hit=lines.findIndex(text=>text.toLowerCase().includes(term));
   if(hit>=0){score+=1;if(line===1)line=hit+1;}
  }
  if(terms.length&&!score)continue;
  results.push({path:doc.path,line,id:front.id||null,title:front.title||doc.path,summary:front.summary||'',score});
 }
 return results.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
}

const allTasks=docs=>docs.flatMap(doc=>doc.items.filter(item=>item.kind==='task').map(item=>({...item,path:doc.path})));

/** Open tasks whose dependencies are all done, in ID order. */
export function nextTasks(docs){
 const tasks=allTasks(docs),status=new Map(tasks.map(task=>[task.id,task.fields.status]));
 return tasks.filter(task=>['todo','in-progress'].includes(task.fields.status)&&(task.fields.depends||[]).every(dep=>status.get(dep)==='done')).sort((a,b)=>a.id.localeCompare(b.id));
}

/** One task with its dependencies' status, the IDs it mentions, and its text, for resuming work. */
export function taskContext(docs,id){
 const task=allTasks(docs).find(item=>item.id===id);if(!task)return null;
 const doc=docs.find(candidate=>candidate.path===task.path),titles=new Map(docs.flatMap(d=>d.items.map(item=>[item.id,item]))),statusOf=ref=>titles.get(ref)?.fields.status||'?';
 const mentioned=[...new Set(doc.mentions.filter(m=>m.line>task.line&&m.line<=task.end).map(m=>m.id))].filter(ref=>ref!==id);
 return {
  id,title:task.title,path:task.path,line:task.line,fields:task.fields,
  dependencies:(task.fields.depends||[]).map(ref=>({id:ref,title:titles.get(ref)?.title,status:statusOf(ref)})),
  mentioned:mentioned.map(ref=>({id:ref,title:titles.get(ref)?.title,status:statusOf(ref)})),
  text:doc.text.split('\n').slice(task.line-1,task.end).join('\n').trimEnd()
 };
}
