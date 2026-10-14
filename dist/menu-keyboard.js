const editing=target=>['INPUT','TEXTAREA','SELECT'].includes(String(target?.tagName||'').toUpperCase())||target?.isContentEditable;
const plainKey=event=>!event.defaultPrevented&&!event.isComposing&&!event.altKey&&!event.ctrlKey&&!event.metaKey;
const initial=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').match(/\p{L}/u)?.[0]?.toLocaleLowerCase()||'';
export function handleSiteIndexShortcut(event,{canOpen=()=>true,open=()=>{}}={}){
 if(event.key!=='/'||!plainKey(event)||editing(event.target)||!canOpen())return false;
 event.preventDefault();open();return true;
}
export function menuInitialTarget(event,items,active){
 if(!plainKey(event)||editing(event.target)||!/^\p{L}$/u.test(event.key))return null;
 const letter=initial(event.key),matches=items.filter(item=>initial(item.querySelector?.('.project-menu-title')?.textContent||item.getAttribute?.('aria-label'))===letter);
 if(!matches.length)return null;
 // Repeated letters cycle titles with the same initial, in displayed order.
 return matches[(matches.indexOf(active)+1)%matches.length];
}
