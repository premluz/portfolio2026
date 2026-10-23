const storageKeys={enabled:'prem-simple-transitions',skipExit:'prem-simple-transitions-skip-exit'};

function readFlag(storage,key){
 try{return storage?.getItem(key)==='true';}
 catch(error){console.warn(`Preference ${key} could not be read; using the default.`,error);return false;}
}
export const readSimpleTransitions=storage=>readFlag(storage,storageKeys.enabled);
export const readSkipExit=storage=>readFlag(storage,storageKeys.skipExit);

function mountFlag(input,state,name,storage){
 if(!input)return;
 input.checked=state[name];
 input.onchange=()=>{
  state[name]=input.checked;
  try{storage?.setItem(storageKeys[name],String(state[name]));}
  catch(error){console.warn(`Preference ${storageKeys[name]} could not be saved.`,error);}
 };
}
// One setting for every page change: the current page fades out in place and the next fades in rising.
// skipExit drops the fade out, so the new page appears at once and only fades in.
export function mountSimpleTransitions({enabled,skipExit}={},{storage=globalThis.localStorage}={}){
 const state={enabled:readSimpleTransitions(storage),skipExit:readSkipExit(storage)};
 mountFlag(enabled,state,'enabled',storage);mountFlag(skipExit,state,'skipExit',storage);
 return state;
}
