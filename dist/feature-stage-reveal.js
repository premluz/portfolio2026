// Featured stage reveal: each time a stage scrolls into view its backdrop settles and its product card
// rises into place (timed CSS transitions in project-backdrop.css). A stage that has fully left the screen
// is reset while invisible, so the reveal plays again on the next pass. The gallery only opts into the
// hidden starting state once this observer exists, so without it every stage simply shows at rest.
// With `once` (setting prem-stage-reveal-once), a stage plays once per visit: it is remembered by card id
// for the page load, so neither leaving the screen nor a re-render of the gallery replays it.
const IN_VIEW=.25;
const revealedThisVisit=new Set();
const stageId=card=>card.dataset.contentCard??card.dataset.card??null;

export function createStageReveal(gallery,{environment=globalThis,once=false}={}){
 if(!gallery||!environment.IntersectionObserver)return null;
 const observer=new environment.IntersectionObserver(entries=>{
  for(const entry of entries){
   const card=entry.target;
   if(entry.intersectionRatio>=IN_VIEW){card.dataset.stageInView='true';const id=stageId(card);if(once&&id)revealedThisVisit.add(id);}
   else if(!entry.isIntersecting&&!once)delete card.dataset.stageInView;
  }
 },{threshold:[0,IN_VIEW]});
 const sync=()=>{
  observer.disconnect();
  for(const card of gallery.querySelectorAll('.image-card[data-feature-stage="true"]')){
   if(once&&revealedThisVisit.has(stageId(card)))card.dataset.stageInView='true';
   observer.observe(card);
  }
 };
 gallery.dataset.stageReveal='true';sync();
 return {
  sync,
  destroy(){observer.disconnect();delete gallery.dataset.stageReveal;for(const card of gallery.querySelectorAll('[data-stage-in-view]'))delete card.dataset.stageInView;}
 };
}
