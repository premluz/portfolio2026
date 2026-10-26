import * as THREE from './vendor/three/three.module.js';
import {cardVertexShader,cardFragmentShader,coverScale} from './card-spiral-shader.js';

// The card world: one WebGL engine for every way of arranging portfolio cards (spiral, infinite space,
// ...). It owns the renderer, the image textures, the rounded card material, picking and opening a card
// through the seamless morph. An arrangement only places cards and handles its own input:
//   arrangement = {create(world), resize(world), update(world, dt), bind?(world, on), dispose?(world)}
// The canvas is decorative; the section's list of links stays the accessible way to every card.
const MAX_DT=.05;
const GEOMETRY=new THREE.PlaneGeometry(1,1);

export function themeColor(name,fallback){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d');
 context.fillStyle=fallback;context.fillStyle=getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;context.fillRect(0,0,1,1);
 const [r,g,b]=context.getImageData(0,0,1,1).data;return new THREE.Color(r/255,g/255,b/255);
}

export class CardWorld{
 constructor(root,{items=[],arrangement,onOpen=()=>{},reduced=()=>false,environment=globalThis}={}){
  this.root=root;this.items=items.filter(item=>item.src);this.arrangement=arrangement;this.onOpen=onOpen;this.reduced=reduced;this.env=environment;
  this.stage=root.querySelector('[data-card-world-stage]');this.cards=[];this.textures=new Map();this.pointer=null;this.hovered=null;this.visible=false;this.frame=0;this.last=0;this.listeners=[];
  if(!this.items.length||!this.createRenderer()){root.dataset.cardWorldState='fallback';return;}
  root.dataset.cardWorldState='ready';
  this.base=themeColor('--card-surface','#ececec');this.frameColor=themeColor('--ink','#222');
  arrangement.create(this);this.bind();this.resize();
 }
 createRenderer(){
  try{this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){console.warn('Card world: WebGL is unavailable, showing the static list.',error);return false;}
  this.renderer.setPixelRatio(Math.min(2,this.env.devicePixelRatio||1));this.renderer.setClearColor(0x000000,0);
  const canvas=this.renderer.domElement;canvas.className='card-world-canvas';canvas.setAttribute('aria-hidden','true');this.stage.append(canvas);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(30,1,1,20000);this.raycaster=new THREE.Raycaster();
  return true;
 }
 texture(src){
  if(this.textures.has(src))return this.textures.get(src);
  const entry={texture:null,aspect:1,ready:false,users:new Set()};this.textures.set(src,entry);
  // No colour-space tag: the shader writes the sampled pixels as they are, so cards show the original
  // image colours (tagging sRGB would linearise them and, with no conversion back, darken every card).
  entry.texture=new THREE.TextureLoader().load(src,texture=>{texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();texture.needsUpdate=true;entry.aspect=texture.image.width/texture.image.height;entry.ready=true;for(const card of entry.users)this.fit(card);if(this.arrangement.isMoving)this.invalidate();},undefined,error=>console.warn('Card world: image could not load: '+src,error));
  return entry;
 }
 /** A card: `fit` 'cover' crops to width x height; 'natural' keeps the image's own shape at that height. */
 addCard(item,{width,height,radius=18,fit='cover'}={}){
  const entry=this.texture(item.src),material=new THREE.ShaderMaterial({vertexShader:cardVertexShader,fragmentShader:cardFragmentShader,transparent:true,depthWrite:false,
   uniforms:{uMap:{value:entry.texture},uSize:{value:new THREE.Vector2(width,height)},uCover:{value:new THREE.Vector2(1,1)},uRadius:{value:radius},uAlpha:{value:0},uBlur:{value:0},uAberration:{value:0},uFrameAlpha:{value:0},uReady:{value:0},uBase:{value:this.base},uFrame:{value:this.frameColor}}});
  const mesh=new THREE.Mesh(GEOMETRY,material),card={item,mesh,material,entry,width,height,fit,hover:0};
  mesh.userData.card=card;mesh.scale.set(width,height,1);entry.users.add(card);if(entry.ready)this.fit(card);this.scene.add(mesh);this.cards.push(card);return card;
 }
 fit(card){
  const {entry,material}=card;
  if(card.fit==='natural'){card.width=card.height*entry.aspect;material.uniforms.uSize.value.set(card.width,card.height);}
  else{const [x,y]=coverScale(card.width/card.height,entry.aspect);material.uniforms.uCover.value.set(x,y);}
  material.uniforms.uReady.value=1;
 }
 /** Size a card in the world: its mesh carries the size so the rounded corners stay in proportion. */
 setSize(card,scale=1){card.mesh.scale.set(card.width*scale,card.height*scale,1);}
 removeCard(card){card.entry.users.delete(card);this.scene.remove(card.mesh);card.material.dispose();this.cards.splice(this.cards.indexOf(card),1);}
 bind(){
  const on=(target,type,handler,options)=>{target.addEventListener(type,handler,options);this.listeners.push(()=>target.removeEventListener(type,handler,options));};
  on(this.env,'resize',()=>this.resize());
  on(this.root,'pointermove',event=>{this.pointer={x:event.clientX,y:event.clientY};if(this.arrangement.isMoving)this.invalidate();});
  on(this.root,'pointerleave',()=>{this.pointer=null;if(this.arrangement.isMoving)this.invalidate();});
  on(this.env.document,'visibilitychange',()=>this.schedule());
  this.arrangement.bind?.(this,on);
  this.styleObserver=new this.env.MutationObserver(()=>{this.readRounding();if(this.arrangement.isMoving)this.invalidate();});this.styleObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
  this.observer=new this.env.IntersectionObserver(entries=>{this.visible=entries.some(entry=>entry.isIntersecting);this.schedule();});this.observer.observe(this.root);
 }
 resize(){
  const rect=this.stage.getBoundingClientRect();this.viewport={width:Math.max(1,rect.width),height:Math.max(1,rect.height)};
  this.renderer.setSize(this.viewport.width,this.viewport.height,false);this.camera.aspect=this.viewport.width/this.viewport.height;
  // The world pulls itself to the top of the page so it fills the viewport; the page heading overlays it.
  const pulled=parseFloat(this.root.style.getPropertyValue('--card-world-pull'))||0;
  this.root.style.setProperty('--card-world-pull',Math.max(0,this.root.getBoundingClientRect().top+this.env.scrollY+pulled)+'px');
  this.readRounding();this.arrangement.resize(this);this.camera.updateProjectionMatrix();this.renderFrame(0);
 }
 schedule(){
  const running=this.visible&&!this.env.document.hidden&&!this.dead&&(this.arrangement.isMoving?.()??true);
  // The frame clock restarts only when the loop resumes after a pause, never between frames.
  if(running&&!this.frame){if(!this.running)this.last=0;this.frame=requestAnimationFrame(now=>this.tick(now));}
  if(!running&&this.frame){cancelAnimationFrame(this.frame);this.frame=0;}
  this.running=running;
 }
 invalidate(){this.renderFrame(0);this.schedule();}
 tick(now){this.frame=0;const dt=this.last?Math.min(MAX_DT,(now-this.last)/1000):0;this.last=now;this.renderFrame(dt);this.schedule();}
 renderFrame(dt){
  if(!this.renderer||this.dead)return;
  this.hovered=this.pointer&&!this.dragging?this.pick(this.pointer.x,this.pointer.y):null;
  this.arrangement.update(this,dt);this.matchRounding();
  this.renderer.render(this.scene,this.camera);
 }
 // Cards keep the Home cards' corner rounding (--image-rounding) in screen pixels, whatever their depth
 // or scale: the radius is converted through each card's projected size every frame.
 readRounding(){this.rounding=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--image-rounding'))||0;}
 matchRounding(){
  const halfFov=THREE.MathUtils.degToRad(this.camera.fov/2);
  for(const card of this.cards){
   if(!card.mesh.visible)continue;
   const distance=Math.max(1,this.camera.position.z-card.mesh.position.z),pixelsPerUnit=this.viewport.height/(2*distance*Math.tan(halfFov));
   const localToWorld=card.mesh.scale.y/card.height,radius=this.rounding/(pixelsPerUnit*localToWorld);
   card.material.uniforms.uRadius.value=Math.min(radius,card.width/2,card.height/2);
  }
 }
 pick(clientX,clientY){
  const rect=this.renderer.domElement.getBoundingClientRect();
  this.raycaster.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-((clientY-rect.top)/rect.height)*2+1),this.camera);
  const hit=this.raycaster.intersectObjects(this.cards.filter(card=>card.mesh.visible).map(card=>card.mesh)).find(entry=>entry.object.userData.card.material.uniforms.uAlpha.value>.5);
  return hit?.object.userData.card||null;
 }
 /** The card's on-screen rectangle, from its projected corners. */
 screenRect(card){
  const rect=this.renderer.domElement.getBoundingClientRect(),box=new THREE.Box3().setFromObject(card.mesh),xs=[],ys=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(this.camera);xs.push(rect.left+(p.x+1)/2*rect.width);ys.push(rect.top+(1-p.y)/2*rect.height);}
  return {left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
 }
 /** Open the card under a point, if it is a project, from where it sits on screen. */
 open(clientX,clientY){
  const card=this.pick(clientX,clientY);if(!card?.item.projectId)return false;
  this.onOpen({projectId:card.item.projectId,src:card.item.src,rect:this.screenRect(card)});return true;
 }
 destroy(){
  this.dead=true;this.schedule();this.observer?.disconnect();this.styleObserver?.disconnect();this.listeners.forEach(remove=>remove());
  for(const card of [...this.cards])card.material.dispose();this.arrangement?.dispose?.(this);
  for(const entry of this.textures.values())entry.texture?.dispose();
  this.renderer?.dispose();this.renderer?.domElement.remove();
 }
}
