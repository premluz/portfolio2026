import {trackAmbientGallery} from './ambient-layer.js';

// The two reveal masks follow the pointer. Ambient glow measures the image
// on hover and animates in CSS, with no pointer or idle rendering loop.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function stepLiquidPointer(point,target,dt=1,lag=.24){
 const t=clamp(dt,.4,2),accel=lag*t;
 point.vx=(point.vx+(target.x-point.x)*accel)*Math.pow(.72,t);
 point.vy=(point.vy+(target.y-point.y)*accel)*Math.pow(.72,t);
 point.x+=point.vx*t;point.y+=point.vy*t;
 return point;
}

export function createLiquidReveal({host,layer}){
 let active=false,mode='',initialized=false,frame=0,last=0,energy=0,phase=0,compression=0;
 const point={x:0,y:0,vx:0,vy:0},tail={x:0,y:0,vx:0,vy:0},target={x:0,y:0};
 const direction={x:1,y:0},lastMove={x:0,y:0};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const bounds=()=>host.getBoundingClientRect();
 const image=host.querySelector?.(':scope > .visual > img, :scope > .detail-layout > .visual > img, :scope > .detail-layout > .detail-media-column > .visual > img');
 const imageFrame=host.querySelector?.(':scope > .visual, :scope > .detail-layout > .visual, :scope > .detail-layout > .detail-media-column > .visual');
 const measureAmbient=()=>{
  if(!imageFrame)return;
  const parent=layer.parentElement||host,card=parent.getBoundingClientRect(),imageRect=image?.getBoundingClientRect();
  const rect=imageRect?.width>4&&imageRect?.height>4?imageRect:imageFrame.getBoundingClientRect();
  if(parent!==host){const style=getComputedStyle(host);for(const key of ['--project-hue-start','--project-hue-end'])layer.style.setProperty(key,style.getPropertyValue(key));}
  layer.style.setProperty('--ambient-left',(rect.left-card.left).toFixed(1)+'px');
  layer.style.setProperty('--ambient-top',(rect.top-card.top).toFixed(1)+'px');
  layer.style.setProperty('--ambient-width',rect.width.toFixed(1)+'px');
  layer.style.setProperty('--ambient-height',rect.height.toFixed(1)+'px');
 };
 const observer=typeof ResizeObserver!=='undefined'&&imageFrame?new ResizeObserver(()=>{if(active&&mode==='glow')measureAmbient();}):null;
 if(observer){observer.observe(host);observer.observe(image||imageFrame);}
 const untrack=trackAmbientGallery(host,()=>{if(active&&mode==='glow')measureAmbient();});
 const put=(rect)=>{
  if(mode==='reveal-soft'){
   const rx=clamp(rect.width*.62,220,570),ry=clamp(rect.height*.72,180,460);
   const dx=clamp(Math.abs(point.vx)*.018,0,.28),dy=clamp(Math.abs(point.vy)*.018,0,.28);
   layer.style.setProperty('--liquid-x',point.x.toFixed(1)+'px');
   layer.style.setProperty('--liquid-y',point.y.toFixed(1)+'px');
   layer.style.setProperty('--liquid-tail-x',tail.x.toFixed(1)+'px');
   layer.style.setProperty('--liquid-tail-y',tail.y.toFixed(1)+'px');
   layer.style.setProperty('--liquid-rx',(rx*(1+dx)).toFixed(1)+'px');
   layer.style.setProperty('--liquid-ry',(ry*(1+dy)).toFixed(1)+'px');
   layer.style.setProperty('--liquid-tail-rx',(rx*.68).toFixed(1)+'px');
   layer.style.setProperty('--liquid-tail-ry',(ry*.72).toFixed(1)+'px');
   return;
  }
  const baseX=clamp(rect.width*.34,140,350),baseY=clamp(rect.height*.42,125,300);
  const pulse=Math.sin(phase)*energy,twist=Math.cos(phase*.83)*energy;
  const rx=baseX*(1+energy*.46+pulse*.13-compression*.26);
  const ry=baseY*(1-energy*.21+twist*.12+compression*.29);
  const wing=baseX*energy*.55;
  const sideX=point.x+direction.x*wing-direction.y*baseX*(energy*.37+twist*.11);
  const sideY=point.y+direction.y*wing+direction.x*baseY*(energy*.37+twist*.11);
  layer.style.setProperty('--liquid-x',point.x.toFixed(1)+'px');
  layer.style.setProperty('--liquid-y',point.y.toFixed(1)+'px');
  layer.style.setProperty('--liquid-tail-x',tail.x.toFixed(1)+'px');
  layer.style.setProperty('--liquid-tail-y',tail.y.toFixed(1)+'px');
  layer.style.setProperty('--liquid-side-x',sideX.toFixed(1)+'px');
  layer.style.setProperty('--liquid-side-y',sideY.toFixed(1)+'px');
  layer.style.setProperty('--liquid-rx',rx.toFixed(1)+'px');
  layer.style.setProperty('--liquid-ry',ry.toFixed(1)+'px');
  layer.style.setProperty('--liquid-tail-rx',(baseX*.81*(1+energy*.12)).toFixed(1)+'px');
  layer.style.setProperty('--liquid-tail-ry',(baseY*.76).toFixed(1)+'px');
  layer.style.setProperty('--liquid-side-rx',(baseX*.56*(1+energy*.22)).toFixed(1)+'px');
  layer.style.setProperty('--liquid-side-ry',(baseY*.62).toFixed(1)+'px');
 };
 const tick=now=>{
  frame=0;if(!active||!host.isConnected)return;
  const dt=last?clamp((now-last)/16.667,.4,2):1;last=now;
  stepLiquidPointer(point,target,dt,.24);stepLiquidPointer(tail,point,dt,.10);
  const speed=Math.hypot(point.vx,point.vy);
  if(mode!=='reveal-soft'){
   if(speed>.2){direction.x=point.vx/speed;direction.y=point.vy/speed;}
   energy=Math.max(energy*Math.pow(.9,dt),clamp(speed/22,0,1));
   compression*=Math.pow(.84,dt);phase+=dt*(.11+energy*.23);
  }
  put(bounds());
  if((mode!=='reveal-soft'&&(energy>.012||compression>.012))||Math.hypot(target.x-point.x,target.y-point.y,point.vx,point.vy,point.x-tail.x,point.y-tail.y,tail.vx,tail.vy)>.35)frame=requestAnimationFrame(tick);
 };
 const move=e=>{
  if(e.pointerType==='touch'||!['reveal','reveal-soft'].includes(host.dataset.hoverEffect))return;
  const rect=bounds(),x=clamp(e.clientX-rect.left,-rect.width*.2,rect.width*1.2),y=clamp(e.clientY-rect.top,-rect.height*.2,rect.height*1.2);
  if(!Number.isFinite(x+y))return;
  const mx=x-target.x,my=y-target.y,moveLength=Math.hypot(mx,my),priorLength=Math.hypot(lastMove.x,lastMove.y);
  if(moveLength>3&&priorLength>3&&(mx*lastMove.x+my*lastMove.y)/(moveLength*priorLength)<-.4)compression=Math.max(compression,.85);
  if(moveLength>2){lastMove.x=mx;lastMove.y=my;}
  target.x=x;target.y=y;
  if(!initialized){point.x=tail.x=x;point.y=tail.y=y;initialized=true;put(rect);}
  if(active&&!frame&&!reduced())frame=requestAnimationFrame(tick);
  else if(active&&reduced()){point.x=tail.x=x;point.y=tail.y=y;put(rect);}
 };
 host.addEventListener('pointerenter',move);
 host.addEventListener('pointermove',move,{passive:true});
 return {
  setActive(on){
   const nextMode=['reveal','reveal-soft','glow'].includes(host.dataset.hoverEffect)?host.dataset.hoverEffect:'';
   const next=on&&!!nextMode&&(nextMode!=='glow'||!!imageFrame),changed=mode!==nextMode;
   if(next===active&&!changed){if(next&&mode==='glow')measureAmbient();return;}
   active=next;mode=nextMode;layer.classList.toggle('is-active',active);
   if(!active){cancelAnimationFrame(frame);frame=0;last=0;energy=0;compression=0;lastMove.x=lastMove.y=0;return;}
   if(mode==='glow'){
    cancelAnimationFrame(frame);frame=0;last=0;energy=0;compression=0;initialized=false;
    measureAmbient();
    return;
   }
   if(!initialized){const rect=bounds();point.x=tail.x=target.x=rect.width*.5;point.y=tail.y=target.y=rect.height*.4;initialized=true;put(rect);}
   else if(changed){energy=0;compression=0;put(bounds());}
   if(!reduced()&&!frame)frame=requestAnimationFrame(tick);
  },
  destroy(){cancelAnimationFrame(frame);observer?.disconnect();untrack();host.removeEventListener('pointerenter',move);host.removeEventListener('pointermove',move);}
 };
}
