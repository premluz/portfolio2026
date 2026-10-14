const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function magneticHoverTarget(pointerY,rows){
 if(!rows.length)return {y:pointerY,height:36,index:-1,snapped:false};
 let index=0,distance=Infinity;
 for(let i=0;i<rows.length;i++){
  const next=Math.abs(pointerY-(rows[i].top+rows[i].height/2));
  if(next<distance){distance=next;index=i;}
 }
 const row=rows[index];
 return {y:row.top+row.height/2,height:row.height,index,snapped:true};
}

export function installProjectMenuHover(root,{reduced=()=>false,onHover=()=>{},onLeave=()=>{}}={}){
 let pointerY=null,hoverState=null;
 const update=event=>{
  if(event.pointerType==='touch')return;
  if(event.target?.closest?.('.project-menu-actions')){leave();return;}
  const bounds=root.getBoundingClientRect(),scrollTop=root.scrollTop||0;
  pointerY=event.clientY-bounds.top+scrollTop;
  const rows=[...(root.querySelectorAll?.('[data-project-menu-item]')||[])].map(node=>{
   const rect=node.getBoundingClientRect();
   return {node,top:rect.top-bounds.top+scrollTop,height:rect.height};
  }).filter(row=>row.height>0);
  const field=magneticHoverTarget(pointerY,rows),top=clamp(field.y-field.height/2,0,Math.max(0,root.scrollHeight-field.height));
  const row=rows[field.index]?.node,motion=reduced()?'none':field.snapped?'snap':'follow';
  if(hoverState?.row===row&&hoverState.top===top&&hoverState.height===field.height&&hoverState.motion===motion)return;
  hoverState={row,top,height:field.height,motion};
  root.style?.setProperty?.('--project-menu-hover-y',`${top.toFixed(2)}px`);
  root.style?.setProperty?.('--project-menu-hover-height',`${field.height.toFixed(2)}px`);
  root.dataset.cursorTracking='true';
  root.dataset.cursorSnap=field.snapped?'true':'false';
  root.dataset.cursorMotion=motion;
  if(row)onHover(row);
 };
 const clearPointer=()=>{pointerY=null;hoverState=null;delete root.dataset.cursorTracking;delete root.dataset.cursorSnap;delete root.dataset.cursorMotion;};
 const leave=()=>{onLeave();clearPointer();};
 const scroll=()=>{
  if(pointerY===null)return;
  const bounds=root.getBoundingClientRect();
  update({pointerType:'mouse',clientY:bounds.top+pointerY-(root.scrollTop||0)});
 };
 root.addEventListener('pointermove',update,{passive:true});
 root.addEventListener('pointerleave',leave);
 root.addEventListener('keydown',clearPointer);
 root.addEventListener('scroll',scroll,{passive:true});
 return ()=>{
  root.removeEventListener('pointermove',update);root.removeEventListener('pointerleave',leave);
  root.removeEventListener('keydown',clearPointer);root.removeEventListener('scroll',scroll);
  leave();root.style?.removeProperty?.('--project-menu-hover-y');root.style?.removeProperty?.('--project-menu-hover-height');
 };
}
