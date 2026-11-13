// A highlight band swept across a label while work is in flight, ported from PremLab's TextGlimmer
// (studio-ui/packages/premlab/src/components/text-glimmer/gradient.ts), which adapted Merlin's shimmer text.
const BASE='var(--text-glimmer-base, var(--eyebrow-ink))';
const PEAK='var(--text-glimmer-peak, var(--ink))';
const PRISM=Object.freeze([1,2,3,4].map(index=>`var(--text-effect-prism-${index})`));
const round=value=>Number(value.toFixed(2));

// A 90deg gradient whose band fills `spread`% around the 50% mark, with resting ink on both sides, so a
// 250%-wide background reads as base ink with a band passing through rather than two colours split down the middle.
export function glimmerGradient(tint,color,spread){
 const half=spread/2,start=round(50-half),end=round(50+half),rest=`${BASE} 0%, ${BASE} ${start}%`,after=`${BASE} ${end}%, ${BASE} 100%`;
 if(tint==='multi'){
  const stops=PRISM.map((stop,index)=>`${stop} ${round(start+spread*(index+1)/(PRISM.length+1))}%`).join(', ');
  return `linear-gradient(90deg, ${rest}, ${stops}, ${after})`;
 }
 const peak=tint==='single'?`var(--text-glimmer-color, var(--text-effect-${color}))`:PEAK;
 return `linear-gradient(90deg, ${rest}, ${peak} 50%, ${after})`;
}

// The band is painted by CSS (text-effects.css) from these properties on the status element.
export function applyGlimmer(element,{tint,color,speed,spread,direction}){
 element.setAttribute('data-glimmer','');element.setAttribute('data-direction',direction);
 element.style.setProperty('--text-glimmer-gradient',glimmerGradient(tint,color,spread));
 element.style.setProperty('--text-glimmer-cycle',`${speed}s`);
}
