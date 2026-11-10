// Project pages arrange hero media and copy by the hero's ratio. The thresholds twin --detail-wide-min-ratio and
// --detail-tall-max-ratio in tokens.css; tests/detail-shape.mjs keeps them equal.
export const DETAIL_WIDE_MIN_RATIO=1.2;
export const DETAIL_TALL_MAX_RATIO=0.8;
export const DETAIL_RATIO_ATTRIBUTE='detailRatioLayout';

// A project with no hero media has no ratio and keeps the even split; it never reaches the media rules anyway.
export function detailShape(ratio){
 if(!Number.isFinite(ratio)||ratio<=0)return 'square';
 if(ratio>=DETAIL_WIDE_MIN_RATIO)return 'wide';
 return ratio<DETAIL_TALL_MAX_RATIO?'tall':'square';
}
