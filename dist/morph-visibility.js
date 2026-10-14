// Retained sources (notably Chat cards) outlive the detail transition.
// Conceal either live endpoint without changing the geometry used by the morph.
// Opacity suppresses the whole subtree: a chat label's explicit visibility:
// visible can otherwise escape visibility: hidden on the card itself.
export function hideMorphSource(node){
 if(!node?.isConnected)return ()=>{};
 const properties=['visibility','opacity'].map(name=>({name,value:node.style[name]||'',priority:node.style.getPropertyPriority?.(name)||''}));
 for(const [name,value] of [['visibility','hidden'],['opacity','0']]){if(node.style.setProperty)node.style.setProperty(name,value,'important');else node.style[name]=value;}
 let restored=false;
 return ()=>{if(restored)return;restored=true;for(const {name,value,priority} of properties){if(node.style.setProperty){if(value)node.style.setProperty(name,value,priority);else node.style.removeProperty(name);}else node.style[name]=value;}};
}
