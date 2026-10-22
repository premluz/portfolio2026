import {content} from './content/local.js';
import {escapeText,headingText,safeHref} from './content/html.js';

// The component's references set the order, so the author decides what leads.
export function writingMarkup(doc,{homeSection=null}={}){
 if(!doc)return '';
 const articles=doc.blocks.filter(block=>block.type==='reference').map(block=>content.getCard(block.documentId)).filter(article=>article?._article);
 if(!articles.length)return '';
 const item=article=>`<li><a class="home-writing-row" data-project-menu-item="${escapeText(article.id)}" href="${safeHref('#'+article.id)}"><span class="home-writing-title">${headingText(article.title)}</span></a></li>`;
 return `<section class="home-content-section home-writing"${homeSection?` data-home-section="${escapeText(homeSection)}"`:''} data-content-document="${escapeText(doc.id)}" aria-labelledby="${escapeText(doc.id)}-title"><h2 id="${escapeText(doc.id)}-title">${escapeText(doc.title)}</h2><ul class="home-writing-list">${articles.map(item).join('')}</ul></section>`;
}
export const homeWritingMarkup=(doc=content.get('home-writing'))=>writingMarkup(doc,{homeSection:'writing'});
