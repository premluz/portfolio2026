import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildClientStyles} from './client-styles.mjs';
import {contentSets} from '../dist/content/sets.js';
import {DEFAULT_CONTENT_SET} from '../dist/content/content-set.js';

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
// Each content set gets its own assistant documents so answers follow whichever set is live.
const assistantDocuments=catalog=>catalog.documents
 .filter(document=>document.status==='published'&&['portfolio-item','component','page'].includes(document.type))
 .map(({id,type,status,title,pageTitle,intro,name,client,prototype,aliases,kind,category,domains,capabilities,tags,summary,context,challenge,role,highlights,keyWork,impact,blocks,evidence})=>({id,type,status,title,pageTitle,intro,name,client,prototype,aliases,kind,category,domains,capabilities,tags,summary,context,challenge,role,highlights,keyWork,impact,blocks,evidence}));
const assistantDocumentSets={};
for(const set of contentSets)assistantDocumentSets[set]=assistantDocuments(JSON.parse(await fs.readFile(path.join(dist,`content/${set}.json`),'utf8')));
const publishedAssistantDocuments=assistantDocumentSets[DEFAULT_CONTENT_SET];
await fs.writeFile(path.join(server,'content.js'),`// Generated from the published content catalogs.\nexport const assistantDocumentSets=${JSON.stringify(assistantDocumentSets)};\nexport const publishedAssistantDocuments=assistantDocumentSets[${JSON.stringify(DEFAULT_CONTENT_SET)}];\n`);
await fs.copyFile(path.join(root,'worker/index.js'),path.join(server,'index.js'));
const assistantCore=await fs.readFile(path.join(root,'worker/assistant-core.mjs'),'utf8');
await fs.writeFile(path.join(server,'assistant-core.mjs'),assistantCore.replaceAll("'../dist/","'./"));
for(const file of ['assistant-model.mjs','assistant-policy.mjs']){
 const source=await fs.readFile(path.join(root,'worker',file),'utf8');
 await fs.writeFile(path.join(server,file),source.replaceAll("'../dist/","'./"));
}
await fs.copyFile(path.join(dist,'assistant-limits.js'),path.join(server,'assistant-limits.js'));
await fs.mkdir(path.join(server,'knowledge'),{recursive:true});
await fs.copyFile(path.join(dist,'knowledge/profile.js'),path.join(server,'knowledge/profile.js'));
await fs.copyFile(path.join(dist,'assistant-knowledge.js'),path.join(server,'assistant-knowledge.js'));
await fs.copyFile(path.join(dist,'assistant-answer.js'),path.join(server,'assistant-answer.js'));
await fs.copyFile(path.join(root,'worker/voice-core.mjs'),path.join(server,'voice-core.mjs'));
await fs.copyFile(path.join(root,'worker/provider-error.mjs'),path.join(server,'provider-error.mjs'));
let hosting=null;
try{hosting=JSON.parse(await fs.readFile(path.join(root,'.openai/hosting.json'),'utf8'));}
catch(error){if(error.code!=='ENOENT')throw error;}
const hostingOutput=path.join(dist,'.openai');
if(hosting){
 await fs.mkdir(hostingOutput,{recursive:true});
 await fs.writeFile(path.join(hostingOutput,'hosting.json'),`${JSON.stringify(hosting,null,2)}\n`);
}else await fs.rm(hostingOutput,{recursive:true,force:true});
console.log(`Built Worker endpoint with ${publishedAssistantDocuments.length} published source documents.`);
