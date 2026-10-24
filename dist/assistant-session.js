import {assistantLimits,assistantHistory} from './assistant-limits.js';
import {requestAssistant} from './assistant-client.js';
import {knowledgeById} from './assistant-answer.js';
import {mountThinkingIndicator,playSendWave} from './iconiq-chat-effects.js';
import {acknowledgementFor,acknowledgementText} from './assistant-acknowledgements.js';

async function submitQuestion(r,value,{spoken=false}={}){
 const question=value.trim();if(!question||r.pending||r.count>=r.limit)return {ok:false,message:'Finish the current question first.'};
 if(question.length>assistantLimits.questionCharacters)return {ok:false,message:`Please keep the question or job description under ${assistantLimits.questionCharacters} characters.`};
 const readAloud=r.voiceMode&&r.soundEnabled;r.speech.stop();r.options.onStatus('answer','');r.hideComposerSuggestions();
 if(readAloud){const id=acknowledgementFor(question,r.count);r.speech.acknowledge({id,text:acknowledgementText(id),sessionId:r.sessionId()});}
 r.input.value='';r.page.classList.remove('assistant-empty');r.count++;r.save('prem-ask-count',String(r.count));
 r.persist({role:'user',text:question,documentIds:[]});r.suggestionsEl.remove();r.append('user',question);
 r.pending=true;r.sync();r.dock.classList.add('assistant-working');r.page.setAttribute('aria-busy','true');
 playSendWave(r.form,{reduced:r.options.reducedMotion()});const waiting=r.append('status','');mountThinkingIndicator(waiting,{reduced:r.options.reducedMotion()});
 try{
  const answer=await requestAssistant(question,assistantHistory(r.transcript.slice(0,-1)),{store:r.store,sessionId:r.sessionId()});waiting.remove();
  if(answer.notice)r.options.onInputError(answer.notice);
  else if(readAloud&&!answer.speechToken)r.options.onInputError('Showing a text answer. Voice could not connect.');
  if(!readAloud||!answer.speechToken)r.speech.release();
  r.addAnswer(answer,{auto:readAloud,spoken,animateCards:true});
  const documentIds=[...new Set([...(answer.cards||[]).map(item=>item.documentId),...(answer.sources||[]).map(item=>item.documentId)])].filter(id=>typeof id==='string'&&r.store.get(id));
  const knowledgeSourceIds=(answer.sources||[]).map(source=>source.documentId).filter(id=>knowledgeById.has(id));
  r.persist({role:'assistant',text:answer.text||'',documentIds,knowledgeSourceIds,suggestions:answer.suggestions||[],speechToken:answer.speechToken||null,spoken:answer.spoken||null,requirements:answer.requirements||[],notice:answer.notice||''});
 }catch(error){waiting.remove();r.speech.release();const text='I couldn’t check the portfolio just now. Please try again.';r.options.onInputError('Assistant rendering failed: '+error.name);r.append('assistant',text);r.persist({role:'assistant',text,documentIds:[]});}
 finally{r.pending=false;r.sync();r.dock.classList.remove('assistant-working');r.page.removeAttribute('aria-busy');}
 return {ok:true,message:'Answered'};
}
export function mountAssistantSession(r){
 let opening=false;
 r.submitQuestion=(value,options)=>submitQuestion(r,value,options);
 const submitFromComposer=async value=>{
  if(!value.trim()||r.pending||r.count>=r.limit)return {ok:false,message:'Finish the current question first.'};
  if(r.page.hidden){if(opening)return {ok:false,message:'Opening the assistant.'};opening=true;r.hideComposerSuggestions();try{const opened=await r.options.onOpen();if(opened?.ok===false)return opened;}finally{opening=false;}}
  return r.submitQuestion(value);
 };
 r.toggle.addEventListener('click',r.options.onOpen);
 r.form.addEventListener('submit',event=>{event.preventDefault();void (async()=>{await r.dictation.stop();return submitFromComposer(r.input.value);})();});
 r.microphone.onclick=()=>{if(r.dictation.active)void r.dictation.stop();else if(!r.input.disabled)r.dictation.start();};
 r.send.onclick=event=>{if(r.send.dataset.mode==='stop'){event.preventDefault();r.speech.stop();return;}if(r.send.dataset.mode==='voice'){event.preventDefault();r.dictation.cancel();r.options.onVoiceToggle();}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){r.speech.stop();r.dictation.cancel();}});
 addEventListener('pagehide',()=>{r.speech.stop();r.dictation.cancel();});
}
export function assistantControls(r,setAvailability){
 return {get soundEnabled(){return r.soundEnabled;},setSoundEnabled:on=>r.setSound(Boolean(on)),submitQuestion:r.submitQuestion,
  dismissSuggestions:()=>r.hideComposerSuggestions({release:true}),prepareNavigation:()=>r.composerViewport.prepareNavigation(),prepareVoice:()=>r.speech.prime(),stopResponse:()=>r.speech.stop(),
  setVoiceMode(on){r.voiceMode=Boolean(on);r.page.dataset.voiceMode=String(r.voiceMode);if(r.voiceMode)r.setSound(true,false);else{r.speech.stop();r.options.onStatus('answer','');}},
  stopDictation:()=>r.dictation.cancel(),get dictating(){return r.dictation.active;},get active(){return !r.page.hidden;},
  setComposerAvailable(active){setAvailability(r.form,active);if(!active){r.hideComposerSuggestions({release:true,immediate:true});r.dictation.cancel();}},
  setComposerGlowEnabled(enabled){r.dock.classList.toggle('composer-glow-hidden',!enabled);},
  setActive(active,{focus=false,scroll=true}={}){
   r.hideComposerSuggestions({release:true,immediate:true});r.page.hidden=!active;r.toggle.setAttribute('aria-pressed',String(active));
   if(!active){r.speech.stop();for(const finish of [...r.textStreams])finish();r.textStreams.clear();}
   if(active){if(scroll)r.scrollEnd();if(focus&&!r.input.disabled)requestAnimationFrame(()=>r.input.focus({preventScroll:true}));}
  },
 };
}
