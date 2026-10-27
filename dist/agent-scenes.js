// Hard-coded scenes: what wakes the agent and what it must not cover. A scene names its targets, the boxes the
// visitor is reading (obstacles) and the surfaces that still count as attending (holds). Spoken lines and
// pre-recorded audio become further scene fields; the engine stays the same.
export const AGENT_SCENES=Object.freeze([
 Object.freeze({
  id:'context-hover',
  selector:'[data-context-id]',
  // The popover and the sentence around its marker are being read, so the agent sits beside them.
  obstacles:(target,doc)=>[doc.getElementById('contextualPopover'),target.closest('p,li,dd,blockquote,h1,h2,h3')].filter(Boolean),
  // Moving from the marker into its popover is still attending to the same thing.
  holds:doc=>[doc.getElementById('contextualPopover')].filter(Boolean)
 })
]);

export function mountAgentScenes(engine,{doc=document,win=window,scenes=AGENT_SCENES,frame=callback=>requestAnimationFrame(callback)}={}){
 let active=null;
 const match=node=>{for(const scene of scenes){const target=node?.closest?.(scene.selector);if(target)return {scene,target};}return null;};
 const owns=(node,current)=>Boolean(node)&&[current.target,...current.scene.holds(doc)].some(owner=>owner.contains(node));
 // The popover opens on the same pointerover; a frame later its box is placed and can be avoided.
 const attend=found=>{active=found;frame(()=>{if(active===found)engine.attend(found.target,found.scene.obstacles(found.target,doc));});};
 const release=()=>{active=null;engine.release();};
 const over=event=>{if(event.pointerType==='touch')return;const found=match(event.target);if(found&&found.target!==active?.target)attend(found);};
 const out=event=>{if(active&&event.pointerType!=='touch'&&owns(event.target,active)&&!owns(event.relatedTarget,active))release();};
 const focusIn=event=>{const found=match(event.target);if(found&&found.target!==active?.target)attend(found);};
 const focusOut=event=>{if(active&&owns(event.target,active)&&!owns(event.relatedTarget,active))release();};
 // Scrolling closes the popover, so the seat beside it is stale.
 const scroll=event=>{if(active&&!(event.target?.nodeType&&owns(event.target,active)))release();};
 doc.addEventListener('pointerover',over);doc.addEventListener('pointerout',out);doc.addEventListener('focusin',focusIn);doc.addEventListener('focusout',focusOut);win.addEventListener('scroll',scroll,{capture:true,passive:true});
 return {destroy(){doc.removeEventListener('pointerover',over);doc.removeEventListener('pointerout',out);doc.removeEventListener('focusin',focusIn);doc.removeEventListener('focusout',focusOut);win.removeEventListener('scroll',scroll,{capture:true});}};
}
