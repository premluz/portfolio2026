import {MAX_SETTINGS_BYTES} from '../dist/settings-transfer.js';

// A published settings profile is the same JSON the dev panel exports. The server cannot see the panel's controls,
// so it checks structure and bounds only; the browser re-validates every value against its controls before applying.
const FORMAT='prem-portfolio-settings';
const KEY_PATTERN=/^[A-Za-z0-9._-]{1,80}$/;
const MAX_KEYS=400,MAX_STRING=200;

export function validateSettingsExport(value){
 const fail=reason=>({ok:false,reason});
 if(!value||typeof value!=='object'||Array.isArray(value))return fail('Settings must be an object.');
 if(value.format!==FORMAT||value.version!==1)return fail('Unsupported settings format.');
 if(typeof value.exportedAt!=='string'||!Number.isFinite(Date.parse(value.exportedAt)))return fail('Settings need a valid exportedAt timestamp.');
 const settings=value.settings;
 if(!settings||typeof settings!=='object'||Array.isArray(settings))return fail('Settings need a settings object.');
 const entries=Object.entries(settings);
 if(!entries.length||entries.length>MAX_KEYS)return fail(`Settings must hold between 1 and ${MAX_KEYS} values.`);
 for(const [key,item] of entries){
  if(!KEY_PATTERN.test(key))return fail(`Unsupported setting name: ${key.slice(0,40)}`);
  const primitive=typeof item==='boolean'||typeof item==='number'&&Number.isFinite(item)||typeof item==='string'&&item.length<=MAX_STRING;
  if(!primitive)return fail(`Unsupported value for ${key}.`);
 }
 if(new TextEncoder().encode(JSON.stringify(value)).byteLength>MAX_SETTINGS_BYTES)return fail('Settings exceed 64 KB.');
 return {ok:true,value:{format:value.format,version:1,exportedAt:value.exportedAt,settings}};
}

// Matches the build's revision (scripts/site-settings.mjs), so identical settings never re-import in a visitor's browser.
export async function settingsRevision(settings){
 const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(settings)));
 return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
