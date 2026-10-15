import {previewFor} from './hover-video.js';

const GEOMETRY=['position','left','top','width','height','borderRadius','clipPath'];
const BRIDGE_TIMEOUT_MS=400,BRIDGE_PRESENTED_FRAMES=2;

const geometryOf=node=>Object.fromEntries(GEOMETRY.map(key=>[key,node?.style?.[key]||'']));

/**
 * Chrome draws nothing for a <video> for a few frames after it is moved to a new parent, so the
 * still image under it shows through. A canvas, redrawn from the clip every frame, stands in at the
 * same place until the moved video has presented new frames in its new position.
 * Returns release(), called after the move.
 */
function bridgeFrame(video,visual,geometry,doc=document){
 const rect=video.getBoundingClientRect?.(),ratio=globalThis.devicePixelRatio||1;
 if(!visual||!rect?.width||!rect.height||!video.videoWidth)return {release(){},canvas:null};
 const canvas=doc.createElement('canvas'),context=canvas.getContext('2d');
 canvas.className='video-frame-bridge';canvas.setAttribute('aria-hidden','true');
 canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
 Object.assign(canvas.style,geometry);
 let alive=true,frame=0;
 const draw=()=>{if(!alive)return;try{context.drawImage(video,0,0,canvas.width,canvas.height);}catch(error){console.warn('Video frame bridge could not copy the frame.',error);}frame=requestAnimationFrame(draw);};
 draw();visual.append(canvas);
 const remove=()=>{if(!alive)return;alive=false;cancelAnimationFrame(frame);canvas.remove();};
 return {canvas,release(){
  setTimeout(remove,BRIDGE_TIMEOUT_MS);
  if(!video.requestVideoFrameCallback)return;
  let presented=0;const count=()=>{if(++presented>=BRIDGE_PRESENTED_FRAMES)requestAnimationFrame(remove);else video.requestVideoFrameCallback(count);};
  video.requestVideoFrameCallback(count);
 }};
}

/**
 * Carries the one playing <video> element from its source frame into the moving picture.
 * Moving a playing element within the document keeps it playing, so there is no copy to sync.
 * A comment marks where it came from.
 */
export function carryVideo(video,picture,doc=document){
 if(!video||video.paused||!picture)return null;
 const preview=previewFor(video),placeholder=doc.createComment('carried video'),css=video.style.cssText,home=geometryOf(video);
 const bridge=bridgeFrame(video,picture,geometryOf(picture.querySelector('img')),doc);
 preview?.release();
 picture.classList.add('video-preview-playing');
 video.replaceWith(placeholder);picture.append(video);
 bridge.release();
 return {video,placeholder,css,home,preview,bridge:bridge.canvas};
}

// The picture's ImageFrame fits and rounds the image each frame; the clip (and its bridge) copy that shape.
export function syncMorphVideo(carried,image){
 if(!carried||!image)return;
 for(const node of [carried.video,carried.bridge])if(node?.isConnected!==false&&node)for(const key of GEOMETRY)node.style[key]=image.style[key];
}

/**
 * Lands the carried element in the receiving frame. A receiver with the same clip swaps elements: it
 * takes the playing one, and its idle element goes back to the source frame. Otherwise (Escape back
 * to the source, or a different clip) the element returns home. Each frame's player adopts what it holds.
 */
export function landVideo(carried,receiverVisual){
 if(!carried)return;
 const {video,placeholder,css,home,preview}=carried;
 const target=receiverVisual?.querySelector?.('video[data-video-url]');
 if(!target||target.dataset.videoUrl!==video.dataset.videoUrl){
  const bridge=bridgeFrame(video,placeholder.parentNode,home);
  video.style.cssText=css;placeholder.replaceWith(video);preview?.adopt(video);bridge.release();return;
 }
 const receiver=previewFor(target),targetCss=target.style.cssText;
 receiver?.release();
 receiverVisual.classList.add('video-preview-playing');
 const bridge=bridgeFrame(video,receiverVisual,geometryOf(target));
 target.replaceWith(video);video.style.cssText=targetCss;
 target.style.cssText=css;placeholder.replaceWith(target);
 receiver?.adopt(video);preview?.adopt(target);
 bridge.release();
}
