// One circular "Drag" cursor for every draggable carousel, shown only on devices with real hover.
// It trails the pointer through a lerp so it reads as a soft object rather than a second arrow.
export const dragCursorMotion=Object.freeze({follow:.12,settle:.1});
let shared=null;
function cursorNode(doc){
 if(shared?.isConnected)return shared;
 shared=doc.createElement('div');shared.id='dragCursor';shared.className='drag-cursor';shared.setAttribute('aria-hidden','true');shared.textContent='Drag';
 doc.body.append(shared);return shared;
}
export class DragCursor{
 constructor(node,{doc=globalThis.document,win=globalThis.window,enabled=()=>true}={}){
  this.node=node;this.enabled=enabled;this.cleanups=[];this.frame=0;this.win=win;
  if(!win?.matchMedia?.('(hover: hover)')?.matches)return;
  this.cursor=cursorNode(doc);
  const listen=(type,fn)=>{node.addEventListener(type,fn);this.cleanups.push(()=>node.removeEventListener(type,fn));};
  listen('pointerenter',e=>{if(e.pointerType!=='mouse'||!this.enabled())return;this.target=this.current={x:e.clientX,y:e.clientY};this.paint();this.cursor.classList.remove('is-leaving');this.cursor.classList.add('is-visible');});
  listen('pointermove',e=>{if(e.pointerType!=='mouse'||!this.current)return;this.target={x:e.clientX,y:e.clientY};this.wake();});
  listen('pointerleave',e=>{if(e.pointerType!=='mouse')return;this.hide();});
 }
 hide(){if(!this.cursor)return;this.cursor.classList.remove('is-visible');this.cursor.classList.add('is-leaving');}
 paint(){this.cursor.style.translate=`${this.current.x}px ${this.current.y}px`;}
 wake(){
  if(this.frame)return;
  this.frame=this.win.requestAnimationFrame(()=>{
   this.frame=0;const dx=this.target.x-this.current.x,dy=this.target.y-this.current.y;
   this.current={x:this.current.x+dx*dragCursorMotion.follow,y:this.current.y+dy*dragCursorMotion.follow};this.paint();
   if(Math.hypot(dx,dy)>dragCursorMotion.settle)this.wake();
  });
 }
 destroy(){this.win?.cancelAnimationFrame?.(this.frame);this.frame=0;this.hide();this.cleanups.forEach(fn=>fn());this.cleanups=[];}
}
