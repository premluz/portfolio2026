import {LAB_RIPPLE} from './motion-tokens.js';

// One expanding ring across the live page, with the colour fringe of the image
// hover ripple: each channel is displaced by a slightly different amount, so the
// ring disperses into red/blue edges while everything outside it stays still.
// SVG filters can distort live DOM (WebGL would need a page snapshot). The ring
// is a displacement map rendered once and scaled up, so frames only move it.
const SVG_NS='http://www.w3.org/2000/svg';
const ROOT_CLASS='lab-rippling';
const TARGETS=[['#main','lab-ripple-main'],['body > header','lab-ripple-header'],['.site-footer','lab-ripple-footer']];
const MAP_SIZE=256,NEUTRAL='rgb(128,128,128)';
const CHANNELS={
 red:'1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
 green:'0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
 blue:'0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'
};
// The ring sits near the map's rim so the scaled image fully contains it.
export const RING_RADIUS=LAB_RIPPLE.ringRadius;

// R/G encode an outward push (128 = none) shaped as one soft band.
function ringMapUrl(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=MAP_SIZE;
 const context=canvas.getContext('2d');
 if(!context)throw Error('Lab ripple needs a 2D canvas to render its displacement map');
 const image=context.createImageData(MAP_SIZE,MAP_SIZE),half=MAP_SIZE/2;
 for(let y=0;y<MAP_SIZE;y++)for(let x=0;x<MAP_SIZE;x++){
  const dx=(x+.5-half)/half,dy=(y+.5-half)/half,distance=Math.hypot(dx,dy)||1;
  const band=Math.exp(-(((distance-RING_RADIUS)/LAB_RIPPLE.ringWidth)**2)),i=(y*MAP_SIZE+x)*4;
  image.data[i]=128+127*band*dx/distance;image.data[i+1]=128+127*band*dy/distance;image.data[i+2]=128;image.data[i+3]=255;
 }
 context.putImageData(image,0,0);return canvas.toDataURL();
}

const node=(name,attributes)=>{const el=document.createElementNS(SVG_NS,name);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,value);return el;};

function channel(name){
 const shift=node('feDisplacementMap',{in:'SourceGraphic',in2:'ring',scale:'0',xChannelSelector:'R',yChannelSelector:'G',result:name+'Shift'});
 return {shift,nodes:[shift,node('feColorMatrix',{in:name+'Shift',type:'matrix',values:CHANNELS[name],result:name})]};
}

function buildFilter(id,mapUrl){
 const filter=node('filter',{id,x:'0',y:'0',width:'100%',height:'100%','color-interpolation-filters':'sRGB'});
 const ring=node('feImage',{href:mapUrl,preserveAspectRatio:'none',x:'0',y:'0',width:'0',height:'0',result:'ringImage'});
 const channels=['red','green','blue'].map(channel);
 filter.append(node('feFlood',{'flood-color':NEUTRAL,result:'neutral'}),ring,
  node('feComposite',{in:'ringImage',in2:'neutral',operator:'over',result:'ring'}),
  ...channels.flatMap(part=>part.nodes),
  node('feBlend',{in:'red',in2:'green',mode:'screen',result:'redGreen'}),
  node('feBlend',{in:'redGreen',in2:'blue',mode:'screen'}));
 return {filter,ring,shifts:channels.map(part=>part.shift)};
}

/** Positions one ring (viewport coordinates) on every distorted page region. */
export function createLabFilter(root=document.documentElement){
 const defs=document.getElementById('filters');
 if(!defs)throw Error('Lab ripple needs the shared <defs id="filters"> element');
 const mapUrl=ringMapUrl();
 const parts=TARGETS.map(([selector,id])=>{const built=buildFilter(id,mapUrl);defs.append(built.filter);return {selector,...built};});
 const dispersion=[1+LAB_RIPPLE.dispersion,1,1-LAB_RIPPLE.dispersion];
 return {
  apply({x,y,radius,amplitude}){
   const active=amplitude>LAB_RIPPLE.restAmplitude&&radius>0;
   root.classList.toggle(ROOT_CLASS,active);if(!active)return;
   const size=radius/RING_RADIUS;
   for(const part of parts){
    const rect=document.querySelector(part.selector)?.getBoundingClientRect();if(!rect)continue;
    part.ring.setAttribute('x',(x-rect.left-size).toFixed(1));part.ring.setAttribute('y',(y-rect.top-size).toFixed(1));
    part.ring.setAttribute('width',(size*2).toFixed(1));part.ring.setAttribute('height',(size*2).toFixed(1));
    part.shifts.forEach((shift,index)=>shift.setAttribute('scale',(amplitude*LAB_RIPPLE.maxWarpPx*dispersion[index]).toFixed(1)));
   }
  }
 };
}
