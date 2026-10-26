import {content} from './content/local.js';
import {escapeText} from './content/html.js';

// "At a glance" under the hero: one column per timeline block of the home-overview document. References
// take their wording and link from the referenced project or article, so renaming one updates it here.
function referenceItem(block,store){
 const doc=store.get(block.documentId);if(!doc)throw new Error(`home-overview references missing document ${block.documentId}`);
 const text=doc.type==='portfolio-item'?[doc.client,doc.name].filter(Boolean).join(' '):doc.title;
 return `<li><a href="#${escapeText(doc.id)}">${escapeText(text)}</a></li>`;
}
function textItem(block){
 const body=(block.paragraphs||[]).map(escapeText).join(' ');
 if(block.label)return `<li class="home-overview-row"><span class="home-overview-label">${escapeText(block.label)}</span><span>${body}</span></li>`;
 return `<li>${escapeText(block.title||body)}</li>`;
}
const column=(block,store)=>`<div class="home-overview-column"><h2 class="home-overview-title text-eyebrow">${escapeText(block.title||'')}</h2><ul class="home-overview-list">${block.items.map(item=>item.type==='reference'?referenceItem(item,store):textItem(item)).join('')}</ul></div>`;

export function homeOverviewMarkup(doc=content.get('home-overview'),store=content){
 if(!doc)return '';
 return `<section class="home-overview" data-home-section="overview" data-content-document="${escapeText(doc.id)}" aria-label="${escapeText(doc.title)}"><div class="home-overview-columns">${doc.blocks.filter(block=>block.type==='timeline').map(block=>column(block,store)).join('')}</div></section>`;
}
