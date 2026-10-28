import {contextualText} from './contextual-popovers.js';
import {content} from './content/local.js';
import {escapeText,headingText} from './content/html.js';
import {timelineMarkup} from './hero-timeline.js';
const projectIds={'role-gala':'galachain','role-tracr':'tracr','role-vodafone':'vodafone-iot','role-playstation':'playstation','side-rios':'rios','side-porter':'porter','side-merlin':'merlin','side-bastion':'bastion'};
function experienceItem(item){const projectId=projectIds[item.id],tag=projectId?'a':'span';return `<${tag} class="home-about-row" data-project-menu-item="${escapeText(projectId||item.id)}"${projectId?` href="#${escapeText(projectId)}" data-text-project="${escapeText(projectId)}"`:''}><span class="home-about-item">${escapeText(item.title)}</span>${item.label?`<span class="home-about-years">${escapeText(item.label)}</span>`:''}</${tag}>`;}
// Authored content stays in one reusable component document; this is its home projection.
export function homeAboutMarkup(doc=content.get('home-about'),{showTitle=true}={}){
 if(!doc)return '';
 const intro=doc.blocks.find(block=>block.id==='about-introduction');if(!intro)return '';
 const path=content.get('about')?.blocks.find(block=>block.id==='about-timeline');
 const heading=showTitle?`<h2 id="home-about-title">${headingText(intro.title)}</h2>`:'';
 return `<section class="home-about" ${showTitle?'aria-labelledby="home-about-title"':'aria-label="About"'} data-content-document="${escapeText(doc.id)}">${heading}<div class="home-about-introduction" data-home-section="about"><div class="home-about-copy">${intro.paragraphs.map(text=>`<p>${contextualText(text)}</p>`).join('')}</div></div>${path?`<div class="home-about-path" data-home-section="about-timeline">${timelineMarkup(path)}</div>`:''}</section>`;
}

// Experience and Side projects & R&D are sections of their own, placed after How I work, each with the same main heading as the other
// sections; each keeps its own switch (data-home-section).
export function homeListSectionsMarkup(doc=content.get('home-about')){
 if(!doc)return '';
 return doc.blocks.filter(block=>['about-roles','about-side-projects'].includes(block.id)).map(list=>`<section class="home-content-section home-about-list" data-home-section="${list.id==='about-side-projects'?'side-projects':'experience'}" data-about-list="${escapeText(list.id)}" aria-labelledby="${escapeText(list.id)}-title"><h2 id="${escapeText(list.id)}-title">${escapeText(list.title)}</h2><ul>${list.items.map(item=>`<li>${experienceItem(item)}</li>`).join('')}</ul></section>`).join('');
}
