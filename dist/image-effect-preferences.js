import {imageEffectDefaults} from './material-settings.js';
// Missing preferences use published defaults on every device, not implicit On.
export function readImageEffectPreferences(storage){
 const preferences={...imageEffectDefaults};
 for(const effect of Object.keys(preferences)){
  try{const saved=storage?.getItem('prem-image-'+effect+'-enabled');if(saved==='true'||saved==='false')preferences[effect]=saved==='true';}catch{}
 }
 return preferences;
}
