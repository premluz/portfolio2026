import {EASE} from './motion-tokens.js';
// One reversible image-to-focus transition for prototype and full-screen actions.
export function focusedImageRect({width,height},{width:vw,height:vh},portrait=false){
 const scale=Math.min((portrait?vw-48:Math.min(1440,vw-48))/width,(portrait?vh*.85:vh-96)/height);
 const w=width*Math.max(.01,scale),h=height*Math.max(.01,scale);
 return {left:(vw-w)/2,top:(vh-h)/2,width:w,height:h};
}
export function descriptionExitTargets(root){
 return [...root.querySelectorAll('.detail>.detail-caption,.detail>.project-client,.detail>h1,.detail>.project-summary,[data-detail-fact],.detail-project-qr,.detail-media-actions,.detail-footer,.story')]
  .sort((a,b)=>b.getBoundingClientRect().top-a.getBoundingClientRect().top);
}
export function mediaExitKeyframes(node,opacity='1'){
 return node.matches?.('.detail-media-actions')
  ?[{opacity,transform:'translateY(0px)'},{opacity:0,transform:'translateY(18px)'}]
  :[{opacity},{opacity:0}];
}
function youtubeEmbedUrl(value){
 const url=new URL(value),host=url.hostname.toLowerCase(),parts=url.pathname.split('/').filter(Boolean);
 const videoId=host==='youtu.be'?parts[0]:['youtube.com','www.youtube.com','m.youtube.com'].includes(host)?url.searchParams.get('v')|| (parts[0]==='embed'?parts[1]:null):null;
 if(!videoId||! /^[A-Za-z0-9_-]{11}$/.test(videoId))return value;
 const embed=new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);embed.searchParams.set('autoplay','1');embed.searchParams.set('playsinline','1');return embed.toString();
}
export class ProjectMediaFocus{
 constructor(root,{dock,duration=()=>400,reduced=()=>false}={}){this.root=root;this.dock=dock;this.duration=duration;this.reduced=reduced;this.animations=[];this.active=false;this.epoch=0;this.resize=()=>{if(this.active&&this.settled)this.layout();};addEventListener('resize',this.resize);}
 open(button,{prototypeUrl,prototypeTitle,detail=button.closest('.detail')}={}){
  if(this.active)return;
  const source=detail?.querySelector('.visual img');if(!source)return;
  this.active=true;this.target=true;this.settled=false;this.trigger=button;this.source=source;this.sourceRect=source.getBoundingClientRect();this.portrait=detail.dataset.cardOrientation==='portrait';
  this.saved={visibility:source.style.visibility,inert:this.root.inert,overflow:document.body.style.overflow};
  this.layer=document.createElement('div');this.layer.className='project-media-focus';this.layer.setAttribute('role','dialog');this.layer.setAttribute('aria-modal','true');this.layer.setAttribute('aria-label',prototypeUrl?prototypeTitle||'Project prototype':'Project image full screen');
  this.image=document.createElement('img');this.image.src=source.currentSrc||source.src;this.image.alt=source.alt;this.image.className='project-media-focus-image';this.image.style.borderRadius=getComputedStyle(source).borderRadius;
  this.closeButton=document.createElement('button');this.closeButton.className='project-media-focus-close';this.closeButton.type='button';this.closeButton.setAttribute('aria-label','Exit full screen');this.closeButton.dataset.tooltip='Exit full screen [Esc]';this.closeButton.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>';this.closeButton.onclick=()=>this.close();
  this.closeButton.id='project-media-focus-close';this.layer.setAttribute('aria-owns',this.closeButton.id);
  this.layer.append(this.image);document.body.append(this.layer);this.dock().el.append(this.closeButton);this.layout();
  const r=this.sourceRect,t=this.rect,transform=`translate(${r.left-t.left}px,${r.top-t.top}px) scale(${r.width/t.width},${r.height/t.height})`;
  this.image.style.transformOrigin='0 0';this.image.style.transform=transform;
  // Hide the whole original frame, including any ripple canvas or hover video.
  this.visual=detail.querySelector('.visual');this.visualVisibility=this.visual.style.visibility;this.visual.style.visibility='hidden';this.root.inert=true;document.body.style.overflow='hidden';
  this.trapFocus=e=>{if(e.key==='Tab'){e.preventDefault();(this.frame&&document.activeElement===this.closeButton?this.frame:this.closeButton).focus();}};document.addEventListener('keydown',this.trapFocus);
  const duration=this.reduced()?0:Math.max(80,this.duration());
  this.imageAnimation=this.image.animate([{transform},{transform:'none'}],{duration,easing:EASE.settle,fill:'both'});this.animations.push(this.imageAnimation);
  descriptionExitTargets(this.root).forEach((node,index)=>this.animations.push(node.animate(mediaExitKeyframes(node,getComputedStyle(node).opacity),{duration:duration*.55,delay:Math.min(index*24,duration*.4),easing:EASE.leave,fill:'both'})));
  this.dock().setMediaFocus(true,{duration});
  for(const node of detail.querySelectorAll(':scope>.liquid-skin,:scope>.surface-effect-layer'))this.animations.push(node.animate([{opacity:getComputedStyle(node).opacity},{opacity:0}],{duration,easing:'ease',fill:'both'}));
  this.closeButton.focus({preventScroll:true});this.prototypeUrl=prototypeUrl;this.prototypeTitle=prototypeTitle||'Interactive project prototype';this.awaitEnd();
 }
 layout(){
  this.rect=focusedImageRect({width:this.source.naturalWidth||this.sourceRect.width,height:this.source.naturalHeight||this.sourceRect.height},{width:innerWidth,height:innerHeight},this.portrait);
  for(const key of ['left','top','width','height'])this.image.style[key]=this.rect[key]+'px';
  if(this.source.srcset){this.image.fetchPriority='high';this.image.sizes=Math.ceil(this.rect.width)+'px';this.image.srcset=this.source.srcset;}
  if(this.settled&&this.imageAnimation){const r=this.sourceRect,t=this.rect;this.imageAnimation.effect.setKeyframes([{transform:`translate(${r.left-t.left}px,${r.top-t.top}px) scale(${r.width/t.width},${r.height/t.height})`},{transform:'none'}]);}
  if(this.frame)for(const key of ['left','top','width','height'])this.frame.style[key]=this.rect[key]+'px';
 }
 awaitEnd(){const epoch=++this.epoch;Promise.all(this.animations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(epoch!==this.epoch||!this.active)return;if(!this.target){this.destroy();return;}this.settled=true;this.image.style.transform='none';if(this.prototypeUrl&&!this.frame){this.frame=document.createElement('iframe');this.frame.className='project-media-focus-prototype';this.frame.title=this.prototypeTitle;this.frame.src=youtubeEmbedUrl(this.prototypeUrl);this.frame.style.borderRadius=this.image.style.borderRadius;this.frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; web-share');this.frame.setAttribute('allowfullscreen','');this.layer.append(this.frame);this.layout();}});}
 close(){if(!this.active||!this.target)return;this.target=false;this.settled=false;this.dock?.().setMediaFocus(false,{duration:this.duration(),returnFocus:this.trigger});this.frame?.remove();this.frame=null;if(this.reduced()){this.destroy();return;}for(const a of this.animations)a.reverse();this.awaitEnd();}
 destroy(){if(!this.active)return;this.active=false;++this.epoch;this.dock?.().setMediaFocus(false,{duration:this.duration()});document.removeEventListener('keydown',this.trapFocus);this.closeButton?.remove();this.animations.forEach(a=>a.cancel());this.animations=[];this.layer.remove();this.visual.style.visibility=this.visualVisibility;this.root.inert=this.saved.inert;document.body.style.overflow=this.saved.overflow;if(this.trigger.isConnected)this.trigger.focus({preventScroll:true});this.frame=null;}
}
