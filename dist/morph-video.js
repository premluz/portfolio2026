import {previewFor} from './hover-video.js';

const GEOMETRY=['position','left','top','width','height','borderRadius','clipPath'];
const BRIDGE_TIMEOUT_MS=400,BRIDGE_PRESENTED_FRAMES=2;

const geometryOf=node=>Object.fromEntries(GEOMETRY.map(key=>[key,node?.style?.[key]||'']));
const canMoveLive=(parent,node)=>typeof parent?.moveBefore==='function'&&parent.isConnected!==false&&node.isConnected!==false;

/**
 * Moves the element before `reference` in `parent`. moveBefore keeps a playing <video> attached and
 * painting through the move, so no stand-in is needed; elsewhere the move re-attaches it.
 */
function moveNode(parent,node,reference=null){
 if(canMoveLive(parent,node)){parent.moveBefore(node,reference);return;}
 parent.insertBefore(node,reference);
}

/**
 * A re-attached <video> draws nothing for a few frames, so the still image under it shows through. A
 * canvas, redrawn from the clip every frame, stands in until the moved video presents new frames. It is
 * only a fallback: a canvas copy renders the clip's dark tones visibly darker than the video does, so
 * where moveBefore keeps the video painting, no bridge is drawn. Returns release(), called after the move.
 */
function bridgeFrame(video,visual,geometry,doc=document){
 const rect=video.getBoundingClientRect?.(),ratio=globalThis.devicePixelRatio||1;
 if(!visual||canMoveLive(visual,video)||!rect?.width||!rect.height||!video.videoWidth)return {release(){},canvas:null};
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
 video.parentNode.insertBefore(placeholder,video);moveNode(picture,video);
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
  video.style.cssText=css;moveNode(placeholder.parentNode,video,placeholder);placeholder.remove();preview?.adopt(video);bridge.release();return;
 }
 const receiver=previewFor(target),targetCss=target.style.cssText;
 receiver?.release();
 receiverVisual.classList.add('video-preview-playing');
 const bridge=bridgeFrame(video,receiverVisual,geometryOf(target));
 moveNode(target.parentNode,video,target);video.style.cssText=targetCss;
 target.style.cssText=css;moveNode(placeholder.parentNode,target,placeholder);placeholder.remove();
 receiver?.adopt(video);preview?.adopt(target);
 bridge.release();
}
