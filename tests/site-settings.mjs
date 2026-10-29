import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readPublishedSettings,publishedSettingsModule} from '../scripts/site-settings.mjs';
import {applyActiveSettings,applySiteSettings,revisionKey} from '../dist/site-settings.js';

const styleOptions=['ghost','outline','glass'];
const controls=[{id:'controlStyle',tagName:'SELECT',dataset:{},options:styleOptions.map(value=>({value}))},
 {id:'cardGlassStyle',tagName:'INPUT',type:'checkbox',dataset:{}},
 ...['Navigation','Projects','Carousels','Suggestions','Utilities'].map(group=>({id:'controlStyle'+group,tagName:'SELECT',dataset:{},options:['inherit',...styleOptions].map(value=>({value}))}))];
const root={querySelector:()=>({querySelectorAll:()=>controls})};
const saved=new Map([['unrelated','keep'],['prem-control-style-navigation','outline']]);
const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
const profile=settings=>({format:'prem-portfolio-settings',version:1,settings});
function verifyPublishedStyles(actual){
 const legacy=profile({plainNav:actual.settings.plainNav,glassStyle:actual.settings.glassStyle});
 const options={root,storage,preset:legacy,revision:'legacy'};
 const messages=[],originalError=console.error;
 try{
  console.error=(...args)=>messages.push(args);
  assert.equal(applyActiveSettings({export:legacy,revision:options.revision},options),true);
 }finally{console.error=originalError;}
 assert.deepEqual(messages,[],'The published legacy profile loads without logging or falling back');
 assert.equal(saved.get('prem-control-style'),'ghost');assert.equal(saved.get('prem-card-glass-style'),'true');
 assert.equal(saved.get('prem-control-style-navigation'),'outline','Published legacy settings preserve local overrides');
 storage.setItem('prem-control-style','outline');storage.setItem('prem-card-glass-style','false');
 const userOverrides=new Map(saved);
 assert.equal(applySiteSettings(options),false);assert.deepEqual(saved,userOverrides,'An unchanged revision preserves user overrides');
 assert.equal(applySiteSettings({...options,preset:profile({controlStyle:'glass',cardGlassStyle:false,controlStyleNavigation:'inherit',plainNav:true,glassStyle:true}),revision:'current'}),true);
 assert.equal(saved.get('prem-control-style'),'glass');assert.equal(saved.get('prem-card-glass-style'),'false');assert.equal(saved.get('prem-control-style-navigation'),'inherit');
 assert.equal(saved.get(revisionKey),'current');assert.equal(saved.get('unrelated'),'keep');
 assert(!saved.has('prem-plain-nav')&&!saved.has('prem-glass-style'));
 const before=new Map(saved);
 for(const settings of [{plainNav:true,unapprovedStyle:true},{plainNav:'true'},{glassStyle:null},{controlStyle:'ghost',glassStyle:'false'}]){
  assert.throws(()=>applySiteSettings({...options,preset:profile(settings),revision:'invalid'}),/unsupported controls: unapprovedStyle|Invalid setting: (plainNav|glassStyle)/);
  assert.deepEqual(saved,before,'Rejected profiles leave settings and revision untouched');
 }
}

const directory=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-site-settings-'));
const EXPORT_STEP_MS=1000;
try{
 const actual=(await readPublishedSettings()).preset;
 verifyPublishedStyles(actual);
 const nextTimestamp=step=>new Date(Date.parse(actual.exportedAt)+step*EXPORT_STEP_MS).toISOString();
 await fs.writeFile(path.join(directory,'z-later-filename.json'),JSON.stringify(actual));
 assert.deepEqual((await readPublishedSettings(directory)).preset,actual);
 const different={format:actual.format,version:actual.version,exportedAt:nextTimestamp(1),settings:{homeProductDisplay:'text',cardBackground:true,'design.typeSize':'large','carousel.tilt':12}};
 await fs.writeFile(path.join(directory,'a-earlier-filename.json'),JSON.stringify(different));
 const latest=await readPublishedSettings(directory);
 assert.equal(latest.source,'a-earlier-filename.json');
 const module=await import('data:text/javascript,'+encodeURIComponent(publishedSettingsModule(latest)));
 assert.deepEqual(module.publishedSettings,different);
 await fs.writeFile(path.join(directory,latest.source),JSON.stringify({...different,exportedAt:nextTimestamp(2)}));
 assert.equal((await readPublishedSettings(directory)).revision,latest.revision,'Re-exporting identical settings preserves local overrides');
 await fs.writeFile(path.join(directory,'same-time.json'),JSON.stringify({...different,exportedAt:nextTimestamp(2)}));
 await assert.rejects(readPublishedSettings(directory),/same exportedAt timestamp/);
 await fs.writeFile(path.join(directory,'same-time.json'),'{invalid');
 await assert.rejects(readPublishedSettings(directory),/Invalid settings JSON/);
}finally{await fs.rm(directory,{recursive:true,force:true});}
console.log('Site settings passed: real and different exports, timestamp selection, module output, revision stability, invalid and ambiguous files.');
