const easing='cubic-bezier(.22,1,.36,1)';

function revealTargets(root){
 const targets=[],detail=root?.matches?.('.detail:not(.info-detail)')?root:root?.querySelector?.('.detail:not(.info-detail)'),description=detail?.querySelector?.('.description');
 // Keep the image present for its shared card-to-detail morph. Each label/value
 // pair is its own fade step, so more project facts need no timing code.
 const facts=[...(description?.querySelectorAll?.('[data-detail-fact]')||[])];
 if(facts.length)targets.push(...facts);else if(description)targets.push(description);
 const actions=detail?.querySelector?.('.detail-media-actions');if(actions)targets.push(actions);
 const footer=root?.querySelector?.(':scope > .detail-footer');if(footer)targets.push(footer);
 for(const story of root?.querySelectorAll?.(':scope > .story')||[])targets.push(...story.children);
 return [...new Set(targets)];
}

export class DetailContentReveal{
 constructor(targets,{reduced=false,duration=220,stagger=44}={}){
  this.targets=targets.map(node=>({node,opacity:node.style.opacity||''}));
  this.reduced=reduced;this.duration=duration;this.stagger=stagger;this.animations=[];this.started=false;this.dead=false;this.reversing=false;
  if(!reduced)for(const {node} of this.targets)node.style.opacity='0';
 }
 start(){
  if(this.dead||this.started||this.reduced)return;this.started=true;
  this.targets.forEach(({node},index)=>{
   const animation=node.animate([{opacity:0},{opacity:1}],{duration:this.duration,delay:Math.min(index*this.stagger,240),easing,fill:'both'});
   this.animations.push(animation);
   animation.onfinish=()=>{
    animation.onfinish=null;animation.cancel();this.restore(node,this.reversing);
    this.animations=this.animations.filter(item=>item!==animation);
   };
  });
 }
 restore(node,keepHidden=false){const saved=this.targets.find(item=>item.node===node);if(saved)node.style.opacity=keepHidden?'0':saved.opacity;}
 pause(){for(const animation of this.animations)animation.pause?.();}
 resume(){if(!this.dead)for(const animation of this.animations)animation.play?.();}
 reverse(){
  if(this.dead)return;this.reversing=true;
  for(const {node} of this.targets)node.style.opacity='0';
  for(const animation of this.animations)animation.reverse?.();
 }
 cancel(){
  if(this.dead)return;this.dead=true;
  for(const animation of this.animations){animation.onfinish=null;animation.cancel();}
  this.animations=[];for(const {node} of this.targets)this.restore(node);
 }
}

export function createDetailContentReveal(root,options={}){
 return new DetailContentReveal(revealTargets(root),options);
}

// The morph displays cloned detail content while the live page owns the fade
// animations. Sample those existing animations so the clone and handoff agree.
export function bindDetailContentReveal(source,copy){
 const originals=revealTargets(source),copies=revealTargets(copy),pairs=originals.map((node,index)=>({node,copy:copies[index]})).filter(pair=>pair.copy);
 return ()=>{for(const {node,copy} of pairs)copy.style.opacity=getComputedStyle(node).opacity;};
}
