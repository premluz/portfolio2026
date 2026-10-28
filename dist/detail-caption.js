import {escapeText} from './content/html.js';

// The caption on a project page follows the Cards settings, so a card and its page read the same: where the company sits
// (above the title, leading it, or hidden), whether the title is the long title or the short category, and whether the line
// under it is the project's results or "Company · Year".
export const DEFAULT_CAPTION_FLAGS=Object.freeze({showClient:true,clientInline:false,clientAbove:false,showTitle:true,showCategory:false,showDescription:true,companyYear:false});
export function detailCaptionLines(data,flags=DEFAULT_CAPTION_FLAGS){
 const client=String(data.client||'').trim(),category=String(data.category||'').trim(),title=String(data.title||'').trim(),summary=String(data.summary||'').trim(),year=String(data.year||'').trim(),intro=String(data.pageTitle||'').trim();
 const heading=flags.showTitle?(flags.showCategory&&category?category:title):'';
 const eyebrow=flags.showClient&&flags.clientAbove?client:'';
 const titleLine=flags.showClient&&flags.clientInline&&!flags.clientAbove&&client?(heading?`${client}. ${heading}`:client):heading;
 const lead=flags.showDescription?(flags.companyYear&&(client||year)?[client,year].filter(Boolean).join(' · '):summary):'';
 // With Company · Year as the description, the project's results line still belongs on the page, one step under it.
 const results=flags.showDescription&&flags.companyYear&&(client||year)?summary:'';
 // The page's headline sentence belongs to the caption, so it is not repeated in the column below.
 return {eyebrow,title:titleLine,lead,results,intro};
}
export function detailCaptionInner({eyebrow,title,lead,results='',intro=''}){
 return `${eyebrow?`<p class="detail-caption-client">${escapeText(eyebrow)}</p>`:''}${title?`<p class="detail-caption-title">${escapeText(title)}</p>`:''}${lead?`<p class="detail-caption-lead">${escapeText(lead)}</p>`:''}${results?`<p class="detail-caption-results">${escapeText(results)}</p>`:''}${intro?`<p class="detail-caption-intro">${escapeText(intro)}</p>`:''}`;
}
export const detailCaptionDataAttributes=data=>`data-client="${escapeText(data.client||'')}" data-title="${escapeText(data.title||'')}" data-category="${escapeText(data.category||'')}" data-summary="${escapeText(data.summary||'')}" data-year="${escapeText(data.year||'')}" data-page-title="${escapeText(data.pageTitle||'')}"`;
