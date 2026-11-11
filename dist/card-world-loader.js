// The card worlds (spiral, infinite space, sphere) are the only route code that needs three.js (692 KB), so they load
// on first use instead of with the app. card-world-mount.js holds the static imports; tests/card-world-loader.mjs
// checks these names against it.
export const CARD_WORLD_ARRANGEMENTS=Object.freeze(['spiral','infinite','sphere']);
export const CARD_WORLD_ROUTES=Object.freeze(['about-infinite','about-sphere']);

let loaded=null,loading=null;
// Already-loaded code mounts synchronously, as before; only the first use waits.
export const loadedCardWorlds=()=>loaded;
export function loadCardWorlds(){
 loading??=import('./card-world-mount.js').then(module=>loaded=module,error=>{
  loading=null;
  throw new Error('The card world code could not be loaded',{cause:error});
 });
 return loading;
}
