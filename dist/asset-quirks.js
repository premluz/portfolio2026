// Per-file facts about an exported image that its pixels carry but nothing else records: a baked matte corner or a
// bright one-pixel frame. They live on the asset record (sourceCornerRadius, sourceEdgeInset) and reach the image
// frame through this lookup, which the content store fills when it loads a catalog.
const quirks=new Map();
export const assetFileName=src=>String(src||'').split(/[?#]/)[0].split('/').pop();

export function registerAssetQuirks(assets){
 for(const asset of assets){
  if(!asset.sourceCornerRadius&&!asset.sourceEdgeInset)continue;
  quirks.set(assetFileName(asset.url),{radius:asset.sourceCornerRadius||0,inset:asset.sourceEdgeInset||0});
 }
}
export const sourceCornerRadius=src=>quirks.get(assetFileName(src))?.radius||0;
export const sourceEdgeInset=src=>quirks.get(assetFileName(src))?.inset||0;
