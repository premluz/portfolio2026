import {EASE} from './motion-tokens.js';

// Simple page transitions have no card to morph from, so a project's hero image grows into place instead.
// It settles a little slower than the page fade (about a quarter longer), in proportion to the transition duration setting.
export const HERO_IMAGE_ENTRANCE_SCALE=.94,HERO_IMAGE_ENTRANCE_RATIO=1.225,HERO_IMAGE_ENTRANCE_MIN=240;
export function heroImageEntrance(root,{reduced=false,duration=400,scale=HERO_IMAGE_ENTRANCE_SCALE}={}){
 if(reduced)return null;
 const image=root?.querySelector?.('.detail .detail-media-column .visual')||root?.querySelector?.('.detail > .visual');
 if(!image?.animate)return null;
 return image.animate([{transform:`scale(${scale})`},{transform:'scale(1)'}],{duration:Math.round(Math.max(HERO_IMAGE_ENTRANCE_MIN,duration*HERO_IMAGE_ENTRANCE_RATIO)),easing:EASE.gentle});
}
