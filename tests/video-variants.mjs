import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {staleVideos,staleVideosMessage} from '../scripts/video-freshness.mjs';
import {videoVariants} from '../dist/video-variants.js';
import {videoSource} from '../dist/media-loading.js';

// A throwaway project: one MP4 with a current optimised copy, one whose original beat its re-encode.
const root=await fs.mkdtemp(path.join(os.tmpdir(),'video-freshness-'));
const put=async(file,data)=>{const target=path.join(root,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data);};
const sha1=data=>createHash('sha1').update(data).digest('hex');
const manifest=entries=>put('dist/video-variants.js','export const videoVariants='+JSON.stringify(entries)+';\n');
const reasons=async()=>Object.fromEntries((await staleVideos(root)).map(item=>[item.url,item.reason]));
await put('content/catalog.json',JSON.stringify({assets:[{id:'walk',type:'video',status:'published',url:'assets/walk.mp4'},{id:'tiny',type:'video',status:'published',url:'assets/tiny.mp4'},{id:'shot',type:'image',status:'published',url:'assets/shot.png'}]}));
await put('dist/assets/walk.mp4','walk');await put('dist/assets/tiny.mp4','tiny');await put('dist/assets/optimised/walk-1.mp4','w');
await manifest({'assets/walk.mp4':{source:sha1('walk'),url:'assets/optimised/walk-1.mp4'},'assets/tiny.mp4':{source:sha1('tiny'),url:null}});
assert.deepEqual(await reasons(),{},'A current copy, and an original kept because it was already smaller, are not stale; images are not checked here');
await put('dist/assets/walk.mp4','walk v2');
assert.deepEqual(await reasons(),{'assets/walk.mp4':'changed since its optimised copy was made'},'A replaced original is caught by checksum');
await put('dist/assets/walk.mp4','walk');await fs.rm(path.join(root,'dist/assets/optimised/walk-1.mp4'));
assert.deepEqual(await reasons(),{'assets/walk.mp4':'optimised copy assets/optimised/walk-1.mp4 is missing'});
await fs.rm(path.join(root,'dist/video-variants.js'));
assert.equal((await staleVideos(root)).length,2,'No manifest: every MP4 needs a copy');
assert.match(staleVideosMessage(await staleVideos(root)),/^2 videos out of date\. Run `npm run images`/);
await fs.rm(root,{recursive:true});

// The committed manifest: every copy exists, is smaller than its original, and is what the page serves.
const project=new URL('..',import.meta.url);
for(const [url,entry] of Object.entries(videoVariants)){
 const original=(await fs.stat(new URL('dist/'+url,project))).size;
 if(!entry.url){assert.equal(videoSource(url),url,`${url} keeps its original`);continue;}
 assert((await fs.stat(new URL('dist/'+entry.url,project))).size<original,`${entry.url} is smaller than ${url}`);
 assert.equal(videoSource(url),entry.url,`${url} is served from its optimised copy`);
}
assert.equal(videoSource('assets/unlisted.mp4'),'assets/unlisted.mp4','A video without a copy falls back to the original');
for(const file of ['dist/card-renderer.js','dist/content-blocks.js'])assert((await fs.readFile(new URL(file,project),'utf8')).includes('${videoSource('),`${file} writes video URLs through videoSource`);
assert((await fs.readFile(new URL('package.json',project),'utf8')).includes('node scripts/optimise-videos.mjs'),'npm run images makes the video copies');
assert((await fs.readFile(new URL('scripts/check-images.mjs',project),'utf8')).includes('staleVideos('),'The build stops on stale video copies');
console.log(`Video variants passed: freshness by checksum, ${Object.keys(videoVariants).length} committed copies smaller than their originals, served through videoSource.`);
