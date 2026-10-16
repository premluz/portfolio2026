import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readPublishedSettings,publishedSettingsModule} from '../scripts/site-settings.mjs';

const directory=await fs.mkdtemp(path.join(os.tmpdir(),'portfolio-site-settings-'));
const EXPORT_STEP_MS=1000;
try{
 const actual=(await readPublishedSettings()).preset;
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
