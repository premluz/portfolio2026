export function mountGalleryCardCopy(root){
 const copies=[...root.querySelectorAll('.spatial-gallery-item[data-gallery-media="true"] .card-copy')];
 const refresh=()=>{
  const height=root.dataset.descriptionInCard==='true'?Math.max(0,...copies.map(copy=>{
   const style=getComputedStyle(copy);
   return copy.offsetHeight+parseFloat(style.marginTop)+parseFloat(style.marginBottom);
  })):0;
  root.style.setProperty('--gallery-copy-height',`${height}px`);
 };
 const observer=new ResizeObserver(refresh);
 copies.forEach(copy=>observer.observe(copy));
 return {refresh,destroy:()=>observer.disconnect()};
}
