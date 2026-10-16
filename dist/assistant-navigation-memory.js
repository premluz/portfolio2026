/** Remembers Chat's entry route and lets one Back return to Chat after leaving it. */
export class AssistantNavigationMemory {
 constructor(){this.origin='work';this.returnToChat=false;this.preserveOrigin=false;this.suppressNextReturn=false;}
 beforeNavigate(from,to){
  // Project cards have their own source memory. Returning through that route
  // should consume the same Chat return step as the generic Back command.
  const returningToChat=to==='assistant'&&(this.preserveOrigin||this.returnToChat);
  if(to==='assistant'){
   if(!returningToChat)this.origin=from||'work';
   this.returnToChat=false;this.preserveOrigin=false;
  }else if(from==='assistant'){
   if(!this.suppressNextReturn)this.returnToChat=true;
   this.suppressNextReturn=false;
  }
  return {returningToChat};
 }
 backTarget(current){
  if(current==='assistant'){this.returnToChat=false;this.suppressNextReturn=true;return this.origin||'work';}
  if(this.returnToChat){this.preserveOrigin=true;return 'assistant';}
  return null;
 }
 prepareHomeNavigation(){this.returnToChat=false;this.preserveOrigin=false;this.suppressNextReturn=true;}
 reverseToChat(){this.returnToChat=false;this.suppressNextReturn=false;}
}
