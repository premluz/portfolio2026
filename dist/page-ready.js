// Text is what the first view needs; images load progressively behind the reveal.
export const PAGE_READY_TIMEOUT_MS=400;
const BOOTING_CLASS='page-booting';
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));

/** Fades the dark boot cover away once fonts are ready, or after a short cap. */
export async function revealPage({root=document,timeout=PAGE_READY_TIMEOUT_MS}={}){
 let timer;
 await Promise.race([Promise.allSettled([root.fonts?.ready]),new Promise(resolve=>{timer=setTimeout(resolve,timeout);})]);
 clearTimeout(timer);
 await nextFrame();
 root.documentElement.classList.remove(BOOTING_CLASS);
}
