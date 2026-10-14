// Temporary scenes can be taller/wider than the page. Their viewport contains
// paint and fixed descendants so offscreen motion cannot extend root scrolling.
export function stageMotion(node,zIndex=20){
 const viewport=document.createElement('div');viewport.className='motion-viewport';
 viewport.style.zIndex=String(zIndex);viewport.append(node);document.body.append(viewport);
 return ()=>viewport.remove();
}
