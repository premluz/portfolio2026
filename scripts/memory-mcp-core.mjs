// Read-only MCP interface over project memory: JSON-RPC 2.0 request handling, no I/O of its own.
// It exposes only the memory documents found by memory-load.mjs, never user chat content, and has no write tools.
import {nextTasks,searchMemory,taskContext} from './memory-index.mjs';

export const PROTOCOL_VERSION='2025-06-18';
const SERVER_INFO={name:'project-memory',version:'1.0.0'};
const MAX_RESULTS=20;

const tool=(name,description,properties,required=[])=>({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}});
export const TOOLS=[
 tool('memory_search','Search project memory documents. Filters narrow by tag, type or status; results carry path:line sources.',{query:{type:'string'},tag:{type:'string'},type:{type:'string'},status:{type:'string'}}),
 tool('memory_read','Read one memory item by ID (REQ-/TASK-/ADR-/FACT-/Q-nnn) or one memory document by path. Returns the text with its source.',{id:{type:'string'},path:{type:'string'}}),
 tool('memory_next','List open tasks whose dependencies are all done.',{}),
 tool('memory_task','Read one task with its dependencies and the IDs it mentions.',{id:{type:'string'}},['id'])
];

const text=(value,isError=false)=>({content:[{type:'text',text:value}],isError});
const source=(path,line)=>`${path}:${line}`;

function readItem(docs,id){
 for(const doc of docs){
  const item=doc.items.find(candidate=>candidate.id===id);
  if(item)return {path:doc.path,line:item.line,body:doc.text.split('\n').slice(item.line-1,item.end).join('\n').trimEnd()};
  if(doc.front?.id===id)return {path:doc.path,line:1,body:doc.text};
 }
 return null;
}

const calls={
 memory_search:(docs,args)=>{
  const hits=searchMemory(docs,args).slice(0,MAX_RESULTS);
  return text(hits.length?hits.map(hit=>`${source(hit.path,hit.line)}  ${hit.id?hit.id+'  ':''}${hit.title}\n  ${hit.summary}`).join('\n'):'No matching documents.');
 },
 memory_read:(docs,args)=>{
  if(args.id){const found=readItem(docs,args.id);return found?text(`Source: ${source(found.path,found.line)}\n\n${found.body}`):text(`No item ${args.id}.`,true);}
  if(args.path){
   // Only documents the loader found are readable, so a path can never reach outside project memory.
   const doc=docs.find(candidate=>candidate.path===args.path);
   return doc?text(`Source: ${doc.path}\n\n${doc.text}`):text(`${args.path} is not a project memory document.`,true);
  }
  return text('Give an id or a path.',true);
 },
 memory_next:docs=>{
  const tasks=nextTasks(docs);
  return text(tasks.length?tasks.map(task=>`${task.id} [${task.fields.status}] ${task.title} (${source(task.path,task.line)})`).join('\n'):'No open task is ready.');
 },
 memory_task:(docs,args)=>{
  const context=taskContext(docs,args.id);
  if(!context)return text(`No task ${args.id}.`,true);
  const section=(label,list)=>list.length?`\n\n${label}:\n`+list.map(item=>`  ${item.id} [${item.status}] ${item.title||''}`).join('\n'):'';
  return text(`Source: ${source(context.path,context.line)}\n\n${context.text}${section('Depends on',context.dependencies)}${section('Mentions',context.mentioned)}`);
 }
};

const reply=(id,result)=>({jsonrpc:'2.0',id,result});
const failure=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}});

/** Handles one parsed JSON-RPC message; returns the response, or null for a notification. */
export function handleMessage(message,docs){
 const {id,method,params={}}=message;
 if(id===undefined)return null;
 if(method==='initialize')return reply(id,{protocolVersion:PROTOCOL_VERSION,capabilities:{tools:{}},serverInfo:SERVER_INFO,instructions:'Read-only project memory: search documents, read an item by ID, list ready tasks.'});
 if(method==='ping')return reply(id,{});
 if(method==='tools/list')return reply(id,{tools:TOOLS});
 if(method==='tools/call'){
  const call=calls[params.name];
  if(!call)return failure(id,-32602,`Unknown tool ${params.name}`);
  try{return reply(id,call(docs,params.arguments||{}));}
  catch(error){return reply(id,text(`Tool failed: ${error.message}`,true));}
 }
 return failure(id,-32601,`Method not found: ${method}`);
}
