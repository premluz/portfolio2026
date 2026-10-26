import {escapeText} from './content/html.js';

const tones=new Set(['success','error']);
// A small status pill: a dot and a short label. The tone picks one of the functional status colours.
// `section` names a Content Home switch that can hide it (data-home-section), which toggles the hidden attribute.
export function badgeMarkup(badge,{section=''}={}){
 if(!badge?.label)return '';
 const tone=tones.has(badge.tone)?badge.tone:'success';
 return `<p class="badge"${section?` data-home-section="${escapeText(section)}"`:''} data-badge-tone="${tone}"><span class="badge-dot" aria-hidden="true"></span><span class="badge-label">${escapeText(badge.label)}</span></p>`;
}
