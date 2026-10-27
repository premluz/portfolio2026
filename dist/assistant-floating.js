// The dock's Assistant button opens the chat page, or the same conversation as a floating panel above the dock
// or a sidebar on the right (the page is pushed aside and the composer sits at the sidebar's foot), so a visitor can ask without leaving the page they are reading. Maximise moves it to the chat page.
const storageKey='prem-assistant-presentation',presentations=['page','floating','sidebar'];

export function readAssistantPresentation(storage){
 try{const value=storage?.getItem(storageKey);return presentations.includes(value)?value:'page';}
 catch(error){console.warn('Assistant presentation could not be read; opening the chat page.',error);return 'page';}
}
export function mountAssistantPresentation(select,{storage=globalThis.localStorage,onChange=()=>{}}={}){
 const state={value:readAssistantPresentation(storage)};
 if(select){
  select.value=state.value;
  select.onchange=()=>{
   state.value=presentations.includes(select.value)?select.value:'page';
   try{storage?.setItem(storageKey,state.value);}catch(error){console.warn('Assistant presentation could not be saved.',error);}
   onChange(state.value);
  };
 }
 return state;
}
// Only the panel's own presentation lives here; the app decides when the dock shows the composer.
export function setAssistantFloating(page,on,variant='panel'){
 page.classList.toggle('assistant-floating',on);page.classList.toggle('assistant-sidebar',on&&variant==='sidebar');
 if(on)page.dataset.floating='true';else delete page.dataset.floating;
 const bar=page.querySelector('.assistant-floating-bar');if(bar)bar.hidden=!on;
 page.setAttribute('aria-label',on?'Assistant':'');if(!on)page.removeAttribute('aria-label');
}
