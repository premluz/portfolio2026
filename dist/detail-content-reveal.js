import {EASE,DURATION} from './motion-tokens.js';
import {captionRevealLines} from './caption-travel.js';
import {streamEdgeText} from './text-stream-edge.js';
import {headingRevealOptions,readTextEffects} from './text-effects-settings.js';
const easing=EASE.settle;

function revealTargets(root){
 const targets=[],detail=root?.matches?.('.detail:not(.info-detail)')?root:root?.querySelector?.('.detail:not(.info-detail)'),description=detail?.querySelector?.('.description');
 targets.push(...captionRevealLines(detail,root?.ownerDocument?.documentElement?.dataset?.cardText!=='stagger'));
 // Keep the image present for its shared card-to-detail morph. Each label/value
 // pair is its own fade step, so more project facts need no timing code.
 const facts=[...(description?.querySelectorAll?.('[data-detail-fact]')||[])];
 if(facts.length)targets.push(...facts);else if(description)targets.push(description);
 const actions=detail?.querySelector?.('.detail-media-actions');if(actions)targets.push(actions);
 targets.push(...(detail?.querySelectorAll?.(':scope > .page-blocks > *')||[]));
 const footer=root?.querySelector?.(':scope > .detail-footer');if(footer)targets.push(footer);
 for(const story of root?.querySelectorAll?.(':scope > .story')||[])targets.push(...story.children);
 return [...new Set(targets)];
}

export class DetailContentReveal{
 constructor(targets,{reduced=false,duration=DURATION.detailReveal,stagger=44,titleStream=false,effects}={}){
  this.targets=targets.map(node=>({node,opacity:node.style.opacity||''}));
  this.reduced=reduced;this.duration=duration;this.stagger=stagger;this.animations=[];this.started=false;this.dead=false;this.reversing=false;
  if(!reduced)for(const {node} of this.targets)node.style.opacity='0';
  // The streamed title leaves the opacity fade: the stream's moving edge is what reveals it.
  this.title=titleStream&&!reduced?targets.find(node=>node.classList?.contains('detail-caption-title')||node.hasAttribute?.('data-page-title'))||null:null;
  this.effects=effects;this.titleTimer=0;this.titleWaiting=false;this.titleShown=false;this.finishTitle=null;
 }
 // The title is a heading, not an answer: it takes the Heading reveal settings, paced to land in a near-fixed time.
 streamTitle(){
  this.titleWaiting=false;if(this.dead||this.reversing)return;
  const {style,timing}=headingRevealOptions(this.effects||readTextEffects()),text=this.title.textContent;
  this.restore(this.title);this.titleShown=true;
  this.finishTitle=streamEdgeText(this.title,text,{reduced:false,style,timing});
 }
 stopTitle(){
  clearTimeout(this.titleTimer);this.titleWaiting=false;
  const finish=this.finishTitle;this.finishTitle=null;finish?.();
 }
 fadeOutTitle(){
  if(!this.titleShown)return;
  const animation=this.title.animate([{opacity:1},{opacity:0}],{duration:this.duration,easing,fill:'both'});
  this.animations.push(animation);
  animation.onfinish=()=>{animation.onfinish=null;animation.cancel();this.restore(this.title,true);this.animations=this.animations.filter(item=>item!==animation);};
 }
 start(){
  if(this.dead||this.started||this.reduced)return;this.started=true;
  this.targets.forEach(({node},index)=>{
   const delay=Math.min(index*this.stagger,240);
   if(node===this.title){this.titleWaiting=true;this.titleTimer=setTimeout(()=>this.streamTitle(),delay);return;}
   const animation=node.animate([{opacity:0},{opacity:1}],{duration:this.duration,delay,easing,fill:'both'});
   this.animations.push(animation);
   animation.onfinish=()=>{
    animation.onfinish=null;animation.cancel();this.restore(node,this.reversing);
    this.animations=this.animations.filter(item=>item!==animation);
   };
  });
 }
 restore(node,keepHidden=false){const saved=this.targets.find(item=>item.node===node);if(saved)node.style.opacity=keepHidden?'0':saved.opacity;}
 // The text stream cannot pause, so pausing settles the title; a title still waiting for its slot streams on resume.
 pause(){
  const waiting=this.titleWaiting;this.stopTitle();this.titleWaiting=waiting;
  for(const animation of this.animations)animation.pause?.();
 }
 resume(){
  if(this.dead)return;
  if(this.titleWaiting)this.streamTitle();
  for(const animation of this.animations)animation.play?.();
 }
 reverse(){
  if(this.dead)return;this.reversing=true;this.stopTitle();
  for(const {node} of this.targets)node.style.opacity='0';
  for(const animation of this.animations)animation.reverse?.();
  this.fadeOutTitle();
 }
 cancel(){
  if(this.dead)return;this.dead=true;this.stopTitle();
  for(const animation of this.animations){animation.onfinish=null;animation.cancel();}
  this.animations=[];for(const {node} of this.targets)this.restore(node);
 }
}

export function createDetailContentReveal(root,options={}){
 return new DetailContentReveal(revealTargets(root),options);
}

// About and Contact enter as a project does: the heading streams, then its paragraphs, links, photos and each
// following section fade in, one step apart.
function pageRevealTargets(root){
 const page=root?.querySelector?.('.detail.info-detail');if(!page)return [];
 const title=page.querySelector('h1');title?.setAttribute('data-page-title','');
 const body=[...page.querySelectorAll('.info-body')].flatMap(node=>[...node.children]);
 const rest=[...page.children].filter(node=>!node.matches('.liquid-skin,h1,.info-body')&&!node.contains(title));
 const hero=page.querySelector('.about-photos');
 return [...new Set([title,...body,hero,...rest].filter(Boolean))];
}
export function createPageContentReveal(root,options={}){
 return new DetailContentReveal(pageRevealTargets(root),{...options,titleStream:true});
}

// A streaming title rewrites its own markup each frame on the hidden live page, so its clone, cloned with the whole
// text, would show the title finished while the stream played unseen. The clone takes the live markup instead.
const STREAM_ATTRIBUTES=['data-effect','data-tint','data-color','data-font','aria-busy'];
function mirrorStream(node,copy){
 if(!node.classList?.contains('edge-stream')&&!copy.classList?.contains('edge-stream'))return;
 if(copy.innerHTML!==node.innerHTML)copy.innerHTML=node.innerHTML;
 copy.className=node.className;
 for(const name of STREAM_ATTRIBUTES){const value=node.getAttribute(name);if(value===null)copy.removeAttribute(name);else copy.setAttribute(name,value);}
}

// The morph displays cloned detail content while the live page owns the fade
// animations. Sample those existing animations so the clone and handoff agree.
export function bindDetailContentReveal(source,copy){
 const originals=revealTargets(source),copies=revealTargets(copy),pairs=originals.map((node,index)=>({node,copy:copies[index]})).filter(pair=>pair.copy);
 return ()=>{for(const {node,copy} of pairs){copy.style.opacity=getComputedStyle(node).opacity;mirrorStream(node,copy);}};
}
