import {escapeText,headingText,safeHref} from './content/html.js';
import {blockRenderers} from './content-blocks.js';

// Dates are calendar days, so they format in UTC to stay on the authored day in every time zone.
const dateFormat=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
export const articleDate=value=>dateFormat.format(new Date(value+'T00:00:00Z'));
const partLink=part=>`<a href="${safeHref('#'+part.id)}">Part ${part.part}: ${escapeText(part.title)}</a>`;

export function articleSeriesMarkup(article){
 const series=article.series;if(!series)return '';
 const others=series.parts.filter(part=>part.id!==article.id);
 return `<p class="article-series">Part ${series.part} of ${series.of}.${others.length?' '+others.map(partLink).join(' · ')+'.':''}</p>`;
}
const sourceMarkup=source=>{
 const label=source.url?`<a href="${safeHref(source.url)}" target="_blank" rel="noopener">${escapeText(source.label)}</a>`:escapeText(source.label);
 return `<li>${[label,source.publisher,source.date].filter(Boolean).map((part,index)=>index?escapeText(part):part).join(', ')}</li>`;
};
const sectionMarkup=block=>{
 const renderer=Object.hasOwn(blockRenderers,block.type)?blockRenderers[block.type]:null;
 return `<section class="article-section" data-block-type="${escapeText(block.type)}">${renderer?renderer(block,{}):'<p>Content type unavailable.</p>'}</section>`;
};

export function articleMarkup(article){
 const sources=article.sources.length?`<div class="article-sources"><h2>Sources</h2><ul>${article.sources.map(sourceMarkup).join('')}</ul></div>`:'';
 return `<section class="surface detail info-detail article-detail" data-surface><article class="article"><div class="article-header"><h1 tabindex="-1">${headingText(article.title)}</h1><p class="eyebrow article-meta"><time datetime="${escapeText(article.publishedAt)}">${articleDate(article.publishedAt)}</time></p>${articleSeriesMarkup(article)}</div><div class="article-body">${article.blocks.map(sectionMarkup).join('')}</div>${sources}</article></section>`;
}
