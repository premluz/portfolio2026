import {contextualText} from './contextual-popovers.js';
import {timelineMarkup} from './hero-timeline.js';
import {content} from './content/local.js';
import {headingText} from './content/html.js';
export function normalizeHeroContent(value='timeline'){
 if(value&&typeof value==='object')return {timeline:value.timeline!==false,timelineText:value.timelineText??value.timeline!==false,description:value.description===true};
 return value==='paragraph'?{timeline:false,timelineText:false,description:true}:{timeline:true,timelineText:true,description:false};
}
export function heroCopyMarkup(mode='timeline'){
 const hero=content.get('home'),timeline=hero.blocks.find(b=>b.id==='home-timeline'||b.type==='timeline'),description=hero.blocks.find(b=>b.id==='home-description');
 const selection=normalizeHeroContent(mode),parts=[];
 if(selection.description&&description)parts.push((description.paragraphs||[]).map(text=>`<p data-hero-description>${contextualText(text)}</p>`).join(''));
 if((selection.timeline||selection.timelineText)&&timeline)parts.push(timelineMarkup(timeline,{graphic:selection.timeline,text:selection.timelineText}));
 return parts.join('');
}
export function homeHero({heroContent='timeline'}={}){const hero=content.get('home'),intro=hero.blocks.find(b=>b.id==='home-introduction'),selection=normalizeHeroContent(heroContent);return `<section class="home-hero" aria-label="Introduction">
 <div class="hero-about" data-hero-combined-content="${(selection.timeline||selection.timelineText)&&selection.description}">
  <h1 data-hero-title><span class="hero-greeting">${headingText(hero.title)}</span> ${headingText(intro?.title||'')}</h1>
  <div class="hero-copy" data-hero-copy>${heroCopyMarkup(heroContent)}</div>
 </div>
 </section>`;}
export function hydrateFooter(root=document){
 const footer=content.get('site-footer'),invitation=footer?.blocks.find(block=>block.id==='footer-invitation');if(!footer||!invitation)return;
 const title=root.querySelector('#footer-title'),body=root.querySelector('.footer-invitation');
 if(title)title.innerHTML=headingText(invitation.title);if(body)body.textContent=invitation.paragraphs?.join(' ')||'';
 const links=root.querySelectorAll('.footer-links a');footer.links?.forEach((link,index)=>{if(links[index]){links[index].href=link.url;links[index].setAttribute('aria-label',link.label);}});
}
