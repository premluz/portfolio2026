import {publishedSettings,settingsRevision} from './published-settings.js';
import {settingsSchema,parseSettings,importSettings} from './settings-transfer.js';

const revisionKey='prem-site-settings-revision';

export function applySiteSettings({root=document,storage=globalThis.localStorage,preset=publishedSettings,revision=settingsRevision}={}){
 if(!storage)throw Error('Published site settings require browser storage.');
 if(storage.getItem(revisionKey)===revision)return false;
 const schema=settingsSchema(root.querySelector('#settings'),root);
 const unknown=Object.keys(preset.settings).filter(key=>!schema.has(key));
 if(unknown.length)throw Error(`Published settings contain unsupported controls: ${unknown.join(', ')}`);
 const values=parseSettings(JSON.stringify(preset),schema);
 importSettings(values,schema,storage);
 storage.setItem(revisionKey,revision);
 return true;
}
