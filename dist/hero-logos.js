// Logo strip under the hero description; the Content Home "Logo strip" switch shows it (data-home-section="logos").
// Width and height come from each SVG's viewBox so the strip never reflows while the files load.
export const HERO_LOGOS=Object.freeze([
 {name:'PlayStation',file:'PlayStation.svg',width:128,height:24},
 {name:'Deutsche Bank',file:'Deutsche_Bank.svg',width:117,height:25},
 {name:'Vodafone',file:'Vodafone.svg',width:111,height:22},
 {name:'Kingfisher',file:'Kingfisher.svg',width:84,height:26},
 {name:'The Body Shop',file:'TheBodyShop.svg',width:150,height:21},
 {name:'Gala Games',file:'GalaGames.svg',width:117,height:23},
 {name:'GalaChain',file:'GalaChain.svg',width:108,height:23},
 {name:'Tracr',file:'Tracr.svg',width:92,height:18}
]);
// Three identical copies: the track moves by exactly one copy per loop, and three keep the rail filled at the widest content width.
export const HERO_LOGO_COPIES=3;

const listMarkup=(logos,decorative)=>`<ul class="hero-logos-set"${decorative?' aria-hidden="true"':''}>${logos.map(logo=>`<li><img src="assets/logos/${logo.file}" width="${logo.width}" height="${logo.height}" alt="${decorative?'':logo.name}" decoding="async" draggable="false"></li>`).join('')}</ul>`;

export function heroLogosMarkup(logos=HERO_LOGOS){
 if(!logos.length)return '';
 const sets=Array.from({length:HERO_LOGO_COPIES},(_,index)=>listMarkup(logos,index>0)).join('');
 return `<div class="hero-logos" data-home-section="logos" role="region" aria-label="Companies I have worked with"><div class="hero-logos-track">${sets}</div></div>`;
}
