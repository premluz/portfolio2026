import fs from 'node:fs/promises';
import {readPublishedSettings,publishedSettingsModule} from './site-settings.mjs';

const profile=await readPublishedSettings();
const target=new URL('../dist/published-settings.js',import.meta.url);
const module=publishedSettingsModule(profile);
if(process.argv.includes('--check')){
 if(await fs.readFile(target,'utf8')!==module)throw Error('Published settings are stale. Run npm run build:settings.');
}else await fs.writeFile(target,module);
console.log(`Published settings: settings/${profile.source}`);
