/** Shared, accessible suggested-question chips for the assistant and dock composer. */
export function renderSuggestionChips(container,prompts,{onSelect=()=>{},label='Suggested questions',leadingAction=null}={}){
 container.replaceChildren();
 container.classList.add('ask-suggestions');
 container.setAttribute('role','group');
 container.setAttribute('aria-label',label);
 const questions=Array.isArray(prompts)?prompts.filter(value=>typeof value==='string'&&value.trim()).slice(0,3):[];
 const items=questions.map(prompt=>({label:prompt,select:button=>onSelect(prompt,button)}));
 if(leadingAction?.label&&typeof leadingAction.onSelect==='function')items.unshift({label:leadingAction.label,select:leadingAction.onSelect});
 items.forEach((item,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='suggestion-chip glass-surface';
  button.style.setProperty('--suggestion-index',String(index));
  button.textContent=item.label;
  button.addEventListener('click',()=>item.select(button));
  container.append(button);
 });
 return container;
}
