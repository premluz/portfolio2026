// Builds web-sized copies of the panoramic project backdrops (assets/*-bg.jpg, ~16k px wide).
// The originals stay untouched; copies land in dist/assets/backgrounds/<name>-<width>.jpg, the
// paths dist/backdrop-sources.js derives. Uses macOS `sips`, so run it locally after adding a
// backdrop and commit the output. `--check` only verifies every catalog backdrop has its copies.
// Whole-canvas exports are cropped to their photo frame first (see backdrop-frame.mjs).
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BACKDROP_WIDTHS,GENERIC_BACKDROP_ID,backdropCopy} from '../dist/backdrop-sources.js';
import {findBackdropFrame} from './backdrop-frame.mjs';
import {chromium} from '@playwright/test';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const JPEG_QUALITY='62';
const catalog=JSON.parse(await fs.readFile(path.join(root,'content/catalog.json'),'utf8'));
// Every asset whose id ends in -bg is a backdrop (the same rule scripts/optimise-images.py skips by), linked or not yet.
const backdropIds=new Set([GENERIC_BACKDROP_ID,...catalog.presentations.map(item=>item.card?.backgroundMediaId).filter(Boolean)]);
const sources=catalog.assets.filter(asset=>asset.type==='image'&&(backdropIds.has(asset.id)||asset.id.endsWith('-bg'))).map(asset=>asset.url);
if(!sources.length)throw new Error('No presentations[].card.backgroundMediaId found in content/catalog.json');
const missing=[];
const sips=args=>execFileSync('sips',args,{stdio:'pipe',encoding:'utf8'});
const dimensions=file=>{const out=sips(['-g','pixelWidth','-g','pixelHeight',file]);return {sourceWidth:Number(out.match(/pixelWidth: (\d+)/)[1]),sourceHeight:Number(out.match(/pixelHeight: (\d+)/)[1])};};
// sips only crops around the centre (it ignores --cropOffset), so the top-left frame is cut out on a
// canvas in headless Chromium, which Playwright already provides; sips then makes the web copies.
// Each crop gets a fresh page: decoded canvases are large and would otherwise pile up in one tab.
async function cropInBrowser(browser,file,frame,out){
 const page=await browser.newPage();
 try{
 const data='data:image/jpeg;base64,'+(await fs.readFile(file)).toString('base64');
 const png=await page.evaluate(async({data,frame})=>{
  const image=new Image();image.src=data;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;
  canvas.getContext('2d').drawImage(image,frame.x,frame.y,frame.width,frame.height,0,0,frame.width,frame.height);
  return canvas.toDataURL('image/png').split(',')[1];
 },{data,frame});
 await fs.writeFile(out,Buffer.from(png,'base64'));
 }finally{await page.close();}
}
// The frame to resample from: the original, or a temporary crop of it when it is a whole canvas.
// Chromium refuses to decode images much above ~55M pixels (13000×4250 decodes, 14000×4575 does not),
// so oversized exports are first scaled under that area. An export of just the frame never needs it.
const DECODE_MAX_PIXELS=55e6;
async function framed(original,dir,browser){
 let file=original;const {sourceWidth,sourceHeight}=dimensions(original);
 if(sourceWidth*sourceHeight>DECODE_MAX_PIXELS){file=path.join(dir,'decodable-'+path.basename(original));sips(['--resampleWidth',String(Math.floor(Math.sqrt(DECODE_MAX_PIXELS*sourceWidth/sourceHeight))),original,'--out',file]);}
 const frame=await findBackdropFrame(file,dimensions(file));if(!frame)return {file,frameWidth:dimensions(file).sourceWidth,note:'whole image'};
 const cropped=path.join(dir,path.basename(file,path.extname(file))+'.png');
 await cropInBrowser(browser,file,frame,cropped);
 return {file:cropped,frameWidth:frame.width,note:`cropped to ${frame.width}×${frame.height} frame`};
}
const work=await fs.mkdtemp(path.join(os.tmpdir(),'backdrops-'));
const browser=check?null:await chromium.launch();
try{
 for(const source of sources){
  const targets=BACKDROP_WIDTHS.map(width=>({width,target:path.join(root,'dist',backdropCopy(source,width))}));
  if(check){for(const {target} of targets)await fs.access(target).catch(()=>missing.push(path.relative(root,target)));continue;}
  const {file,frameWidth,note}=await framed(path.join(root,'dist',source),work,browser);
  console.log(`${source}: ${note}${frameWidth<Math.max(...BACKDROP_WIDTHS)?` (frame is ${frameWidth}px wide; larger copies keep that width rather than upscale)`:''}`);
  for(const {width,target} of targets){
   await fs.mkdir(path.dirname(target),{recursive:true});
   sips(['--resampleWidth',String(Math.min(width,frameWidth)),'-s','format','jpeg','-s','formatOptions',JPEG_QUALITY,file,'--out',target]);
  }
 }
}finally{await browser?.close();await fs.rm(work,{recursive:true,force:true});}
if(missing.length)throw new Error('Backdrop copies missing; run node scripts/build-backgrounds.mjs:\n'+missing.join('\n'));
console.log(`${check?'Checked':'Built'} ${sources.length} backdrops × ${BACKDROP_WIDTHS.length} widths.`);
