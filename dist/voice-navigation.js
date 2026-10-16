import {parseVoiceCommand,isVoiceNavigationRequest} from './interaction-commands.js';

const messages={
  'not-allowed':'Microphone access was not allowed. Check this site’s microphone permission and try again.',
  'service-not-allowed':'The browser’s speech service is blocked in this view. Open the site directly and try again.',
  'audio-capture':'No microphone is available. Connect a microphone and try again.',
  'language-not-supported':'English speech recognition is unavailable in this browser.',
  'network':'The browser’s speech service could not connect. Check your connection and try again.'
};
const outputCommands=new Set(['assistant.speech.stop','assistant.ask','route.assistant','input.voice.stop']);
const recognitionStartRetry=120;
export class VoiceNavigation {
  constructor(catalog,{onCommand=()=>{},onUtterance=()=>{},canAsk=()=>false,onStatus=()=>{},onChange=()=>{},environment=globalThis}={}) {
    Object.assign(this,{catalog,onCommand,onUtterance,canAsk,onStatus,onChange,environment,conversation:false,enabled:false,paused:false,recognition:null,generation:0,pending:false,retries:0});
    this.timer=0;this.pauseTimer=0;this.outputActive=false;this.execution=0;
  }
  status(message,phase='ready'){this.onStatus({message,phase});}
  async start({conversation=false}={}) {
    this.stop();this.conversation=conversation;
    const Recognition=this.environment.SpeechRecognition||this.environment.webkitSpeechRecognition;
    let probe;try{probe=Recognition?new Recognition():null;}catch{}
    if(!probe)throw Error('Voice navigation is unavailable in this browser. Open the site directly in a browser with speech recognition support.');
    this.Recognition=Recognition;this.lang='en-US';
    this.status('Waiting for microphone permission…','starting');
    this.enabled=true;this.paused=false;this.onChange(true);
    return new Promise((resolve,reject)=>{
      this.startup={resolve,reject};
      this.startTimer=setTimeout(()=>this.fail('Microphone setup timed out. Check the browser permission and try again.'),15000);
      this.listen();
    });
  }
  listen() {
    clearTimeout(this.timer);
    if(!this.enabled||this.paused||this.pending&&!this.outputActive||this.recognition)return;
    const recognition=new this.Recognition(),generation=this.generation;
    // Use the browser-provided speech service. Do not request a language-pack
    // installation; the consent guide explains its possible online processing.
    recognition.lang=this.lang;
    recognition.continuous=this.outputActive;recognition.interimResults=true;recognition.maxAlternatives=1;
    const valid=()=>this.enabled&&!this.paused&&generation===this.generation&&this.recognition===recognition;
    this.recognition=recognition;this.transcript='';this.executed=false;
    recognition.onstart=()=>{if(!valid())return;this.status(this.outputActive?'Say “Stop” to interrupt':'Listening',this.outputActive?'output':'listening');this.retries=0;clearTimeout(this.startTimer);this.startup?.resolve(true);this.startup=null;};
    recognition.onspeechstart=()=>{if(valid()&&!this.outputActive)this.status('Listening…','hearing');};
    recognition.onresult=event=>{
      if(!valid()||this.executed)return;
      const text=Array.from(event.results).map(result=>result[0]?.transcript||'').join(' ').trim(),final=Array.from(event.results).every(result=>result.isFinal);
      this.transcript=text;if(!this.outputActive)this.status(this.conversation?'Listening…':text.slice(0,120)||'Listening…','hearing');
      // Conversation waits for the complete phrase to avoid routing partial
      // question fragments as commands. Commands always take priority.
      const command=parseVoiceCommand(text,this.catalog,{final});
      if(this.outputActive){
        if(final&&command&&outputCommands.has(command.id))this.execute(command,recognition,generation);
        // Ignore reply audio and other utterances while output is active.
        return;
      }
      if(command&&(!this.conversation||final)){this.execute(command,recognition,generation);return;}
      if(final&&text){
        if(!isVoiceNavigationRequest(text)&&(this.conversation||this.canAsk())){this.execute({id:'assistant.utterance',text},recognition,generation);return;}
        this.transcript='';this.status('Try “Open Merlin”, “Next” or “List”.','ready');
      }
    };
    recognition.onspeechend=()=>{
      if(!valid()||this.executed)return;
      // Flush the final result on a pause. A complete known interim command
      // takes the instant path above; bare "open" waits for this endpoint.
      clearTimeout(this.pauseTimer);this.pauseTimer=setTimeout(()=>{if(valid())try{recognition.stop();}catch{}},180);
    };
    recognition.onerror=event=>{
      if(!valid()||event.error==='aborted')return;
      if(event.error==='no-speech'){this.retries++;return;}
      this.fail(messages[event.error]||'Voice recognition stopped. Please try again.');
    };
    recognition.onend=()=>{
      if(this.recognition!==recognition)return;
      this.recognition=null;
      clearTimeout(this.pauseTimer);
      if(generation!==this.generation||!this.enabled||this.paused||this.pending&&!this.outputActive)return;
      const command=!this.executed&&this.transcript?parseVoiceCommand(this.transcript,this.catalog,{final:true}):null;
      if(this.outputActive){if(command&&outputCommands.has(command.id)){this.execute(command,null,generation);return;}this.transcript='';return;}
      if(command){this.execute(command,null,generation);return;}
      if(!isVoiceNavigationRequest(this.transcript)&&(this.conversation||this.canAsk())&&this.transcript.trim()){this.execute({id:'assistant.utterance',text:this.transcript.trim()},null,generation);return;}
      if(isVoiceNavigationRequest(this.transcript))this.status('Try “Open Merlin”, “Next” or “List”.','ready');
      this.transcript='';this.schedule(this.retries?Math.min(1500,400+this.retries*150):350);
    };
    try{recognition.start();}catch(error){if(error?.name==='InvalidStateError'&&valid()){this.recognition=null;this.schedule(recognitionStartRetry);return;}this.fail(error.message||'The microphone could not start.');}
  }
  async execute(command,recognition,generation) {
    const interrupt=this.outputActive&&outputCommands.has(command.id);
    if((this.executed||this.pending)&&!interrupt)return;
    const execution=++this.execution;
    this.executed=true;this.pending=true;clearTimeout(this.pauseTimer);
    // End this utterance before doing anything to the interface. Stale final
    // results cannot execute it again while the liquid transition is running.
    if(recognition){this.recognition=null;try{recognition.abort();}catch{}}
    this.transcript='';this.status(['assistant.utterance','assistant.ask'].includes(command.id)?'Thinking…':'Recognized · activating','acting');
    try {
      const result=command.id==='assistant.utterance'?command.text.length<=240?await this.onUtterance(command.text):{ok:false,message:'Ask a shorter question.'}:await this.onCommand(command);
      if(generation===this.generation&&execution===this.execution&&this.enabled&&!this.outputActive)this.status(interrupt?'Listening':result?.message||'Done',interrupt?'listening':result?.ok===false?'ready':'acting');
    } catch {if(generation===this.generation&&execution===this.execution)this.status('Could not activate that command. Try again.','ready');}
    finally{if(generation===this.generation&&execution===this.execution){this.pending=false;this.schedule(interrupt?0:550);}}
  }
  schedule(delay) {clearTimeout(this.timer);if(this.enabled&&!this.paused&&(!this.pending||this.outputActive))this.timer=setTimeout(()=>this.listen(),delay);}
  setOutputActive(on){this.outputActive=Boolean(on);this.abort();if(this.enabled&&!this.paused)this.schedule(0);}
  pause() {this.paused=true;this.abort();this.status('Voice paused','paused');}
  resume() {if(!this.enabled)return;this.paused=false;this.schedule(150);}
  abort() {
    clearTimeout(this.timer);clearTimeout(this.pauseTimer);
    const recognition=this.recognition;this.recognition=null;
    if(recognition){for(const event of ['onstart','onresult','onend','onerror','onspeechstart','onspeechend'])recognition[event]=null;try{recognition.abort();}catch{}}
    this.transcript='';
  }
  fail(message) {const startup=this.startup;this.startup=null;this.stop();startup?.reject(Error(message));this.status(message,'error');}
  stop() {
    ++this.generation;++this.execution;this.outputActive=false;this.conversation=false;this.enabled=false;this.pending=false;this.paused=false;this.abort();clearTimeout(this.startTimer);
    this.startup?.resolve(false);this.startup=null;this.onChange(false);
  }
}
