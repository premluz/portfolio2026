import {DURATION,EASE} from './motion-tokens.js';
// Service card art: each `.service-move` part is drawn at its pose and held at rest by its translate attribute.
// With a pointer that hovers, a hovered card swings between rest and pose until the pointer leaves, then eases
// back to rest. Without hover (touch), each card plays rest → pose → rest once, the first time it is mostly on
// screen, so cards further along a carousel wait until they are scrolled to.
const CARD='.home-service-card',PART='.service-move',IN_VIEW=.6;
const TRANSLATE=/^translate\((-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)\)$/;
const POSE='none';

export function restTransform(part){
 const value=part.getAttribute('transform')??'';const match=TRANSLATE.exec(value.trim());
 if(!match)throw new Error(`Service art part has no translate rest pose: "${value}"`);
 return `translate(${match[1]}px, ${match[2]}px)`;
}
const delayOf=part=>Number(part.dataset.step??0)*DURATION.staggerStep;
const parts=card=>[...card.querySelectorAll(PART)];

function swing(card,running){
 for(const part of parts(card)){
  running.get(part)?.cancel();
  const rest=restTransform(part);
  running.set(part,part.animate([{transform:rest},{transform:POSE}],{duration:DURATION.serviceArtLeg,delay:delayOf(part),easing:EASE.standard,iterations:Infinity,direction:'alternate',fill:'backwards'}));
 }
}
function settle(card,running,view){
 for(const part of parts(card)){
  const current=running.get(part);if(!current)continue;
  const from=view.getComputedStyle(part).transform;current.cancel();
  // No fill: the finished state equals the translate attribute, so dropping the animation changes nothing.
  running.set(part,part.animate([{transform:from},{transform:restTransform(part)}],{duration:DURATION.serviceArtLeg,easing:EASE.settle}));
 }
}
function playOnce(card,running){
 for(const part of parts(card)){
  const rest=restTransform(part);
  running.set(part,part.animate([{transform:rest,easing:EASE.standard},{transform:POSE,easing:EASE.standard},{transform:rest}],{duration:2*DURATION.serviceArtLeg,delay:delayOf(part)}));
 }
}

export function mountServiceArtMotion(root,{reduced=()=>false,environment=globalThis}={}){
 const running=new Map(),cleanups=[],still=()=>reduced()||environment.document?.documentElement.dataset.animation==='off';
 const cards=[...root.querySelectorAll(CARD)].filter(card=>card.querySelector(PART));
 if(environment.matchMedia?.('(hover:hover)').matches){
  for(const card of cards){
   const enter=()=>{if(!still())swing(card,running);},leave=()=>settle(card,running,environment);
   card.addEventListener('pointerenter',enter);card.addEventListener('pointerleave',leave);
   cleanups.push(()=>{card.removeEventListener('pointerenter',enter);card.removeEventListener('pointerleave',leave);});
  }
 }else if(environment.IntersectionObserver){
  const observer=new environment.IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.intersectionRatio>=IN_VIEW){observer.unobserve(entry.target);if(!still())playOnce(entry.target,running);}
  },{threshold:[IN_VIEW]});
  for(const card of cards)observer.observe(card);
  cleanups.push(()=>observer.disconnect());
 }
 return {root,destroy(){for(const cleanup of cleanups)cleanup();for(const animation of running.values())animation.cancel();running.clear();}};
}
