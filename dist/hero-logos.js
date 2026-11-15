// Logo strip under the hero description; the Content Home "Logo strip" switch shows it (data-home-section="logos").
import {EASE,DURATION} from './motion-tokens.js';
// Width and height come from each SVG's viewBox so the strip never reflows while the files load.
export const HERO_LOGOS=Object.freeze([
 {name:'GalaChain',file:'GalaChain.svg',width:108,height:23},
 {name:'Tracr',file:'Tracr.svg',width:64,height:18},
 {name:'PlayStation',file:'PlayStation.svg',width:128,height:24},
 {name:'De Beers',file:'DeBeers.svg',width:127.56,height:35.926},
 {name:'Deutsche Bank',file:'Deutsche_Bank.svg',width:117,height:25},
 {name:'Vodafone',file:'Vodafone.svg',width:111,height:22},
 {name:'Kingfisher',file:'Kingfisher.svg',width:84,height:26},
 {name:'The Body Shop',file:'TheBodyShop.svg',width:150,height:21}
]);
// Three identical copies: the track moves by exactly one copy per loop, and three keep the rail filled at the widest content width.
export const HERO_LOGO_COPIES=3;

const listMarkup=(logos,decorative)=>`<ul class="hero-logos-set"${decorative?' aria-hidden="true"':''}>${logos.map(logo=>`<li><img src="assets/logos/${logo.file}" width="${logo.width}" height="${logo.height}" alt="${decorative?'':logo.name}" decoding="async" draggable="false"></li>`).join('')}</ul>`;

export function heroLogosMarkup(logos=HERO_LOGOS){
 if(!logos.length)return '';
 const sets=Array.from({length:HERO_LOGO_COPIES},(_,index)=>listMarkup(logos,index>0)).join('');
 return `<div class="hero-logos" data-home-section="logos" role="region" aria-label="Companies I have worked with"><div class="hero-logos-track">${sets}</div></div>`;
}

const LOOP='hero-logos-scroll';
const loopOf=track=>track.getAnimations().find(animation=>animation.animationName===LOOP);
// Moving the strip to another parent (the retained home layer during a project transition, and back) restarts its CSS
// loop, which snapped the logos to the first one. Call before the move; the returned function puts the loop back where it was.
export function holdHeroLogoPhase(root){
 const saved=[...root.querySelectorAll('.hero-logos-track')].map(track=>[track,loopOf(track)?.currentTime]).filter(([,time])=>time!=null);
 return ()=>{for(const [track,time] of saved){const loop=loopOf(track);if(loop)loop.currentTime=time;}};
}
// The logos arrive one after another, left to right, like the hero lines above them. Steps shrink to fit the phase so
// none is dropped; logos still behind the strip's edge arrive with the last visible one.
export function staggerHeroLogos(strip,{delay=0,duration,track=animation=>animation}){
 const bounds=strip.getBoundingClientRect();
 const items=[...strip.querySelectorAll('.hero-logos-set li')].map(item=>({item,rect:item.getBoundingClientRect()}));
 const shown=items.filter(({rect})=>rect.right>bounds.left&&rect.left<bounds.right).sort((a,b)=>a.rect.left-b.rect.left).map(({item})=>item);
 const step=shown.length>1?Math.min(DURATION.staggerStep,duration*DURATION.staggerSpan/(shown.length-1)):0;
 const last=delay+Math.max(0,shown.length-1)*step;
 return items.map(({item})=>{const index=shown.indexOf(item);return track(item.animate([{opacity:0},{opacity:1}],{duration,delay:index<0?last:delay+index*step,easing:EASE.settle,fill:'backwards'})).finished;});
}
