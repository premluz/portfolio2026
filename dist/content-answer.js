import {content} from './content/local.js';
import {escapeText,safeHref} from './content/html.js';
import {card} from './card-renderer.js';
// Use this boundary for an eventual API response; the API supplies IDs, never HTML.
export function contentAnswer(answer,{store=content}={}){
 const resolved=store.resolveAnswer(answer);
 return `<section class="content-answer" aria-label="Portfolio answer">${resolved.text?`<div class="content-answer-copy">${resolved.text.split(/\n\s*\n/).map(text=>`<p>${escapeText(text)}</p>`).join('')}</div>`:''}${resolved.cards.length?`<div class="grid">${resolved.cards.map((p,i)=>card(p,i,'regular',{link:true})).join('')}</div>`:''}${resolved.sources.length?`<ul class="content-answer-sources" aria-label="Sources">${resolved.sources.map(source=>`<li>${source.route?`<a href="${safeHref(source.route)}">${escapeText(source.title)}</a>`:escapeText(source.title)}${source.evidence?` — ${escapeText(source.evidence.text)}`:''}</li>`).join('')}</ul>`:''}</section>`;
}
