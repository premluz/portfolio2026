import {content} from './content/local.js';
import {escapeText} from './content/html.js';
import {serviceIllustration} from './home-service-illustrations.js';
import {cardRailControlsMarkup} from './card-rail.js';
export function servicesMarkup(doc,{id=doc?.id||'services',layout='grid',carouselAlignment='full-bleed',homeSection=null}={}){
 if(!doc)return '';
 return `<section class="home-content-section home-services" data-component="services" data-services-carousel-alignment="${carouselAlignment==='content'?'content':'full-bleed'}" data-services-layout="${layout==='carousel'?'carousel':'grid'}" data-card-rail data-card-rail-mode="${layout==='carousel'?'carousel':'grid'}"${homeSection?` data-home-section="${escapeText(homeSection)}"`:''} data-content-document="${escapeText(doc.id)}" aria-labelledby="${escapeText(id)}-title"><h2 id="${escapeText(id)}-title">${escapeText(doc.title)}</h2><div class="home-services-grid" data-card-rail-viewport role="region" aria-label="${escapeText(doc.title)}" tabindex="${layout==='carousel'?0:-1}">${doc.blocks.filter(block=>block.type==='info-card').map(block=>`<article class="home-service-card">${serviceIllustration(block.id)}<h3>${escapeText(block.title)}</h3>${(block.paragraphs||[]).map(text=>`<p>${escapeText(text)}</p>`).join('')}</article>`).join('')}</div>${cardRailControlsMarkup({label:'services'})}</section>`;
}
export const homeServicesMarkup=(doc=content.get('home-services'),options={})=>servicesMarkup(doc,{layout:'carousel',...options,homeSection:'services'});
