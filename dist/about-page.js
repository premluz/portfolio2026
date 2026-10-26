import {content} from './content/local.js';
import {escapeText,headingText} from './content/html.js';
import {imageMarkup} from './media-loading.js';
import {traitIllustration} from './about-illustrations.js';
import {servicesMarkup} from './home-services.js';
import {homeApproachMarkup} from './home-approach.js';
import {homeAboutMarkup} from './home-about.js';
import {testimonialsMarkup} from './home-testimonials.js';
import {writingMarkup} from './home-writing.js';

// Phrases the authored intro tints; matched by text so editing the catalog copy stays plain.
export const ABOUT_HIGHLIGHTS=Object.freeze(['Web3, DeFi, blockchain, IoT & Telco,','AI-native design systems and experiences.']);
const escapePattern=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const highlightPattern=new RegExp('('+ABOUT_HIGHLIGHTS.map(escapePattern).join('|')+')');
export const highlightedText=text=>String(text??'').split(highlightPattern).map((part,index)=>index%2?`<span class="about-highlight">${escapeText(part)}</span>`:escapeText(part)).join('');

const paragraphs=values=>(values||[]).map(text=>`<p>${escapeText(text)}</p>`).join('');
const figure=(asset,className)=>asset?`<figure class="${className}">${imageMarkup(asset.url,asset.alt??'')}</figure>`:'';

export function aboutHeroMarkup(card,store=content){
 const portrait=card.blocks.find(block=>block.type==='image'&&block.id==='about-portrait');
 return `<div class="about-hero" data-about-section="hero"><div class="about-hero-copy"><h1 tabindex="-1">${headingText(card.title)}</h1><div class="info-body">${card.body.map(text=>`<p>${highlightedText(text)}</p>`).join('')}</div></div>${portrait?figure(store.getAsset(portrait.mediaId),'about-portrait'):''}</div>`;
}

// Traits reuse the global card section, so the Card layout and Show card settings apply here too.
// Home's markup tags its parts for the Home dev settings; on About they answer to the About settings instead.
const forAbout=html=>html.replaceAll('data-home-section=','data-about-section=');

export const aboutTraitsMarkup=(doc=content.get('about-traits'))=>forAbout(servicesMarkup(doc,{id:'about-traits',illustration:traitIllustration,railLabel:'traits',className:'about-traits',cardClassName:'about-trait',homeSection:'traits'}));

export function aboutUnusualMarkup(doc=content.get('about-unusual'),store=content){
 if(!doc)return '';
 const intro=doc.blocks.find(block=>block.type==='text'),items=doc.blocks.filter(block=>block.type==='info-card');
 return `<section class="home-content-section about-section about-unusual" data-about-section="unusual" data-content-document="${escapeText(doc.id)}" aria-labelledby="about-unusual-title"><h2 id="about-unusual-title">${headingText(doc.title)}</h2>${intro?paragraphs(intro.paragraphs).replace('<p>','<p class="about-section-lead">'):''}<ol class="about-unusual-list">${items.map(block=>`<li class="about-unusual-item" data-unusual="${escapeText(block.id)}">${figure(store.getAsset(block.mediaId),'about-unusual-media')}<div class="about-unusual-caption"><h3>${escapeText(block.title)}</h3>${paragraphs(block.paragraphs)}</div></li>`).join('')}</ol></section>`;
}

// The Home components, in Home's order. Which of them show is a dev setting (Content About); all start off.
export const aboutHomeComponentsMarkup=(store=content)=>forAbout(homeApproachMarkup(store.get('home-approach'))+servicesMarkup(store.get('home-services'),{id:'about-services',homeSection:'services'})+homeAboutMarkup(store.get('home-about'))+writingMarkup(store.get('home-writing'),{homeSection:'writing'})+testimonialsMarkup(store.get('home-testimonials'),{id:'about-testimonials',homeSection:'testimonials'}));

export const aboutBodyMarkup=(card,store=content)=>aboutHeroMarkup(card,store)+aboutTraitsMarkup(store.get('about-traits'))+aboutUnusualMarkup(store.get('about-unusual'),store)+aboutHomeComponentsMarkup(store);
