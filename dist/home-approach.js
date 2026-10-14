import {content} from './content/local.js';
import {escapeText} from './content/html.js';

export function homeApproachMarkup(doc=content.get('home-approach')){
 if(!doc)return '';
 const paragraphs=doc.blocks.find(block=>block.type==='text')?.paragraphs||[doc.summary];
 return `<section class="home-content-section home-approach" data-home-section="approach" data-content-document="${escapeText(doc.id)}" aria-labelledby="home-approach-title"><div class="home-approach-intro"><h2 id="home-approach-title">${escapeText(doc.title)}</h2>${paragraphs.map(text=>`<p>${escapeText(text)}</p>`).join('')}</div><div class="home-approach-principles">${doc.blocks.filter(block=>block.type==='info-card').map(block=>`<article><h3>${escapeText(block.title)}</h3>${(block.paragraphs||[]).map(text=>`<p>${escapeText(text)}</p>`).join('')}</article>`).join('')}</div></section>`;
}
