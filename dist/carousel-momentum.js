export const carouselMotion=Object.freeze({sampleWindow:90,releaseWindow:100,decay:420,maxSpeed:5,stopSpeed:.025,maxFrame:64,derivativeStep:.001});

// Sample recent travel, so a flick retains its speed but a held card stops.
export class CarouselMomentum{
 constructor(){this.stop();}
 begin(position,time){this.stop();this.samples=[{position,time}];this.lastMovement=time;}
 track(position,time){
  const previous=this.samples.at(-1);if(!previous){this.begin(position,time);return;}
  if(position!==previous.position)this.lastMovement=time;
  if(time<=previous.time){previous.position=position;return;}
  const earlier=this.samples.at(-2);
  if(earlier&&(position-previous.position)*(previous.position-earlier.position)<0)this.samples=[previous];
  if(time-previous.time>carouselMotion.sampleWindow)this.samples=[{position:previous.position,time:time-carouselMotion.sampleWindow}];
  this.samples.push({position,time});
  while(this.samples.length>2&&this.samples[1].time<time-carouselMotion.sampleWindow)this.samples.shift();
 }
 release(time,radius){
  const last=this.samples.at(-1),first=this.samples[0];
  if(!last||time-this.lastMovement>=carouselMotion.releaseWindow||last.time<=first.time){this.stop();return;}
  const elapsed=Math.max(1,time-first.time);
  const speed=(last.position-first.position)*radius/elapsed;
  this.velocity=Math.max(-carouselMotion.maxSpeed,Math.min(carouselMotion.maxSpeed,speed))/radius;
  this.samples=[];
 }
 advance(elapsed,radius){
  const before=this.velocity,decay=Math.exp(-Math.min(carouselMotion.maxFrame,Math.max(0,elapsed))/carouselMotion.decay);
  this.velocity*=decay;
  const travel=(before-this.velocity)*carouselMotion.decay;
  if(Math.abs(this.velocity*radius)<carouselMotion.stopSpeed)this.velocity=0;
  return travel;
 }
 stop(){this.velocity=0;this.samples=[];this.lastMovement=0;}
}
