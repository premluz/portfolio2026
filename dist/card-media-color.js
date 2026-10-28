import {sampleAmbientColors} from './ambient-palette.js';

// Card colour from the card's own picture: the two hues sampled from its media (the same sampling the ambient glow uses) replace
// the project's authored colours, so a card's tint is a gradient of what is on it. The authored tokens are kept on the card and
// come back when this is off, when the card has an authored ambient pair, or when the media cannot be read.
const TOKENS=['--project-hue-start','--project-hue-end','--project-chroma-scale'];
export function applyMediaCardColor(card,enabled=true){
 if(!card?.style)return;
 if(!card.dataset.projectColors)card.dataset.projectColors=JSON.stringify(TOKENS.map(name=>card.style.getPropertyValue(name)));
 const sampled=enabled&&!card.style.getPropertyValue('--ambient-manual-start').trim()?sampleAmbientColors(card):null;
 if(sampled?.a.hue!=null){
  const scale=(sampled.a.chromaScale+sampled.b.chromaScale)/2;
  card.style.setProperty(TOKENS[0],sampled.a.hue.toFixed(2));card.style.setProperty(TOKENS[1],sampled.b.hue.toFixed(2));card.style.setProperty(TOKENS[2],scale.toFixed(2));
  card.dataset.mediaColor='on';return;
 }
 if(card.dataset.mediaColor!=='on')return;
 JSON.parse(card.dataset.projectColors).forEach((value,index)=>value?card.style.setProperty(TOKENS[index],value):card.style.removeProperty(TOKENS[index]));
 delete card.dataset.mediaColor;
}
export const applyMediaCardColors=(root,enabled=true)=>root.querySelectorAll('.project-card,.surface.detail').forEach(card=>applyMediaCardColor(card,enabled));
