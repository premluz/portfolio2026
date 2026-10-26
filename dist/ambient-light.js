import {EdgeSpring,materialSettings,springParameters} from './material-settings.js';
import {ambientLayerParent,trackAmbientGallery} from './ambient-layer.js';
import {sampleAmbientColors,ambientMediaSource,VIDEO_SAMPLE_MS} from './ambient-palette.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mix=(a,b,t)=>a+(b-a)*t;
const hueDelta=(a,b)=>((b-a)%360+540)%360-180;
const geometry=rect=>({x:rect.left+rect.width/2,y:rect.top+rect.height/2,width:rect.width,height:rect.height});
// Clears the field's widest CSS spread (clamp(120px,17vw,230px)) so the rising glow starts fully off screen.
const ENTRY_CLEARANCE=240;
const belowViewport=rect=>({left:rect.left,top:(Number(globalThis.innerHeight)||0)+ENTRY_CLEARANCE,width:rect.width,height:rect.height});
export function blendAmbientPalette(a,b,t){return {a:a.a.map((v,i)=>i===2?v+hueDelta(v,b.a[i])*t:mix(v,b.a[i],t)),b:a.b.map((v,i)=>i===2?v+hueDelta(v,b.b[i])*t:mix(v,b.b[i],t))};}
export function blendAmbientRect(a,b,t){return Object.fromEntries(['left','top','width','height'].map(key=>[key,mix(a[key],b[key],t)]));}
export function ambientMotionSpeed({duration=400,hoverSpeed=60,context='route'}={}){return context==='hover'?clamp(hoverSpeed,20,150)/100:400/Math.max(100,duration);}
export function ambientDeformation(vx,vy,{intensity=.7,settings=materialSettings}={}){
 const strength=clamp(intensity,0,1),stretch=settings.stretch/100*strength,lag=settings.lag/100*strength;
 return {driftX:clamp(vx*.7*lag,-8*strength,8*strength),driftY:clamp(vy*.7*lag,-8*strength,8*strength),stretchX:1.16+Math.min(.24,Math.abs(vx)*.0073*stretch),stretchY:1.04+Math.min(.24,Math.abs(vy)*.0073*stretch)};
}

// Reuse the card's spring parameters. Light has its own position, velocity and
// colour: retargeting never restarts a fade or resets the moving spring.
export class AmbientLightMotion {
 constructor(){this.axes=Object.fromEntries(['x','y','width','height'].map(key=>[key,new EdgeSpring()]));this.initialized=false;this.opacity=0;}
 aim(rect,palette,opacity=1){
  this.target=geometry(rect);this.targetPalette=palette;this.targetOpacity=opacity;
  if(!this.initialized){for(const key in this.axes)this.axes[key].position=this.target[key];this.palette=blendAmbientPalette(palette,palette,0);this.initialized=true;}
 }
 // Places the light without motion, e.g. off screen before it rises into a card.
 seed(rect,palette){
  const start=geometry(rect);for(const key in this.axes){this.axes[key].position=start[key];this.axes[key].velocity=0;}
  if(!this.initialized){this.palette=blendAmbientPalette(palette,palette,0);this.initialized=true;}
 }
 // Native scrolling changes the coordinate frame, not the card's physical motion.
 rebase(dx,dy){
  if(!this.initialized)return;
  this.axes.x.position+=dx;this.axes.y.position+=dy;
  this.target.x+=dx;this.target.y+=dy;
 }
 get rect(){const width=Math.max(16,this.axes.width.position),height=Math.max(16,this.axes.height.position);return {left:this.axes.x.position-width/2,top:this.axes.y.position-height/2,width,height};}
 step(dt=1,reduced=false,{duration=400,intensity=.7,hoverSpeed=60,context='route',settings=materialSettings}={}){
  if(!this.initialized)return false;
  const spring=springParameters(settings),strength=clamp(intensity,0,1),k=spring.k/(1+settings.lag*.003*strength);
  const critical=1/Math.pow(1+Math.sqrt(k),2),bounce=strength*clamp(settings.overshoot/60,0,1)*(context==='hover'?.35:1);
  const damper=mix(critical,spring.damper*.88,bounce);
  // Scale the spring clock, not its strength. Substeps keep short durations
  // stable; a slower route also slows colour travel and settling.
  const speed=ambientMotionSpeed({duration,hoverSpeed,context});
  const delta=clamp(dt,.25,1.5)*speed,steps=Math.max(1,Math.ceil(delta));
  for(const key in this.axes){const axis=this.axes[key];if(reduced){axis.position=this.target[key];axis.velocity=0;}else for(let i=0;i<steps;i++)axis.step(this.target[key],k,damper,delta/steps);}
  const colorRate=reduced?1:1-Math.pow(.86,delta);
  this.palette=blendAmbientPalette(this.palette,this.targetPalette,colorRate);
  this.opacity=mix(this.opacity,this.targetOpacity,reduced?1:1-Math.pow(this.targetOpacity>this.opacity ? .82 : .925,dt));
  const geometryError=Object.keys(this.axes).reduce((sum,key)=>sum+Math.abs(this.axes[key].position-this.target[key])+Math.abs(this.axes[key].velocity),0);
  const colorError=['a','b'].reduce((sum,key)=>sum+this.palette[key].reduce((n,v,i)=>n+Math.abs(i===2?hueDelta(v,this.targetPalette[key][i]):v-this.targetPalette[key][i]),0),0);
  const moving=geometryError>.1||colorError>.015||Math.abs(this.opacity-this.targetOpacity)>.001;
  if(!moving){for(const key in this.axes){this.axes[key].position=this.target[key];this.axes[key].velocity=0;}this.palette=blendAmbientPalette(this.targetPalette,this.targetPalette,0);this.opacity=this.targetOpacity;}
  return moving;
 }
}

export function ambientImageRect(host){
 const image=host?.querySelector('.visual img'),frame=host?.querySelector('.visual');
 const rect=image?.getBoundingClientRect();
 return rect?.width>4&&rect?.height>4?rect:frame?.getBoundingClientRect();
}
// Precedence: a project's authored ambient pair (manual), then colours sampled
// from its media when the source is 'auto', then the card surface hues.
export function paletteFor(host,source='auto'){
 const style=getComputedStyle(host),dark=document.documentElement.dataset.theme==='dark';
 const lightness=parseFloat(style.getPropertyValue('--ambient-lightness'))||(dark ? .48 : .82),chroma=parseFloat(style.getPropertyValue('--ambient-chroma'))||(dark ? .032 : .055);
 const color=key=>[lightness,chroma,parseFloat(style.getPropertyValue(key))||0];
 if(style.getPropertyValue('--ambient-manual-start').trim())return {a:color('--ambient-manual-start'),b:color('--ambient-manual-end')};
 const sampled=source==='auto'&&host.querySelector?.('.visual')?sampleAmbientColors(host):null;
 if(sampled?.a.hue!=null)return {a:[lightness,chroma*sampled.a.chromaScale,sampled.a.hue],b:[lightness,chroma*sampled.b.chromaScale,sampled.b.hue]};
 return {a:color('--project-hue-start'),b:color('--project-hue-end')};
}

// One field is reparented beneath the receiving image, never cloned. During a
// route morph it sits in the shell but keeps independent screen-space springs.
export class AmbientLight {
 constructor({reduced=()=>false,controls=()=>({})}={}){
  this.reduced=reduced;this.controls=controls;this.context='hover';this.motion=new AmbientLightMotion();this.hosts=new Map();this.enabled=false;this.frame=0;this.last=0;this.locked=false;
  this.refresh=()=>{if(this.enabled&&this.owner?.isConnected&&!this.locked)this.target(this.owner,this.motion.targetOpacity);};
  this.videoStarted=()=>{this.lastVideoSample=0;this.wake();};
  this.scroll=()=>{
   if(!this.enabled||!this.owner?.isConnected||this.locked||!this.motion.initialized)return;
   const origin={x:Number(globalThis.scrollX)||0,y:Number(globalThis.scrollY)||0},previous=this.viewportOrigin||origin;
   this.motion.rebase(previous.x-origin.x,previous.y-origin.y);this.viewportOrigin=origin;
   // Leave opacity, hover-leave timer and spring velocity untouched.
   this.wake();
  };
  addEventListener('scroll',this.scroll,{passive:true});addEventListener('resize',this.refresh);
  this.resizeObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(this.refresh);
  this.themeObserver=typeof MutationObserver==='undefined'?null:new MutationObserver(()=>{
   if(!this.enabled||!this.motion.initialized)return;
   const values=this.paletteFor(this.owner||this.parent),palette=this.motion.targetPalette;
   this.motion.targetPalette={a:[...values.a.slice(0,2),palette.a[2]],b:[...values.b.slice(0,2),palette.b[2]]};this.wake();
  });
  this.themeObserver?.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 }
 paletteFor(host){return paletteFor(host,this.controls().colorSource);}
 // A playing hover video keeps re-sampling, so the glow follows the footage.
 followVideo(now){
  if(this.locked||!this.owner?.isConnected||this.motion.targetOpacity<=0||this.controls().colorSource!=='auto'||!ambientMediaSource(this.owner)?.live)return false;
  if(now-(this.lastVideoSample||0)>=VIDEO_SAMPLE_MS){this.lastVideoSample=now;this.motion.targetPalette=this.paletteFor(this.owner);}
  return true;
 }
 setEnabled(on){
  if(on===this.enabled)return;this.enabled=on;
  if(!on){clearTimeout(this.leaveTimer);cancelAnimationFrame(this.frame);this.resizeObserver?.disconnect();this.observedImage=null;this.frame=0;this.last=0;this.locked=false;this.external=false;this.owner=null;this.field?.remove();this.stage?.remove();this.field=null;this.stage=null;this.motion=new AmbientLightMotion();}
 }
 ensure(){
  if(this.field)return;
  this.stage=document.createElement('div');this.stage.className='ambient-light-stage';this.stage.dataset.hoverEffect='glow';this.stage.setAttribute('aria-hidden','true');this.stage.hidden=true;document.body.append(this.stage);
  this.field=document.createElement('div');this.field.className='surface-effect-layer ambient-light-field is-active';this.field.style.opacity=String(this.motion.opacity);this.field.setAttribute('aria-hidden','true');this.stage.append(this.field);this.parent=this.stage;
 }
 attach(parent){this.ensure();if(this.field.parentNode!==parent)parent.append(this.field);this.parent=parent;this.stage.hidden=parent!==this.stage;}
 register(host,proxy){
  proxy.hidden=true;const entry={active:false};this.hosts.set(host,entry);
  const untrack=trackAmbientGallery(host,()=>{if(this.enabled&&this.owner===host&&!this.locked)this.wake();});
  return {setActive:on=>{
   entry.active=!!on&&(host.matches('.project-card')||host.hasAttribute('data-hover-persistent'));
   if(!this.enabled||this.locked)return;
   if(entry.active){this.context='hover';this.target(host);}
   else if(this.owner===host){clearTimeout(this.leaveTimer);this.leaveTimer=setTimeout(()=>{if(!this.locked&&this.owner===host&&!entry.active){this.motion.targetOpacity=0;this.wake();}},140);}
  },destroy:()=>{untrack();this.hosts.delete(host);if(this.owner===host&&!this.locked){this.attach(this.stage);this.owner=null;if(this.motion.initialized){this.motion.targetOpacity=0;this.wake();}}}};
 }
 target(host,opacity=1){
  if(!this.enabled)return;const rect=ambientImageRect(host);if(!rect)return;
  clearTimeout(this.leaveTimer);this.owner=host;this.viewportOrigin={x:Number(globalThis.scrollX)||0,y:Number(globalThis.scrollY)||0};this.attach(ambientLayerParent(host));const palette=this.paletteFor(host);
  // A light appearing from nothing rises from below the viewport; a fading one keeps its momentum.
  if(opacity>0&&(!this.motion.initialized||this.motion.opacity<.01))this.motion.seed(belowViewport(rect),palette);
  this.motion.aim(rect,palette,opacity);this.wake();
  const video=host.querySelector('.visual video');if(video!==this.observedVideo){this.observedVideo?.removeEventListener('playing',this.videoStarted);video?.addEventListener('playing',this.videoStarted);this.observedVideo=video;}
  const image=host.querySelector('.visual img');if(image&&image!==this.observedImage){this.resizeObserver?.disconnect();this.resizeObserver?.observe(image);this.resizeObserver?.observe(host);this.observedImage=image;}
 }
 hold(source,sourceRect){
  if(!this.enabled)return;clearTimeout(this.leaveTimer);this.ensure();
  this.context='route';
  this.resizeObserver?.disconnect();this.observedImage=null;
  const rect=sourceRect||ambientImageRect(source);
  if(rect&&(!this.motion.initialized||this.motion.opacity<.01)){this.motion=new AmbientLightMotion();this.motion.aim(rect,this.paletteFor(source),1);}
  this.source=source;this.owner=null;this.locked=true;this.attach(this.stage);this.wake();
 }
 beginMorph(shell,from,to){
  if(!this.enabled||!from.image||!ambientImageRect(to))return null;
  if(!this.locked)this.hold(from.element,from.image.contentRect||from.image.rect);
  const start=this.motion.initialized?this.motion.rect:from.image.contentRect||from.image.rect;
  const startPalette=this.motion.initialized?this.motion.palette:this.paletteFor(to),end=ambientImageRect(to),endPalette=this.paletteFor(to);
  // The morph supplies display ticks after positioning its shell. Driving our
  // independent springs there avoids two RAF writers or a one-frame offset.
  this.external=true;cancelAnimationFrame(this.frame);this.frame=0;
  shell.dataset.hoverEffect='glow';this.attach(shell);this.motion.aim(end,endPalette,1);let reversing=false;
  const seek=direction=>{if(direction<0&&!reversing){reversing=true;this.motion.aim(start,startPalette,1);}};
  return {seek,frame:(now,direction,base)=>{seek(direction);this.tick(now,base);},handoff:receiver=>this.finishNavigation(receiver)};
 }
 beginSlide(to,direction=0){
  if(!this.enabled)return;if(ambientImageRect(to)){to.dataset.hoverEffect='glow';this.context='route';this.target(to);this.locked=true;const {intensity=.7}=this.controls();this.motion.axes.x.velocity-=direction*28*intensity*materialSettings.stretch/55;}
  else if(this.motion.initialized){this.motion.targetOpacity=0;this.wake();}
 }
 beginDrag(layers){
  if(!this.enabled)return;
  this.dragLayers=layers;for(const item of layers){const detail=item.node.querySelector('.detail');if(detail)detail.dataset.hoverEffect='glow';}const host=layers.find(item=>!item.side)?.node.querySelector('.detail');
  if(host){host.dataset.hoverEffect='glow';this.attach(host);this.owner=null;this.locked=true;this.wake();}
 }
 drag({layers,offset,distance}){
  if(!this.enabled||!this.locked)return;
  const center=layers.find(item=>!item.side)?.node.querySelector('.detail'),neighbor=layers.find(item=>item.side===(offset<0?1:-1))?.node.querySelector('.detail');
  const a=ambientImageRect(center),b=ambientImageRect(neighbor);if(!a||!b)return;
  const {intensity=.7}=this.controls(),progress=clamp(Math.abs(offset)/distance*(1+materialSettings.lag/100*.28*intensity),0,1);
  this.motion.aim(blendAmbientRect(a,b,progress),blendAmbientPalette(this.paletteFor(center),this.paletteFor(neighbor),progress),1);this.wake();
 }
 finishNavigation(host){
  if(!this.enabled)return;this.locked=false;this.external=false;this.dragLayers=null;clearTimeout(this.leaveTimer);
  if(ambientImageRect(host)){
   const active=host.hasAttribute('data-hover-persistent')||this.hosts.get(host)?.active||host.matches('.project-card:hover,.project-card:focus-visible,.project-card.gesture-hover');
   this.target(host,Number(!!active));
  }else{this.owner=null;this.ensure();this.attach(this.stage);if(this.motion.initialized){this.motion.targetOpacity=0;this.wake();}}
 }
 wake(){if(this.enabled&&this.motion.initialized&&!this.frame&&!this.external)this.frame=requestAnimationFrame(now=>this.tick(now));}
 tick(now,parentBase){
  this.frame=0;if(!this.enabled||!this.field)return;
  const dt=this.last?clamp((now-this.last)/16.667,.25,1.5):1;this.last=now;
  if(!this.locked&&this.owner?.isConnected){const rect=ambientImageRect(this.owner);if(rect)this.motion.target=geometry(rect);}
  const controls=this.controls(),moving=this.motion.step(dt,this.reduced(),{...controls,context:this.context});
  const base=parentBase||(this.parent===this.stage?{left:0,top:0}:this.parent.getBoundingClientRect()),rect=this.motion.rect;
  for(const [key,value] of Object.entries({left:rect.left-base.left,top:rect.top-base.top,width:rect.width,height:rect.height}))this.field.style.setProperty('--ambient-'+key,value+'px');
  for(const key of ['a','b'])this.field.style.setProperty('--liquid-glow-'+key,`oklch(${this.motion.palette[key].join(' ')})`);
  const speed=ambientMotionSpeed({...controls,context:this.context}),vx=this.motion.axes.x.velocity*speed,vy=this.motion.axes.y.velocity*speed;
  const deformation=ambientDeformation(vx,vy,controls);
  this.field.style.setProperty('--ambient-drift-x',deformation.driftX+'%');this.field.style.setProperty('--ambient-drift-y',deformation.driftY+'%');
  this.field.style.setProperty('--ambient-stretch-x',String(deformation.stretchX));this.field.style.setProperty('--ambient-stretch-y',String(deformation.stretchY));
  this.field.style.opacity=String(this.motion.opacity);
  if(moving||this.locked||this.followVideo(now))this.wake();else{this.last=0;if(!this.motion.opacity){this.field.remove();this.stage.hidden=true;}}
 }
}
