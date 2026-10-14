const formControls=new Set(['INPUT','TEXTAREA','SELECT']);

export function handleProjectArrowKey(event,{canNavigate=()=>true,move=()=>{}}={}){
 if(event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey)return false;
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return false;
 const target=event.target,tag=String(target?.tagName||'').toUpperCase();
 if(formControls.has(tag)||target?.isContentEditable||!canNavigate())return false;
 event.preventDefault();move(event.key==='ArrowRight'?1:-1);return true;
}
