import {content} from './content/local.js';
import {escapeText,headingText} from './content/html.js';
import {imageSource} from './media-loading.js';

// Cards for the spiral: every project's cover (opens the project), then the About photos (image only).
export function spiralItems(store=content){
 const projects=store.list({type:'portfolio-item'}).map(doc=>store.getCard(doc.id)).filter(card=>card?.image).map(card=>({src:imageSource(card.image,960),alt:card.imageAlt||card.name,projectId:card.id,label:card.name}));
 const about=[store.get('about-unusual'),store.get('about')].filter(Boolean).flatMap(doc=>doc.blocks).map(block=>store.getAsset(block.mediaId)).filter(asset=>asset?.type==='image').map(asset=>({src:imageSource(asset.url,960),alt:asset.alt||'',projectId:null,label:asset.alt||''}));
 return [...projects,...about];
}

const ARRANGEMENT_LABELS={spiral:'All cards, as a spiral',infinite:'All cards, in an endless space: drag to move, scroll to fly, W A S D and Q E to move with the keyboard'};

/** An experiment page: heading, then the card world in one arrangement ('spiral' scrolls a tall section,
 * 'infinite' fills the viewport). The list of links is the accessible way to every card. */
export function cardWorldPageMarkup(card,arrangement,store=content){
 const items=spiralItems(store),json=JSON.stringify(items).replace(/</g,'\\u003c');
 const list=items.map(item=>`<li>${item.projectId?`<a href="#${escapeText(item.projectId)}" data-text-project="${escapeText(item.projectId)}">${escapeText(item.label)}</a>`:`<img src="${escapeText(item.src)}" alt="${escapeText(item.alt)}" loading="lazy">`}</li>`).join('');
 return `<section class="surface detail info-detail about-lab-detail" data-surface><h1 tabindex="-1">${headingText(card.title)}</h1><div class="info-body">${card.body.map(text=>`<p>${escapeText(text)}</p>`).join('')}</div></section>
<section class="card-world" data-card-world="${escapeText(arrangement)}" aria-label="${escapeText(ARRANGEMENT_LABELS[arrangement]||'All cards')}"><div class="card-world-stage" data-card-world-stage></div><script type="application/json" data-card-world-items>${json}</script><ul class="card-world-list">${list}</ul></section>`;
}
export const aboutLabMarkup=(card,store=content)=>cardWorldPageMarkup(card,'spiral',store);
