import {answerPublishedQuestion,knowledgeById} from './assistant-answer.js';
import {syncComposerAction,syncComposerMic} from './composer-controls.js';
import {content} from './content/local.js';
import {assistantLimits} from './assistant-limits.js';
import {mountAssistantView} from './assistant-view.js';
import {mountAssistantAudio,mountAssistantDictation,mountAssistantSuggestions} from './assistant-composer.js';
import {mountAssistantSession,assistantControls} from './assistant-session.js';

const cap=20;
export const answerPortfolioQuestion=(question,{store=content,history=[]}={})=>answerPublishedQuestion(question,{store,history});

export function readSessionTranscript(storage,store=content){
 let entries;try{entries=JSON.parse(storage?.getItem('prem-ask-transcript')||'[]');}catch(error){throw new Error('Cannot restore the stored chat transcript',{cause:error});}
 if(!Array.isArray(entries))return [];
 return entries.slice(-40).filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.text==='string')
  .map(item=>({role:item.role,text:item.text.slice(0,item.role==='user'?assistantLimits.questionCharacters:assistantLimits.answerCharacters),
   documentIds:[...new Set(Array.isArray(item.documentIds)?item.documentIds:[])].filter(id=>typeof id==='string'&&store.get(id)).slice(0,5),
   knowledgeSourceIds:[...new Set(Array.isArray(item.knowledgeSourceIds)?item.knowledgeSourceIds:[])].filter(id=>knowledgeById.has(id)).slice(0,3),
   suggestions:(Array.isArray(item.suggestions)?item.suggestions:[]).filter(value=>typeof value==='string').map(value=>value.slice(0,100)).slice(0,3),
   speechToken:typeof item.speechToken==='string'&&/^\d{10}\.[A-Za-z0-9_-]{43}$/.test(item.speechToken)?item.speechToken:null,
   spoken:typeof item.spoken==='string'&&item.spoken.length<=assistantLimits.spokenCharacters?item.spoken:null,
   notice:typeof item.notice==='string'?item.notice.slice(0,assistantLimits.noticeCharacters):''}));
}

export function setAssistantComposerAvailability(form,active){
 form.inert=!active;form.setAttribute('aria-hidden',String(!active));
}

export function syncAssistantComposer(input,send,{pending=false,count=0,limit=20}={}){
 input.maxLength=assistantLimits.questionCharacters;
 syncComposerAction(input,send,{pending,count,limit,voice:send.dataset.voiceEnabled==='true'});
}


const noop=()=>{};
const assistantDefaults={store:content,limit:cap,onOpen:noop,onOpenProject:noop,onCardsAdded:noop,onVoiceToggle:noop,onDictationStart:noop,onDictationEnd:noop,onInputError:noop,reducedMotion:()=>false,onSpeechStart:noop,onSpeechEnd:noop,onSoundChange:noop,onStatus:noop,onComposerFocus:()=>Promise.resolve()};
const transcriptLimit=40;

function assistantRuntime(root,options){
 const r={root,options,store:options.store,limit:options.limit,pending:false,count:0,voiceMode:false,soundEnabled:false,textStreams:new Set()};
 for(const [key,id] of Object.entries({toggle:'askToggle',page:'askPage',form:'askForm',input:'askInput',messages:'askMessages',dock:'dock'}))r[key]=root.querySelector('#'+id);
 r.send=r.form.querySelector('#assistantAction');
 try{r.storage=sessionStorage;r.preferences=localStorage;r.soundEnabled=r.preferences.getItem('prem-assistant-sound')==='true';r.count=Math.max(0,Math.min(r.limit,Number(r.storage.getItem('prem-ask-count'))||0));}
 catch(error){options.onInputError('Browser preferences are unavailable: '+error.name);}
 try{r.transcript=readSessionTranscript(r.storage,r.store);}catch(error){r.transcript=[];options.onInputError(error.message);}
 r.save=(key,value)=>{try{r.storage?.setItem(key,value);}catch(error){options.onInputError('Chat session could not be saved: '+error.name);}};
 r.persist=entry=>{r.transcript.push(entry);r.transcript=r.transcript.slice(-transcriptLimit);r.save('prem-ask-transcript',JSON.stringify(r.transcript));};
 r.sessionId=()=>{if(r.sessionKey)return r.sessionKey;const previous=r.storage?.getItem('prem-ask-session');r.sessionKey=previous||globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;if(!previous)r.save('prem-ask-session',r.sessionKey);return r.sessionKey;};
 r.sync=()=>{syncAssistantComposer(r.input,r.send,{pending:r.pending,count:r.count,limit:r.limit});if(r.microphone)syncComposerMic(r.microphone,Boolean(r.dictation?.active),{disabled:r.input.disabled});};
 return r;
}

export function mountPortfolioAssistant(root,options={}){
 const r=assistantRuntime(root,{...assistantDefaults,...options});
 mountAssistantView(r);mountAssistantAudio(r);mountAssistantSuggestions(r);mountAssistantDictation(r);mountAssistantSession(r);
 r.sync();r.page.classList.toggle('assistant-empty',!r.transcript.length);r.page.dataset.voiceMode='false';
 return assistantControls(r,setAssistantComposerAvailability);
}
