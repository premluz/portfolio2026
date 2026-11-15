// Finds catalog MP4s whose optimised copy is missing or was made from a different file.
// Pure Node, like image-freshness.mjs: the deploy build checks committed copies and never needs ffmpeg.
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {contentSetNames,readContentSource} from './content-source.mjs';

const FIX='npm run images';
let reads=0; // two reads in one millisecond must not share a module URL
export const sha1=async file=>createHash('sha1').update(await fs.readFile(file)).digest('hex');
const exists=file=>fs.access(file).then(()=>true,()=>false);
const isLocalMp4=asset=>asset.type==='video'&&asset.url.startsWith('assets/')&&asset.url.toLowerCase().endsWith('.mp4');

/** Every local MP4 referenced by any content set, once. */
export async function catalogVideos(root){
 const contentDir=path.join(root,'content'),byUrl=new Map();
 for(const set of await contentSetNames(contentDir))for(const asset of (await readContentSource(contentDir,set)).assets)if(isLocalMp4(asset))byUrl.set(asset.url,asset);
 return [...byUrl.values()];
}

export async function readVideoVariants(root){
 const file=path.join(root,'dist/video-variants.js');
 if(!await exists(file))return {};
 return (await import(pathToFileURL(file).href+`?read=${Date.now()}-${reads++}`)).videoVariants;
}

/** [{url, reason}] for every MP4 that needs `npm run images`. Originals that are missing are left to build-content. */
export async function staleVideos(root){
 const dist=path.join(root,'dist'),variants=await readVideoVariants(root),stale=[];
 for(const asset of await catalogVideos(root)){
  const original=path.join(dist,asset.url);if(!await exists(original))continue;
  const entry=variants[asset.url];
  if(!entry)stale.push({url:asset.url,reason:'no optimised copy was made for it'});
  else if(entry.source!==await sha1(original))stale.push({url:asset.url,reason:'changed since its optimised copy was made'});
  else if(entry.url&&!await exists(path.join(dist,entry.url)))stale.push({url:asset.url,reason:`optimised copy ${entry.url} is missing`});
 }
 return stale;
}

export const staleVideosMessage=stale=>`${stale.length} video${stale.length===1?'':'s'} out of date. Run \`${FIX}\` and commit the result:\n`+stale.map(item=>`  ${item.url}: ${item.reason}`).join('\n');
