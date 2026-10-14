import {HoverVideo} from './hover-video.js';
export const PREVIEW_VIDEO_DELAY=650;

export class ProjectPreviewVideo {
 constructor(root,{reduced=()=>false,createPlayer=(el,video)=>new HoverVideo(el,video,()=>{},{decorative:true})}={}){
  Object.assign(this,{root,reduced,createPlayer});
 }
 start(project){
  this.stop();
  if(!project.videoUrl||this.reduced()||document.documentElement?.dataset.animation==='off')return;
  this.timer=setTimeout(()=>{
   this.timer=null;
   if(this.reduced()||!this.root.classList.contains('is-visible')||document.documentElement?.dataset.animation==='off')return;
   this.video=document.createElement('video');this.video.className='project-menu-preview-video';
   this.video.dataset.videoUrl=project.videoUrl;this.video.preload='none';this.video.setAttribute('aria-hidden','true');
   this.root.append(this.video);this.player=this.createPlayer(this.root,this.video);void this.player.play();
  },PREVIEW_VIDEO_DELAY);
 }
 stop(){
  clearTimeout(this.timer);this.timer=null;this.player?.destroy();this.player=null;
  this.video?.remove();this.video=null;
 }
}
