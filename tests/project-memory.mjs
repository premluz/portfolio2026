import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseFrontMatter,scanBody} from '../scripts/memory-parse.mjs';
import {loadDocs,readConfig} from '../scripts/memory-load.mjs';
import {validateMemory} from '../scripts/memory-validate.mjs';
import {nextTasks,searchMemory,staleIndexIssues,taskContext,writeIndex} from '../scripts/memory-index.mjs';

// 1. Front matter: scalars, lists and quoted values parse; a missing or unclosed block is reported, not guessed.
const front=parseFrontMatter('---\ntitle: "A: title"\ntags: [area/home, kind/bug]\nupdated: 2026-10-26\n---\n# Body\n');
assert.deepEqual(front.data,{title:'A: title',tags:['area/home','kind/bug'],updated:'2026-10-26'});
assert.equal(front.bodyStart,5);
assert.equal(parseFrontMatter('# No front matter').data,null);
assert.match(parseFrontMatter('---\ntitle: x\n').errors[0],/not closed/);

// 2. Items need a heading ID; bullets under it become fields; fenced code is ignored.
const scanned=scanBody('## TASK-001 First\n- Status: todo\n- Depends: TASK-002, TASK-003\n- Verifies: tests/a.mjs; manual: looked\n\nSee [x](other.md) and TASK-009.\n```\n## TASK-777 Not real\n```\n');
assert.deepEqual(scanned.items.map(item=>item.id),['TASK-001'],'A heading inside a code fence is not an item');
assert.deepEqual(scanned.items[0].fields.depends,['TASK-002','TASK-003']);
assert.deepEqual(scanned.items[0].fields.verifies,['tests/a.mjs','manual: looked']);
assert.deepEqual(scanned.mentions.map(mention=>mention.id),['TASK-009'],'Only prose mentions count, not definitions or code');
assert.equal(scanned.links[0].target,'other.md');

// A throwaway project with a small, healthy memory.
const root=await fs.mkdtemp(path.join(os.tmpdir(),'memory-'));
const put=async(file,text)=>{await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),text);};
const head=(extra='')=>`---\ntitle: Doc\ntype: spec\nstatus: active\nowner: Prem\nupdated: 2026-10-26\nsummary: A fixture document\ntags: [area/home]\n${extra}---\n`;
await put('docs/memory.config.json',JSON.stringify({types:['spec','tasks','decision'],statuses:{document:['active'],decision:['accepted','superseded'],task:['todo','done','blocked'],requirement:['implemented'],fact:['verified'],question:['open']},tags:['area/home','kind/bug']}));
await put('tests/real.mjs','// a test');
const tasks=(body)=>put('TASKS.md',head()+'# Tasks\n'+body);
const healthy='## TASK-001 Build it\n- Status: done\n- Evidence: tests/real.mjs passes\n\n## TASK-002 Use it\n- Status: todo\n- Depends: TASK-001\n\n## TASK-003 Later\n- Status: todo\n- Depends: TASK-002\n';
await tasks(healthy);
await put('README.md',head()+'See [tasks](TASKS.md) and TASK-001.\n');
const config=await readConfig(root);
const check=async()=>validateMemory(await loadDocs(root),config,root);

// 3. A healthy memory has no issues.
assert.deepEqual(await check(),[]);

// 4. Each broken rule is caught with a useful location.
await put('README.md',head()+'See [gone](NOPE.md).\n');
assert((await check()).some(issue=>/README\.md:\d+ broken link NOPE\.md/.test(issue)),'Broken relative links are reported');
await put('README.md',head()+'See TASK-099.\n');
assert((await check()).some(issue=>/mentions unknown TASK-099/.test(issue)),'Mentions of unknown IDs are reported');
await put('README.md',head().replace('area/home','area/invented')+'ok\n');
assert((await check()).some(issue=>/tag "area\/invented"/.test(issue)),'Tags outside the controlled vocabulary are reported');
await put('README.md','# no front matter\n');
assert((await check()).some(issue=>/README\.md:1 missing front matter/.test(issue)));
await put('README.md',head()+'ok\n');

await tasks(healthy.replace('- Evidence: tests/real.mjs passes\n',''));
assert((await check()).some(issue=>/TASK-001 is done but has no Evidence/.test(issue)),'Done needs evidence');
await tasks(healthy.replace('- Depends: TASK-001','- Depends: TASK-404'));
assert((await check()).some(issue=>/TASK-002 refers to unknown TASK-404/.test(issue)),'Dependencies must exist');
await tasks(healthy+'## TASK-004 Loop\n- Status: todo\n- Depends: TASK-005\n\n## TASK-005 Loop back\n- Status: todo\n- Depends: TASK-004\n');
assert((await check()).some(issue=>/dependency cycle: TASK-004 → TASK-005 → TASK-004/.test(issue)),'Dependency cycles are reported');
await tasks(healthy+'## TASK-001 Duplicate\n- Status: todo\n');
assert((await check()).some(issue=>/duplicate TASK-001/.test(issue)),'IDs are unique');
await tasks(healthy);

// 5. Decisions carry their ID in the file name, and a superseded one names its replacement.
await put('docs/decisions/ADR-001-first.md',head('id: ADR-001\n').replace('type: spec','type: decision').replace('status: active','status: superseded')+'x\n');
assert((await check()).some(issue=>/superseded decision needs superseded_by/.test(issue)));
await put('docs/decisions/ADR-001-first.md',head('id: ADR-001\nsuperseded_by: ADR-002\n').replace('type: spec','type: decision').replace('status: active','status: superseded')+'x\n');
await put('docs/decisions/ADR-002-second.md',head('id: ADR-002\n').replace('type: spec','type: decision').replace('status: active','status: accepted')+'x\n');
assert.deepEqual(await check(),[],'A superseded decision pointing at a real successor is healthy');

// 6. The index detects stale entries by content hash, not by date.
const docs=await loadDocs(root);
assert.deepEqual(await staleIndexIssues(root,docs),[`docs/memory-index.json is missing`]);
await writeIndex(root,docs);
assert.deepEqual(await staleIndexIssues(root,docs),[]);
await put('README.md',head()+'edited\n');
assert.deepEqual(await staleIndexIssues(root,await loadDocs(root)),['README.md changed since the index was built']);
await put('NEW.md',head()+'new\n');
assert((await staleIndexIssues(root,await loadDocs(root))).includes('NEW.md is not in the index'));
await fs.rm(path.join(root,'NEW.md'));await put('README.md',head()+'ok\n');

// 7. Search filters by metadata and ranks title and summary matches above body text.
const fresh=await loadDocs(root);
assert.deepEqual(searchMemory(fresh,{query:'fixture',type:'decision'}).map(hit=>hit.id).sort(),['ADR-001','ADR-002'],'The type filter keeps only decisions');
assert(searchMemory(fresh,{query:'fixture',type:'spec'}).every(hit=>!hit.path.startsWith('docs/decisions/')),'...and excludes them for another type');
assert.equal(searchMemory(fresh,{tag:'area/home'}).length,fresh.length,'Tag filters apply');
const found=searchMemory(fresh,{query:'build it'});
const tasksDoc=fresh.find(doc=>doc.path==='TASKS.md');
assert.equal(found[0].path,'TASKS.md');assert.equal(found[0].line,tasksDoc.text.split('\n').findIndex(text=>text.includes('Build it'))+1,'A hit points at the first matching line');

// 8. "Next" lists only tasks whose dependencies are done, and task context explains them.
assert.deepEqual(nextTasks(fresh).map(task=>task.id),['TASK-002'],'TASK-003 waits on TASK-002');
const context=taskContext(fresh,'TASK-003');
assert.deepEqual(context.dependencies,[{id:'TASK-002',title:'Use it',status:'todo'}]);
assert.equal(taskContext(fresh,'TASK-999'),null);

await fs.rm(root,{recursive:true,force:true});
console.log('Project memory passed: front matter, items, links, IDs, tags, evidence, dependencies and cycles, decisions, hash-based index freshness, search and next-task.');
