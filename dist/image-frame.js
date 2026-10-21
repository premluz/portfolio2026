// Position the actual image bounds inside a transparent holding frame. Native
// images and the liquid canvas use the same fit and corner geometry.
import {HoverVideo} from './hover-video.js';
export function nestedRadius(outer,padding=0){return Math.max(0,outer-padding);}
export function thumbnailImageRadius(radius,bounds,orientation='landscape',sourceCorners=null){
 const scale=Math.min(1,orientation==='portrait'?bounds.height/700:bounds.width/1000);
 const source=sourceCorners?.width>0?sourceCorners.radius*bounds.width/sourceCorners.width:0;
 return Math.min(bounds.width/2,bounds.height/2,Math.max(0,radius*scale,source));
}
const pixels=value=>Number.isFinite(parseFloat(value))?Math.max(0,parseFloat(value)):0;
const inset=padding=>Math.min(...['top','right','bottom','left'].map(side=>pixels(padding[side])));
// This JPEG has white matte corners baked into its 1440px-wide source.
// Mask that matte at its source scale, rather than adding a second outline.
const sourceCornerRadii={'tracr-transfer.jpg':34};
const sourceName=src=>String(src||'').split(/[?#]/)[0].split('/').pop();
export const sourceCornerRadius=src=>sourceCornerRadii[sourceName(src)]||0;
// PlayStation's still has a bright one-pixel frame encoded in the JPEG.
// Two source pixels also exclude its resampling fringe; product content stays intact.
export const sourceEdgeInset=src=>sourceName(src)==='playstation-content.jpg'?2:0;
export function imageEdgeGeometry(bounds,sourceInset=0,sourceWidth=0){
 const inset=Math.min(bounds.width/2,bounds.height/2,sourceWidth>0?sourceInset*bounds.width/sourceWidth:0);
 return {...bounds,left:bounds.left+inset,top:bounds.top+inset,width:bounds.width-2*inset,height:bounds.height-2*inset,inset};
}
// Letterboxing is image fitting, not padding. Keep centred portrait screenshots
// rounded even when there is ample empty space beside them.
export function readFrameRadius(el){
 const card=el.closest?.('.surface');
 if(card){
  const style=getComputedStyle(card),outer=pixels(style.borderTopLeftRadius);
  const gallery=card.closest?.('.gallery-grid'),oneColumn=gallery?.dataset.columns==='1'&&!gallery.closest?.('.home-view-split');
  const composed=oneColumn&&(card.dataset.cardCopyPosition==='bottom'||(typeof innerWidth!=='undefined'&&innerWidth>700&&['left','right'].includes(card.dataset.cardCopyPosition)));
  const padding=card.classList.contains('image-card')&&card.dataset.imageMode==='bleed'&&!composed?0:
   inset(Object.fromEntries(['top','right','bottom','left'].map(side=>[side,style['padding'+side[0].toUpperCase()+side.slice(1)]])));
  return nestedRadius(outer,padding);
 }
 const radius=parseFloat(getComputedStyle(el).borderTopLeftRadius);
 return Number.isFinite(radius)?Math.max(0,radius):24;
}
export function imageGeometry(width,height,ratio,radius=24,padding={},sourceCorners=null,sizeLimit=1,maxWidthLimit=Infinity,maxHeightLimit=Infinity,align='center',blockAlign='center'){
 // Clamp opposing insets together, keeping a usable frame at narrow sizes.
 const horizontal=Math.min(1,Math.max(0,width-1)/Math.max(1,(padding.left||0)+(padding.right||0)));
 const vertical=Math.min(1,Math.max(0,height-1)/Math.max(1,(padding.top||0)+(padding.bottom||0)));
 const left=(padding.left||0)*horizontal,right=(padding.right||0)*horizontal,top=(padding.top||0)*vertical,bottom=(padding.bottom||0)*vertical;
 const availableWidth=Math.max(1,width-left-right),availableHeight=Math.max(1,height-top-bottom);
 // Limit both axes inside the holding frame. The same factor works for wide
 // and tall sources, while the aspect ratio and centre stay unchanged.
 const scale=Number.isFinite(sizeLimit)?Math.max(0.01,Math.min(1,sizeLimit)):1;
 const widthCapped=Number.isFinite(maxWidthLimit);
 const maxWidth=widthCapped?Math.min(availableWidth,maxWidthLimit*scale):availableWidth*scale;
 const maxHeight=widthCapped?Math.min(availableHeight,maxHeightLimit):availableHeight*scale;
 const imageWidth=Math.min(maxWidth,maxHeight*ratio),imageHeight=imageWidth/ratio;
 const sourceRadius=sourceCorners?.width>0?sourceCorners.radius*imageWidth/sourceCorners.width:0;
 return {width:imageWidth,height:imageHeight,left:left+(align==='start'?0:(availableWidth-imageWidth)/2),top:top+(availableHeight-imageHeight)*(blockAlign==='end'?1:.5),radius:Math.min(imageWidth/2,imageHeight/2,Math.max(0,radius,sourceRadius))};
}
export function readImagePadding(el){const style=getComputedStyle(el);return Object.fromEntries(['top','right','bottom','left'].map(side=>[side,Math.max(0,parseFloat(style.getPropertyValue('--image-padding-'+side))||0)]));}
export function updateImageShade(el){
 const card=el.parentElement;if(!card?.matches('.image-card'))return;
 const label=card.querySelector('.eyebrow')||card.querySelector('h2');
 if(label)el.style.setProperty('--image-shade-height',(label.offsetTop+label.offsetHeight+32)+'px');
}
export class ImageFrame {
 constructor(el,onResize=()=>{}){
  this.el=el;this.img=el.querySelector('img');this.onResize=onResize;
  this.card=el.closest?.('.image-card');
  this.thumbnail=Boolean(this.card?.matches?.('.ask-cards .project-card'));
  this.edge=el.querySelector(':scope > .image-edge');
  if(!this.edge){this.edge=document.createElement('span');this.edge.className='image-edge';this.edge.setAttribute('aria-hidden','true');el.append(this.edge);}
  this.load=()=>this.resize();this.img?.addEventListener('load',this.load);
  const video=el.querySelector('video[data-video-url]');
  if(video?.play)this.preview=new HoverVideo(el,video,()=>this.resize());
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(el);if(this.card)this.observer.observe(this.card);this.resize();
 }
 resize(){
  if(this.el.isConnected===false||this.el.clientWidth===0)return;
  updateImageShade(this.el);
  const declaredWidth=Number(this.img?.getAttribute?.('width'))||0,declaredHeight=Number(this.img?.getAttribute?.('height'))||0;
  const width=this.img?.naturalWidth||declaredWidth,height=this.img?.naturalHeight||declaredHeight;
  if(!width||!height)return;
  this.padding=readImagePadding(this.el);
  const limit=parseFloat(getComputedStyle(this.el).getPropertyValue('--image-size-limit'));
  this.sizeLimit=Number.isFinite(limit)?limit:1;
  const imageStyle=getComputedStyle(this.el);
  this.maxWidth=pixels(imageStyle.getPropertyValue('--image-max-width'))||Infinity;
  this.maxHeight=pixels(imageStyle.getPropertyValue('--image-max-height'))||Infinity;
  this.align=this.el.closest?.('[data-card-orientation]')?.dataset.cardOrientation==='landscape'?'start':'center';
  const frameRadius=readFrameRadius(this.el);
  if(this.el.style)this.el.style.borderRadius=frameRadius+'px';
  const selected=parseFloat(getComputedStyle(this.el).getPropertyValue('--image-rounding'));
  this.radius=Number.isFinite(selected)?Math.max(0,selected):nestedRadius(frameRadius,inset(this.padding));
  // Backgrounds retain the nested frame shape. The screenshot, its edge and
  // canvas mask own their corners, without an ancestor clipping them again.
  if(this.el.style)this.el.style.overflow=Number.isFinite(selected)?'visible':'hidden';
  this.ratio=width/height;
  if(this.el.style?.setProperty)this.el.style.setProperty('--image-source-ratio',String(this.ratio));
  // Current portrait cards use a frame fitted to the image's own capped size.
  // That removes the tall letterbox the old fixed-ratio card frame introduced.
  const gallery=this.card?.closest?.('.gallery-grid');
  const oneColumn=gallery?.dataset.columns==='1'&&!gallery.closest?.('.home-view-split');
  const position=oneColumn?this.card?.dataset.cardCopyPosition:null;
  const side=typeof innerWidth!=='undefined'&&innerWidth>700&&(position==='left'||position==='right');
  const bottom=position==='bottom';
  if(this.card?.dataset.cardPresentation==='current'&&(this.card.dataset.imageMode!=='bleed'||side||bottom)){
   const cardStyle=getComputedStyle(this.card),cardSides=pixels(cardStyle.paddingLeft)+pixels(cardStyle.paddingRight),imageSides=this.padding.left+this.padding.right,vertical=this.padding.top+this.padding.bottom;
   const availableWidth=Math.max(1,side?this.el.clientWidth:this.card.clientWidth-cardSides),portrait=this.card.dataset.cardOrientation==='portrait';
   // Vertical padding adds room around the image instead of reducing its width.
   // Side padding stays inside the frame and continues to reduce image width.
   const imageWidth=Math.min(Math.max(1,availableWidth-imageSides),this.maxWidth,portrait?this.maxHeight*this.ratio:Infinity);
   const frameWidth=portrait?imageWidth+imageSides:Math.min(availableWidth,this.maxWidth+imageSides);
   const frameHeight=imageWidth/this.ratio+vertical;
   this.el.style.width=frameWidth+'px';this.el.style.height=frameHeight+'px';
   this.el.style.setProperty('--card-image-frame-width',frameWidth+'px');this.el.style.setProperty('--card-image-frame-height',frameHeight+'px');
  }else if(this.card){
   this.el.style.removeProperty?.('width');this.el.style.removeProperty?.('height');
   this.el.style.removeProperty?.('--card-image-frame-width');this.el.style.removeProperty?.('--card-image-frame-height');
  }
  const src=this.img.dataset?.originalImage||this.img.currentSrc||this.img.src;
  this.sourceCorners={radius:sourceCornerRadius(src),width:declaredWidth||width};this.sourceInset=sourceEdgeInset(src);
  // Copy placed under the frame sets this, so a letterboxed image sits on the copy instead of floating above it.
  const blockAlign=this.blockAlign=getComputedStyle(this.el).getPropertyValue('--image-block-align').trim()==='end'?'end':'center';
  const rect=imageGeometry(this.el.clientWidth,this.el.clientHeight,this.ratio,this.radius,this.padding,this.sourceCorners,1,this.maxWidth,this.maxHeight,this.align,blockAlign);
  if(this.thumbnail)rect.radius=thumbnailImageRadius(this.radius,rect,this.card.dataset.cardOrientation,this.sourceCorners);
  const geometry={position:'absolute',width:rect.width+'px',height:rect.height+'px',left:rect.left+'px',top:rect.top+'px',borderRadius:rect.radius+'px'};
  Object.assign(this.img.style,geometry);
  const visible=imageEdgeGeometry(rect,this.sourceInset,this.sourceCorners.width);
  if(this.sourceInset||this.img.style.clipPath)this.img.style.clipPath=this.sourceInset?`inset(${visible.inset}px round ${visible.radius}px)`:'none';
  Object.assign(this.edge.style,{...geometry,width:visible.width+'px',height:visible.height+'px',left:visible.left+'px',top:visible.top+'px'});
  if(this.preview){
   const video=this.preview.video,ratio=video.videoWidth&&video.videoHeight?video.videoWidth/video.videoHeight:this.ratio;
   const bounds=imageGeometry(this.el.clientWidth,this.el.clientHeight,ratio,this.radius,this.padding,this.sourceCorners,1,this.maxWidth,this.maxHeight,this.align,blockAlign);
   Object.assign(video.style,{position:'absolute',width:bounds.width+'px',height:bounds.height+'px',left:bounds.left+'px',top:bounds.top+'px',borderRadius:bounds.radius+'px'});
  }
  this.onResize();
 }
 destroy(){this.preview?.destroy();this.observer.disconnect();this.img?.removeEventListener('load',this.load);}
}
