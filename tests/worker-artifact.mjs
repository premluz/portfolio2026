import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {clientStyles,versionClientStyles} from '../scripts/client-styles.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const build=spawnSync(process.execPath,['scripts/build-worker.mjs'],{cwd:root,encoding:'utf8'});
assert.equal(build.status,0,build.stderr);
const client=new URL('../dist/client/',import.meta.url);
for(const file of ['site.css','app.js','media-loading.js','image-variants.js','home-about.css','home-about.js','home-sections.css','home-sections.js','home-services.js','home-service-illustrations.js','home-testimonials.js','portfolio-assistant.js','content/catalog.json']){
 const actual=await fs.readFile(new URL(file,client));
 const authored=await fs.readFile(new URL('../dist/'+file,import.meta.url));
 assert(actual.equals(authored),`The hosted asset tree must preserve ${file}.`);
}
const expectedCSS=(await Promise.all(clientStyles.map(file=>fs.readFile(new URL('../dist/'+file,import.meta.url),'utf8')))).map((style,index)=>`/* ${clientStyles[index]} */\n${style}`).join('\n');
assert.equal(await fs.readFile(new URL('site.css',client),'utf8'),expectedCSS,'The hosted CSS bundle retains every current rule in its original cascade order');
const authoredHTML=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const hostedHTML=await fs.readFile(new URL('index.html',client),'utf8');
assert.equal(hostedHTML,versionClientStyles(authoredHTML,expectedCSS),'Hosted HTML versions the stylesheet without changing other authored content');
assert.match(hostedHTML,/href="site\.css\?v=[a-f0-9]{64}"/,'The deployed stylesheet URL includes its content digest');
assert.notEqual(versionClientStyles(authoredHTML,'a{cursor:pointer}'),versionClientStyles(authoredHTML,'button{cursor:default}'),'Different stylesheet contents invalidate the browser cache');
assert.throws(()=>versionClientStyles('<html></html>',expectedCSS),/missing the site.css stylesheet link/,'Missing stylesheet links fail the build');
for(const privatePath of ['server','.openai']){
 await assert.rejects(fs.access(new URL(privatePath,client)),`Server-only output must stay outside public assets: ${privatePath}.`);
}
const sourceHosting=await fs.readFile(new URL('../.openai/hosting.json',import.meta.url),'utf8').catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
if(sourceHosting){
 const hosting=JSON.parse(await fs.readFile(new URL('../dist/.openai/hosting.json',import.meta.url),'utf8'));
 assert(!hosting.static,'The API needs a Worker deployment.');
 assert.equal(hosting.project_id,JSON.parse(sourceHosting).project_id);
 console.log('Worker artifact passed: public frontend assets preserved, server output excluded, and Site identity retained.');
}else{
 await assert.rejects(fs.access(new URL('../dist/.openai/hosting.json',import.meta.url)),'Portable builds must not invent or retain a Site identity.');
 console.log('Worker artifact passed: public frontend assets preserved, server output excluded, and hosting identity omitted for portable builds.');
}
