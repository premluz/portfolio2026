// A placement layer for the existing cards. Slots keep the final grid geometry;
// no card, image canvas, content, or click handler is copied or remounted.
const clamp=n=>Math.max(0,Math.min(1,n));
const mix=(a,b,p)=>a+(b-a)*p;
export const carouselProgress=(scroll,start,span,reduced=false)=>{
 const p=clamp((scroll-start)/Math.max(1,span));
 return reduced?(p>=.5?1:0):p*p*(3-2*p);
};
export function carouselPose(grid,tile,p){
 return {x:mix(tile.left-grid.left,0,p),y:mix(tile.top-grid.top,0,p),scale:mix(tile.scale,1,p)};
}
// With the description hidden only the picture takes part in sizing and centring, so the strip stays balanced.
export function carouselRow(items,{width,height,top,gap=24,offset=0,size=1,copy=true}){
 let x=-Math.min(120,width*.08);
 const tiles=items.map(item=>{
  const itemHeight=copy?item.height:item.visualHeight||item.height;
  const scale=Math.min(Math.min(Math.min(460,width<600?width*.72:width*.30)*size,width*.92)/Math.max(1,item.width),height/Math.max(1,itemHeight));
  const tile={left:x,top:top+(height-itemHeight*scale)/2,width:item.width*scale,height:itemHeight*scale,scale};
  x+=tile.width+gap;return tile;
 });
 const period=tiles.reduce((n,t)=>n+t.width+gap,0);
 // Every card wraps only outside the screen; no duplicate card is required.
 return tiles.map(tile=>({...tile,left:period>width?((tile.left+offset+tile.width+gap)%period+period)%period-tile.width-gap:tile.left+Math.min(120,width*.08)+(width-period+gap)/2}));
}
export class HeroCarousel {
 constructor(root,slots,{reduced=()=>false,state={},settings=()=>({})}={}){
  this.root=root;this.settings=settings;this.slots=slots;this.reduced=reduced;this.stage=root.querySelector('[data-hero-carousel]');
  this.state=state;this.enabled=false;this.paused=true;this.dead=false;this.progress=1;this.cleanups=[];
  if(!this.stage)return;
  this.listen=(node,type,fn,options)=>{node.addEventListener(type,fn,options);this.cleanups.push(()=>node.removeEventListener(type,fn,options));};
  this.schedule=this.schedule.bind(this);
  this.listen(window,'scroll',this.schedule,{passive:true});
  this.listen(window,'resize',()=>this.measure());
  this.listen(document,'visibilitychange',this.schedule);
  this.listen(root,'pointerdown',e=>this.down(e));
  this.listen(root,'pointermove',e=>this.move(e));
  this.listen(root,'pointerup',e=>this.up(e));
  this.listen(root,'pointercancel',e=>this.up(e));
  this.listen(root,'click',e=>{if(this.suppressClick){e.preventDefault();e.stopImmediatePropagation();this.suppressClick=false;}},true);
  this.listen(root,'wheel',e=>{
   if(!this.canInteract(e))return;const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.shiftKey?e.deltaY:0;
   if(delta){e.preventDefault();this.aim=null;this.offset-=delta*(e.deltaMode===1?16:e.deltaMode===2?innerWidth:1);this.schedule();}
  },{passive:false});
  this.listen(root,'pointerover',e=>{if(this.canInteract(e)){this.hover=true;this.schedule();}});
  this.listen(root,'pointerout',e=>{if(!root.contains(e.relatedTarget)||!e.relatedTarget?.closest?.('[data-card]')){this.hover=false;this.schedule();}});
  this.listen(root,'focusin',e=>{
   const item=this.items?.find(item=>item.card===e.target);
   if(!item||this.progress!==0)return;
   const tile=this.tiles?.[this.items.indexOf(item)];
   if(tile&&(tile.left<0||tile.left+tile.width>innerWidth))this.offset+=innerWidth/2-tile.left-tile.width/2;
   this.schedule();
  });
  this.listen(root,'focusout',this.schedule);
  this.listen(this.stage,'keydown',e=>{
   if(this.progress!==0||!['ArrowLeft','ArrowRight'].includes(e.key))return;
   e.preventDefault();e.stopPropagation();this.shift(e.key==='ArrowLeft'?1:-1);
  });
  this.stage.querySelector('[data-carousel-previous]').onclick=()=>this.shift(1);
  this.stage.querySelector('[data-carousel-next]').onclick=()=>this.shift(-1);
  this.stage.querySelector('[data-carousel-pause]').onclick=e=>{
   this.userPaused=!this.userPaused;e.currentTarget.setAttribute('aria-pressed',String(this.userPaused));
   e.currentTarget.setAttribute('aria-label',this.userPaused?'Play carousel':'Pause carousel');e.currentTarget.textContent=this.userPaused?'▶':'Ⅱ';this.schedule();
  };
 }
 setEnabled(enabled){
  enabled=!!enabled&&!!this.stage;
  if(enabled===this.enabled){if(enabled)this.measure();return;}
  this.reset();this.enabled=enabled;
  this.root.classList.toggle('home-carousel-active',enabled);if(this.stage)this.stage.hidden=!enabled;
  if(enabled)this.measure();
 }
 measure(){
  if(!this.enabled||this.dead)return;
  const band=this.stage.getBoundingClientRect(),pageY=scrollY;
  this.band={top:band.top+pageY,height:band.height};
  this.start=Math.max(0,this.band.top-innerHeight*.80);this.span=Math.max(360,innerHeight*.95);
  this.items=[...this.slots.values()].filter(slot=>slot.parentElement?.matches('[data-gallery]')).map(slot=>{
   const carrier=slot.firstElementChild,card=slot.querySelector('[data-card]'),rect=slot.getBoundingClientRect();
   return {slot,carrier,card,left:rect.left,top:rect.top+pageY,width:card.offsetWidth||rect.width,height:card.offsetHeight||rect.height,visualHeight:card.querySelector?.('.visual')?.offsetHeight||0};
  });
  this.frozen=null;this.render(0);this.schedule();
 }
 render(dt=0){
  if(!this.enabled||!this.items?.length)return false;
  const p=carouselProgress(scrollY,this.start,this.span,this.reduced()),old=this.progress;this.progress=p;
  if(old===0&&p>0)this.frozen=this.tiles;
  const visible=this.band.top-scrollY<innerHeight&&this.band.top+this.band.height-scrollY>0;
  const focused=this.items.some(item=>item.card.contains(document.activeElement))||this.stage.contains(document.activeElement);
  const {size=100,copy=true}=this.settings(),layout={size:size/100,copy};
  const copyOpacity=copy?'1':String(p);if(this.copyOpacity!==copyOpacity){this.root.style?.setProperty?.('--hero-carousel-copy',copyOpacity);this.copyOpacity=copyOpacity;}
  const row=carouselRow(this.items,{width:innerWidth,height:this.band.height,top:this.band.top,...layout});
  const overflowing=row.reduce((n,t)=>n+t.width+24,0)>innerWidth;
  const playing=overflowing&&p===0&&visible&&!this.reduced()&&!this.userPaused&&!this.hover&&!this.drag&&!focused&&!document.hidden;
  let sliding=false;
  if(p>0)this.aim=null;
  if(p===0&&this.aim!=null){const delta=this.aim-this.offset;this.offset+=this.reduced()?delta:delta*(1-Math.exp(-Math.max(0,dt)/100));sliding=Math.abs(delta)>.1;if(!sliding){this.offset=this.aim;this.aim=null;}}
  if(playing)this.offset-=Math.min(40,dt)*.022;
  if(p===0)this.frozen=null;
  this.tiles=this.frozen||carouselRow(this.items,{width:innerWidth,height:this.band.height,top:this.band.top,gap:24,offset:this.offset,...layout});
  this.items.forEach((item,i)=>{
   if(p===1){item.carrier.style.transform='';item.carrier.style.zIndex='';item.carrier.style.willChange='';return;}
   const pose=carouselPose(item,this.tiles[i],p);
   item.carrier.style.transform=`translate3d(${pose.x.toFixed(4)}px,${pose.y.toFixed(4)}px,0) scale(${pose.scale.toFixed(6)})`;
   item.carrier.style.zIndex=String(3+i);item.carrier.style.willChange='transform';
  });
  this.stage.querySelector('[data-carousel-controls]').inert=p>0;
  this.stage.querySelector('[data-carousel-controls]').style.opacity=String(1-Math.min(1,p*5));
  return playing||sliding;
 }
 canInteract(e){return this.enabled&&!this.paused&&this.progress===0&&e.clientY>=this.band.top-scrollY&&e.clientY<=this.band.top+this.band.height-scrollY;}
 shift(direction){if(this.progress!==0)return;this.aim=(this.aim??this.offset)+direction*(this.tiles?.[0]?.width+24||320);this.schedule();}
 down(e){
  if(e.pointerType==='touch'&&e.isPrimary===false){if(this.drag)this.up({pointerId:this.drag.id});return;}
  if((globalThis.visualViewport?.scale||1)>1.03)return;
  if(e.button!==0||!this.canInteract(e)||e.target.closest('[data-carousel-controls]'))return;
  this.aim=null;this.suppressClick=false;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,offset:this.offset,active:false};this.schedule();
 }
 move(e){
  const drag=this.drag;if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.active&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){this.drag=null;return;}
  if(!drag.active&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){drag.active=true;this.root.setPointerCapture(e.pointerId);}
  if(drag.active){e.preventDefault();this.offset=drag.offset+dx;this.suppressClick=true;this.schedule();}
 }
 up(e){if(!this.drag||e.pointerId!==this.drag.id)return;if(this.root.hasPointerCapture(e.pointerId))this.root.releasePointerCapture(e.pointerId);this.drag=null;this.schedule();}
 schedule(){if(!this.enabled||this.paused||this.dead||this.raf)return;this.raf=requestAnimationFrame(now=>{
  this.raf=0;const dt=this.lastFrame?now-this.lastFrame:0;this.lastFrame=now;if(this.render(dt))this.schedule();else this.lastFrame=0;
 });}
 get offset(){return this.state.offset||0;}
 set offset(value){this.state.offset=value;}
 pause(){this.paused=true;cancelAnimationFrame(this.raf);this.raf=0;this.lastFrame=0;
  if(this.drag&&this.root.hasPointerCapture?.(this.drag.id))this.root.releasePointerCapture(this.drag.id);this.drag=null;
 }
 resume(){this.paused=false;this.schedule();}
 reset(){cancelAnimationFrame(this.raf);this.raf=0;this.lastFrame=0;this.frozen=null;this.aim=null;this.drag=null;this.root.style?.removeProperty?.('--hero-carousel-copy');this.copyOpacity=null;
  for(const slot of this.slots.values()){const s=slot.firstElementChild.style;s.transform='';s.zIndex='';s.willChange='';}
 }
 destroy(){this.dead=true;this.pause();this.reset();this.root.classList.remove('home-carousel-active');this.cleanups.forEach(fn=>fn());this.cleanups=[];}
}
