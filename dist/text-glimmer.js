// A highlight band swept across a label while work is in flight, ported from PremLab's TextGlimmer
// (studio-ui/packages/premlab/src/components/text-glimmer/gradient.ts), which adapted Merlin's shimmer text.
const BASE='var(--text-glimmer-base, var(--eyebrow-ink))';
const PEAK='var(--text-glimmer-peak, var(--ink))';
const PRISM=Object.freeze([1,2,3,4].map(index=>`var(--text-effect-prism-${index})`));
const round=value=>Number(value.toFixed(2));

// A 90deg gradient whose band fills `spread`% around the 50% mark, with resting ink on both sides, so a
// 250%-wide background reads as base ink with a band passing through rather than two colours split down the middle.
// `base` is the resting ink (the label's eyebrow ink by default, the heading's ink for the hero) and `peak` the band's
// ink when the tint is "none". They must differ, or that tint shows nothing.
export function glimmerGradient(tint,color,spread,{base=BASE,peak:inkPeak=PEAK}={}){
 const half=spread/2,start=round(50-half),end=round(50+half),rest=`${base} 0%, ${base} ${start}%`,after=`${base} ${end}%, ${base} 100%`;
 if(tint==='multi'){
  const stops=PRISM.map((stop,index)=>`${stop} ${round(start+spread*(index+1)/(PRISM.length+1))}%`).join(', ');
  return `linear-gradient(90deg, ${rest}, ${stops}, ${after})`;
 }
 const peak=tint==='single'?`var(--text-glimmer-color, var(--text-effect-${color}))`:inkPeak;
 return `linear-gradient(90deg, ${rest}, ${peak} 50%, ${after})`;
}

// The band is painted by CSS (text-effects.css) from these properties on the status element.
export function applyGlimmer(element,{tint,color,speed,spread,direction}){
 element.setAttribute('data-glimmer','');element.setAttribute('data-direction',direction);
 element.style.setProperty('--text-glimmer-gradient',glimmerGradient(tint,color,spread));
 element.style.setProperty('--text-glimmer-cycle',`${speed}s`);
}

// Each page's main heading sweeps `plays` times when the page lands, then rests as plain ink: the home hero, a
// project's visible title, About, Lab, articles and info pages. The page's root carries the state, so every route
// change plays it again; text-effects.css paints it and must list the same headings (tests/text-effects.mjs).
export const PAGE_HEADINGS=Object.freeze(['[data-hero-title]','.detail-caption-title','.surface.detail>h1','.about-hero h1','.lab-heading h1','.article-header h1']);
const HEADING=PAGE_HEADINGS.join(','),DONE='data-glimmer-done',listening=new WeakSet();
export function applyHeroGlimmer(root,{enabled,tint,color,speed,spread,direction,plays}){
 if(!listening.has(root)){
  listening.add(root);
  // The finished heading drops the glimmer paint altogether, so nothing of the band stays at rest.
  root.addEventListener('animationend',event=>{if(event.animationName?.startsWith('text-glimmer')&&event.target.matches?.(HEADING))event.target.setAttribute(DONE,'');});
  // Every route change is a landing: a heading the app keeps and brings back (home, returning from a project) plays again.
  globalThis.addEventListener?.('hashchange',()=>{for(const title of root.querySelectorAll(HEADING))title.removeAttribute(DONE);});
 }
 if(!enabled){root.removeAttribute('data-hero-glimmer');return;}
 root.style.setProperty('--hero-glimmer-gradient',glimmerGradient(tint,color,spread,{base:'var(--ink)',peak:'var(--body-ink)'}));
 root.style.setProperty('--hero-glimmer-cycle',`${speed}s`);root.style.setProperty('--hero-glimmer-plays',String(plays));
 root.setAttribute('data-hero-glimmer',direction);
}
// Plays it again on the heading that is on screen (the settings panel's Replay).
export function replayHeroGlimmer(root){
 const direction=root.getAttribute('data-hero-glimmer');if(direction===null)return;
 for(const title of root.querySelectorAll(HEADING))title.removeAttribute(DONE);
 root.removeAttribute('data-hero-glimmer');void root.offsetWidth;root.setAttribute('data-hero-glimmer',direction);
}
