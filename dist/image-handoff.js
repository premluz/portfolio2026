const handoffs=new Map();
const candidate=image=>image?.currentSrc||image?.src||'';
const identity=value=>{try{return new URL(value,globalThis.document?.baseURI||'https://portfolio.invalid/').href;}catch{return String(value||'');}};
export function sameImageAsset(source,target){const a=source?.originalSrc||source?.src,b=target?.dataset?.originalImage||candidate(target);return !!a&&!!b&&identity(a)===identity(b);}
export function presentedImage(visual){return handoffs.get(visual)?.image||visual?.querySelector('img');}

// `load` and `complete` do not guarantee that an async-decoded responsive
// candidate can paint. A stale decode must not reveal a replacement candidate.
export class ImageDecodeGate{
 constructor(image,onReady=()=>{}){
  this.image=image;this.onReady=onReady;this.ready=false;this.decodedSrc='';this.dead=false;this.epoch=0;
  this.load=()=>{this.ready=false;void this.check();};image?.addEventListener('load',this.load);void this.check();
 }
 async check(){
  if(this.dead||!this.image?.complete||!this.image.naturalWidth)return;
  const epoch=++this.epoch,src=candidate(this.image);
  try{if(this.image.decode)await this.image.decode();else await Promise.resolve();}catch{return;}
  if(this.dead||epoch!==this.epoch)return;
  if(src!==candidate(this.image)){void this.check();return;}
  if(!this.image.complete||!this.image.naturalWidth)return;
  this.ready=true;this.decodedSrc=src;this.onReady();
 }
 isReady(){return this.ready&&!this.dead&&this.image?.complete&&this.image.naturalWidth>0&&this.decodedSrc===candidate(this.image);}
 dispose(){this.dead=true;++this.epoch;this.image?.removeEventListener('load',this.load);}
}

// Adopt the already-painted motion image, retaining its decoded bitmap. It
// covers the live slot until that slot's own candidate and GPU pass can paint.
export function handoffImage(image,visual,{beforeReveal=()=>{}}={}){
 const target=visual?.querySelector('img');if(!image||!target||image===target)return ()=>{};
 handoffs.get(visual)?.dispose();
 let gate,observer,dead=false;
 const sync=()=>{if(sameImageAsset({originalSrc:image.dataset?.originalImage,src:candidate(image)},target))for(const key of ['position','left','top','width','height','borderRadius','clipPath'])image.style[key]=target.style[key]||'';};
 image.classList.add('morph-image-bridge');image.removeAttribute('data-media-pending');
 image.style.setProperty('visibility','visible','important');image.style.setProperty('opacity','1','important');image.style.zIndex='3';
 visual.append(image);sync();
 const dispose=()=>{if(dead)return;dead=true;gate?.dispose();observer?.disconnect();image.remove();if(handoffs.get(visual)?.image===image)handoffs.delete(visual);};
 handoffs.set(visual,{image,dispose});
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(sync);observer.observe(visual);}
 gate=new ImageDecodeGate(target,()=>{
  if(dead)return;if(visual.isConnected===false){dispose();return;}
  target.removeAttribute('data-media-pending');beforeReveal();dispose();
 });
 return dispose;
}
export function clearImageHandoffs(root){for(const [visual,handoff] of handoffs)if(!root||root.contains(visual))handoff.dispose();}
