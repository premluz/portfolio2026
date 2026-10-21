const storageKey='prem-glass-style';

export function readGlassStyle(storage){
 try{return storage?.getItem(storageKey)!=='false';}
 catch(error){console.warn('Glass style preference could not be read; using the default.',error);return true;}
}
export function applyGlassStyle(root,enabled){root.dataset.glassStyle=enabled?'on':'off';return enabled;}
export function mountGlassStyle(input,{root=document.documentElement,storage=globalThis.localStorage}={}){
 const enabled=applyGlassStyle(root,readGlassStyle(storage));
 if(!input)return enabled;
 input.checked=enabled;
 input.onchange=()=>{
  applyGlassStyle(root,input.checked);
  try{storage?.setItem(storageKey,String(input.checked));}
  catch(error){console.warn('Glass style preference could not be saved.',error);}
 };
 return enabled;
}
