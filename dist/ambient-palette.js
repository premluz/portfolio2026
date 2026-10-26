import {oklchChannels} from './surface-colors.js';

// Automatic ambience, in the spirit of YouTube's ambient mode: the glow takes its
// two hues from what is actually on the card. Each half of a tiny downsample is
// averaged as hue vectors weighted by chroma, so a vivid accent outweighs a large
// grey UI field and near-black/near-white pixels barely count.
const SAMPLE_WIDTH=32,SAMPLE_HEIGHT=20;
const MIN_LIGHTNESS=.12,MAX_LIGHTNESS=.97;
// Chroma at which the glow uses the theme's full ambient chroma; greyer sources fade toward neutral.
const REFERENCE_CHROMA=.06,MIN_CHROMA_SCALE=.45,MAX_CHROMA_SCALE=1.6;
export const VIDEO_SAMPLE_MS=480;

const imageCache=new Map(),failed=new Set();
let canvas=null,context=null;

function sampler(){
 if(context)return context;
 canvas=document.createElement('canvas');canvas.width=SAMPLE_WIDTH;canvas.height=SAMPLE_HEIGHT;
 context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('Automatic ambience needs a 2D canvas to sample card media');
 return context;
}

function summarize(data,fromColumn,toColumn){
 let x=0,y=0,weight=0,chroma=0;
 for(let row=0;row<SAMPLE_HEIGHT;row++)for(let column=fromColumn;column<toColumn;column++){
  const i=(row*SAMPLE_WIDTH+column)*4,color=oklchChannels(`rgb(${data[i]},${data[i+1]},${data[i+2]})`);
  if(!color||color[0]<MIN_LIGHTNESS||color[0]>MAX_LIGHTNESS)continue;
  const w=color[1]*color[1],angle=color[2]*Math.PI/180;
  x+=Math.cos(angle)*w;y+=Math.sin(angle)*w;weight+=w;chroma+=color[1]*w;
 }
 if(weight<1e-7)return {hue:null,chromaScale:MIN_CHROMA_SCALE};
 const scale=Math.min(MAX_CHROMA_SCALE,Math.max(MIN_CHROMA_SCALE,chroma/weight/REFERENCE_CHROMA));
 return {hue:(Math.atan2(y,x)*180/Math.PI+360)%360,chromaScale:scale};
}

function sample(media){
 const ctx=sampler();
 ctx.drawImage(media,0,0,SAMPLE_WIDTH,SAMPLE_HEIGHT);
 const {data}=ctx.getImageData(0,0,SAMPLE_WIDTH,SAMPLE_HEIGHT),half=SAMPLE_WIDTH/2;
 const a=summarize(data,0,half),b=summarize(data,half,SAMPLE_WIDTH);
 // A monochrome half borrows the other half's hue so the pair never jumps to red (hue 0).
 const hue=a.hue??b.hue;if(hue===null)return {a:{...a,hue:null},b:{...b,hue:null}};
 return {a:{...a,hue},b:{...b,hue:b.hue??hue}};
}

/** The playing hover video when there is one, else the card's decoded image. */
export function ambientMediaSource(host){
 const video=host?.querySelector('.visual video');
 if(video&&!video.paused&&video.readyState>=2&&video.videoWidth)return {media:video,live:true,key:null};
 const image=host?.querySelector('.visual img');
 if(image?.complete&&image.naturalWidth)return {media:image,live:false,key:image.currentSrc||image.src};
 return null;
}

/** Two sampled {hue, chromaScale} stops for the host's media, or null if none is readable yet. */
export function sampleAmbientColors(host){
 const source=ambientMediaSource(host);if(!source)return null;
 const key=source.key;
 if(key&&imageCache.has(key))return imageCache.get(key);
 if(key&&failed.has(key))return null;
 try{
  const colors=sample(source.media);if(key)imageCache.set(key,colors);return colors;
 }catch(error){
  // Cross-origin media taints the canvas; such cards keep their project colours.
  if(key)failed.add(key);console.warn(`Automatic ambience could not sample ${key||'video frame'}; using project colours`,error);return null;
 }
}
