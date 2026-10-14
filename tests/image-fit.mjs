import assert from 'node:assert/strict';
import {LiquidImage} from '../dist/liquid-image.js';
import {ImageFrame,imageGeometry} from '../dist/image-frame.js';

globalThis.devicePixelRatio=1.25;
let fit,imageSize,cornerRadius,imageCenter;
const image=Object.create(LiquidImage.prototype);
Object.assign(image,{
 ready:true,dead:false,effects:{ripple:true,blur:true},canvas:{width:0,height:0,style:{}},el:{clientWidth:1,clientHeight:1,classList:{add(){},remove(){}}},
 fixedResolution:[1024,1024],motion:{x:.2,y:0},strength:()=>0,
 burstStart:-10000,burstForce:0,mouse:[.5,.5],burstOrigin:[.06,.5],uniforms:{fit:'fit',imageSize:'imageSize',cornerRadius:'cornerRadius',imageCenter:'imageCenter'},
 gl:{useProgram(){},viewport(){},uniform2f(location,x,y){if(location==='fit')fit=[x,y];if(location==='imageSize')imageSize=[x,y];if(location==='imageCenter')imageCenter=[x,y];},uniform2fv(){},uniform1f(location,value){if(location==='cornerRadius')cornerRadius=value;},drawArrays(){}}
});

// Exercise the real resize/draw path across portrait, square, landscape and
// intermediate morph frames, with a fixed backing resolution as used in flow.
for(const ratio of [853/1280,878/1280,1,16/9,3]){
 for(const [width,height] of [[300,650],[450,400],[700,430],[1280,320],[240,800]]){
  image.ratio=ratio;image.el.clientWidth=width;image.el.clientHeight=height;
  image.resize();image.draw(0);
  const displayedWidth=width/fit[0],displayedHeight=height/fit[1];
  assert(Math.abs(displayedWidth/displayedHeight-ratio)<1e-10,'Image proportions must match the source');
  assert(displayedWidth<=width+1e-10&&displayedHeight<=height+1e-10,'The full source must fit inside the frame');
  assert(fit.every(scale=>scale>=1),'Both source edges must remain within the frame');
  assert(Math.min(...fit)===1,'Contain must fill one frame axis');
  assert(Math.abs(imageSize[0]-displayedWidth)<1e-10&&Math.abs(imageSize[1]-displayedHeight)<1e-10,'Rounded canvas mask follows screenshot bounds, not holding-frame bounds');
  assert(cornerRadius>0&&cornerRadius<Math.min(...imageSize)/2,'Image corners stay rounded without clipping the whole screenshot');
  for(const axis of [0,1]){
   const sourceStart=.5-.5/fit[axis],sourceEnd=.5+.5/fit[axis];
   assert(Math.abs((sourceStart-.5)*fit[axis]+.5)<1e-10);
   assert(Math.abs((sourceEnd-.5)*fit[axis]+.5-1)<1e-10);
  }
 }
}
// Native fallback and canvas must agree, including resize and the taller
// portrait frame. This also covers reduced-motion and unavailable WebGL.
const landscapeFit=imageGeometry(1200,600,16/9,24,{},null,1,1000,Infinity,'start');
assert.equal(landscapeFit.width,1000,'Landscape uses its 1000px maximum width');
assert(Math.abs(landscapeFit.height-562.5)<1e-10&&landscapeFit.left===0,'Landscape keeps its source ratio and aligns to the text edge');
const portraitFit=imageGeometry(600,700,402/858,24,{},null,1,600,700);
assert(Math.abs(portraitFit.height-700)<1e-10,'Portrait respects its 700px height cap');
assert(Math.abs(portraitFit.top)<1e-10,'Portrait frame ends at the image cap, leaving no top or bottom gap');
const native={naturalWidth:402,naturalHeight:858,style:{},addEventListener(){},removeEventListener(){}};
let resize,disconnected=false;
globalThis.ResizeObserver=class{constructor(callback){resize=callback;}observe(){}disconnect(){disconnected=true;}};
let padding={top:0,right:0,bottom:0,left:0},sizeLimit=1;
globalThis.getComputedStyle=()=>({getPropertyValue:key=>key==='--image-size-limit'?String(sizeLimit):key==='--image-max-width'?'600px':key==='--image-max-height'?'700px':key.startsWith('--image-padding-')?String(padding[key.replace('--image-padding-','')]||0):''});
const edge={style:{},setAttribute(){}};
globalThis.document={createElement:()=>edge};
const frameElement={clientWidth:600,clientHeight:375,querySelector:selector=>selector==='img'?native:null,closest:selector=>selector==='[data-card-orientation]'?{dataset:{cardOrientation:'portrait'}}:null,append(){},classList:{add(){},remove(){}}};
const frame=new ImageFrame(frameElement);
const regularHeight=parseFloat(native.style.height);
frameElement.clientHeight=700;resize();
assert(parseFloat(native.style.height)>regularHeight*1.5,'Masonry portrait screenshot is larger');
assert(Math.abs(parseFloat(native.style.width)/parseFloat(native.style.height)-402/858)<1e-10);
assert(parseFloat(native.style.left)>0&&parseFloat(native.style.top)===0,'Portrait remains centred horizontally and fills its capped frame vertically');
assert(parseFloat(native.style.borderRadius)>0,'Native screenshot itself is rounded');
// Asymmetric padding shifts the screenshot away from the overlaid title.
padding={top:128,bottom:32,left:24,right:24};resize();
image.imageFrame=frame;image.ratio=frame.ratio;image.el=frameElement;image.resize();image.draw(0);
assert(parseFloat(native.style.top)>=128&&parseFloat(native.style.left)>=24,'Padding is reserved outside the image');
assert(parseFloat(native.style.top)+parseFloat(native.style.height)<=frameElement.clientHeight-32+1e-10);
assert(Math.abs(imageSize[0]-parseFloat(native.style.width))<1e-10&&Math.abs(imageSize[1]-parseFloat(native.style.height))<1e-10,'Canvas and native image share padded bounds');
assert.deepEqual(edge.style,native.style,'The border follows actual padded screenshot bounds, not the holding container');
assert(imageCenter[1]>.5,'The liquid texture follows the shifted image centre');
assert(Math.abs((imageCenter[0]-.5/fit[0])*frameElement.clientWidth-parseFloat(native.style.left))<1e-10,'Texture edge aligns with the native screenshot');
// Fixed orientation caps are shared by the still and liquid canvas.
padding={top:0,right:0,bottom:0,left:0};frameElement.clientWidth=600;frameElement.clientHeight=800;
for(const [sourceWidth,sourceHeight,cap] of [[402,858,600],[1600,900,600]]){
 native.naturalWidth=sourceWidth;native.naturalHeight=sourceHeight;resize();image.ratio=frame.ratio;image.resize();image.draw(0);
 const width=parseFloat(native.style.width),height=parseFloat(native.style.height);
 assert(width<=cap+1e-10&&height<=700+1e-10,'Portrait respects fixed width and height caps');
 assert(Math.abs(width/height-sourceWidth/sourceHeight)<1e-10,'Fixed caps preserve source proportions');
 assert(Math.abs(imageSize[0]-width)<1e-10&&Math.abs(imageSize[1]-height)<1e-10,'Liquid canvas matches the capped native image');
}
frame.destroy();assert(disconnected,'Frame observers are released');
// Current home portraits size their holding frame to the capped screenshot,
// rather than centring a smaller screenshot inside a wide/tall fixed box.
const portraitNative={naturalWidth:402,naturalHeight:858,style:{},addEventListener(){},removeEventListener(){}};
const portraitCard={clientWidth:900,dataset:{cardPresentation:'current',cardOrientation:'portrait',imageMode:'inset'}};
const portraitElement={get clientWidth(){return parseFloat(this.style.width)||1;},get clientHeight(){return parseFloat(this.style.height)||1;},style:{setProperty(){}},querySelector:selector=>selector==='img'?portraitNative:null,closest:selector=>selector==='.image-card'?portraitCard:selector==='[data-card-orientation]'?{dataset:{cardOrientation:'portrait'}}:null,append(){},classList:{add(){},remove(){}}};
globalThis.getComputedStyle=node=>node===portraitCard?{paddingLeft:'42px',paddingRight:'42px',paddingTop:'42px',paddingBottom:'28px',borderTopLeftRadius:'28px'}:{borderTopLeftRadius:'0px',getPropertyValue:key=>key==='--image-size-limit'?'1':key==='--image-max-width'?'600px':key==='--image-max-height'?'700px':key.startsWith('--image-padding-')?'0px':''};
const portraitFrame=new ImageFrame(portraitElement);
assert.equal(parseFloat(portraitElement.style.width),402/858*700,'Home portrait frame fits the full-height screenshot');
assert.equal(parseFloat(portraitElement.style.height),700,'Home portrait frame stops at its height cap');
assert.equal(parseFloat(portraitNative.style.top),0,'Portrait image starts at the same frame edge as landscape');
portraitCard.clientWidth=300;resize();
assert(parseFloat(portraitElement.style.height)<700,'Portrait frame shrinks with a narrow one-column viewport');
assert.equal(parseFloat(portraitNative.style.top),0,'Responsive portrait keeps no top or bottom letterbox');
portraitFrame.destroy();
// Landscape top/bottom padding grows the frame around the image. Its maximum
// width should not collapse just because the image is offset vertically.
const landscapeNative={naturalWidth:1600,naturalHeight:900,style:{},addEventListener(){},removeEventListener(){}};
const landscapePadding={top:96,right:0,bottom:74,left:0},landscapeCard={clientWidth:1200,dataset:{cardPresentation:'current',cardOrientation:'landscape',imageMode:'inset'}};
const landscapeElement={get clientWidth(){return parseFloat(this.style.width)||1;},get clientHeight(){return parseFloat(this.style.height)||1;},style:{setProperty(){}},querySelector:selector=>selector==='img'?landscapeNative:null,closest:selector=>selector==='.image-card'?landscapeCard:selector==='[data-card-orientation]'?landscapeCard:null,append(){},classList:{add(){},remove(){}}};
globalThis.getComputedStyle=node=>node===landscapeCard?{paddingLeft:'40px',paddingRight:'40px',paddingTop:'40px',paddingBottom:'40px',borderTopLeftRadius:'28px'}:{borderTopLeftRadius:'0px',getPropertyValue:key=>key==='--image-size-limit'?'1':key==='--image-max-width'?'1000px':key==='--image-max-height'?'700px':key.startsWith('--image-padding-')?String(landscapePadding[key.replace('--image-padding-','')])+'px':''};
const landscapeFrame=new ImageFrame(landscapeElement);
assert.equal(parseFloat(landscapeNative.style.width),1000,'Landscape retains its full 1000px image width with vertical padding');
assert.equal(parseFloat(landscapeNative.style.top),96,'Top padding offsets the image without scaling it down');
assert.equal(parseFloat(landscapeElement.style.height),562.5+96+74,'Top and bottom padding add space around the full-width image');
landscapeFrame.destroy();
console.log('Image fit passed: fixed orientation caps, original proportions, portrait centring and landscape text alignment.');
