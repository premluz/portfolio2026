import {safeUrl} from './model.js';
export const escapeText=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const headingText=value=>escapeText(value).replace(/\n/g,'<br>');
export const safeHref=(value,options)=>safeUrl(value,options)?escapeText(value):'';
