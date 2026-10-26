// Project memory tool. Usage:
//   node scripts/memory.mjs index                      rebuild docs/memory-index.json
//   node scripts/memory.mjs check                      validate documents, IDs, links, tags, tasks and index freshness
//   node scripts/memory.mjs search <words> [--tag area/x] [--type spec] [--status active]
//   node scripts/memory.mjs next                       open tasks whose dependencies are done
//   node scripts/memory.mjs task TASK-nnn              one task with its dependencies and referenced items
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadDocs,readConfig} from './memory-load.mjs';
import {validateMemory} from './memory-validate.mjs';
import {nextTasks,searchMemory,staleIndexIssues,taskContext,writeIndex} from './memory-index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [command,...args]=process.argv.slice(2);

function parseSearchArgs(values){
 const options={query:[]};
 for(let index=0;index<values.length;index++){
  const value=values[index];
  if(value.startsWith('--'))options[value.slice(2)]=values[++index];
  else options.query.push(value);
 }
 return {...options,query:options.query.join(' ')};
}

const commands={
 async index(docs){await writeIndex(root,docs);console.log(`Indexed ${docs.length} documents.`);},
 async check(docs){
  const issues=[...validateMemory(docs,await readConfig(root),root),...await staleIndexIssues(root,docs)];
  if(issues.length){console.error(`Project memory has ${issues.length} problem${issues.length===1?'':'s'}:\n`+issues.map(issue=>`  ${issue}`).join('\n')+'\nFix them, then run `npm run memory:index`.');process.exit(1);}
  console.log(`Project memory healthy: ${docs.length} documents, ${docs.reduce((sum,doc)=>sum+doc.items.length,0)} items, index current.`);
 },
 async search(docs){
  const results=searchMemory(docs,parseSearchArgs(args));
  if(!results.length)console.log('No matching documents.');
  for(const result of results)console.log(`${result.path}:${result.line}  ${result.id?result.id+'  ':''}${result.title}\n    ${result.summary}`);
 },
 async next(docs){
  const tasks=nextTasks(docs);
  if(!tasks.length)console.log('No open task is ready.');
  for(const task of tasks)console.log(`${task.id}  [${task.fields.status}]  ${task.title}  (${task.path}:${task.line})`);
 },
 async task(docs){
  const context=taskContext(docs,args[0]);
  if(!context){console.error(`No task ${args[0]}.`);process.exit(1);}
  console.log(context.text);
  for(const [label,list] of [['Depends on',context.dependencies],['Mentions',context.mentioned]])if(list.length)console.log(`\n${label}:\n`+list.map(item=>`  ${item.id} [${item.status}] ${item.title||''}`).join('\n'));
 }
};

if(!commands[command]){console.error(`Usage: node scripts/memory.mjs ${Object.keys(commands).join('|')}`);process.exit(2);}
await commands[command](await loadDocs(root));
