import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {MAX_SETTINGS_BYTES} from '../dist/settings-transfer.js';

const settingsDirectory=fileURLToPath(new URL('../settings/',import.meta.url));

async function readExport(directory,name){
 const text=await fs.readFile(path.join(directory,name),'utf8');
 if(Buffer.byteLength(text)>MAX_SETTINGS_BYTES)throw Error(`Settings export exceeds 64 KB: ${name}`);
 let preset;
 try{preset=JSON.parse(text);}catch(error){throw new Error(`Invalid settings JSON: ${name}`,{cause:error});}
 if(preset?.format!=='prem-portfolio-settings'||preset.version!==1||!preset.settings||typeof preset.settings!=='object'||Array.isArray(preset.settings))throw Error(`Unsupported settings export: ${name}`);
 const timestamp=typeof preset.exportedAt==='string'?Date.parse(preset.exportedAt):NaN;
 if(!Number.isFinite(timestamp))throw Error(`Settings export needs a valid exportedAt timestamp: ${name}`);
 return {source:name,preset,timestamp};
}

export async function readPublishedSettings(directory=settingsDirectory){
 const entries=await fs.readdir(directory,{withFileTypes:true});
 const names=entries.filter(entry=>entry.isFile()&&entry.name.endsWith('.json')).map(entry=>entry.name);
 if(!names.length)throw Error(`Save a portfolio settings export in ${directory}`);
 const exports=await Promise.all(names.map(name=>readExport(directory,name)));
 exports.sort((a,b)=>b.timestamp-a.timestamp);
 if(exports.length>1&&exports[0].timestamp===exports[1].timestamp)throw Error(`Settings exports have the same exportedAt timestamp: ${exports[0].source}, ${exports[1].source}`);
 const {source,preset}=exports[0];
 const revision=createHash('sha256').update(JSON.stringify(preset.settings)).digest('hex');
 return {source,preset,revision};
}

export function publishedSettingsModule({source,preset,revision}){
 return `// Generated from settings/${source}; export developer settings there to change the published profile.\nexport const settingsSource=${JSON.stringify(source)};\nexport const settingsRevision=${JSON.stringify(revision)};\nexport const publishedSettings=${JSON.stringify(preset)};\n`;
}
