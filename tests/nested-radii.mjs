import assert from 'node:assert/strict';
import {ImageFrame,imageGeometry,readFrameRadius,imageEdgeGeometry,sourceEdgeInset} from '../dist/image-frame.js';
import {LiquidImage} from '../dist/liquid-image.js';

let imageRounding='',outer=64,cardPadding=40,padding={top:0,right:0,bottom:0,left:0};
const card={dataset:{},classList:{contains:()=>true}};
const native={naturalWidth:1600,naturalHeight:900,style:{},addEventListener(){},removeEventListener(){}};
const edge={style:{},setAttribute(){}};
let flow=false;
const el={style:{},clientWidth:600,clientHeight:375,closest:()=>flow?null:card,
 querySelector:selector=>selector==='img'?native:edge,classList:{add(){},remove(){}}};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.getComputedStyle=node=>node===card?{
 borderTopLeftRadius:outer+'px',paddingTop:cardPadding+'px',paddingRight:cardPadding+'px',paddingBottom:cardPadding+'px',paddingLeft:cardPadding+'px'
}:{borderTopLeftRadius:el.style.borderRadius||'24px',getPropertyValue:key=>key==='--image-rounding'?imageRounding:key.startsWith('--image-padding-')?String(padding[key.replace('--image-padding-','')]||0):''};
const frame=new ImageFrame(el);
let mask,maskInset;
const renderer=Object.assign(Object.create(LiquidImage.prototype),{
 ready:true,dead:false,el,imageFrame:frame,motion:{x:1,y:0},effects:{ripple:false,blur:false},burstStart:-10000,burstForce:0,
 canvas:{style:{}},uniforms:{cornerRadius:'radius',sourceInset:'inset'},gl:{useProgram(){},uniform2f(){},uniform1f:(location,value)=>{if(location==='radius')mask=value;if(location==='inset')maskInset=value;},drawArrays(){}}
});
const verify=expected=>{
 frame.resize();renderer.ratio=frame.ratio;renderer.renderW=el.clientWidth;renderer.renderH=el.clientHeight;renderer.draw(0);
 assert.equal(parseFloat(native.style.borderRadius),expected);
 assert.equal(mask,expected,'Liquid mask has exactly the native screenshot radius');
 assert.equal(maskInset,sourceEdgeInset(native.src)*parseFloat(native.style.width)/native.naturalWidth,'Motion rendering masks the same baked edge as the native still');
 const {clipPath,...nativeBounds}=native.style;
 if(sourceEdgeInset(native.src)){
  const visible=imageEdgeGeometry(Object.fromEntries(['width','height','left','top'].map(k=>[k,parseFloat(native.style[k])])),2,native.naturalWidth);
  for(const key of ['width','height','left','top'])assert.equal(parseFloat(edge.style[key]),visible[key],'Border follows the visible image after removing its baked frame');
  assert.equal(native.style.clipPath,`inset(${visible.inset}px round ${expected}px)`);
 }else assert.deepEqual(edge.style,nativeBounds,'Hairline and screenshot have identical corner and bounds geometry');
 assert(Math.abs(parseFloat(native.style.width)/parseFloat(native.style.height)-native.naturalWidth/native.naturalHeight)<1e-10,'Fitting never squashes the source');
};
// Desktop, compact, flip and wide detail use their actual radius/padding, not
// an unrelated percentage of the image. Changes work without a dimension change.
for(const [r,p] of [[64,40],[44,24],[44,32],[100,76],[0,0],[24,40]]){
 outer=r;cardPadding=p;verify(Math.max(0,r-p));
}
outer=64;cardPadding=40;native.naturalWidth=402;native.naturalHeight=858;
verify(24);assert(parseFloat(native.style.left)>0,'Portrait is centred');
el.clientHeight=800;verify(24);
assert(parseFloat(native.style.height)>700,'Masonry portrait grows without changing its radius');
// Full bleed uses the card perimeter, then subtracts the independent image inset.
card.dataset.imageMode='bleed';padding={top:128,right:24,bottom:24,left:24};verify(40);
assert.equal(readFrameRadius(el),64,'Full-bleed holding frame matches its card');
assert.equal(el.style.borderRadius,'64px');
// Flow pictures interpolate the holding-frame radius and padding. Exercise an
// opening and its mid-flight reversal; zero remains a valid endpoint.
flow=true;
for(const progress of [0,.2,.5,.8,.5,.2,0,1]){
 el.style.borderRadius=(24*(1-progress))+'px';
 padding={top:0,right:0,bottom:0,left:0};verify(24*(1-progress));
}
// Independent image rounding refreshes sharp native images, their edge and GPU mask.
flow=false;card.dataset.imageMode='inset';outer=64;cardPadding=40;
for(const mode of ['inset','bleed'])for(const [r,p] of [[64,40],[12,40],[0,80]])for(const limit of [6,0,12,32]){
 card.dataset.imageMode=mode;outer=r;cardPadding=p;imageRounding=String(limit);verify(limit);
 assert.equal(el.style.overflow,'visible','The parent frame must not override screenshot corners');
 assert.equal(parseFloat(el.style.borderRadius),mode==='bleed'?r:Math.max(0,r-p),'Backing still follows its own nested/card geometry');
}
flow=true;
for(const progress of [0,.2,.5,.8,.5,.2,0,1]){el.style.borderRadius=(64*(1-progress))+'px';imageRounding='6';verify(6);assert.equal(el.style.overflow,'visible','Morph frames retain the independent image mask');}
const tiny=imageGeometry(20,12,16/9,128);
assert.equal(tiny.radius,Math.min(tiny.width,tiny.height)/2,'Radius is clamped to the actual image bounds');
// Tracr's original JPEG contains a white rounded matte. It must be masked at
// the source scale during resizes and reversals, including the native/GPU edge.
native.src='https://example.test/assets/tracr-transfer.jpg';native.naturalWidth=1440;native.naturalHeight=900;
padding={top:0,right:0,bottom:0,left:0};
for(const width of [300,600,1100,600,300])for(const selected of [0,6,32]){
 el.clientWidth=width;el.clientHeight=width/1.6;imageRounding=String(selected);
 verify(Math.max(selected,34*width/1440));
}
native.src='assets/playstation-content.jpg';imageRounding='6';
for(const width of [300,600,1100,600,300]){el.clientWidth=width;el.clientHeight=width/1.6;verify(6);}
native.src='assets/vodafone-iot.jpg';verify(6);assert.equal(native.style.clipPath,'none','Unframed source assets keep their full bounds');
frame.destroy();
console.log('Nested radii passed: card/padding controls, portrait fitting, full bleed, native/border/canvas agreement and reversible morph frames.');
