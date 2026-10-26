// Featured stage reveal: each time a stage scrolls into view its backdrop settles and its product card
// rises into place (timed CSS transitions in project-backdrop.css). A stage that has fully left the screen
// is reset while invisible, so the reveal plays again on the next pass. The gallery only opts into the
// hidden starting state once this observer exists, so without it every stage simply shows at rest.
const IN_VIEW=.25;

export function createStageReveal(gallery,{environment=globalThis}={}){
 if(!gallery||!environment.IntersectionObserver)return null;
 const observer=new environment.IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.intersectionRatio>=IN_VIEW)entry.target.dataset.stageInView='true';
   else if(!entry.isIntersecting)delete entry.target.dataset.stageInView;
  }
 },{threshold:[0,IN_VIEW]});
 const sync=()=>{
  observer.disconnect();
  for(const card of gallery.querySelectorAll('.image-card[data-feature-stage="true"]'))observer.observe(card);
 };
 gallery.dataset.stageReveal='true';sync();
 return {
  sync,
  destroy(){observer.disconnect();delete gallery.dataset.stageReveal;for(const card of gallery.querySelectorAll('[data-stage-in-view]'))delete card.dataset.stageInView;}
 };
}
