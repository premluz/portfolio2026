const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};
const k=.55228475;
const point=(x,y)=>`${x.toFixed(3)} ${y.toFixed(3)}`;
function roundedRect(x,y,w,h,r,topEdge=''){
 r=Math.min(r,w/2,h/2);const p=point;
 return `M ${p(x+r,y)} ${topEdge} H ${x+w-r} C ${p(x+w-r+k*r,y)} ${p(x+w,y+r-k*r)} ${p(x+w,y+r)} V ${y+h-r} C ${p(x+w,y+h-r+k*r)} ${p(x+w-r+k*r,y+h)} ${p(x+w-r,y+h)} H ${x+r} C ${p(x+r-k*r,y+h)} ${p(x,y+h-r+k*r)} ${p(x,y+h-r)} V ${y+r} C ${p(x,y+r-k*r)} ${p(x+r-k*r,y)} ${p(x+r,y)} Z`;
}
function roundedSegment(x,y,w,h,leftRadius,rightRadius){
 const l=Math.min(leftRadius,w/2,h/2),r=Math.min(rightRadius,w/2,h/2),p=point;
 return `M ${p(x+l,y)} H ${x+w-r} C ${p(x+w-r+k*r,y)} ${p(x+w,y+r-k*r)} ${p(x+w,y+r)} V ${y+h-r} C ${p(x+w,y+h-r+k*r)} ${p(x+w-r+k*r,y+h)} ${p(x+w-r,y+h)} H ${x+l} C ${p(x+l-k*l,y+h)} ${p(x,y+h-l+k*l)} ${p(x,y+h-l)} V ${y+l} C ${p(x,y+l-k*l)} ${p(x+l-k*l,y)} ${p(x+l,y)} Z`;
}
function splitPopover(branch,popover){
 // The internal corners round with the opening seam. At zero separation the
 // silhouette is continuous; each group reverses into the original neck.
 const gap=Math.min(12,branch.width*.18)*clamp(popover.split||0)*smooth(.94,1,popover.position);
 if(branch.connected||gap<.001||!branch.path)return;
 const radius=Math.min(popover.radius||24,branch.height/2),inner=Math.min(radius,gap*2);
 const fractions=popover.splitAts?.length?popover.splitAts:[popover.splitAt||.5],cuts=[];
 for(const [index,fraction] of fractions.entries()){
  const cut=branch.left+branch.width*Math.max(.05,Math.min(.95,fraction)),seam=popover.splitGaps?Math.max(gap,popover.splitGaps[index]*clamp(popover.split||0)*smooth(.94,1,popover.position)):gap;
  if(!cuts.length||cut-cuts.at(-1).position>(seam+cuts.at(-1).gap)/2+2)cuts.push({position:cut,gap:seam});
 }
 branch.segments=Array.from({length:cuts.length+1},(_,index)=>{
  const left=index?cuts[index-1].position+cuts[index-1].gap/2:branch.left,right=index<cuts.length?cuts[index].position-cuts[index].gap/2:branch.left+branch.width;
  return {left,width:right-left};
 }).filter(segment=>segment.width>0);
 branch.segmentGap=gap;
 branch.path=branch.segments.map((segment,index)=>roundedSegment(segment.left,branch.top,segment.width,branch.height,index?inner:radius,index===branch.segments.length-1?radius:inner)).join(' ');
}

// A vertical branch of the very same perimeter, not a scaled popover skin.
// Opening and closing traverse this contour in either direction.
export function popoverGeometry(phase,{baseLeft=0,baseWidth=120,baseTop=0,width=330,height=480,left=-105,gap=14,radius=24,rootX=null}={}){
 const t=clamp(phase),grow=smooth(0,.78,t),stretch=Math.sin(Math.PI*t);
 const w=28+(width-28)*grow+8*stretch,h=height*grow+10*stretch;
 const root=rootX??baseLeft+baseWidth/2,center=root+(left+width/2-root)*grow;
 const x=center-w/2,bottom=baseTop-gap*smooth(.12,.90,t),y=bottom-h;
 const r=Math.min(radius,w/2,h/2),neck=Math.min(34,baseWidth*.28,Math.max(0,w-2*r))*(1-smooth(.22,.96,t))*smooth(0,.06,t),p=point;
 const connected=neck>.02&&h>.001,half=neck/2;
 const edge=connected?`H ${root-half}
  C ${p(root-half,baseTop-(baseTop-bottom)*.55)} ${p(center-half,bottom+(baseTop-bottom)*.55)} ${p(center-half,bottom)}
  H ${x+r} C ${p(x+r-k*r,bottom)} ${p(x,bottom-r+k*r)} ${p(x,bottom-r)}
  V ${y+r} C ${p(x,y+r-k*r)} ${p(x+r-k*r,y)} ${p(x+r,y)} H ${x+w-r}
  C ${p(x+w-r+k*r,y)} ${p(x+w,y+r-k*r)} ${p(x+w,y+r)} V ${bottom-r}
  C ${p(x+w,bottom-r+k*r)} ${p(x+w-r+k*r,bottom)} ${p(x+w-r,bottom)} H ${center+half}
  C ${p(center+half,bottom+(baseTop-bottom)*.55)} ${p(root+half,baseTop-(baseTop-bottom)*.55)} ${p(root+half,baseTop)}`:'';
 return {edge,path:h>.001&&!connected?roundedRect(x,y,w,h,r):'',connected,neck,left:x,top:y,width:w,height:h,reveal:smooth(.28,.78,t)};
}

// One continuous outline grows a second lobe, narrows its neck, then splits.
// The same shape clips a real backdrop-filter surface; no image shader is used.
export function dockGeometry(phase,{main=252,context=120,gap=12,height=48,radius=24}={},popover=null){
 const t=clamp(phase),h=height,stretch=10*Math.sin(Math.PI*t);
 const pull=stretch*smooth(0,.3,t),m=(context+gap)*smooth(0,.72,t)+pull,body=main+stretch,width=body+m;
 const space=gap*smooth(.25,.72,t)+pull,c=Math.max(0,m-space),ch=h*smooth(0,.35,t);
 const r=Math.min(radius,h/2),cr=Math.min(radius,c/2,ch/2),top=(h-ch)/2,bottom=(h+ch)/2,mid=h/2;
 const neck=ch*(1-smooth(.20,.96,t));
 const mainBranch=popover?.anchor==='main';
 const branch=popover&&(mainBranch||c>.001)?popoverGeometry(popover.position,{...popover,baseLeft:mainBranch?m:0,baseWidth:mainBranch?body:c,baseTop:mainBranch?0:top}):null;
 if(branch)splitPopover(branch,popover);
 let path=roundedRect(m,0,body,h,r,mainBranch?branch?.edge:''),connected=false;
 if(c>.001&&ch>.001){
  if(neck<.02)path+=' '+roundedRect(0,top,c,ch,cr,mainBranch?'':branch?.edge);
  else{
   connected=true;
   const mr=Math.min(r,(h-neck)/2),jr=Math.min(cr,(ch-neck)/2),lo=mid+neck/2,hi=mid-neck/2,p=point;
   const bridgeHalf=neck*(.5-.30*smooth(0,Math.max(1,gap),space));
   path=`M ${p(m+r,0)} ${mainBranch?branch?.edge||'':''} H ${m+body-r} C ${p(m+body-r+k*r,0)} ${p(m+body,r-k*r)} ${p(m+body,r)} V ${h-r} C ${p(m+body,h-r+k*r)} ${p(m+body-r+k*r,h)} ${p(m+body-r,h)} H ${m+r}
    C ${p(m+r-k*r,h)} ${p(m,h-mr+k*mr)} ${p(m,h-mr)} V ${lo}
    C ${p(m-space*.35,mid+bridgeHalf)} ${p(c+space*.35,mid+bridgeHalf)} ${p(c,lo)} V ${bottom-jr}
    C ${p(c,bottom-jr+k*jr)} ${p(c-cr+k*cr,bottom)} ${p(c-cr,bottom)} H ${cr}
    C ${p(cr-k*cr,bottom)} ${p(0,bottom-cr+k*cr)} ${p(0,bottom-cr)} V ${top+cr}
    C ${p(0,top+cr-k*cr)} ${p(cr-k*cr,top)} ${p(cr,top)} ${!mainBranch?branch?.edge||'':''} H ${c-cr}
    C ${p(c-cr+k*cr,top)} ${p(c,top+jr-k*jr)} ${p(c,top+jr)} V ${hi}
    C ${p(c+space*.35,mid-bridgeHalf)} ${p(m-space*.35,mid-bridgeHalf)} ${p(m,hi)} V ${mr}
    C ${p(m,mr-k*mr)} ${p(m+r-k*r,0)} ${p(m+r,0)} Z`;
  }
 }
 if(branch?.path)path+=' '+branch.path;
 return {path,width,height:h,mainLeft:m,mainWidth:body,contextWidth:c,contextHeight:ch,neck,connected,reveal:smooth(.35,.72,t),popover:branch};
}

// Rotate the vertical liquid branch onto the dock's left perimeter.
function rotateBranchPath(path,left,mid){
 const tokens=path.match(/[MCHVZ]|-?\d+(?:\.\d+)?/g)||[];let result='',i=0;
 while(i<tokens.length){const cmd=tokens[i++];if(cmd==='Z'){result+=' Z';continue;}const count={M:2,C:6,H:1,V:1}[cmd],values=tokens.slice(i,i+count).map(Number);i+=count;
  if(cmd==='H')result+=' V '+(mid-values[0]);else if(cmd==='V')result+=' H '+(left+values[0]);else{result+=' '+cmd;for(let j=0;j<values.length;j+=2)result+=' '+point(left+values[j+1],mid-values[j]);}
 }return result;
}
export function backGeometry(shape,phase,{height=48,radius=24,backWidth=78}={}){
 const contextual=shape.contextWidth>.001,left=contextual?0:shape.mainLeft;
 const h=contextual?shape.contextHeight:height,top=(height-h)/2,r=Math.min(radius,h/2,contextual?shape.contextWidth/2:shape.mainWidth/2);
 const branch=popoverGeometry(phase,{baseWidth:h,rootX:0,width:height,height:backWidth,left:-height/2,gap:10,radius});
 const edge=rotateBranchPath(branch.edge,left,height/2),path=rotateBranchPath(branch.path,left,height/2);
 let outline=shape.path;
 if(branch.connected){const marker=point(left,top+h-r)+' V '+(top+r);outline=outline.replace(marker,point(left,top+h-r)+edge+' V '+(top+r));}
 else if(path)outline+=' '+path;
 // Neck strain belongs to the glass; the menu's layout moves without that wobble.
 const space=backWidth*smooth(0,.78,phase)+10*smooth(.12,.90,phase);
 return {...branch,path:outline,left:left+branch.top,top:height/2-branch.left-branch.width,width:branch.height,height:branch.width,space};
}

// Analytic critical spring keeps position and velocity continuous on reversal.
export function stepDockSpring(position,velocity,target,seconds,duration=400){
 const omega=7/Math.max(.1,duration/1000),dt=Math.min(.032,Math.max(0,seconds));
 const offset=position-target,coefficient=velocity+omega*offset,decay=Math.exp(-omega*dt);
 return {position:target+(offset+coefficient*dt)*decay,velocity:(velocity-omega*coefficient*dt)*decay};
}

export class DockMorph {
 constructor(el,{reduced=()=>false}={}){
  this.el=el;this.reduced=reduced;this.position=0;this.velocity=0;this.target=0;this.duration=400;
  this.voicePosition=0;this.voiceVelocity=0;this.voiceTarget=0;
  this.composerPosition=0;this.composerVelocity=0;this.composerTarget=0;this.backPosition=0;this.backVelocity=0;this.backTarget=0;this.back=el.querySelector('#assistantBack');
  el.querySelector('.dock-shapes')?.remove();
  this.context=el.querySelector('.context-nav');this.main=el.querySelector('nav');
  this.content=document.createElement('div');this.content.className='dock-content';this.content.append(this.context,this.main);
  this.glass=document.createElement('div');this.glass.className='dock-glass glass-surface';this.glass.setAttribute('aria-hidden','true');
  const ns='http://www.w3.org/2000/svg';this.rim=document.createElementNS(ns,'svg');this.rim.classList.add('dock-outline');this.rim.setAttribute('aria-hidden','true');
  this.path=document.createElementNS(ns,'path');this.rim.append(this.path);el.prepend(this.glass,this.content,this.rim);el.classList.add('dock-morph');
  this.clipId=(el.id||'dock')+'-liquid-popover-clip';this.defs=document.createElementNS(ns,'defs');this.clip=document.createElementNS(ns,'clipPath');this.clip.setAttribute('id',this.clipId);this.clip.setAttribute('clipPathUnits','userSpaceOnUse');this.clipPath=document.createElementNS(ns,'path');this.clip.append(this.clipPath);this.defs.append(this.clip);this.rim.append(this.defs);
  this.resize=()=>this.refresh();addEventListener('resize',this.resize);this.refresh();
 }
 refresh(){
  const style=getComputedStyle(this.el),read=(name,fallback)=>parseFloat(style.getPropertyValue(name))||fallback;
  this.baseMetrics={main:read('--nav-main-width',252),context:Number.parseFloat(getComputedStyle(this.context).width)||read('--nav-context-width',120),gap:read('--nav-section-gap',12),height:read('--nav-height',48),backWidth:read('--nav-back-width',78),radius:parseFloat(style.getPropertyValue('--nav-rounding'))||0};
  this.updateComposerWidth();
  this.paint();
  this.onLayout?.();
 }
 updateComposerWidth(){
  const viewportWidth=Number(globalThis.innerWidth)||1024;
  const shape=dockGeometry(this.position,this.baseMetrics);
  const back=this.back&&this.backPosition>0?backGeometry(shape,this.backPosition,this.baseMetrics):null;
  this.settingsSpace=this.el.dataset?.separateSettings==='true'?this.baseMetrics.height+10:0;
  const backSpace=back?.space||0,stretch=shape.mainWidth-this.baseMetrics.main;
  const available=Math.max(80,viewportWidth-32-shape.mainLeft-this.settingsSpace-backSpace-stretch);
  this.layoutMain=Math.min(this.baseMetrics.main,available);
  const expanded=Math.max(this.layoutMain,Math.min(520,available)),compact=Math.min(320,available);this.composerWidth=expanded+(compact-expanded)*this.voicePosition;
 }
 setSplit(split,{duration=400,immediate=false}={}){
  this.target=split?1:0;this.duration=Math.max(550,duration*1.55);this.el.classList.toggle('split',split);this.updateComposerWidth();
  if(immediate||this.reduced()){this.position=this.target;this.velocity=0;this.paint();if(this.composerPosition!==this.composerTarget)this.start();return;}
  if(Math.abs(this.position-this.target)<.0001&&Math.abs(this.velocity)<.001){this.paint();return;}
  this.start();
 }
 setBack(active,{duration=400,immediate=false}={}){
  if(!this.back)return;this.backTarget=active?1:0;this.el.dataset.separateBack=String(active);this.duration=Math.max(550,duration*1.55);this.updateComposerWidth();
  if(active)this.back.hidden=false;
  if(immediate||this.reduced()){this.backPosition=this.backTarget;this.backVelocity=0;this.paint();return;}this.start();
 }
 setVoiceCompact(active){this.voiceTarget=active?1:0;if(this.reduced()){this.voicePosition=this.voiceTarget;this.voiceVelocity=0;this.paint();this.onLayout?.();}else this.start();}
 setComposer(active,{duration=400,immediate=false}={}){
  this.composerTarget=active?1:0;this.duration=Math.max(550,duration*1.55);this.updateComposerWidth();
  this.el.classList.toggle('is-composer',active);
  if(immediate||this.reduced()){this.composerPosition=this.composerTarget;this.composerVelocity=0;this.paint();return;}
  this.start();
 }
 start(){if(!this.raf){this.previous=performance.now();this.raf=requestAnimationFrame(now=>this.tick(now));}}
 tick(now){
  this.raf=0;const seconds=(now-this.previous)/1000;
  const next=stepDockSpring(this.position,this.velocity,this.target,seconds,this.duration);this.previous=now;this.position=next.position;this.velocity=next.velocity;
  const composer=stepDockSpring(this.composerPosition,this.composerVelocity,this.composerTarget,seconds,this.duration);
  this.composerPosition=composer.position;this.composerVelocity=composer.velocity;
  if(Math.abs(this.position-this.target)<.0001&&Math.abs(this.velocity)<.003){this.position=this.target;this.velocity=0;}
  if(Math.abs(this.composerPosition-this.composerTarget)<.0001&&Math.abs(this.composerVelocity)<.003){this.composerPosition=this.composerTarget;this.composerVelocity=0;}
  const back=stepDockSpring(this.backPosition,this.backVelocity,this.backTarget,seconds,this.duration);this.backPosition=back.position;this.backVelocity=back.velocity;
  if(Math.abs(this.backPosition-this.backTarget)<.0001&&Math.abs(this.backVelocity)<.003){this.backPosition=this.backTarget;this.backVelocity=0;}
  const voice=stepDockSpring(this.voicePosition,this.voiceVelocity,this.voiceTarget,seconds,220);this.voicePosition=voice.position;this.voiceVelocity=voice.velocity;if(Math.abs(this.voicePosition-this.voiceTarget)<.0001&&Math.abs(this.voiceVelocity)<.003){this.voicePosition=this.voiceTarget;this.voiceVelocity=0;}
  this.paint();this.onLayout?.();if(this.voicePosition!==this.voiceTarget||this.voiceVelocity||this.position!==this.target||this.velocity||this.composerPosition!==this.composerTarget||this.composerVelocity||this.backPosition!==this.backTarget||this.backVelocity)this.raf=requestAnimationFrame(time=>this.tick(time));
 }
 paint(){
  this.updateComposerWidth();
  this.metrics={...this.baseMetrics,main:this.layoutMain+(this.composerWidth-this.layoutMain)*this.composerPosition};
  const extension=this.popover||this.accessory;
  const shape=dockGeometry(this.position,this.metrics,extension);this.el.style.width=shape.width+'px';this.el.style.setProperty('--dock-painted-width',shape.width+'px');
  // Keep the receding action branch in the same glass while the menu grows.
  // Both paths share the base, so their clipped surface remains continuous.
  const receding=this.popover&&this.accessory?dockGeometry(this.position,this.metrics,this.accessory):null;
  if(receding)shape.path+=' '+receding.path;
  const back=this.back&&this.backPosition>0?backGeometry(shape,this.backPosition,this.metrics):null;if(back)shape.path=back.path;
  const backSpace=back?.space||0;
  this.el.style.setProperty('--dock-back-space',backSpace+'px');
  this.el.style.setProperty('--dock-center-offset',(backSpace-this.settingsSpace)/2+'px');
  if(this.back){this.back.hidden=this.backPosition===0&&this.backTarget===0;this.back.inert=!this.backTarget||!back||back.reveal<.7;this.back.style.opacity=String(back?.reveal||0);if(back)this.back.style.left=back.left+(back.width-this.metrics.backWidth)/2+'px';}
  const clip=`path('${shape.path.replace(/\s+/g,' ')}')`;
  this.content.style.clipPath=extension?`path('${dockGeometry(this.position,this.metrics).path.replace(/\s+/g,' ')}')`:clip;this.main.style.width=shape.mainWidth+'px';
  const branch=shape.popover,branches=[branch,receding?.popover].filter(Boolean),left=Math.min(0,...branches.map(item=>item.left),back?.left||0),top=Math.min(0,...branches.map(item=>item.top)),width=Math.max(shape.width,...branches.map(item=>item.left+item.width))-left,height=shape.height-top;
  for(const node of [this.glass,this.rim])Object.assign(node.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
  this.clipPath.setAttribute('d',shape.path);this.clipPath.setAttribute('transform',`translate(${-left} ${-top})`);
  this.glass.style.clipPath=branch||back?`url(#${this.clipId})`:clip;
  this.rim.setAttribute('viewBox',`${left} ${top} ${width} ${height}`);this.path.setAttribute('d',shape.path);
  this.context.style.opacity=String(shape.reveal);this.context.style.visibility=shape.reveal>.001?'visible':'hidden';this.context.inert=this.target===0||shape.reveal<.7;this.context.setAttribute('aria-hidden',String(this.context.inert));
 }
 setPopover(popover){this.popover=popover;this.paint();}
 setAccessory(accessory){if(this.accessory===accessory)return;this.accessory=accessory;this.paint();}
 destroy(){cancelAnimationFrame(this.raf);removeEventListener('resize',this.resize);this.el.append(this.context,this.main);this.content.remove();this.glass.remove();this.rim.remove();}
}
