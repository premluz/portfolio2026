import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {measureAsset,measureMp4File,posterRatioMismatches,readMp4Size,withMeasuredMedia} from '../scripts/media-metadata.mjs';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const FIXED=0x10000,IDENTITY=[FIXED,0,0,0,FIXED,0,0,0,0x40000000];

// Real files: the content changes, so assert shape and agreement with the built catalog rather than pinned pixel sizes.
const built=JSON.parse(await fs.readFile(new URL('../dist/content/catalog.json',import.meta.url),'utf8'));
const videos=built.assets.filter(asset=>asset.type==='video'&&asset.status==='published'&&/^assets\/[^/]+\.mp4$/.test(asset.url));
assert(videos.length>=3,'The catalog publishes several MP4 files to measure');
for(const video of videos){
 const size=await measureMp4File(path.join(dist,video.url));
 assert(Number.isInteger(size.width)&&size.width>0&&Number.isInteger(size.height)&&size.height>0,`${video.url} has a positive integer size`);
 assert.deepEqual(size,{width:video.width,height:video.height},`${video.url} measures the same as the exported catalog`);
}
const shape=name=>measureMp4File(path.join(dist,`assets/${name}.mp4`)).then(({width,height})=>width/height);
assert(await shape('merlin')>1,'merlin.mp4 is landscape');assert(await shape('rios')<1,'rios.mp4 is portrait');

const box=(type,...parts)=>{const body=Buffer.concat(parts),head=Buffer.alloc(8);head.writeUInt32BE(8+body.length,0);head.write(type,4,'latin1');return Buffer.concat([head,body]);};
const tkhd=(width,height,matrix=IDENTITY,version=0)=>{
 const lead=Buffer.alloc(version===0?40:52);lead[0]=version;
 const tail=Buffer.alloc(36+8);matrix.forEach((value,i)=>tail.writeInt32BE(value,i*4));tail.writeUInt32BE(width*FIXED,36);tail.writeUInt32BE(height*FIXED,40);
 return box('tkhd',lead,tail);
};
const mp4=(...tracks)=>Buffer.concat([box('ftyp',Buffer.from('mp42')),box('mdat',Buffer.alloc(32)),box('moov',...tracks.map(track=>box('trak',track)))]);
const measure=(buffer,label='synthetic')=>readMp4Size(async(offset,length)=>buffer.subarray(offset,offset+length),buffer.length,label);

assert.deepEqual(await measure(mp4(tkhd(0,0),tkhd(640,360))),{width:640,height:360},'An audio track with zero size is skipped');
assert.deepEqual(await measure(mp4(tkhd(320,240,IDENTITY,1))),{width:320,height:240},'Version 1 tkhd boxes are read');
await assert.rejects(measure(mp4(tkhd(1080,1920,[0,FIXED,0,-FIXED,0,0,0,0,0x40000000]))),/rotated or transformed/,'A rotated recording is refused, not guessed');
await assert.rejects(measure(mp4(tkhd(0,0))),/no video track/);
await assert.rejects(measure(mp4(tkhd(640,360)).subarray(0,60),'cut.mp4'),/cut\.mp4: truncated|runs past its parent/,'A truncated file throws and names the file');
await assert.rejects(measure(Buffer.from('<!doctype html><title>not video</title>'),'page.mp4'),/page\.mp4: not an MP4/,'A non-MP4 buffer throws');

// Catalog integration, against the real image index.
const image={id:'sample',type:'image',status:'published',url:'assets/playstation-content.jpg',alt:'x'};
assert.deepEqual(await measureAsset(image,dist),{width:1440,height:900});
assert.equal(await measureAsset({id:'merlin-bg',type:'image',status:'published',url:'assets/merlin-bg.jpg',alt:''},dist),null,'Backdrops are not measured');
assert.equal(await measureAsset({id:'qr',type:'image',status:'published',url:'assets/bastion.svg',alt:'x'},dist),null,'SVG is not measured');
await assert.rejects(measureAsset({id:'gone',type:'image',status:'published',url:'assets/not-optimised.png',alt:'x'},dist),/gone.*image-variants/,'An image missing from the variants index fails loudly');
await assert.rejects(measureAsset({id:'clip',type:'video',status:'published',url:'assets/clip.webm'},dist),/clip.*\.webm/,'Other containers are refused');

const measured=await withMeasuredMedia({assets:[image,{id:'draft',type:'video',status:'draft',url:'assets/missing.mp4'},{id:'mer',type:'video',status:'published',url:'assets/merlin.mp4'}]},dist);
assert.deepEqual(measured.assets.map(asset=>[asset.id,asset.width,asset.height]),[['sample',1440,900],['draft',undefined,undefined],['mer',1440,900]],'Drafts are skipped; published media gains its size');
await assert.rejects(withMeasuredMedia({assets:[{...image,width:10,height:900}]},dist),/authored width 10 differs from measured 1440/,'A wrong authored size is an error, with both values');
assert.equal((await withMeasuredMedia({assets:[{...image,width:1440,height:900}]},dist)).assets[0].width,1440,'A matching authored size is accepted');

// Poster/video ratio report.
const asset=(id,width,height)=>({id,width,height});
const catalog={assets:[asset('hero',1440,900),asset('clip',1920,1200),asset('tall',393,852),asset('wide',1440,900),asset('poster',100,100)],documents:[
 {id:'ok',heroMediaId:'hero',hoverVideoId:'clip',blocks:[]},
 {id:'bad',heroMediaId:'hero',hoverVideoId:'tall',blocks:[{id:'section',type:'section',items:[{id:'v',type:'video',mediaId:'wide',posterMediaId:'poster'}]}]}
]};
assert.deepEqual(posterRatioMismatches(catalog).map(line=>line.split(':')[0]),['bad.hoverVideoId','bad.v'],'Equal ratios pass; differing ones are listed, including nested video blocks');
console.log('Media metadata passed: MP4 headers (every published file against the catalog, audio-first, version 1), rotation/truncation/non-MP4 refusals, image index, backdrop/SVG skips, authored-size conflicts and poster ratio report.');
