import {imageSource} from './media-loading.js';
import {imageVariants} from './image-variants.js';
import {menuPreviewPosition,PROJECT_PREVIEW_SIZE,PROJECT_PREVIEW_GAP} from './project-menu-preview.js';
import {TEXT_LIST_PREVIEW_ANCHOR} from './text-list-hover.js';
import {EASE} from './motion-tokens.js';

const PREVIEW_ROWS='.home-about-list-content [data-project-menu-item],.home-product-text [data-project-menu-item]';
const PROXY_FADE_MS=220;

// The hover preview shows its image contained in a fixed box; the morph needs the image's own rect.
export function containRect(box,{width,height}={}){
 if(!width||!height)return box;
 const scale=Math.min(box.width/width,box.height/height),w=width*scale,h=height*scale;
 return {left:box.left+(box.width-w)/2,top:box.top+(box.height-h)/2,width:w,height:h};
}

/** A card-shaped stand-in for the floating thumbnail, so the existing card morph can start or end there. */
export function previewMorphProxy(rect,src,doc=document){
 const proxy=doc.createElement('div'),visual=doc.createElement('div'),image=doc.createElement('img');
 proxy.className='preview-morph-proxy';proxy.setAttribute('aria-hidden','true');visual.className='visual';
 image.src=src;image.alt='';image.decoding='sync';
 for(const key of ['left','top','width','height'])proxy.style[key]=rect[key]+'px';
 visual.append(image);proxy.append(visual);doc.body.append(proxy);
 return proxy;
}

export function visiblePreviewImage(doc=document){
 const image=[...doc.querySelectorAll('.project-menu-preview.is-visible .project-menu-preview-image')].at(-1);
 const rect=image?.getBoundingClientRect();
 return rect?.width&&rect.height?{rect,src:image.currentSrc||image.src}:null;
}

// Where the hover thumbnail of this project's row would appear right now, or null if the row is not on the page.
export function rowPreviewRect(root,project,viewport={width:innerWidth,height:innerHeight}){
 const row=[...root.querySelectorAll(PREVIEW_ROWS)].find(node=>node.dataset.projectMenuItem===project.id&&node.getClientRects().length);
 if(!row||!project.image)return null;
 const anchor=row.querySelector(TEXT_LIST_PREVIEW_ANCHOR)||row;
 const box=menuPreviewPosition(anchor.getBoundingClientRect(),row.getBoundingClientRect(),viewport,PROJECT_PREVIEW_SIZE,'left',PROJECT_PREVIEW_GAP);
 return box?containRect(box,imageVariants[project.image]):null;
}

export function previewReturnProxy(root,project){
 const rect=rowPreviewRect(root,project);
 return rect?previewMorphProxy(rect,imageSource(project.image,480)):null;
}

export function fadeOutProxy(proxy,reduced=false){
 if(!proxy)return;
 if(reduced||!proxy.animate){proxy.remove();return;}
 proxy.animate([{opacity:1},{opacity:0}],{duration:PROXY_FADE_MS,easing:EASE.leave,fill:'forwards'}).finished.then(()=>proxy.remove(),()=>proxy.remove());
}
