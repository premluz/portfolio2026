import {answerPublishedQuestion,resolvedAnswer,knowledgeById} from './assistant-answer.js';
import {DraftDictation} from './draft-dictation.js';
import {mountDictationWaveform} from './dictation-waveform.js';
import {mountComposerViewport,chatEndScrollTarget} from './composer-viewport.js';
import {syncComposerAction,syncComposerMic} from './composer-controls.js';
import {setIconSwitchState} from './icon-switch.js';
import {mountThinkingIndicator,playSendWave} from './iconiq-chat-effects.js';
import {content} from './content/local.js';
import {card} from './card-renderer.js';
import {assistantKnowledge,findCuratedAnswer,suggestionsFor} from './assistant-knowledge.js';
import {AssistantSpeech} from './assistant-speech.js';
import {streamText} from './assistant-text-stream.js';
import {renderSuggestionChips} from './suggestion-chips.js';
import {ComposerSuggestions} from './composer-suggestions.js';

const cap=20;
export const answerPortfolioQuestion=(question,{store=content,history=[]}={})=>answerPublishedQuestion(question,{store,history});

export function readSessionTranscript(storage,store=content){
 let entries=[];try{entries=JSON.parse(storage?.getItem('prem-ask-transcript')||'[]');}catch{}
 if(!Array.isArray(entries))return [];
 return entries.slice(-40).filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.text==='string')
  .map(item=>({role:item.role,text:item.text.slice(0,item.role==='user'?240:1200),
   documentIds:[...new Set(Array.isArray(item.documentIds)?item.documentIds:[])].filter(id=>typeof id==='string'&&store.get(id)).slice(0,5),
   knowledgeSourceIds:[...new Set(Array.isArray(item.knowledgeSourceIds)?item.knowledgeSourceIds:[])].filter(id=>knowledgeById.has(id)).slice(0,3),
   suggestions:(Array.isArray(item.suggestions)?item.suggestions:[]).filter(value=>typeof value==='string').map(value=>value.slice(0,100)).slice(0,3),
   speechToken:typeof item.speechToken==='string'&&/^\d{10}\.[A-Za-z0-9_-]{43}$/.test(item.speechToken)?item.speechToken:null}));
}

export function setAssistantComposerAvailability(form,active){
 form.inert=!active;form.setAttribute('aria-hidden',String(!active));
}

export function syncAssistantComposer(input,send,{pending=false,count=0,limit=20}={}){
 syncComposerAction(input,send,{pending,count,limit,voice:send.dataset.voiceEnabled==='true'});
}

export function mountPortfolioAssistant(root,{store=content,limit=cap,onOpen=()=>{},onOpenProject=()=>{},onCardsAdded=()=>{},onVoiceToggle=()=>{},onDictationStart=()=>{},onDictationEnd=()=>{},onInputError=()=>{},reducedMotion=()=>false,onSpeechStart=()=>{},onSpeechEnd=()=>{},onSoundChange=()=>{},onStatus=()=>{},onComposerFocus=()=>Promise.resolve()}={}){
 const toggle=root.querySelector('#askToggle'),page=root.querySelector('#askPage'),form=root.querySelector('#askForm'),input=root.querySelector('#askInput'),messages=root.querySelector('#askMessages'),send=form.querySelector('#assistantAction'),dock=root.querySelector('#dock');
 let storage;try{storage=sessionStorage;}catch{}
 let preferences;try{preferences=localStorage;}catch{}
 const textStreams=new Set();
 let transcript=readSessionTranscript(storage,store),count=0,pending=false;
 let voiceMode=false,soundEnabled=false;try{soundEnabled=preferences?.getItem('prem-assistant-sound')==='true';}catch{}
 const soundToggle=root.querySelector('#soundPreference');
 const speechStatus=document.createElement('span');speechStatus.className='sr';speechStatus.setAttribute('role','status');page.append(speechStatus);
 const speech=new AssistantSpeech({onStart:onSpeechStart,onEnd:onSpeechEnd,onState:(state,button)=>{
  send.dataset.responseActive=String(speech.active);sync();
  if(button){const icon=button.querySelector('svg');if(icon)icon.innerHTML=['playing','loading'].includes(state)?'<rect x="7" y="7" width="10" height="10" rx="1"/>':'<path d="M4 9v6h4l5 4V5L8 9H4ZM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>';button.dataset.speechState=state;button.setAttribute('aria-label',['playing','loading'].includes(state)?'Stop response':state==='blocked'?'Tap to play spoken answer':state==='error'?'Voice unavailable. Try again.':'Read answer aloud');const label=button.querySelector('.ask-speech-label');if(label)label.textContent=['playing','loading'].includes(state)?'Stop':state==='blocked'?'Tap to play':state==='error'?'Retry voice':'Listen';}
  onStatus('answer',state==='loading'?'Preparing voice…':state==='playing'?'Speaking…':state==='blocked'?'Tap Listen to play this answer':state==='error'?'Voice unavailable. Try Listen again.':'',{tone:['error','blocked'].includes(state)?'error':'neutral'});
  speechStatus.textContent=state==='error'?'Voice is unavailable right now. Try the Listen button again.':state==='blocked'?'Tap Listen beside the answer to play it.':state==='playing'?'Reading answer aloud.':'';
 }});
 const syncSound=()=>{soundToggle.setAttribute('aria-checked',String(soundEnabled));setIconSwitchState(soundToggle,soundEnabled?'on':'off');};
 const setSound=(on,announce=true)=>{soundEnabled=on;try{preferences?.setItem('prem-assistant-sound',String(on));}catch{}if(!on){speech.stop();onStatus('answer','');}syncSound();if(on)speechStatus.textContent='New answers will be read aloud.';if(announce)onSoundChange(on);};
 soundToggle.onclick=()=>setSound(!soundEnabled);
 const sessionId=()=>storage?.getItem('prem-ask-session')||(()=>{const value=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;try{storage?.setItem('prem-ask-session',value);}catch{}return value;})();
 try{count=Math.max(0,Math.min(limit,Number(storage?.getItem('prem-ask-count'))||0));}catch{}
 const persist=entry=>{transcript.push(entry);transcript=transcript.slice(-40);try{storage?.setItem('prem-ask-transcript',JSON.stringify(transcript));}catch{}};
 const microphone=root.querySelector('#assistantMic'),waveform=form.querySelector('.dictation-waveform'),wave=mountDictationWaveform(waveform);
 const dictationStatus=document.createElement('span');dictationStatus.className='sr';dictationStatus.setAttribute('role','status');form.append(dictationStatus);
 const sync=()=>{syncAssistantComposer(input,send,{pending,count,limit});syncComposerMic(microphone,dictation.active,{disabled:input.disabled});};
 const dictation=new DraftDictation({getDraft:()=>input.value,setDraft:value=>{input.value=value.slice(0,240);sync();},onStart:()=>{speech.stop();hideComposerSuggestions();onDictationStart();},onEnd:onDictationEnd,onError:message=>{dictationStatus.textContent=message;onInputError(message);},onState:phase=>{onStatus('dictation',phase==='starting'?'Starting dictation…':phase==='finishing'?'Finishing dictation…':phase==='idle'?'':'Dictating…');const active=phase!=='idle';form.classList.toggle('is-dictating',active);waveform.hidden=!active;input.readOnly=active;sync();if(phase==='starting')dictationStatus.textContent='Starting dictation.';if(phase==='listening')dictationStatus.textContent='Listening. Press the microphone to stop.';if(phase==='idle'){dictationStatus.textContent='Dictation stopped. Edit or send your draft.';if(!form.inert)input.focus({preventScroll:true});}},onLevel:level=>wave.setLevel(level)});
 // Clip only the animated aura to the viewport; it must never grow the page's scroll extent.
 const aura=document.createElement('div');aura.className='composer-aura-viewport';aura.setAttribute('aria-hidden','true');aura.innerHTML='<div class="composer-aura-light"></div>';dock.prepend(aura);
 const scrollEnd=({instant=false}={})=>{if(!page.hidden)requestAnimationFrame(()=>{const last=messages.lastElementChild;if(page.hidden||!last)return;const viewport=globalThis.visualViewport,top=chatEndScrollTarget(last.getBoundingClientRect(),dock.getBoundingClientRect(),{scroll:scrollY,visibleBottom:viewport?viewport.offsetTop+viewport.height:innerHeight});window.scrollTo({top,behavior:instant||reducedMotion()?'instant':'smooth'});});};
 const composerViewport=mountComposerViewport({input,onSettled:()=>scrollEnd({instant:true})});
 const append=(role,text)=>{const p=document.createElement('p');p.className='ask-message ask-'+role;p.textContent=text;messages.append(p);scrollEnd();return p;};
 const suggestionsEl=document.createElement('div');
 const showSuggestions=prompts=>{renderSuggestionChips(suggestionsEl,prompts,{onSelect:prompt=>{input.value=prompt;sync();form.requestSubmit();}});messages.append(suggestionsEl);};
 const composerSuggestions=document.createElement('div');composerSuggestions.className='composer-suggestions';composerSuggestions.hidden=true;dock.append(composerSuggestions);
 const suggestionMotion=new ComposerSuggestions(composerSuggestions,{reduced:reducedMotion});
 let suggestionHideTimer=0,suggestionEpoch=0,openingChat=false;
 const hideComposerSuggestions=async({release=false,immediate=false}={})=>{clearTimeout(suggestionHideTimer);suggestionHideTimer=0;const epoch=++suggestionEpoch;await suggestionMotion.setVisible(false,{immediate});if(release&&epoch===suggestionEpoch)await onComposerFocus(false);};
 const currentSuggestions=()=>{for(let index=transcript.length-1;index>=0;index--){const entry=transcript[index];if(entry.role==='assistant'&&entry.suggestions?.length)return entry.suggestions;}return assistantKnowledge.suggestedQuestions;};
 const showComposerSuggestions=async()=>{
  clearTimeout(suggestionHideTimer);const epoch=++suggestionEpoch,ready=onComposerFocus(true);
  if(!page.hidden||form.inert||!dock.classList.contains('is-composer')||input.value.trim()){hideComposerSuggestions();return;}
  await ready;if(epoch!==suggestionEpoch||document.activeElement!==input)return;
  if(composerSuggestions.hidden)renderSuggestionChips(composerSuggestions,currentSuggestions(),{leadingAction:{label:'View chat',onSelect:()=>{hideComposerSuggestions();onOpen();}},onSelect:prompt=>{input.value=prompt;sync();form.requestSubmit();}});
  await suggestionMotion.setVisible(true);
 };
 input.addEventListener('focus',showComposerSuggestions);
 input.addEventListener('input',()=>{sync();input.value.trim()?hideComposerSuggestions():showComposerSuggestions();});
 input.addEventListener('blur',()=>{clearTimeout(suggestionHideTimer);suggestionHideTimer=setTimeout(()=>{if(document.activeElement!==input&&!composerSuggestions.contains(document.activeElement))hideComposerSuggestions({release:true});},140);});
 composerSuggestions.addEventListener('focusout',()=>{clearTimeout(suggestionHideTimer);suggestionHideTimer=setTimeout(()=>{if(document.activeElement!==input&&!composerSuggestions.contains(document.activeElement))hideComposerSuggestions({release:true});},140);});
 const addAnswer=(answer,{auto=false,spoken=false,animateCards=false}={})=>{
  const group=document.createElement('div');group.className='ask-response';const lead=document.createElement('div');lead.className='ask-response-lead';const p=document.createElement('p'),answerText=answer.text||'';p.setAttribute('aria-label',answerText);p.textContent='';lead.append(p);let finish;finish=streamText(p,answerText,{reduced:reducedMotion()||!animateCards,onComplete:()=>textStreams.delete(finish)});if(animateCards&&!reducedMotion())textStreams.add(finish);
  if(answer.speechToken){const button=document.createElement('button');button.type='button';button.className='ask-speech-button';button.dataset.speechState='idle';button.setAttribute('aria-label','Read answer aloud');button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4ZM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></svg><span class="ask-speech-label" aria-hidden="true">Listen</span>';const spokenAnswer={text:answer.text,speechToken:answer.speechToken};button.onclick=()=>{if(voiceMode&&soundEnabled)void speech.play({...spokenAnswer,sessionId:sessionId()},button);};lead.prepend(button);if(auto)requestAnimationFrame(()=>{if(!page.hidden&&voiceMode&&soundEnabled)speech.play({...spokenAnswer,sessionId:sessionId()},button);});}
  group.append(lead);
  if(answer.cards?.length){const list=document.createElement('div');list.className='ask-cards';for(const [index,projected] of answer.cards.entries()){list.insertAdjacentHTML('beforeend',card(projected,index,'regular',{link:true}));const item=list.lastElementChild;if(animateCards&&!reducedMotion()){item.classList.add('ask-card-enter');item.style.setProperty('--ask-card-index',String(index));item.addEventListener('animationend',()=>{item.classList.remove('ask-card-enter');item.style.removeProperty('--ask-card-index');},{once:true});}item.addEventListener('click',event=>{event.preventDefault();onOpenProject(item.dataset.contentCard,item);});}group.append(list);}
  const linked=answer.sources?.filter(source=>!answer.cards?.some(projected=>projected.documentId===source.documentId))||[];
  if(linked.length){const refs=document.createElement('div');refs.className='ask-sources';refs.append('Source · ');for(const source of linked){if(source.route){const link=document.createElement('a');link.href=source.route;link.textContent=source.title;refs.append(link);}else refs.append(source.title);}group.append(refs);}
  messages.append(group);if(answer.cards?.length)onCardsAdded(group.querySelectorAll('.ask-cards .project-card'));showSuggestions(answer.suggestions?.length?answer.suggestions:assistantKnowledge.suggestedQuestions);scrollEnd();
 };
 for(const entry of transcript){
  if(entry.role==='user')append('user',entry.text);
  else addAnswer({...resolvedAnswer(store,entry.text,entry.documentIds,entry.knowledgeSourceIds,entry.suggestions),speechToken:entry.speechToken});
 }
 if(!transcript.length)showSuggestions(assistantKnowledge.suggestedQuestions);
 const askModel=async(question,history)=>{
  try{
   const response=await fetch('/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,sessionId:sessionId(),history}),signal:AbortSignal.timeout(18000)});
   const result=await response.json();
   if(typeof result.text!=='string'||!Array.isArray(result.documentIds))return answerPortfolioQuestion(question,{store,history});
   const documentIds=[...new Set(result.documentIds)].filter(id=>store.get(id));
   const knowledgeSourceIds=(Array.isArray(result.knowledgeSources)?result.knowledgeSources:[]).map(source=>source?.id).filter(id=>knowledgeById.has(id));
   return {...resolvedAnswer(store,result.text,documentIds,knowledgeSourceIds,Array.isArray(result.suggestions)?result.suggestions:suggestionsFor(documentIds)),speechToken:typeof result.speechToken==='string'?result.speechToken:null,responseMode:result.responseMode||'model'};
  }catch{return answerPortfolioQuestion(question,{store,history});}
 };
 toggle.addEventListener('click',onOpen);
 const submitQuestion=async(value,{spoken=false}={})=>{
  const question=value.trim();if(!question||pending||count>=limit)return {ok:false,message:'Finish the current question first.'};
  const readAloud=voiceMode&&soundEnabled;
  speech.stop();onStatus('answer','');hideComposerSuggestions();
  input.value='';page.classList.remove('assistant-empty');count++;try{storage?.setItem('prem-ask-count',String(count));}catch{}
  persist({role:'user',text:question,documentIds:[]});suggestionsEl.remove();append('user',question);
  pending=true;sync();dock.classList.add('assistant-working');page.setAttribute('aria-busy','true');
  playSendWave(form,{reduced:reducedMotion()});
  const waiting=append('status','');mountThinkingIndicator(waiting,{reduced:reducedMotion()});
  try{
   const history=transcript.slice(0,-1).slice(-4).map(({role,text,documentIds})=>({role,text:text.slice(0,400),documentIds:role==='assistant'&&Array.isArray(documentIds)?documentIds.filter(id=>typeof id==='string').slice(0,6):[]}));
   const answer=await askModel(question,history);waiting.remove();if(readAloud&&!answer.speechToken)onInputError('Showing a text answer. Voice could not connect.');addAnswer(answer,{auto:readAloud,spoken,animateCards:true});
   const documentIds=[...new Set([...(answer.cards||[]).map(item=>item.documentId),...(answer.sources||[]).map(item=>item.documentId)])].filter(id=>typeof id==='string'&&store.get(id));
   const knowledgeSourceIds=(answer.sources||[]).map(source=>source.documentId).filter(id=>knowledgeById.has(id));
   persist({role:'assistant',text:answer.text||'',documentIds,knowledgeSourceIds,suggestions:answer.suggestions||[],speechToken:answer.speechToken||null});
  }catch{waiting.remove();const text='I couldn’t check the portfolio just now. Please try another question.';append('assistant',text);persist({role:'assistant',text,documentIds:[]});}
  finally{pending=false;sync();dock.classList.remove('assistant-working');page.removeAttribute('aria-busy');}
  return {ok:true,message:'Answered'};
 };
 const submitFromComposer=async value=>{
  const question=value.trim();if(!question||pending||count>=limit)return {ok:false,message:'Finish the current question first.'};
  if(page.hidden){if(openingChat)return {ok:false,message:'Opening the assistant.'};openingChat=true;hideComposerSuggestions();try{const opened=await onOpen();if(opened?.ok===false)return opened;}finally{openingChat=false;}}
  return submitQuestion(question);
 };
 form.addEventListener('submit',event=>{event.preventDefault();void (async()=>{await dictation.stop();return submitFromComposer(input.value);})();});
 microphone.onclick=()=>{if(dictation.active)void dictation.stop();else if(!input.disabled)dictation.start();};
 send.onclick=event=>{if(send.dataset.mode==='stop'){event.preventDefault();speech.stop();return;}if(send.dataset.mode==='voice'){event.preventDefault();dictation.cancel();onVoiceToggle();}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){speech.stop();dictation.cancel();}});
 addEventListener('pagehide',()=>{speech.stop();dictation.cancel();});
 sync();syncSound();page.classList.toggle('assistant-empty',!transcript.length);page.dataset.voiceMode='false';
 return {get soundEnabled(){return soundEnabled;},setSoundEnabled:on=>setSound(Boolean(on)),submitQuestion,dismissSuggestions:()=>hideComposerSuggestions({release:true}),prepareNavigation:()=>composerViewport.prepareNavigation(),prepareVoice:()=>speech.prime(),stopResponse:()=>speech.stop(),setVoiceMode(on){voiceMode=Boolean(on);page.dataset.voiceMode=String(voiceMode);if(voiceMode)setSound(true,false);else{speech.stop();onStatus('answer','');}},stopDictation:()=>dictation.cancel(),get dictating(){return dictation.active;},get active(){return !page.hidden;},setComposerAvailable(active){setAssistantComposerAvailability(form,active);if(!active){hideComposerSuggestions({release:true,immediate:true});dictation.cancel();}},setComposerGlowEnabled(enabled){dock.classList.toggle('composer-glow-hidden',!enabled);},setActive(active,{focus=false,scroll=true}={}){
  hideComposerSuggestions({release:true,immediate:true});
  page.hidden=!active;toggle.setAttribute('aria-pressed',String(active));
  if(!active){speech.stop();for(const finish of [...textStreams])finish();textStreams.clear();}
  if(active){if(scroll)scrollEnd();if(focus&&!input.disabled)requestAnimationFrame(()=>input.focus({preventScroll:true}));}
 }};
}
