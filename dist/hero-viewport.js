// Only surplus hero space contracts. Content and the native card layout keep their sizes.
export function heroViewportSpace({viewport,top,content,gap=0,peek=220}){
 return Math.max(0,(viewport-Math.max(0,top)-content-Math.max(0,gap)-Math.min(peek,viewport*.32))/2);
}
export function fitHeroToViewport(root,{carousel=false}={}){
 const hero=root.querySelector('.home-hero');if(!hero)return;
 if(root.classList.contains('home-view-split')){hero.style.removeProperty('--hero-viewport-space');return;}
 const content=root.querySelector('.hero-about');
 const products=root.querySelector('[data-home-product-gallery]');
 const text=root.querySelector('[data-home-product-text]');
 const target=text&&!text.hidden?text:products&&!products.hidden?products.querySelector('.spatial-gallery-viewport'):carousel?root.querySelector('[data-hero-carousel]'):root.querySelector('[data-gallery] .card-slot .visual img')||root.querySelector('[data-gallery]');
 if(!content||!target)return;
 const rect=hero.getBoundingClientRect(),next=target.getBoundingClientRect();
 const space=heroViewportSpace({viewport:innerHeight,top:rect.top+scrollY,content:content.getBoundingClientRect().height,gap:next.top-rect.bottom});
 const value=space.toFixed(2)+'px';if(hero.style.getPropertyValue('--hero-viewport-space')!==value)hero.style.setProperty('--hero-viewport-space',value);
}
