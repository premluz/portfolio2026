import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildClientStyles} from './client-styles.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await buildClientStyles();
const dist=path.join(root,'dist');
const server=path.join(dist,'server');
const client=path.join(dist,'client');
// Worker deployments serve public files from dist/client through ASSETS.
// Keep the authored buildless frontend in dist; copy it into the hosted asset tree.
await fs.rm(client,{recursive:true,force:true});
await fs.mkdir(client,{recursive:true});
for(const entry of await fs.readdir(dist,{withFileTypes:true})){
 if(['client','server','.openai'].includes(entry.name))continue;
 await fs.cp(path.join(dist,entry.name),path.join(client,entry.name),{recursive:true});
}
await fs.mkdir(server,{recursive:true});
const catalog=JSON.parse(await fs.readFile(path.join(dist,'content/catalog.json'),'utf8'));
const publishedAssistantDocuments=catalog.documents
 .filter(document=>document.status==='published'&&(document.type==='portfolio-item'||document.type==='component'||['home','about'].includes(document.id)))
 .map(({id,type,status,title,pageTitle,intro,name,aliases,kind,category,domains,capabilities,tags,summary,context,challenge,role,highlights,keyWork,impact,blocks,evidence})=>({id,type,status,title,pageTitle,intro,name,aliases,kind,category,domains,capabilities,tags,summary,context,challenge,role,highlights,keyWork,impact,blocks,evidence}));
await fs.writeFile(path.join(server,'content.js'),`// Generated from the published content catalog.\nexport const publishedAssistantDocuments=${JSON.stringify(publishedAssistantDocuments)};\n`);
await fs.copyFile(path.join(root,'worker/index.js'),path.join(server,'index.js'));
const assistantCore=await fs.readFile(path.join(root,'worker/assistant-core.mjs'),'utf8');
await fs.writeFile(path.join(server,'assistant-core.mjs'),assistantCore.replace("'../dist/assistant-knowledge.js'","'./assistant-knowledge.js'").replace("'../dist/assistant-answer.js'","'./assistant-answer.js'"));
await fs.copyFile(path.join(dist,'assistant-knowledge.js'),path.join(server,'assistant-knowledge.js'));
await fs.copyFile(path.join(dist,'assistant-answer.js'),path.join(server,'assistant-answer.js'));
await fs.copyFile(path.join(root,'worker/voice-core.mjs'),path.join(server,'voice-core.mjs'));
let hosting=null;
try{hosting=JSON.parse(await fs.readFile(path.join(root,'.openai/hosting.json'),'utf8'));}
catch(error){if(error.code!=='ENOENT')throw error;}
const hostingOutput=path.join(dist,'.openai');
if(hosting){
 await fs.mkdir(hostingOutput,{recursive:true});
 await fs.writeFile(path.join(hostingOutput,'hosting.json'),`${JSON.stringify(hosting,null,2)}\n`);
}else await fs.rm(hostingOutput,{recursive:true,force:true});
console.log(`Built Worker endpoint with ${publishedAssistantDocuments.length} published source documents.`);
