// Validation rules for project memory. Returns a list of "path:line message" strings; empty means healthy.
import fs from 'node:fs';
import path from 'node:path';
import {CONFIG_FILE} from './memory-load.mjs';

const REQUIRED=['title','type','status','owner','updated','summary','tags'];
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const EXTERNAL=/^(?:[a-z][a-z0-9+.-]*:|#)/i;
const STATUS_KEY={requirement:'requirement',task:'task',decision:'decision',fact:'fact',question:'question'};

function frontMatterIssues(doc,config){
 if(!doc.front)return [`${doc.path}:1 missing front matter`,...doc.frontErrors.map(error=>`${doc.path}:1 ${error}`)];
 const issues=doc.frontErrors.map(error=>`${doc.path}:1 ${error}`),front=doc.front;
 for(const key of REQUIRED)if(front[key]===undefined||front[key]===''||Array.isArray(front[key])&&!front[key].length)issues.push(`${doc.path}:1 front matter needs ${key}`);
 if(front.type&&!config.types.includes(front.type))issues.push(`${doc.path}:1 unknown type "${front.type}"`);
 if(front.status&&!config.statuses.document.includes(front.status)&&front.type!=='decision')issues.push(`${doc.path}:1 unknown status "${front.status}"`);
 if(front.updated&&!DATE.test(front.updated))issues.push(`${doc.path}:1 updated must be YYYY-MM-DD`);
 for(const tag of front.tags||[])if(!config.tags.includes(tag))issues.push(`${doc.path}:1 tag "${tag}" is not in ${CONFIG_FILE}`);
 return issues;
}

function decisionIssues(doc,config,ids){
 const front=doc.front;if(!front||front.type!=='decision')return [];
 const issues=[];
 if(!/^ADR-\d{3}$/.test(front.id||''))issues.push(`${doc.path}:1 a decision needs id: ADR-nnn`);
 else if(!path.basename(doc.path).startsWith(front.id))issues.push(`${doc.path}:1 file name must start with ${front.id}`);
 if(!config.statuses.decision.includes(front.status))issues.push(`${doc.path}:1 unknown decision status "${front.status}"`);
 if(front.status==='superseded'&&!ids.has(front.superseded_by))issues.push(`${doc.path}:1 superseded decision needs superseded_by naming an existing ADR`);
 return issues;
}

function itemIssues(doc,item,config,ids){
 const issues=[],where=`${doc.path}:${item.line}`,fields=item.fields,rules=config.statuses[STATUS_KEY[item.kind]];
 if(rules&&!rules.includes(fields.status))issues.push(`${where} ${item.id} status must be one of ${rules.join(', ')}`);
 for(const tag of fields.tags||[])if(!config.tags.includes(tag))issues.push(`${where} ${item.id} tag "${tag}" is not in the vocabulary`);
 for(const ref of [...(fields.depends||[]),...(fields.related||[])])if(!ids.has(ref))issues.push(`${where} ${item.id} refers to unknown ${ref}`);
 if(item.kind==='task'&&fields.status==='done'&&!fields.evidence)issues.push(`${where} ${item.id} is done but has no Evidence`);
 if(item.kind==='requirement'&&fields.status==='implemented'&&!(fields.verifies||[]).length)issues.push(`${where} ${item.id} is implemented but has no Verifies`);
 if(item.kind==='fact'&&!(fields.source&&fields.verified))issues.push(`${where} ${item.id} needs Source and Verified`);
 return issues;
}

function verifiesIssues(doc,item,root){
 const issues=[];
 for(const entry of item.fields.verifies||[])if(!entry.startsWith('manual:')&&!fs.existsSync(path.join(root,entry)))issues.push(`${doc.path}:${item.line} ${item.id} verifies missing file ${entry}`);
 return issues;
}

function dependencyCycles(tasks){
 const issues=[],state=new Map();
 const visit=(id,trail)=>{
  if(state.get(id)==='done')return;
  if(state.get(id)==='open'){issues.push(`dependency cycle: ${[...trail,id].join(' → ')}`);return;}
  state.set(id,'open');
  for(const dep of tasks.get(id)?.fields.depends||[])if(tasks.has(dep))visit(dep,[...trail,id]);
  state.set(id,'done');
 };
 for(const id of tasks.keys())visit(id,[]);
 return issues;
}

function linkIssues(doc,root){
 return doc.links.filter(link=>!EXTERNAL.test(link.target)).flatMap(link=>{
  const target=decodeURIComponent(link.target.split('#')[0]);
  return fs.existsSync(path.join(root,path.dirname(doc.path),target))?[]:[`${doc.path}:${link.line} broken link ${link.target}`];
 });
}

/** Every ID defined by an item heading or a decision's front matter, with duplicates reported. */
export function collectIds(docs){
 const ids=new Map(),duplicates=[];
 const add=(id,where)=>{if(ids.has(id))duplicates.push(`${where} duplicate ${id} (also ${ids.get(id)})`);else ids.set(id,where);};
 for(const doc of docs){
  if(doc.front?.id)add(doc.front.id,`${doc.path}:1`);
  for(const item of doc.items)add(item.id,`${doc.path}:${item.line}`);
 }
 return {ids,duplicates};
}

export function validateMemory(docs,config,root){
 const {ids,duplicates}=collectIds(docs),known=new Set(ids.keys()),tasks=new Map(),issues=[...duplicates];
 for(const doc of docs){
  issues.push(...frontMatterIssues(doc,config),...decisionIssues(doc,config,known),...linkIssues(doc,root));
  for(const item of doc.items){
   issues.push(...itemIssues(doc,item,config,known),...verifiesIssues(doc,item,root));
   if(item.kind==='task')tasks.set(item.id,item);
  }
  for(const ref of doc.front?.related||[])if(!known.has(ref)&&!fs.existsSync(path.join(root,ref)))issues.push(`${doc.path}:1 related "${ref}" is not an ID or a file`);
  for(const mention of doc.mentions)if(!known.has(mention.id))issues.push(`${doc.path}:${mention.line} mentions unknown ${mention.id}`);
 }
 return [...issues,...dependencyCycles(tasks)];
}
