import {EASE} from './motion-tokens.js';
// Native adapters of Iconiq (MIT, Edwin Vakayil). Attribution: vendor/iconiq/.
let glyphId=0;const waves=new WeakMap();
export function mountThinkingIndicator(element,{reduced=false}={}){
 const id='iconiq-thinking-'+ ++glyphId;
 element.classList.add('iconiq-thinking');element.classList.toggle('no-motion',reduced);element.setAttribute('role','status');
 element.innerHTML=`<span class="sr">Thinking…</span><svg aria-hidden="true" viewBox="0 0 24 24"><defs><linearGradient id="${id}" x1="5" x2="20" y1="4" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity=".4"/></linearGradient></defs><path class="iconiq-thinking-glyph" fill="url(#${id})" d="M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z"/><path class="iconiq-thinking-twinkle" fill="currentColor" d="M 19 2.5 C 19.18 4.32 19.68 4.82 21.5 5 C 19.68 5.18 19.18 5.68 19 7.5 C 18.82 5.68 18.32 5.18 16.5 5 C 18.32 4.82 18.82 4.32 19 2.5 Z"/></svg><span class="iconiq-thinking-label" aria-hidden="true">Thinking</span>`;
 return ()=>element.remove();
}
export function playSendWave(host,{reduced=false}={}){
 if(reduced)return ()=>{};
 waves.get(host)?.();
 const layer=document.createElement('span'),wash=document.createElement('span');layer.className='iconiq-send-wave';wash.className='iconiq-send-wash';layer.setAttribute('aria-hidden','true');layer.append(wash);host.append(layer);
 const movement=wash.animate([{transform:'translateY(55%)'},{transform:'translateY(-105%)'}],{duration:700,easing:EASE.settle,fill:'both'});
 const fade=layer.animate([{opacity:1},{opacity:1,offset:.75},{opacity:0}],{duration:1000,easing:'ease-out',fill:'both'});
 const cleanup=()=>{fade.onfinish=null;movement.cancel();fade.cancel();layer.remove();if(waves.get(host)===cleanup)waves.delete(host);};waves.set(host,cleanup);fade.onfinish=cleanup;return cleanup;
}
