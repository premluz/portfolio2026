import {escapeText} from './content/html.js';

const tones=new Set(['success','error']);
// A small status pill: a dot and a short label. The tone picks one of the functional status colours.
export function badgeMarkup(badge){
 if(!badge?.label)return '';
 const tone=tones.has(badge.tone)?badge.tone:'success';
 return `<p class="badge" data-badge-tone="${tone}"><span class="badge-dot" aria-hidden="true"></span><span class="badge-label">${escapeText(badge.label)}</span></p>`;
}
