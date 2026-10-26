// Finds the photo frame inside a backdrop export. Some exports are a whole design canvas: the photo
// sits at the top-left of a large white board that also holds unrelated thumbnails. The frame is the
// region anchored at the top-left corner, walking right along a row and down a column until a run of
// near-white canvas starts. An export that is only the frame has no such run and is returned whole.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PROBE_WIDTH=1600;          // decoded size for analysis; the crop is scaled back to full size
const CANVAS_MIN=245;            // every channel at or above this is blank canvas
const CANVAS_RUN=.02;            // a blank run this long (fraction of the side) ends the frame
const EDGE_COLUMNS=[.005,.01,.02]; // columns near the left edge, always inside a frame, for its height
const ROW_STEP=.05;               // rows sampled every 5% of the frame's height for its width
// The edge is found on the probe, where one pixel spans several source pixels, and the frame's own edge is
// anti-aliased into the canvas, and some exports leave a sliver of canvas inside the corner (tracr-bg, lower
// left); pulling every edge in by two probe pixels (<1% of the frame) keeps all of it out.
const EDGE_INSET=2;

function readBmp(buffer){
 if(buffer.toString('ascii',0,2)!=='BM')throw new Error('Expected a BMP from sips');
 const offset=buffer.readUInt32LE(10),width=buffer.readInt32LE(18),rawHeight=buffer.readInt32LE(22),bits=buffer.readUInt16LE(28);
 if(bits!==24&&bits!==32)throw new Error(`Unsupported BMP depth ${bits}`);
 const height=Math.abs(rawHeight),step=bits/8,stride=Math.ceil(width*step/4)*4,bottomUp=rawHeight>0;
 const blank=(x,y)=>{const row=bottomUp?height-1-y:y,i=offset+row*stride+x*step;return buffer[i]>=CANVAS_MIN&&buffer[i+1]>=CANVAS_MIN&&buffer[i+2]>=CANVAS_MIN;};
 return {width,height,blank};
}

// Length of the non-blank run from the start, ending at the first blank run of `minRun` pixels.
function extent(length,isBlank,minRun){
 let run=0;
 for(let i=0;i<length;i++){if(isBlank(i)){run++;if(run>=minRun)return i-run+1;}else run=0;}
 return length;
}

const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
// Most common value, within one pixel: a soft glow bleeds past the frame on a few rows, the edge holds on most.
function mode(values){
 let best=values[0],count=0;
 for(const value of values){const near=values.filter(other=>Math.abs(other-value)<=1).length;if(near>count||near===count&&value<best){best=value;count=near;}}
 return best;
}
function measure({width,height,blank}){
 // Height first, from the left edge: rows below the frame are blank canvas and would read as zero width.
 const down=median(EDGE_COLUMNS.map(f=>extent(height,y=>blank(Math.floor(width*f),y),Math.ceil(height*CANVAS_RUN))));
 const rows=[];for(let f=ROW_STEP;f<1;f+=ROW_STEP)rows.push(Math.floor(down*f));
 const across=mode(rows.map(y=>extent(width,x=>blank(x,y),Math.ceil(width*CANVAS_RUN))));
 return {width:across,height:down};
}

/** {x,y,width,height} in source pixels, or null when the export is already just the frame. */
export async function findBackdropFrame(source,{sourceWidth,sourceHeight}){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'backdrop-frame-')),probe=path.join(dir,'probe.bmp');
 try{
  execFileSync('sips',['--resampleWidth',String(PROBE_WIDTH),'-s','format','bmp',source,'--out',probe],{stdio:'pipe'});
  const image=readBmp(await fs.readFile(probe)),frame=measure(image);
  if(frame.width>=image.width-1&&frame.height>=image.height-1)return null;
  if(frame.width<image.width*.05||frame.height<image.height*.05)throw new Error(`${source}: no photo frame found at the top-left`);
  const scale=sourceWidth/image.width;
  const inset=Math.ceil(EDGE_INSET*scale);
  return {x:inset,y:inset,width:Math.min(sourceWidth,Math.floor(frame.width*scale))-2*inset,height:Math.min(sourceHeight,Math.floor(frame.height*scale))-2*inset};
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
