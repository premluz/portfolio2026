// Read-only project memory MCP server over stdio (newline-delimited JSON-RPC). Not registered anywhere by default;
// see docs/MEMORY_MCP.md. Documents are re-read on every request, so edits show up without a restart.
import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import {loadDocs} from './memory-load.mjs';
import {handleMessage} from './memory-mcp-core.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const send=message=>process.stdout.write(JSON.stringify(message)+'\n');

// Messages are handled strictly one after another, so replies keep the order requests arrived in.
let queue=Promise.resolve();
readline.createInterface({input:process.stdin}).on('line',line=>{queue=queue.then(()=>handleLine(line));});

async function handleLine(line){
 if(!line.trim())return;
 let message;
 try{message=JSON.parse(line);}
 catch(error){send({jsonrpc:'2.0',id:null,error:{code:-32700,message:`Parse error: ${error.message}`}});return;}
 try{
  const response=handleMessage(message,await loadDocs(root));
  if(response)send(response);
 }catch(error){
  console.error('project-memory MCP:',error);
  if(message.id!==undefined)send({jsonrpc:'2.0',id:message.id,error:{code:-32603,message:`Internal error: ${error.message}`}});
 }
}
