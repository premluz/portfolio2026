// Every moving layer shares one reversible navigation transaction.
export const morphProgress=value=>1-Math.pow(1-value,3);
export class TransitionControl {
 constructor(){this.reversed=false;this.callbacks=[];this.animations=[];this.progressMaps=new Map();}
 // The liquid shell drives this clock after destination layout and images are
 // prepared. Seek every companion layer from the same bounded frame delta.
 synchronize(duration){this.timeline=new ReversibleProgress(duration,32);this.register(()=>this.timeline.reverse());return this.timeline;}
 advance(now){
  const value=this.timeline.step(now),time=value*this.timeline.duration;
  for(const animation of this.animations){
   const end=animation.effect.getComputedTiming().endTime;
   const map=this.progressMaps.get(animation);
   animation.currentTime=Math.min(map?map(value)*this.timeline.duration:time,end);
   if(this.timeline.finished){animation.playbackRate=this.reversed?-1:1;animation.finish();}
  }
  return value;
 }
 register(reverse){this.callbacks.push(reverse);if(this.reversed)reverse();}
 track(animation,progress){this.animations.push(animation);if(progress)this.progressMaps.set(animation,progress);if(this.timeline){animation.pause();animation.currentTime=(progress?progress(this.timeline.value):this.timeline.value)*this.timeline.duration;}else if(this.reversed)animation.reverse();return animation;}
 async wait(){await Promise.all(this.animations.map(animation=>animation.finished));}
 complete(){for(const animation of this.animations)animation.cancel();this.animations=[];this.callbacks=[];this.progressMaps.clear();}
 reverse(){if(this.reversed)return;this.reversed=true;for(const callback of this.callbacks)callback();if(!this.timeline)for(const animation of this.animations){if(animation.playState!=='idle')animation.reverse();}}
}
export class ReversibleProgress {
 constructor(duration,maxStep=Infinity){this.duration=duration;this.maxStep=maxStep;this.value=0;this.direction=1;this.previous=null;}
 reverse(){this.direction=-1;}
 step(now){if(this.previous!==null)this.value=Math.max(0,Math.min(1,this.value+Math.min(this.maxStep,Math.max(0,now-this.previous))/this.duration*this.direction));this.previous=now;return this.value;}
 get finished(){return this.direction<0?this.value===0:this.value===1;}
}
