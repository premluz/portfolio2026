import {menuInitialTarget} from './menu-keyboard.js';
import {dockGeometry,stepDockSpring} from './dock-morph.js';

// Shares the dock's glass and spring. Only list content lives in this element.
export class LiquidPopover {
 constructor(dock,menu,toggle,{reduced=()=>false,duration=()=>400,anchor='context',onOpen=()=>{},onClose=()=>{},onClosed=()=>{},beforeOpen=null,returnFocus=()=>toggle}={}){
  Object.assign(this,{dock,menu,toggle,reduced,duration,anchor,onOpen,onClose,onClosed,beforeOpen,returnFocus,position:0,velocity:0,target:0,openEpoch:0,closedNotified:true});
  toggle.setAttribute('aria-controls',menu.id);toggle.setAttribute('aria-haspopup','dialog');
  menu.setAttribute('role','dialog');menu.inert=true;
  toggle.onclick=()=>this.setOpen(!this.target);
  this.outside=e=>{if((this.target||this.opening)&&!menu.contains(e.target)&&!this.toggle.contains(e.target)&&!document.querySelector?.('dialog[open]'))this.setOpen(false,{restoreFocus:false});};
  this.keys=e=>{
   if(document.querySelector?.('dialog[open]'))return;
   if(e.key==='Escape'&&(this.target||this.opening)){e.preventDefault();e.stopImmediatePropagation();this.setOpen(false);return;}
   if(e.key==='ArrowDown'&&e.target===this.toggle&&!this.target){e.preventDefault();this.setOpen(true);return;}
   if(!this.target)return;
   const buttons=[...menu.querySelectorAll('button:not(:disabled),a[href]')];
   const letterTarget=menuInitialTarget(e,buttons,this.pendingKeyFocus||document.activeElement);
   if(letterTarget){e.preventDefault();if(menu.inert){this.pendingKeyFocus=letterTarget;this.focusPending=true;}else letterTarget.focus();return;}
   if(!menu.contains(e.target)&&!this.focusPending)return;
   const index=buttons.indexOf(this.pendingKeyFocus||document.activeElement);
   if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:index<0?(e.key==='ArrowDown'?0:buttons.length-1):(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;if(menu.inert){this.pendingKeyFocus=buttons[next];this.focusPending=true;}else buttons[next]?.focus();
   }
   if(e.key==='Tab'&&(e.shiftKey?index===0:index===buttons.length-1)){e.preventDefault();buttons[e.shiftKey?buttons.length-1:0]?.focus();}
  };
  this.resize=()=>{if(!menu.hidden){this.measure();this.paint();}};
  addEventListener('pointerdown',this.outside);addEventListener('keydown',this.keys,true);addEventListener('resize',this.resize);addEventListener('composer-status-resize',this.resize);addEventListener('composer-viewport-change',this.resize);
 }
 setTrigger(toggle){
  if(this.toggle===toggle)return;
  this.toggle.setAttribute('aria-expanded','false');
  this.toggle=toggle;
  toggle.setAttribute('aria-controls',this.menu.id);
  toggle.setAttribute('aria-haspopup','dialog');
  toggle.setAttribute('aria-expanded',String(!!this.target));
 }
 measure(){
  const dockRect=this.dock.el.getBoundingClientRect(),availableHeight=Math.max(48,dockRect.top-30),width=Math.min(this.anchor==='main-start'?520:330,innerWidth-32);
  this.menu.style.width=width+'px';this.menu.style.maxHeight=availableHeight+'px';this.menu.style.height='auto';
  const height=Math.min(this.menu.scrollHeight,availableHeight),fromMain=this.anchor.startsWith('main');
  const anchor=fromMain?this.dock.main.getBoundingClientRect().left-dockRect.left+this.dock.metrics.main/2:this.dock.metrics.context/2;
  const left=Math.max(16-dockRect.left,Math.min(anchor-width/2,innerWidth-16-dockRect.left-width));
  this.metrics={width,height,left,gap:14,radius:24,anchor:fromMain?'main':'context',...(this.anchor==='main-start'?{rootX:this.toggle.getBoundingClientRect().left-dockRect.left+this.toggle.getBoundingClientRect().width/2}:{})};
  Object.assign(this.menu.style,{left:left+'px',top:-(height+14)+'px',height:height+'px'});
 }
 setOpen(open,{restoreFocus=true,immediate=false,prepared=false}={}){
  if(open&&this.beforeOpen&&!this.target&&!prepared){const epoch=++this.openEpoch;this.opening=true;this.closedNotified=false;Promise.resolve(this.beforeOpen()).then(()=>{if(epoch!==this.openEpoch)return;this.opening=false;this.setOpen(true,{restoreFocus,immediate,prepared:true});});return;}
  ++this.openEpoch;this.opening=false;if(open)this.closedNotified=false;
  if(open&&!this.target)this.onOpen();
  if(!open&&this.target)this.onClose();
  this.target=open?1:0;this.toggle.setAttribute('aria-expanded',String(open));
  if(open){this.menu.hidden=false;this.measure();this.focusPending=!this.menu.contains(document.activeElement);}
  else{this.menu.inert=true;this.focusPending=false;this.pendingKeyFocus=null;if(restoreFocus)this.returnFocus()?.focus({preventScroll:true});}
  if(immediate||this.reduced()){
   cancelAnimationFrame(this.raf);this.raf=0;this.position=this.target;this.velocity=0;this.paint();return;
  }
  this.paint();
  if(!this.raf){this.previous=performance.now();this.raf=requestAnimationFrame(now=>this.tick(now));}
 }
 tick(now){
  this.raf=0;const next=stepDockSpring(this.position,this.velocity,this.target,(now-this.previous)/1000,Math.max(550,this.duration()*1.55));
  this.previous=now;this.position=next.position;this.velocity=next.velocity;
  if(Math.abs(this.position-this.target)<.0001&&Math.abs(this.velocity)<.003){this.position=this.target;this.velocity=0;}
  this.paint();if(this.position!==this.target||this.velocity)this.raf=requestAnimationFrame(time=>this.tick(time));
 }
 paint(){
  // Only a fully closed state may unmount content. The opening frame can
  // legitimately have zero elapsed time, and resize can paint before it moves.
  if(this.position===0&&this.target===0){this.menu.hidden=true;this.menu.inert=true;this.menu.style.opacity='0';this.dock.setPopover(null);if(!this.closedNotified){this.closedNotified=true;this.onClosed();}return;}
  this.menu.hidden=false;
  const popover={...this.metrics,position:this.position};this.dock.setPopover(popover);
  const shape=dockGeometry(this.dock.position,this.dock.metrics,popover).popover;if(!shape)return;
  const {left,width,height,gap}=this.metrics,top=-height-gap;
  // Text stays at its destination; the growing glass reveals it rather than
  // squeezing screenshots/type through a scale animation.
  this.menu.style.clipPath=`inset(${Math.max(0,shape.top-top)}px ${Math.max(0,left+width-shape.left-shape.width)}px ${Math.max(0,top+height-shape.top-shape.height)}px ${Math.max(0,shape.left-left)}px round ${Math.min(24,shape.height/2)}px)`;
  this.menu.style.opacity=String(shape.reveal);this.menu.inert=!this.target||shape.reveal<.7;
  if(this.focusPending&&!this.menu.inert){this.focusPending=false;(this.pendingKeyFocus||this.menu.querySelector('.active')||this.menu.querySelector('button:not(:disabled),a[href]'))?.focus({preventScroll:true});this.pendingKeyFocus=null;}
 }
 get active(){return this.opening||this.target!==0||this.position!==0;}
 destroy(){++this.openEpoch;this.opening=false;cancelAnimationFrame(this.raf);removeEventListener('pointerdown',this.outside);removeEventListener('keydown',this.keys,true);removeEventListener('resize',this.resize);removeEventListener('composer-status-resize',this.resize);removeEventListener('composer-viewport-change',this.resize);this.dock.setPopover(null);}
}
