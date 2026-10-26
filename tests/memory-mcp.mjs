import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadDocs} from '../scripts/memory-load.mjs';
import {TOOLS,handleMessage} from '../scripts/memory-mcp-core.mjs';

const root=fileURLToPath(new URL('..',import.meta.url)),docs=await loadDocs(root);
const call=(name,args={})=>handleMessage({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}},docs).result;
const textOf=result=>result.content[0].text;

// 1. Protocol basics: notifications get no reply; unknown methods are errors; the tool list is read-only by construction.
assert.equal(handleMessage({jsonrpc:'2.0',method:'notifications/initialized'},docs),null,'A notification has no response');
assert.equal(handleMessage({jsonrpc:'2.0',id:2,method:'nope'},docs).error.code,-32601);
assert.equal(handleMessage({jsonrpc:'2.0',id:3,method:'initialize',params:{}},docs).result.capabilities.tools instanceof Object,true);
assert.deepEqual(TOOLS.map(tool=>tool.name).sort(),['memory_next','memory_read','memory_search','memory_task']);
assert(TOOLS.every(tool=>tool.annotations.readOnlyHint===true&&tool.annotations.destructiveHint===false),'Every tool declares itself read-only');
assert(!TOOLS.some(tool=>/write|edit|delete|update|create/.test(tool.name)),'No write-style tools exist');

// 2. Tools return real project memory with source references.
const search=textOf(call('memory_search',{query:'backdrop crop',type:'decision'}));
assert(/docs\/decisions\/ADR-002-[^:]+:\d+\s+ADR-002/.test(search),'Search finds the backdrop decision with a path:line source');
const item=textOf(call('memory_read',{id:'FACT-001'}));
assert(item.startsWith('Source: docs/FACTS.md:')&&item.includes('55 megapixels'),'An item is read by ID with its source');
assert(textOf(call('memory_read',{id:'ADR-001'})).includes('Source: docs/decisions/ADR-001'),'A decision is read by its front-matter ID');
assert.match(textOf(call('memory_next')),/TASK-001/,'Ready tasks are listed');
const task=textOf(call('memory_task',{id:'TASK-009'}));
assert(task.includes('Depends on:')&&task.includes('TASK-010 [done]'),'Task context includes dependencies');

// 3. Only memory documents are readable: no path can escape, and failures are tool errors, not crashes.
for(const path of ['../package.json','/etc/hosts','dist/content/catalog.json','content/catalog.json','.env'])
 assert.equal(call('memory_read',{path}).isError,true,`${path} is not a memory document`);
assert.equal(call('memory_read',{path:'docs/FACTS.md'}).isError,false);
assert.equal(call('memory_read',{id:'TASK-999'}).isError,true);
assert.equal(call('memory_read',{}).isError,true);
assert.equal(handleMessage({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'memory_delete',arguments:{}}},docs).error.code,-32602,'An unknown tool is rejected');

// 4. The real stdio server answers over a pipe, one JSON line per message.
const server=spawn(process.execPath,['scripts/memory-mcp.mjs'],{cwd:root,stdio:['pipe','pipe','inherit']});
const lines=[];let buffer='';
server.stdout.on('data',chunk=>{buffer+=chunk;let index;while((index=buffer.indexOf('\n'))>=0){lines.push(JSON.parse(buffer.slice(0,index)));buffer=buffer.slice(index+1);}});
const waitFor=async count=>{const deadline=Date.now()+10000;while(lines.length<count&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));assert(lines.length>=count,'The server replied in time');};
server.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'0'}}})+'\n');
server.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
server.stdin.write(JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'memory_read',arguments:{id:'REQ-001'}}})+'\n');
server.stdin.write('not json\n');
await waitFor(3);
assert.equal(lines[0].id,1);assert.equal(lines[0].result.serverInfo.name,'project-memory');
assert.equal(lines[1].id,2);assert(lines[1].result.content[0].text.includes('Generated image copies'),'The server reads live documents');
assert.equal(lines[2].error.code,-32700,'Malformed input is a parse error, and the server keeps running');
server.kill();
console.log('Memory MCP passed: protocol, read-only tools, sources, path confinement, unknown tools and a real stdio session.');
