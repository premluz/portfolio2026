import {dockGeometry,stepDockSpring} from './dock-morph.js';
import {ContextActionPresence} from './context-action-presence.js';

export function readContextualButtons(storage){try{return storage?.getItem('prem-contextual-buttons')==='composer'?'composer':'inline';}catch{return 'inline';}}
export function carouselVisibility(rect,{top=0,bottom}={}){
 if(bottom<=top)return 0;
 const visible=Math.max(0,Math.min(rect.bottom,bottom)-Math.max(rect.top,top));
 return rect.height>0&&visible>=Math.min(rect.height,bottom-top)*.3?visible/Math.min(rect.height,bottom-top):0;
}
export function contextualActions({project=null,carousel=null,section=null,back=false,fullScreen=true}={}){
 if(section?.kind==='testimonials')return [{id:'testimonials-linkedin',group:'testimonials',label:'View on LinkedIn',text:true,href:section.href,external:true}];
 if(section?.kind==='footer')return [{id:'contact-linkedin',group:'contact-linkedin',label:'LinkedIn',tooltip:'LinkedIn',href:section.linkedin,external:true},{id:'contact-email',group:'contact-email',label:'Copy email',tooltip:'Copy email'}];
 if(project)return [{id:'back',group:'back',label:'Go Back',tooltip:'Go Back [Esc]',text:true},...(project.prototype?.url?[{id:'prototype',group:'prototype',label:'View prototype',compactLabel:'Prototype',text:true}]:[]),...(fullScreen?[{id:'fullscreen',group:'fullscreen',label:'Full screen',tooltip:'Full screen'}]:[]),{id:'previous',group:'navigation',label:'Previous project',tooltip:'[←] Previous'},{id:'next',group:'navigation',label:'Next project',tooltip:'Next [→]'}];
 if(carousel)return [{id:'view',group:'primary',label:'View project',text:true},{id:'previous',group:'navigation',label:'Previous card',tooltip:'[←] Previous'},{id:'next',group:'navigation',label:'Next card',tooltip:'Next [→]'}];
 return back?[{id:'back',group:'back',label:'Go Back',tooltip:'Go Back [Esc]',text:true}]:[];
}
const paths={back:'M19 12H5m6-6-6 6 6 6',previous:'m14.5 5-7 7 7 7',next:'m9.5 5 7 7-7 7',fullscreen:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5','contact-linkedin':'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4M2 9h4v12H2ZM4 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2','contact-email':'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 1 9 7 9-7'};

// Visibility morphs the whole branch. Configuration changes retain the branch
// and reconcile stable action ids inside it, including across project routes.
export class ComposerContext {
 constructor(dock,{getScene=()=>({}),onAction=()=>{},reduced=()=>false,duration=()=>400,mode='inline',splitProjectControls=false}={}){
  Object.assign(this,{dock,getScene,onAction,reduced,duration,splitProjectControls,position:0,velocity:0,target:0,splitPosition:0,splitVelocity:0,splitTarget:0,focused:false,blocked:false,waiters:[]});
  this.row=document.createElement('div');this.row.className='composer-context-actions';this.row.hidden=true;this.row.inert=true;this.row.setAttribute('role','navigation');this.row.setAttribute('aria-label','Contextual actions');dock.el.append(this.row);
  this.actions=new ContextActionPresence(this.row,{reduced,onAction:(id,button)=>this.onAction(id,this.rendered,button)});this.metricVelocity={left:0,width:0,height:0};
  this.schedule=()=>{if(!this.raf){this.previous=performance.now();this.raf=requestAnimationFrame(now=>this.tick(now));}};
  this.resize=()=>{this.measure();this.refresh();};
  addEventListener('scroll',this.schedule,{passive:true});addEventListener('resize',this.resize);addEventListener('composer-viewport-change',this.resize);addEventListener('gallery-selection-change',this.schedule);
  this.previousLayout=dock.onLayout;dock.onLayout=()=>{this.previousLayout?.();this.schedule();};this.setMode(mode);
 }
 setSplitProjectControls(value){this.splitProjectControls=!!value;this.signature=null;this.refresh();}
 setMode(mode){this.mode=mode==='composer'?'composer':'inline';document.documentElement.dataset.contextualButtons=this.mode;this.refresh();}
 scene(){
  const scene=this.getScene();
  // Chat autofocus must leave Back available: chat has no floating suggestions
  // that need to occupy the contextual controls' space.
  if(this.focused&&scene.route!=='assistant'||this.blocked||this.dock.focusTarget||this.dock.focusPosition>0)return null;
  if(!this.dock.el.classList.contains('is-composer')&&this.mode==='inline'){
   if(!scene.project)return null;
   const actions=contextualActions(scene).filter(action=>action.id==='prototype'||action.id==='fullscreen');if(!actions.length)return null;
   return {...scene,actions,key:JSON.stringify(actions.map(action=>[action.id,action.group]))};
  }
  if(this.dock.position>.001)return null;
  const limit=this.dock.el.getBoundingClientRect().top-16;
  let section=null,sectionScore=0;
  if(scene.route!=='assistant')for(const candidate of scene.contextSections||[]){if(!candidate.root?.isConnected||candidate.root.closest('[hidden]'))continue;const next=carouselVisibility(candidate.root.getBoundingClientRect(),{bottom:limit});if(next>sectionScore){sectionScore=next;section=candidate;}}
  let carousel=null,score=0;
  for(const gallery of scene.galleries||[]){if(!gallery.root?.isConnected||gallery.root.closest('[hidden]')||!gallery.details?.getAttribute('href'))continue;const next=carouselVisibility(gallery.viewport.getBoundingClientRect(),{bottom:limit});if(next>score){score=next;carousel=gallery;}}
  const actions=contextualActions({...scene,carousel,section});if(scene.project&&this.splitProjectControls){const firstRight=actions.find(action=>action.id==='fullscreen'||action.id==='previous');if(firstRight)firstRight.pushRight=true;}if(!actions.length)return null;
  return {...scene,carousel,section,actions,key:JSON.stringify(actions.map(action=>[action.id,action.label,action.text,action.tooltip,action.group,action.href,action.pushRight]))};
 }
 reconcile(){
  this.desired=this.scene();
  this.target=this.desired?1:0;
  if(this.desired){this.rendered=this.desired;this.splitTarget=this.desired.actions.some((action,index,actions)=>index>0&&action.group!==actions[index-1].group)?1:0;if(this.signature!==this.desired.key){this.signature=this.desired.key;this.render();}}
  this.row.inert=!this.target;this.row.setAttribute('aria-hidden',String(!this.target));
 }
 refresh(){
  this.reconcile();
  if(this.reduced()){cancelAnimationFrame(this.raf);this.raf=0;this.position=this.target;this.velocity=0;this.splitPosition=this.splitTarget;this.splitVelocity=0;if(this.rendered)this.actions.update(this.rendered.actions.map(action=>({...action,path:paths[action.id]})),{immediate:true});this.measure();if(this.targetMetrics)this.metrics={...this.targetMetrics};this.paint();return;}
  this.paint();if(this.moving())this.schedule();
 }
 setFocused(focused){this.focused=!!focused;this.phaseDuration=focused?160:220;if(!focused&&!this.blocked)for(const resolve of this.waiters.splice(0))resolve();this.refresh();return focused&&!this.target?this.whenClosed():Promise.resolve();}
 setBlocked(blocked){this.blocked=!!blocked;this.phaseDuration=blocked?200:260;if(!blocked&&!this.focused)for(const resolve of this.waiters.splice(0))resolve();this.refresh();return blocked?this.whenClosed():Promise.resolve();}
 whenClosed(){return this.position===0?Promise.resolve():new Promise(resolve=>this.waiters.push(resolve));}
 render(){
  this.row.hidden=false;const split=!!this.rendered.project&&this.splitProjectControls;this.row.dataset.splitProjectControls=String(split);this.row.style.width=split?Math.min(dockGeometry(this.dock.position,this.dock.metrics).mainWidth,innerWidth-32)+'px':'';this.actions.update(this.rendered.actions.map(action=>({...action,path:paths[action.id]})),{immediate:this.position===0||this.reduced()});this.measure();
 }
 measure(){
  if(!this.rendered)return;
  if(this.rendered.project&&this.splitProjectControls)this.row.style.width=Math.min(dockGeometry(this.dock.position,this.dock.metrics).mainWidth,innerWidth-32)+'px';
  const rect=this.dock.el.getBoundingClientRect(),natural=this.row.getBoundingClientRect(),width=Math.min(Math.max(48,natural.width),innerWidth-32),height=natural.height||48;
  const base=dockGeometry(this.dock.position,this.dock.metrics),center=base.mainLeft+base.mainWidth/2;
  const left=Math.max(16-rect.left,Math.min(center-width/2,innerWidth-16-rect.left-width));
  const present=this.rendered.actions.filter(action=>this.actions.items.get(action.id)?.target);
  const padding=Number.parseFloat(getComputedStyle(this.row).paddingLeft),groups=new Map();
  for(const action of present){
   const slot=this.actions.items.get(action.id).slot.getBoundingClientRect(),group=groups.get(action.group);
   if(group){group.left=Math.min(group.left,slot.left);group.right=Math.max(group.right,slot.right);group.top=Math.min(group.top,slot.top);group.bottom=Math.max(group.bottom,slot.bottom);}
   else groups.set(action.group,{left:slot.left,right:slot.right,top:slot.top,bottom:slot.bottom});
  }
  const bounds=[...groups.values()],wrapped=Math.max(...bounds.map(group=>group.top))-Math.min(...bounds.map(group=>group.top))>padding;
  this.splitRects=wrapped?bounds.map(group=>({left:group.left-natural.left-padding,top:group.top-natural.top-padding,width:group.right-group.left+2*padding,height:group.bottom-group.top+2*padding})):undefined;
  const radius=wrapped?Math.max(...this.splitRects.map(group=>group.height))/2:height/2;
  this.targetMetrics={anchor:'main',left,width,height,gap:12,radius};
  this.splitAts=[];this.splitGaps=[];
  for(let index=1;index<present.length;index++)if(present[index].group!==present[index-1].group){
   const previous=this.actions.items.get(present[index-1].id).slot.getBoundingClientRect(),next=this.actions.items.get(present[index].id).slot.getBoundingClientRect();
   this.splitAts.push((previous.right+next.left-2*natural.left)/(2*width));this.splitGaps.push(Math.max(0,next.left-previous.right-2*padding));
  }
  if(!this.metrics||this.position===0||this.reduced()){this.metrics={...this.targetMetrics};this.metricVelocity={left:0,width:0,height:0};this.splitPosition=this.splitTarget;this.splitVelocity=0;}
  Object.assign(this.row.style,{left:this.metrics.left+'px',top:-(this.metrics.height+12)+'px'});
 }
 tick(now){
  this.raf=0;this.reconcile();const seconds=(now-this.previous)/1000;
  const next=stepDockSpring(this.position,this.velocity,this.target,seconds,this.phaseDuration||Math.max(220,this.duration()*.8));this.previous=now;this.position=next.position;this.velocity=next.velocity;
  if(Math.abs(this.position-this.target)<.0001&&Math.abs(this.velocity)<.003){this.position=this.target;this.velocity=0;}
  if(this.position===this.target&&!this.velocity)this.phaseDuration=null;
  const split=stepDockSpring(this.splitPosition,this.splitVelocity,this.splitTarget,seconds,200);this.splitPosition=split.position;this.splitVelocity=split.velocity;if(Math.abs(this.splitPosition-this.splitTarget)<.0001&&Math.abs(this.splitVelocity)<.003){this.splitPosition=this.splitTarget;this.splitVelocity=0;}
  this.measure();if(this.metrics)for(const key of ['left','width','height']){const n=stepDockSpring(this.metrics[key],this.metricVelocity[key],this.targetMetrics[key],seconds,200);this.metrics[key]=n.position;this.metricVelocity[key]=n.velocity;if(Math.abs(n.position-this.targetMetrics[key])<.01&&Math.abs(n.velocity)<.1){this.metrics[key]=this.targetMetrics[key];this.metricVelocity[key]=0;}}
  if(this.position===0)for(const resolve of this.waiters.splice(0))resolve();
  this.paint();this.actions.tick(now,seconds);if(this.moving(now))this.schedule();
 }
 moving(now){return this.position!==this.target||this.velocity||this.splitPosition!==this.splitTarget||this.splitVelocity||this.actions.moving(now)||this.metrics&&['left','width','height'].some(key=>Math.abs(this.metrics[key]-this.targetMetrics[key])>.01||this.metricVelocity[key]);}
 paint(){
  if(this.position===0&&!this.target){this.row.hidden=true;this.row.inert=true;this.dock.setAccessory(null);for(const resolve of this.waiters.splice(0))resolve();return;}
  this.row.hidden=false;this.measure();const branch={...this.metrics,radius:Math.min(this.targetMetrics.radius,this.metrics.height/2),position:this.position,split:this.splitPosition,splitAts:this.splitAts,splitRects:this.splitRects,splitGaps:this.rendered?.project&&this.splitProjectControls?this.splitGaps:undefined};this.dock.setAccessory(branch);
  const shape=dockGeometry(this.dock.position,this.dock.metrics,branch).popover;if(!shape)return;
  const {left,gap}=this.metrics,{width,height}=this.targetMetrics,top=-this.metrics.height-gap;
  this.row.style.clipPath=`inset(${Math.max(0,shape.top-top)}px ${Math.max(0,left+width-shape.left-shape.width)}px ${Math.max(0,top+height-shape.top-shape.height)}px ${Math.max(0,shape.left-left)}px round ${branch.radius}px)`;
  this.row.style.opacity=String(shape.reveal);this.row.inert=!this.target||shape.reveal<.7;
  for(const [id,source] of [['previous',this.rendered?.carousel?.previous],['next',this.rendered?.carousel?.next]]){const item=this.actions.items.get(id);if(item?.target) item.button.disabled=!!source?.disabled;}
  dispatchEvent(new Event('composer-overlay-change'));
 }
 destroy(){cancelAnimationFrame(this.raf);this.dock.onLayout=this.previousLayout;for(const [event,fn] of [['scroll',this.schedule],['resize',this.resize],['composer-viewport-change',this.resize],['gallery-selection-change',this.schedule]])removeEventListener(event,fn);this.actions.destroy();this.dock.setAccessory(null);this.row.remove();for(const resolve of this.waiters.splice(0))resolve();}
}
