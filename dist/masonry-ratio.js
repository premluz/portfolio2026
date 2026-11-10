import {ratioCardHeight} from './placement.js';
const px=value=>parseFloat(value)||0;
// A limit CSS leaves unset (or zero) means no limit, as in image-frame.js.
const limit=value=>px(value)||Infinity;
const SIDES=['top','right','bottom','left'];

export const MASONRY_RATIO_ATTRIBUTE='masonryRatio';
// Off whenever the flag is absent, which is also how a page that never ran the settings code behaves.
export const masonryRatioOn=()=>globalThis.document?.documentElement?.dataset?.[MASONRY_RATIO_ATTRIBUTE]==='on';

// Height each card needs when its image keeps the hero's own ratio. Reads the same CSS the card is drawn with,
// so the plan and the image frame agree on padding, margins and the width and height limits.
export function measureRatioHeights(items,slots,{count,gap,width}){
 const heights={};
 for(const item of items){
  const element=slots.get(item.id).querySelector('[data-card]'),style=getComputedStyle(element);
  const copy=element.querySelector('.card-copy'),visual=element.querySelector('.visual'),imageStyle=visual?getComputedStyle(visual):null;
  const copyVisible=Boolean(copy)&&getComputedStyle(copy).position!=='absolute';
  const imagePadding=Object.fromEntries(SIDES.map(side=>[side,imageStyle?px(imageStyle.getPropertyValue('--image-padding-'+side)):0]));
  const bleed=element.dataset.imageMode==='bleed',span=item.featured===true&&count>=3?2:1;
  const cardSides=px(style.paddingLeft)+px(style.paddingRight),imageSides=imagePadding.left+imagePadding.right;
  const imageMargin=imageStyle?px(imageStyle.marginTop)+px(imageStyle.marginBottom):0;
  heights[item.id]=ratioCardHeight({
   width:width*span+gap*(span-1),ratio:visual?item.cardRatio:null,
   maxImageWidth:imageStyle?limit(imageStyle.getPropertyValue('--image-max-width')):Infinity,maxImageHeight:imageStyle?limit(imageStyle.getPropertyValue('--image-max-height')):Infinity,
   sides:bleed?imageSides:cardSides+imageSides,ends:px(style.paddingTop)+px(style.paddingBottom),
   copyHeight:copyVisible?copy.offsetHeight:0,margin:imageMargin+imagePadding.top+imagePadding.bottom+(copyVisible?px(style.rowGap):0),bleed
  }).cardHeight;
 }
 return heights;
}
