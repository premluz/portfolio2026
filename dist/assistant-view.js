import {card} from './card-renderer.js';
import {streamText} from './assistant-text-stream.js';
import {assistantKnowledge} from './assistant-knowledge.js';
import {renderSuggestionChips} from './suggestion-chips.js';
import {resolvedAnswer} from './assistant-answer.js';
import {chatEndScrollTarget} from './composer-viewport.js';

function answerCards(r,answer,animate){
 const list=document.createElement('div');list.className='ask-cards';
 for(const [index,projected] of answer.cards.entries()){
  list.insertAdjacentHTML('beforeend',card(projected,index,'regular',{link:true}));const item=list.lastElementChild;
  if(animate&&!r.options.reducedMotion()){item.classList.add('ask-card-enter');item.style.setProperty('--ask-card-index',String(index));item.addEventListener('animationend',()=>{item.classList.remove('ask-card-enter');item.style.removeProperty('--ask-card-index');},{once:true});}
  item.addEventListener('click',event=>{event.preventDefault();r.options.onOpenProject(item.dataset.contentCard,item);});
 }
 return list;
}
function answerSources(answer){
 const linked=answer.sources?.filter(source=>!answer.cards?.some(project=>project.documentId===source.documentId))||[];
 const refs=document.createElement('div');refs.className='ask-sources';
 if(linked.length)refs.append('Source · ');
 for(const source of linked){if(source.route){const link=document.createElement('a');link.href=source.route;link.textContent=source.title;refs.append(link);}else refs.append(source.title);}
 return refs;
}
function answerSpeech(r,answer,lead,auto){
 if(!answer.speechToken)return;
 const button=document.createElement('button');button.type='button';button.className='ask-speech-button';button.dataset.speechState='idle';button.setAttribute('aria-label','Read answer aloud');
 button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4ZM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></svg><span class="ask-speech-label" aria-hidden="true">Listen</span>';
 // The token authorizes the short spoken line; older saved answers without one were authorized for their text.
 const play=()=>{if(r.voiceMode&&r.soundEnabled)void r.speech.play({text:answer.spoken||answer.text,speechToken:answer.speechToken,sessionId:r.sessionId()},button);};
 button.onclick=play;lead.prepend(button);if(auto)requestAnimationFrame(()=>{if(!r.page.hidden)play();});
}
export function addAssistantAnswer(r,answer,{auto=false,animateCards=false}={}){
 const group=document.createElement('div');group.className='ask-response';const lead=document.createElement('div');lead.className='ask-response-lead';
 const p=document.createElement('p'),text=answer.text||'';p.setAttribute('aria-label',text);lead.append(p);
 let finish;finish=streamText(p,text,{reduced:r.options.reducedMotion()||!animateCards,onComplete:()=>r.textStreams.delete(finish)});
 if(animateCards&&!r.options.reducedMotion())r.textStreams.add(finish);
 answerSpeech(r,answer,lead,auto);group.append(lead);
 if(answer.notice){const notice=document.createElement('p');notice.className='ask-sources ask-service-notice';notice.setAttribute('role','status');notice.textContent=answer.notice;group.append(notice);}
 if(answer.cards?.length)group.append(answerCards(r,answer,animateCards));
 const refs=answerSources(answer);if(refs.childNodes.length)group.append(refs);
 r.messages.append(group);if(answer.cards?.length)r.options.onCardsAdded(group.querySelectorAll('.ask-cards .project-card'));
 r.showSuggestions(answer.suggestions?.length?answer.suggestions:assistantKnowledge.suggestedQuestions);r.scrollEnd();
}
export function mountAssistantView(r){
 r.scrollEnd=({instant=false}={})=>{if(!r.page.hidden)requestAnimationFrame(()=>{
  const last=r.messages.lastElementChild;if(r.page.hidden||!last)return;const viewport=globalThis.visualViewport;
  const top=chatEndScrollTarget(last.getBoundingClientRect(),r.dock.getBoundingClientRect(),{scroll:scrollY,visibleBottom:viewport?viewport.offsetTop+viewport.height:innerHeight});
  window.scrollTo({top,behavior:instant||r.options.reducedMotion()?'instant':'smooth'});
 });};
 r.append=(role,text)=>{const p=document.createElement('p');p.className='ask-message ask-'+role;p.textContent=text;r.messages.append(p);r.scrollEnd();return p;};
 r.suggestionsEl=document.createElement('div');r.showSuggestions=prompts=>{renderSuggestionChips(r.suggestionsEl,prompts,{onSelect:prompt=>{r.input.value=prompt;r.sync();r.form.requestSubmit();}});r.messages.append(r.suggestionsEl);};
 r.addAnswer=(answer,options)=>addAssistantAnswer(r,answer,options);
 for(const entry of r.transcript){if(entry.role==='user')r.append('user',entry.text);else r.addAnswer({...resolvedAnswer(r.store,entry.text,entry.documentIds,entry.knowledgeSourceIds,entry.suggestions),speechToken:entry.speechToken,spoken:entry.spoken,notice:entry.notice});}
 if(!r.transcript.length)r.showSuggestions(assistantKnowledge.suggestedQuestions);
}
