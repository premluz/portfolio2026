// Project backdrops are ~16k px panoramas; scripts/build-backgrounds.mjs writes these web copies.
// 3840 covers a full-height viewport on most screens; 1920 serves phones and narrow windows.
export const BACKDROP_WIDTHS=Object.freeze([1920,3840]);
// Projects without an authored presentations[].card.backgroundMediaId fall back to this asset.
export const GENERIC_BACKDROP_ID='generic-bg';

const stem=url=>String(url).split('/').pop().replace(/\.[^.]+$/,'');
export const backdropCopy=(url,width)=>`assets/backgrounds/${stem(url)}-${width}.jpg`;

/** src (largest copy) and a srcset for a backdrop asset URL. */
export function backdropSources(url){
 if(!url)return null;
 return {src:backdropCopy(url,BACKDROP_WIDTHS.at(-1)),srcset:BACKDROP_WIDTHS.map(width=>`${backdropCopy(url,width)} ${width}w`).join(', ')};
}
