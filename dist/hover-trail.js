// Latch even a very brief pass for a few frames, then let CSS fade it out.
// Delegation supports regenerated project rows without per-item listeners.
export function installHoverTrail(root,{reduced=()=>false,hold=32}={}){
 const pending=new Map(),lit=new Set();
 const item=target=>{const node=target?.closest?.('button, a[data-nav]');return node&&root.contains(node)?node:null;};
 const enter=e=>{
  if(e.pointerType==='touch')return;
  const node=item(e.target);if(!node||node.contains(e.relatedTarget))return;
  clearTimeout(pending.get(node));pending.delete(node);lit.add(node);node.classList.add('hover-trail');
 };
 const leave=e=>{
  const node=item(e.target);if(!node||node.contains(e.relatedTarget))return;
  clearTimeout(pending.get(node));
  const clear=()=>{node.classList.remove('hover-trail');pending.delete(node);lit.delete(node);};
  if(reduced())clear();else pending.set(node,setTimeout(clear,hold));
 };
 root.addEventListener('pointerover',enter);root.addEventListener('pointerout',leave);
 return ()=>{root.removeEventListener('pointerover',enter);root.removeEventListener('pointerout',leave);for(const timer of pending.values())clearTimeout(timer);for(const node of lit)node.classList.remove('hover-trail');pending.clear();lit.clear();};
}
