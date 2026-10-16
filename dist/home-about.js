import {contextualText} from './contextual-popovers.js';
import {content} from './content/local.js';
import {escapeText,headingText} from './content/html.js';
import {timelineMarkup} from './hero-timeline.js';
const projectIds={'role-gala':'galachain','role-tracr':'tracr','role-vodafone':'vodafone-iot','role-playstation':'playstation','side-rios':'rios','side-porter':'porter','side-merlin':'merlin','side-bastion':'bastion'};
function experienceItem(item){const projectId=projectIds[item.id],tag=projectId?'a':'span';return `<${tag} class="home-about-row" data-project-menu-item="${escapeText(projectId||item.id)}"${projectId?` href="#${escapeText(projectId)}" data-text-project="${escapeText(projectId)}"`:''}><span class="home-about-item">${escapeText(item.title)}</span>${item.label?`<span class="home-about-years">${escapeText(item.label)}</span>`:''}</${tag}>`;}
// Authored content stays in one reusable component document; this is its home projection.
export function homeAboutMarkup(doc=content.get('home-about')){
 if(!doc)return '';
 const intro=doc.blocks.find(block=>block.id==='about-introduction');if(!intro)return '';
 const path=content.get('about')?.blocks.find(block=>block.id==='about-timeline');
 const lists=doc.blocks.filter(block=>['about-roles','about-side-projects'].includes(block.id));
 return `<section class="home-about" aria-labelledby="home-about-title" data-content-document="${escapeText(doc.id)}"><div class="home-about-introduction" data-home-section="about"><h2 id="home-about-title">${contextualText(intro.title).replace(/\n/g,'<br>')}${intro.label?` <span class="home-about-title-secondary">${contextualText(intro.label).replace(/\n/g,'<br>')}</span>`:''}</h2><div class="home-about-copy">${intro.paragraphs.map(text=>`<p>${contextualText(text)}</p>`).join('')}</div></div>${path?`<div class="home-about-path" data-home-section="about-timeline">${timelineMarkup(path)}</div>`:''}<div class="home-about-lists" data-home-section="experience"><div class="home-about-list-content">${lists.map(list=>`<section class="home-about-list" data-about-list="${escapeText(list.id)}" aria-labelledby="${escapeText(list.id)}-title"><h3 id="${escapeText(list.id)}-title" class="eyebrow">${escapeText(list.title)}</h3><ul>${list.items.map(item=>`<li>${experienceItem(item)}</li>`).join('')}</ul></section>`).join('')}</div></div></section>`;
}
