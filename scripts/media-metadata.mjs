import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {walkBlocks} from '../dist/content/model.js';
import {isBackdrop} from '../dist/asset-roles.js';

const BOX_HEADER=8,LARGE_BOX_HEADER=16,FIXED_ONE=0x10000,MATRIX_W=0x40000000;
const IDENTITY_MATRIX=[FIXED_ONE,0,0,0,FIXED_ONE,0,0,0,MATRIX_W];
// tkhd payload offsets (after the 4-byte version/flags): version 0 uses 32-bit times and duration, version 1 uses 64-bit.
const TKHD_MATRIX_OFFSET={0:40,1:52};
const RATIO_TOLERANCE=0.01;

// `read(offset,length)` is injected so the same walker serves files (header reads only) and test buffers.
async function readExact(read,offset,length,label){
 const buffer=await read(offset,length);
 if(buffer.length<length)throw new Error(`${label}: truncated MP4 (wanted ${length} bytes at offset ${offset}, got ${buffer.length})`);
 return buffer;
}

async function readBoxHeader(read,offset,end,label){
 if(offset+BOX_HEADER>end)return null;
 const head=await readExact(read,offset,BOX_HEADER,label);
 const size=head.readUInt32BE(0),type=head.toString('latin1',4,8);
 if(size===0)return {type,header:BOX_HEADER,end};
 if(size===1){
  const large=await readExact(read,offset,LARGE_BOX_HEADER,label);
  return {type,header:LARGE_BOX_HEADER,end:offset+Number(large.readBigUInt64BE(8))};
 }
 if(size<BOX_HEADER)throw new Error(`${label}: invalid MP4 box "${type}" with size ${size} at offset ${offset}`);
 return {type,header:BOX_HEADER,end:offset+size};
}

async function* childBoxes(read,start,end,label){
 let offset=start;
 for(;;){
  const box=await readBoxHeader(read,offset,end,label);
  if(!box)return;
  if(box.end>end)throw new Error(`${label}: MP4 box "${box.type}" at offset ${offset} runs past its parent`);
  yield {...box,start:offset+box.header};
  offset=box.end;
 }
}

async function findChild(read,parent,type,label){
 for await(const box of childBoxes(read,parent.start,parent.end,label))if(box.type===type)return box;
 return null;
}

function parseTkhd(payload,label){
 const version=payload[0],matrixOffset=TKHD_MATRIX_OFFSET[version];
 if(matrixOffset===undefined)throw new Error(`${label}: unsupported tkhd version ${version}`);
 if(payload.length<matrixOffset+36+8)throw new Error(`${label}: truncated tkhd box`);
 const matrix=Array.from({length:9},(_,i)=>payload.readInt32BE(matrixOffset+i*4));
 const width=Math.round(payload.readUInt32BE(payload.length-8)/FIXED_ONE),height=Math.round(payload.readUInt32BE(payload.length-4)/FIXED_ONE);
 return {width,height,matrix};
}

// Reads the first video track's stored size. A non-identity matrix means the displayed size is not the stored size, so refuse to guess.
export async function readMp4Size(read,fileSize,label){
 const root={start:0,end:fileSize};
 // Check the signature before walking: arbitrary bytes would otherwise parse as an absurd box size.
 const signature=await read(0,BOX_HEADER);
 if(signature.length<BOX_HEADER||signature.toString('latin1',4,8)!=='ftyp')throw new Error(`${label}: not an MP4 (no ftyp box at the start)`);
 const moov=await findChild(read,root,'moov',label);
 if(!moov)throw new Error(`${label}: MP4 has no moov box`);
 for await(const trak of childBoxes(read,moov.start,moov.end,label)){
  if(trak.type!=='trak')continue;
  const tkhd=await findChild(read,trak,'tkhd',label);
  if(!tkhd)continue;
  const size=parseTkhd(await readExact(read,tkhd.start,tkhd.end-tkhd.start,label),label);
  if(!size.width||!size.height)continue;
  if(size.matrix.some((value,i)=>value!==IDENTITY_MATRIX[i]))throw new Error(`${label}: rotated or transformed video track (matrix ${size.matrix.join(',')}); the displayed size cannot be measured`);
  return {width:size.width,height:size.height};
 }
 throw new Error(`${label}: MP4 has no video track with a non-zero size`);
}

export async function measureMp4File(file){
 const handle=await fs.open(file);
 try{
  const {size}=await handle.stat();
  const read=async(offset,length)=>{const buffer=Buffer.alloc(length);const {bytesRead}=await handle.read(buffer,0,length,offset);return buffer.subarray(0,bytesRead);};
  return await readMp4Size(read,size,file);
 }finally{await handle.close();}
}

const variantsByDirectory=new Map();
async function loadImageVariants(distDir){
 if(!variantsByDirectory.has(distDir))variantsByDirectory.set(distDir,import(pathToFileURL(path.join(distDir,'image-variants.js')).href).then(module=>module.imageVariants));
 return variantsByDirectory.get(distDir);
}

// Backdrops and SVG are not card or block media, so they are never measured. Remote URLs have no local file; authored values stand.
export async function measureAsset(asset,distDir){
 const extension=path.extname(asset.url.split(/[?#]/)[0]).toLowerCase();
 if(/^https?:\/\//.test(asset.url)||isBackdrop(asset)||extension==='.svg')return null;
 if(asset.type==='image'){
  const variant=(await loadImageVariants(distDir))[asset.url];
  if(!variant)throw new Error(`Asset ${asset.id}: no entry for ${asset.url} in image-variants.js; run npm run images`);
  return {width:variant.width,height:variant.height};
 }
 if(extension!=='.mp4')throw new Error(`Asset ${asset.id}: cannot measure ${extension||'unknown'} video ${asset.url}; only MP4 is supported`);
 return measureMp4File(path.join(distDir,decodeURIComponent(asset.url.split(/[?#]/)[0])));
}

// Only published assets are measured: a draft may point at a file that is not there yet.
export async function withMeasuredMedia(catalog,distDir){
 const assets=[];
 for(const asset of catalog.assets||[]){
  const measured=asset.status==='published'?await measureAsset(asset,distDir):null;
  if(!measured){assets.push(asset);continue;}
  for(const key of ['width','height'])if(asset[key]!==undefined&&asset[key]!==measured[key])throw new Error(`Asset ${asset.id}: authored ${key} ${asset[key]} differs from measured ${measured[key]} (${measured.width}x${measured.height}); remove the authored size or correct it`);
  assets.push({...asset,...measured});
 }
 return {...catalog,assets};
}

// Report only: a poster that differs in shape from its video makes the layout jump when the video loads.
export function posterRatioMismatches(catalog){
 const assets=new Map(catalog.assets.map(asset=>[asset.id,asset])),pairs=[];
 for(const doc of catalog.documents){
  if(doc.heroMediaId&&doc.hoverVideoId)pairs.push([`${doc.id}.hoverVideoId`,doc.heroMediaId,doc.hoverVideoId]);
  walkBlocks(doc.blocks||[],block=>{if(block.type==='video'&&block.posterMediaId&&block.mediaId)pairs.push([`${doc.id}.${block.id}`,block.posterMediaId,block.mediaId]);});
 }
 const mismatches=[];
 for(const [where,posterId,videoId] of pairs){
  const poster=assets.get(posterId),video=assets.get(videoId);
  if(!poster?.width||!poster.height||!video?.width||!video.height)continue;
  const posterRatio=poster.width/poster.height,videoRatio=video.width/video.height;
  if(Math.abs(posterRatio-videoRatio)/videoRatio>RATIO_TOLERANCE)mismatches.push(`${where}: poster ${posterId} ${poster.width}x${poster.height} vs video ${videoId} ${video.width}x${video.height}`);
 }
 return mismatches;
}
