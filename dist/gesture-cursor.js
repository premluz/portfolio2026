// A hand cursor targets the same accessible controls as a real pointer.
// Navigation still goes through their command handlers. No second UI tree.
export class GestureCursor {
  constructor(node,{document=globalThis.document,window=globalThis.window}={}) {
    Object.assign(this,{node,document,window,target:null,point:null});
  }
  draw(point) {
    const x=point.x*this.window.innerWidth,y=point.y*this.window.innerHeight;
    this.point={x,y};this.node.hidden=false;this.node.style.transform=`translate3d(${x}px,${y}px,0)`;
    return {x,y};
  }
  hold(point){if(point)this.draw(point);}
  move(point) {
    if(!point){this.clear();return;}
    const {x,y}=this.draw(point);
    const hit=this.document.elementFromPoint(x,y),target=hit?.closest('button,a,input,select,[role="button"]');
    const usable=target&&!target.disabled&&!target.closest('[inert],[aria-hidden="true"],.motion-viewport,.drag-stage')?target:null;
    if(usable!==this.target) {
      this.leave();this.target=usable;
      if(usable){usable.classList.add('gesture-hover');this.pointer('pointerover',usable,{bubbles:true});this.pointer('pointerenter',usable);}
    }
    if(usable)this.pointer('pointermove',usable,{bubbles:true});
    this.node.classList.toggle('over-control',!!usable);
  }
  pointer(type,target,options={}) {
    const Event=this.window.PointerEvent||this.window.MouseEvent;
    if(Event)target.dispatchEvent(new Event(type,{pointerType:'mouse',clientX:this.point?.x||0,clientY:this.point?.y||0,...options}));
  }
  activate() {
    const target=this.target;
    if(!target?.isConnected||target.disabled||target.closest('[inert]'))return {ok:false,message:'Point at a card or button first.'};
    target.focus({preventScroll:true});this.node.classList.remove('clicked');void this.node.offsetWidth;this.node.classList.add('clicked');
    target.click();return {ok:true,message:target.getAttribute('aria-label')||'Selected'};
  }
  leave(){if(this.target){this.target.classList.remove('gesture-hover');this.pointer('pointerout',this.target,{bubbles:true});this.pointer('pointerleave',this.target);this.target=null;}}
  clear(){this.leave();this.node.hidden=true;this.point=null;this.node.classList.remove('over-control','clicked');}
}
