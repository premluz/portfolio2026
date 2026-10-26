import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {staleImages,staleImagesMessage} from '../scripts/image-freshness.mjs';
import {BACKDROP_WIDTHS,backdropCopy} from '../dist/backdrop-sources.js';

// A throwaway project: one screenshot with thumbnails and one backdrop with copies, all current.
const root=await fs.mkdtemp(path.join(os.tmpdir(),'image-freshness-'));
const put=async(file,data)=>{const target=path.join(root,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data);};
const sha1=data=>createHash('sha1').update(data).digest('hex');
const catalog=assets=>put('content/catalog.json',JSON.stringify({assets:assets.map(([id,url])=>({id,type:'image',status:'published',url}))}));
const variants=entries=>put('dist/image-variants.js','export const imageVariants='+JSON.stringify(entries)+';\n');
const shot='screenshot-bytes',backdrop='backdrop-bytes';
await catalog([['shot','assets/shot.png'],['wall-bg','assets/wall-bg.jpg'],['logo','assets/logo.svg']]);
await put('dist/assets/shot.png',shot);await put('dist/assets/wall-bg.jpg',backdrop);await put('dist/assets/logo.svg','<svg/>');
await put('dist/assets/optimised/shot-480.webp','w');
await variants({'assets/shot.png':{width:480,height:300,source:sha1(shot),variants:[{url:'assets/optimised/shot-480.webp',width:480}]}});
await put('dist/assets/backgrounds/sources.json',JSON.stringify({'assets/wall-bg.jpg':sha1(backdrop)}));
for(const width of BACKDROP_WIDTHS)await put('dist/'+backdropCopy('assets/wall-bg.jpg',width),'copy');
const reasons=async()=>Object.fromEntries((await staleImages(root)).map(item=>[item.url,item.reason]));

assert.deepEqual(await reasons(),{},'Current copies, an SVG with none and a vector-only catalog entry are not stale');

await put('dist/assets/shot.png','replaced screenshot');
assert.match((await reasons())['assets/shot.png'],/changed since its thumbnails/,'A replaced original is stale even though its file date is irrelevant');
await put('dist/assets/shot.png',shot);
assert.deepEqual(await reasons(),{},'Restoring the original makes it current again');

await variants({'assets/shot.png':{width:480,height:300,variants:[]}});
assert.match((await reasons())['assets/shot.png'],/predate checksum tracking/,'Thumbnails without a checksum are stale');
await variants({});
assert.match((await reasons())['assets/shot.png'],/no thumbnails/,'A catalog image nobody optimised is stale');
await variants({'assets/shot.png':{width:480,height:300,source:sha1(shot),variants:[{url:'assets/optimised/shot-480.webp',width:480}]}});

await fs.rm(path.join(root,'dist/assets/optimised/shot-480.webp'));
assert.match((await reasons())['assets/shot.png'],/thumbnail .*missing/,'A deleted thumbnail is stale');
await put('dist/assets/optimised/shot-480.webp','w');

await put('dist/assets/wall-bg.jpg','new backdrop');
assert.match((await reasons())['assets/wall-bg.jpg'],/changed since its backdrop copies/,'A replaced backdrop is stale');
await put('dist/assets/wall-bg.jpg',backdrop);
await fs.rm(path.join(root,'dist',backdropCopy('assets/wall-bg.jpg',BACKDROP_WIDTHS[0])));
assert.match((await reasons())['assets/wall-bg.jpg'],/copy .*missing/,'A missing backdrop copy is stale');
await put('dist/'+backdropCopy('assets/wall-bg.jpg',BACKDROP_WIDTHS[0]),'copy');

await fs.rm(path.join(root,'dist/assets/shot.png'));
assert.deepEqual(await reasons(),{},'A missing original is build-content\'s error, not a stale-copy error');

await put('dist/assets/shot.png','another');
const message=staleImagesMessage(await staleImages(root));
assert(message.includes('npm run images')&&message.includes('assets/shot.png'),'The message names the fix and the image');
await fs.rm(root,{recursive:true,force:true});
console.log('Image freshness passed: checksums not dates, thumbnails and backdrop copies, missing files, vectors skipped, actionable message.');
