import {content} from './content/local.js';
import {escapeText} from './content/html.js';
export function testimonialsMarkup(doc,{id=doc?.id||'testimonials',cardBackground=true,homeSection=null}={}){
 if(!doc)return '';
 return `<section class="home-content-section home-testimonials" data-component="testimonials" data-card-background="${cardBackground!==false}"${homeSection?` data-home-section="${escapeText(homeSection)}"`:''} data-content-document="${escapeText(doc.id)}" aria-labelledby="${escapeText(id)}-title"><h2 id="${escapeText(id)}-title">${escapeText(doc.title)}</h2><div class="home-testimonials-grid">${doc.blocks.filter(block=>block.type==='quote').map((block,index)=>`<figure class="home-testimonial${index===0?' is-featured':''}"><blockquote><p>${escapeText(block.text)}</p></blockquote><figcaption><span class="testimonial-author">${escapeText(block.attribution)}</span>${block.label?`<span class="testimonial-role">${escapeText(block.label)}</span>`:''}</figcaption></figure>`).join('')}</div></section>`;
}
export const homeTestimonialsMarkup=(doc=content.get('home-testimonials'),options={})=>testimonialsMarkup(doc,{...options,homeSection:'testimonials'});
