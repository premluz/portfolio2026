// A card's transformed stacking context cannot place light behind its siblings.
export function ambientLayerParent(host){
 const stage=host.closest?.('.spatial-gallery-stage');
 if(!stage)return host;
 let backdrop=stage.querySelector(':scope > .spatial-gallery-ambient');
 if(!backdrop){
  backdrop=document.createElement('div');backdrop.className='spatial-gallery-ambient';
  backdrop.dataset.hoverEffect='glow';backdrop.setAttribute('aria-hidden','true');stage.prepend(backdrop);
 }
 return backdrop;
}

export function trackAmbientGallery(host,update){
 const gallery=host.closest?.('[data-card-gallery]');
 gallery?.addEventListener('gallery-paint',update);
 return ()=>gallery?.removeEventListener('gallery-paint',update);
}
