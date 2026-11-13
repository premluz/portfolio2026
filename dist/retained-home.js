// Keep the live homepage, including its image contexts and event handlers,
// available until an opening transition commits or reverses.
import {EASE} from './motion-tokens.js';
import {stageMotion} from './motion-viewport.js';
export function fadeHomeChrome(layer,control,duration){
 const promises=[],fade=(node,delay=0)=>promises.push(control.track(node.animate([{opacity:getComputedStyle(node).opacity||'1'},{opacity:0}],{duration:duration*.4,delay,easing:EASE.leave,fill:'both'})).finished);
 for(const hero of layer.querySelectorAll('.home-hero')){
  const heading=hero.querySelector('h1'),copy=hero.querySelector('[data-hero-copy]'),badge=hero.querySelector('.badge'),logos=hero.querySelector('.hero-logos:not([hidden])');
  // The hero leaves bottom-up: the logo strip (when shown), the description, the heading, then the badge above it,
  // each one step later.
  let delay=0;const step=duration*.12;
  for(const node of [logos,copy,heading,badge])if(node){fade(node,delay);delay+=step;}
  if(!copy&&!heading&&!badge)fade(hero);
 }
 for(const node of layer.querySelectorAll('.spatial-gallery-primary-action,.footer-note,[data-home-news],.home-about,.home-content-section'))fade(node);
 return promises;
}
// Going back, the hero returns as it left, reversed: top-down, the badge, the heading, the description, then the
// logo strip, with the same step and length as the exit. fill 'backwards' keeps each line hidden until its step begins.
export function revealHomeHero(root,control,duration){
 const promises=[],step=duration*.12;
 for(const hero of root.querySelectorAll('.home-hero')){
  const nodes=[hero.querySelector('.badge'),hero.querySelector('h1'),hero.querySelector('[data-hero-copy]'),hero.querySelector('.hero-logos')].filter(node=>node&&!node.hidden);
  nodes.forEach((node,index)=>promises.push(control.track(node.animate([{opacity:0},{opacity:1}],{duration:duration*.4,delay:index*step,easing:EASE.settle,fill:'backwards'})).finished));
 }
 return promises;
}
export function retainHome(main,images){
 const rect=main.getBoundingClientRect(),style=getComputedStyle(main),className=main.className;
 const sticky=[...main.querySelectorAll('.home-hero')].filter(node=>getComputedStyle(node).position==='sticky').map(node=>({node,rect:node.getBoundingClientRect(),css:node.style.cssText}));
 const layer=main.cloneNode(false);layer.removeAttribute('id');
 layer.classList.add('retained-home');layer.setAttribute('aria-hidden','true');layer.inert=true;
 Object.assign(layer.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',minHeight:'0',margin:'0',padding:style.padding,boxSizing:'border-box',pointerEvents:'none',zIndex:'18'});
 // Moving a scroller resets its scroll position (a native snap carousel, the perspective gallery), so it is carried over.
 const scrolled=[...main.querySelectorAll('*')].filter(node=>node.scrollLeft||node.scrollTop).map(node=>({node,left:node.scrollLeft,top:node.scrollTop}));
 const keepScroll=()=>{for(const item of scrolled)item.node.scrollTo({left:item.left,top:item.top,behavior:'instant'});};
 layer.append(...main.childNodes);const removeViewport=stageMotion(layer,18);keepScroll();
 for(const item of sticky)Object.assign(item.node.style,{position:'absolute',left:item.rect.left-rect.left+'px',top:item.rect.top-rect.top+'px',width:item.rect.width+'px',height:item.rect.height+'px',margin:'0'});
 return {
  images,
  // Preserve the original, already-sized DOM between opening and closing.
  // The viewport keeps its layout; opacity hides it without zero-size observers.
  stash(){layer.style.opacity='0';layer.dataset.retainedDormant='true';images.forEach(image=>image.suspend?.());},
  fadeRest(control,selected,duration){return [...layer.children].filter(node=>node!==selected).map(node=>control.track(node.animate([{opacity:getComputedStyle(node).opacity},{opacity:0}],{duration:duration*.4,easing:'ease-out',fill:'both'})).finished);},
  fadeChrome(control,duration){return fadeHomeChrome(layer,control,duration);},
  restore(){if(typeof className==='string')main.className=className;for(const item of sticky)item.node.style.cssText=item.css;main.replaceChildren(...layer.childNodes);keepScroll();removeViewport();},
  dispose(){images.forEach(image=>image.destroy());removeViewport();}
 };
}
