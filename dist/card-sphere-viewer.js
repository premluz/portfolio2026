import {EASE} from './motion-tokens.js';
import {SPHERE} from './card-sphere-layout.js';
import {sphereThumbnailTransform} from './card-sphere-pose.js';

export class SphereViewer{
 constructor(world){this.world=world;this.animations=[];this.selected=null;}
 open(card){
  if(this.selected||!card.entry.ready)return;
  this.selected=card;
  const dialog=document.createElement('dialog');dialog.className='sphere-viewer';dialog.setAttribute('aria-label',card.item.label||'Selected card');
  dialog.innerHTML='<div class="sphere-viewer-shade"></div><img class="sphere-viewer-media"><div class="sphere-viewer-actions"><a class="glass-utility-button">View project</a><button class="glass-utility-button" type="button">Close <span aria-hidden="true">×</span></button></div>';
  this.dialog=dialog;this.image=dialog.querySelector('img');this.image.src=card.item.src;this.image.alt=card.item.alt;
  this.image.width=card.entry.texture.image.width;this.image.height=card.entry.texture.image.height;
  const link=dialog.querySelector('a');link.hidden=!card.item.projectId;link.href='#'+(card.item.projectId||'');
  link.addEventListener('click',()=>this.destroy());
  dialog.querySelector('button').addEventListener('click',()=>this.close());
  dialog.addEventListener('cancel',event=>{event.preventDefault();void this.close();});
  dialog.querySelector('.sphere-viewer-shade').addEventListener('click',()=>this.close());
  document.body.append(dialog);dialog.showModal();
  const target=this.image.getBoundingClientRect(),viewport=this.world.renderer.domElement.getBoundingClientRect();
  this.returnTransform=sphereThumbnailTransform(card,this.world.camera,viewport,target);
  this.thumbnailRadius=card.material.uniforms.uRadius.value/card.height*target.height;
  card.mesh.visible=false;this.world.renderer.render(this.world.scene,this.world.camera);
  this.animate(false).catch(error=>{if(error.name!=='AbortError'){this.destroy();console.error('Sphere viewer opening failed.',error);}});
 }
 animate(closing){
  const duration=this.world.reduced()?0:closing?SPHERE.viewerExit:SPHERE.viewerDuration;
  const frames=closing?[{transform:getComputedStyle(this.image).transform},{transform:this.returnTransform}]:[{transform:this.returnTransform},{transform:'none'}];
  const corners=closing?[{borderRadius:getComputedStyle(this.image).borderRadius},{borderRadius:this.thumbnailRadius+'px'}]:[{borderRadius:this.thumbnailRadius+'px'},{borderRadius:getComputedStyle(this.image).borderRadius}];
  this.animations.forEach(animation=>animation.cancel());
  const timing={duration,easing:closing?EASE.leave:EASE.settle,fill:'both'};
  this.animations=[this.image.animate(frames,timing),this.image.animate(corners,timing)];
  const shade=this.dialog.querySelector('.sphere-viewer-shade'),actions=this.dialog.querySelector('.sphere-viewer-actions');
  for(const element of [shade,actions])this.animations.push(element.animate([{opacity:closing?1:0},{opacity:closing?0:1}],timing));
  return this.animations[0].finished;
 }
 async close(){
  if(!this.selected||this.closing)return;
  this.closing=true;
  try{await this.animate(true);}catch(error){if(error.name!=='AbortError')throw error;}
  if(!this.selected)return;
  this.selected.mesh.visible=true;this.world.renderer.render(this.world.scene,this.world.camera);
  this.destroy();this.world.stage.focus({preventScroll:true});
 }
 destroy(){
  this.animations.forEach(animation=>animation.cancel());this.animations=[];
  this.dialog?.close();this.dialog?.remove();this.dialog=null;
  if(this.selected)this.selected.mesh.visible=true;
  this.selected=null;this.closing=false;
  if(!this.world.dead)this.world.invalidate();
 }
}
