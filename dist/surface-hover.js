import {ambientLayerParent} from './ambient-layer.js';

// Apply the same surface recipe to cards, controls, or spatial objects. A
// renderer can mount a canvas in the skin without touching the host's content.
export function configureSurfaceHover(surfaces,{rest='surface',enabled=true}={}){
 for(const host of surfaces){
  host.dataset.hoverRest=rest;
  host.toggleAttribute('data-hover-disabled',!enabled);
  host.dispatchEvent?.(new Event('surface-hover-change'));
 }
}

export function mountSurfaceRenderer(host,renderer){
 const skin=host.querySelector(':scope > .liquid-skin');
 if(!skin)throw new Error(`Prepare the surface skin before mounting an effect on <${host.tagName?.toLowerCase()} class="${host.className}" data-hover-effect="${host.dataset?.hoverEffect}"${host.dataset?.card?' data-card="'+host.dataset.card+'"':''}>`);
 const layer=document.createElement('div');layer.className='surface-effect-layer';layer.setAttribute('aria-hidden','true');skin.append(layer);
 const effect=renderer({host,layer})||{};
 const sync=()=>{
  const parent=host.dataset.hoverEffect==='glow'?ambientLayerParent(host):skin;
  if(layer.parentNode!==parent)parent.append(layer);
  effect.setActive?.(!host.hasAttribute('data-hover-disabled')&&(host.hasAttribute('data-hover-persistent')||host.matches(':focus-visible,.gesture-hover')||((typeof matchMedia==='undefined'||matchMedia('(hover:hover) and (pointer:fine)').matches)&&host.matches(':hover'))));
 };
 for(const event of ['pointerenter','pointerleave','focusin','focusout','surface-hover-change'])host.addEventListener(event,sync);
 sync();
 return ()=>{for(const event of ['pointerenter','pointerleave','focusin','focusout','surface-hover-change'])host.removeEventListener(event,sync);effect.destroy?.();layer.remove();};
}
