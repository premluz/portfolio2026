import {AssistantSpeech} from './assistant-speech.js';
import {DraftDictation} from './draft-dictation.js';
import {mountDictationWaveform} from './dictation-waveform.js';
import {mountComposerViewport} from './composer-viewport.js';
import {setIconSwitchState} from './icon-switch.js';
import {ComposerSuggestions} from './composer-suggestions.js';
import {renderSuggestionChips} from './suggestion-chips.js';
import {assistantKnowledge} from './assistant-knowledge.js';
import {assistantLimits} from './assistant-limits.js';

const statusNode=host=>{const node=document.createElement('span');node.className='sr';node.setAttribute('role','status');host.append(node);return node;};
function speechState(r,state,button){
 r.send.dataset.responseActive=String(r.speech.active);r.sync();
 if(button){
  const active=['playing','loading'].includes(state),icon=button.querySelector('svg');
  if(icon)icon.innerHTML=active?'<rect x="7" y="7" width="10" height="10" rx="1"/>':'<path d="M4 9v6h4l5 4V5L8 9H4ZM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>';
  button.dataset.speechState=state;button.setAttribute('aria-label',active?'Stop response':state==='blocked'?'Tap to play spoken answer':state==='error'?'Voice unavailable. Try again.':'Read answer aloud');
  const label=button.querySelector('.ask-speech-label');if(label)label.textContent=active?'Stop':state==='blocked'?'Tap to play':state==='error'?'Retry voice':'Listen';
 }
 r.options.onStatus('answer',state==='loading'?'Preparing voice…':state==='playing'?'Speaking…':state==='blocked'?'Tap Listen to play this answer':state==='error'?'Voice unavailable. Try Listen again.':'',{tone:['error','blocked'].includes(state)?'error':'neutral'});
 r.speechStatus.textContent=state==='error'?'Voice is unavailable right now. Try the Listen button again.':state==='blocked'?'Tap Listen beside the answer to play it.':state==='playing'?'Reading answer aloud.':'';
}
export function mountAssistantAudio(r){
 r.speechStatus=statusNode(r.page);r.speech=new AssistantSpeech({onStart:r.options.onSpeechStart,onEnd:r.options.onSpeechEnd,onState:(state,button)=>speechState(r,state,button)});
 r.soundToggle=r.root.querySelector('#soundPreference');
 r.setSound=(on,announce=true)=>{
  r.soundEnabled=on;try{r.preferences?.setItem('prem-assistant-sound',String(on));}catch(error){r.options.onInputError('Sound preference could not be saved: '+error.name);}
  if(!on){r.speech.stop();r.options.onStatus('answer','');}
  r.soundToggle.setAttribute('aria-checked',String(on));setIconSwitchState(r.soundToggle,on?'on':'off');
  if(on)r.speechStatus.textContent='New answers will be read aloud.';if(announce)r.options.onSoundChange(on);
 };
 r.soundToggle.onclick=()=>r.setSound(!r.soundEnabled);
 r.soundToggle.setAttribute('aria-checked',String(r.soundEnabled));setIconSwitchState(r.soundToggle,r.soundEnabled?'on':'off');
}
function dictationState(r,phase){
 r.options.onStatus('dictation',phase==='starting'?'Starting dictation…':phase==='finishing'?'Finishing dictation…':phase==='idle'?'':'Dictating…');
 const active=phase!=='idle';r.form.classList.toggle('is-dictating',active);r.waveform.hidden=!active;r.input.readOnly=active;r.sync();
 if(phase==='starting')r.dictationStatus.textContent='Starting dictation.';
 if(phase==='listening')r.dictationStatus.textContent='Listening. Press the microphone to stop.';
 if(phase==='idle'){r.dictationStatus.textContent='Dictation stopped. Edit or send your draft.';if(!r.form.inert)r.input.focus({preventScroll:true});}
}
export function mountAssistantDictation(r){
 r.microphone=r.root.querySelector('#assistantMic');r.waveform=r.form.querySelector('.dictation-waveform');r.wave=mountDictationWaveform(r.waveform);r.dictationStatus=statusNode(r.form);
 r.dictation=new DraftDictation({getDraft:()=>r.input.value,setDraft:value=>{r.input.value=value.slice(0,assistantLimits.questionCharacters);r.sync();},
  onStart:()=>{r.speech.stop();r.hideComposerSuggestions();r.options.onDictationStart();},onEnd:r.options.onDictationEnd,
  onError:message=>{r.dictationStatus.textContent=message;r.options.onInputError(message);},onState:phase=>dictationState(r,phase),onLevel:level=>r.wave.setLevel(level)});
 const aura=document.createElement('div');aura.className='composer-aura-viewport';aura.setAttribute('aria-hidden','true');aura.innerHTML='<div class="composer-aura-light"></div>';r.dock.prepend(aura);
 r.composerViewport=mountComposerViewport({input:r.input,onSettled:()=>r.scrollEnd({instant:true})});
}
export function mountAssistantSuggestions(r){
 const panel=document.createElement('div');panel.className='composer-suggestions';panel.hidden=true;r.dock.append(panel);
 const motion=new ComposerSuggestions(panel,{reduced:r.options.reducedMotion});let timer=0,epoch=0;
 r.hideComposerSuggestions=async({release=false,immediate=false}={})=>{clearTimeout(timer);const token=++epoch;await motion.setVisible(false,{immediate});if(release&&token===epoch)await r.options.onComposerFocus(false);};
 const current=()=>r.transcript.findLast(entry=>entry.role==='assistant'&&entry.suggestions?.length)?.suggestions||assistantKnowledge.suggestedQuestions;
 const show=async()=>{
  clearTimeout(timer);const token=++epoch,ready=r.options.onComposerFocus(true);
  if(!r.page.hidden||r.form.inert||!r.dock.classList.contains('is-composer')||r.input.value.trim()){r.hideComposerSuggestions();return;}
  await ready;if(token!==epoch||document.activeElement!==r.input)return;
  if(panel.hidden)renderSuggestionChips(panel,current(),{leadingAction:{label:'View chat',onSelect:()=>{r.hideComposerSuggestions();r.options.onOpen();}},onSelect:prompt=>{r.input.value=prompt;r.sync();r.form.requestSubmit();}});
  await motion.setVisible(true);
 };
 const blur=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(document.activeElement!==r.input&&!panel.contains(document.activeElement))r.hideComposerSuggestions({release:true});},140);};
 r.input.addEventListener('focus',show);r.input.addEventListener('input',()=>{r.sync();r.input.value.trim()?r.hideComposerSuggestions():show();});r.input.addEventListener('blur',blur);panel.addEventListener('focusout',blur);
}
