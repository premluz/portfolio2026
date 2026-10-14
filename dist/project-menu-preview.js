import {imageSource} from './media-loading.js';
import {ProjectPreviewVideo} from './project-preview-video.js';
export const PROJECT_PREVIEW_SIZE=Object.freeze({width:360,height:260});
const previewGap=24;
// A shared, unclipped thumbnail portal. Row movement never replays its entrance.
export function menuPreviewPosition(menu,row,{width:vw,height:vh},size={width:200,height:160},placement='left',gap=16){
 const edge=12,w=Math.min(size.width,vw-edge*2),h=size.height;
 const y=Math.max(edge,Math.min(vh-h-edge,row.top+row.height/2-h/2));
 if(placement==='right'){
  if(menu.right+w+gap<=vw-edge)return {left:menu.right+gap,top:y,width:w,height:h};
  if(menu.left-w-gap>=edge)return {left:menu.left-w-gap,top:y,width:w,height:h};
 }else{
  if(menu.left-w-gap>=edge)return {left:menu.left-w-gap,top:y,width:w,height:h};
  if(menu.right+w+gap<=vw-edge)return {left:menu.right+gap,top:y,width:w,height:h};
 }
 if(menu.top-h-gap>=edge)return {left:Math.max(edge,Math.min(vw-w-edge,menu.left)),top:menu.top-h-gap,width:w,height:h};
 return null;
}
export class ProjectMenuPreview{
 constructor(menu,projects,{reduced=()=>false,anchor=()=>menu,size=PROJECT_PREVIEW_SIZE,placement='left',gap=previewGap}={}){
  this.menu=menu;this.anchor=anchor;this.size=size;this.placement=placement;this.gap=gap;this.projects=new Map(projects.map(p=>[p.id,p]));this.reduced=reduced;this.token=0;this.cache=new Map();this.animations=new Map();
  this.el=document.createElement('div');this.el.className='project-menu-preview';this.el.setAttribute('aria-hidden','true');document.body.append(this.el);
  this.video=new ProjectPreviewVideo(this.el,{reduced});
  this.focus=e=>{const row=e.target.closest('[data-project-menu-item]');row?this.show(row):this.hide();};
  this.blur=e=>{if(!menu.contains(e.relatedTarget))this.hide();};
  this.resize=()=>{if(this.row)this.position(this.row);};
  menu.addEventListener('focusin',this.focus);menu.addEventListener('focusout',this.blur);menu.addEventListener('scroll',this.resize,{passive:true});addEventListener('resize',this.resize);addEventListener('scroll',this.resize,{passive:true});
 }
 position(row){
  const rect=menuPreviewPosition(this.anchor(row).getBoundingClientRect(),row.getBoundingClientRect(),{width:innerWidth,height:innerHeight},this.size,this.placement,this.gap);
  if(!rect){this.el.classList.remove('is-visible');return false;}
  const entering=!this.el.classList.contains('is-visible');if(entering)this.el.classList.add('is-positioning');
  for(const key of ['left','top','width','height'])this.el.style[key]=rect[key]+'px';
  if(entering){this.el.getBoundingClientRect();this.el.classList.remove('is-positioning');}return true;
 }
 load(url){
  if(!this.cache.has(url))this.cache.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{this.cache.delete(url);reject(new Error('Thumbnail unavailable'));};image.src=imageSource(url,480);if(image.complete&&image.naturalWidth)resolve(image);}));
  return this.cache.get(url);
 }
 async show(row){
  const project=this.projects.get(row?.dataset.projectMenuItem);if(!project?.image){this.hide();return;}
  const changed=this.row!==row;if(changed)this.video.stop();
  this.row=row;this.el.classList.toggle('no-motion',this.reduced()||document.documentElement?.dataset.animation==='off');
  if(!this.position(row)){this.hide();return;}
  if(this.url===project.image){++this.token;this.pendingUrl=null;this.el.classList.add('is-visible');if(changed)this.video.start(project);return;}
  if(this.pendingUrl===project.image)return;
  const token=++this.token;this.pendingUrl=project.image;
  let loaded;try{loaded=await this.load(project.image);}catch(error){if(token===this.token)this.pendingUrl=null;console.warn('Project preview image could not load.',error);return;}
  if(token!==this.token||!this.row||this.menu.hidden)return;
  this.pendingUrl=null;this.url=project.image;
  const image=loaded.cloneNode();image.alt='';image.draggable=false;image.className='project-menu-preview-image';
  // Retarget from visible opacity so fast row changes never reset a fading layer.
  const old=[...this.el.children];
  for(const node of old){const opacity=getComputedStyle(node).opacity;const running=this.animations.get(node);if(running){running.onfinish=null;running.cancel();this.animations.delete(node);}node.style.opacity=opacity;}
  this.image=image;this.el.append(image);this.el.classList.add('is-visible');
  this.video.start(project);
  const duration=this.reduced()?0:220;
  for(const node of old){const animation=node.animate([{opacity:node.style.opacity},{opacity:0}],{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});this.animations.set(node,animation);animation.onfinish=()=>{if(this.animations.get(node)!==animation)return;this.removeImage(node);};}
  const animation=image.animate([{opacity:old.length?0:1},{opacity:1}],{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});this.animations.set(image,animation);animation.onfinish=()=>{if(this.animations.get(image)!==animation)return;image.style.opacity='1';animation.onfinish=null;animation.cancel();this.animations.delete(image);if(this.image===image)for(const node of [...this.el.children])if(node!==image&&node!==this.video.video)this.removeImage(node);};
  // Bound rapid scrubbing, then retain exactly one image when the swap settles.
  while(this.el.children.length>3)this.removeImage(this.el.firstElementChild);
 }
 removeImage(node){const animation=this.animations.get(node);if(animation){animation.onfinish=null;animation.cancel();this.animations.delete(node);}node.remove();}
 hide(){this.video.stop();++this.token;this.pendingUrl=null;this.row=null;this.el.classList.remove('is-visible');}
 destroy(){this.hide();for(const animation of this.animations.values())animation.cancel();this.animations.clear();this.el.remove();this.menu.removeEventListener('focusin',this.focus);this.menu.removeEventListener('focusout',this.blur);this.menu.removeEventListener('scroll',this.resize);removeEventListener('resize',this.resize);removeEventListener('scroll',this.resize);}
}
