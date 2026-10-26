// Finds catalog images whose generated copies are missing or were made from a different file.
// Pure Node (no Python, sips or browser), so it can run on the deploy build as well as locally.
// Originals are compared by checksum, not modified time: Finder keeps a moved file's old date.
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {BACKDROP_WIDTHS,backdropCopy} from '../dist/backdrop-sources.js';
import {isContentSetName} from '../dist/content/content-set.js';

const FIX='npm run images';
let reads=0; // a counter, not just the time: two reads in one millisecond must not share a module URL
const sha1=async file=>createHash('sha1').update(await fs.readFile(file)).digest('hex');
const exists=file=>fs.access(file).then(()=>true,()=>false);
const readJson=async file=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw new Error(`Cannot read ${file}`,{cause:error});}};

// Backdrops are named by id suffix (see optimise-images.py and build-backgrounds.mjs).
const isBackdrop=asset=>asset.id.endsWith('-bg');
const isRaster=asset=>asset.type==='image'&&asset.url.startsWith('assets/')&&!asset.url.endsWith('.svg');

async function catalogImages(root){
 const sets=(await fs.readdir(path.join(root,'content'))).filter(file=>file.endsWith('.json')&&isContentSetName(file.slice(0,-5)));
 const byUrl=new Map();
 for(const file of sets)for(const asset of (await readJson(path.join(root,'content',file))).assets)if(isRaster(asset))byUrl.set(asset.url,asset);
 return [...byUrl.values()];
}

/** [{url, reason}] for every image that needs `npm run images`. Originals that are missing are left to build-content. */
export async function staleImages(root){
 const dist=path.join(root,'dist'),stale=[];
 const variantsFile=path.join(dist,'image-variants.js');
 const {imageVariants}=await import(pathToFileURL(variantsFile).href+`?read=${Date.now()}-${reads++}`);
 const sources=await readJson(path.join(dist,'assets/backgrounds/sources.json'))||{};
 for(const asset of await catalogImages(root)){
  const original=path.join(dist,asset.url);if(!await exists(original))continue;
  const digest=await sha1(original);
  if(isBackdrop(asset)){
   if(sources[asset.url]!==digest)stale.push({url:asset.url,reason:sources[asset.url]?'changed since its backdrop copies were made':'no backdrop copies recorded'});
   else for(const width of BACKDROP_WIDTHS)if(!await exists(path.join(dist,backdropCopy(asset.url,width))))stale.push({url:asset.url,reason:`backdrop copy ${width}px is missing`});
   continue;
  }
  const entry=imageVariants[asset.url];
  if(!entry)stale.push({url:asset.url,reason:'no thumbnails were made for it'});
  else if(entry.source!==digest)stale.push({url:asset.url,reason:entry.source?'changed since its thumbnails were made':'thumbnails predate checksum tracking'});
  else for(const variant of entry.variants)if(!await exists(path.join(dist,variant.url)))stale.push({url:asset.url,reason:`thumbnail ${variant.url} is missing`});
 }
 return stale;
}

export const staleImagesMessage=stale=>`${stale.length} image${stale.length===1?'':'s'} out of date. Run \`${FIX}\` and commit the result:\n`+stale.map(item=>`  ${item.url}: ${item.reason}`).join('\n');
