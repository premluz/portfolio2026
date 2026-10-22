import {activeContentSet} from './content/local.js';

// The dev panel's content set picker. It saves to the server, so the choice applies to every visitor;
// the page reloads afterwards because content is loaded once, before the first render.
export async function mountContentSetControl(select,status,{fetch:fetcher=globalThis.fetch,reload=()=>location.reload()}={}){
 if(!select)return;
 const say=text=>{if(status)status.textContent=text;};
 let config;
 try{
  const response=await fetcher('/api/site-config',{headers:{accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw new Error(`Site config responded ${response.status}`);
  config=await response.json();
 }catch(error){
  console.error('Content set picker could not load the site config.',error);
  select.disabled=true;say('Content sets unavailable: the site config API did not answer.');return;
 }
 select.replaceChildren(...config.contentSets.map(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;return option;}));
 select.value=config.contentSet;
 if(config.contentSet!==activeContentSet)say(`Saved: ${config.contentSet}. This page shows ${activeContentSet}; reload to update.`);
 if(!config.writable){select.disabled=true;say('Read-only: saving needs Global Config on the server.');return;}
 select.onchange=async()=>{
  const next=select.value;select.disabled=true;say(`Saving ${next}…`);
  try{
   const response=await fetcher('/api/site-config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contentSet:next})});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body.message||body.error||`Site config responded ${response.status}`);
   say(`Live: ${next}. Reloading…`);reload();
  }catch(error){
   console.error('Saving the content set failed.',error);
   select.value=config.contentSet;select.disabled=false;say(`Not saved: ${error.message}`);
  }
 };
}
