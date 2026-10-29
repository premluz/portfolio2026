import {publishedSettings,settingsRevision} from './published-settings.js';
import {settingsSchema,parseSettings,importSettings} from './settings-transfer.js';

export const revisionKey='prem-site-settings-revision';
const legacyControls=new Set(['plainNav','glassStyle']);

// A published profile replaces the built-in one; if it cannot be applied the built-in settings still load, loudly.
export function applyActiveSettings(published,options={}){
 if(published){
  try{return applySiteSettings({...options,preset:published.export,revision:published.revision});}
  catch(error){console.error('Published site settings could not be applied; using the built-in settings.',error);}
 }
 return applySiteSettings(options);
}

export function applySiteSettings({root=document,storage=globalThis.localStorage,preset=publishedSettings,revision=settingsRevision}={}){
 if(!storage)throw Error('Published site settings require browser storage.');
 if(storage.getItem(revisionKey)===revision)return false;
 const schema=settingsSchema(root.querySelector('#settings'),root);
 const unknown=Object.keys(preset.settings).filter(key=>!schema.has(key)&&!legacyControls.has(key));
 if(unknown.length)throw Error(`Published settings contain unsupported controls: ${unknown.join(', ')}`);
 const values=parseSettings(JSON.stringify(preset),schema);
 importSettings(values,schema,storage);
 storage.setItem(revisionKey,revision);
 return true;
}
