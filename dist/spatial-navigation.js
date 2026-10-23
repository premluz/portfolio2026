import {syncComposerVoice} from './composer-controls.js';
import {setIconSwitchState} from './icon-switch.js';
import {VoiceNavigation} from './voice-navigation.js';
import {GestureNavigation} from './gesture-navigation.js';
import {GestureCursor} from './gesture-cursor.js';
import {ViewportScroll} from './viewport-scroll.js';
import {createStatusMotion} from './status-motion.js';

// Capture has a session lifetime, never a saved "on" preference. Each new
// activation goes through the processing/privacy guide and explicit OK button.
export class SpatialNavigation {
  constructor(catalog,bus,{beforeGuide=()=>{},scrollSurface=()=>null,onAssistantQuestion=()=>{},onModeChange=()=>{},onNotify=null,onStop=()=>{},onVoiceState=()=>{},reduced=()=>false}={}) {
    this.onVoiceState=onVoiceState;this.onStop=onStop;this.onModeChange=onModeChange;this.onNotify=onNotify;this.modeStates={};this.bus=bus;this.beforeGuide=beforeGuide;this.scrollSurface=scrollSurface;this.mode=null;this.attempt=0;
    const find=id=>document.getElementById(id);
    this.dialog=find('interactionGuide');this.confirm=find('interactionConfirm');this.cancel=find('interactionCancel');this.message=find('interactionSetupStatus');this.feedback=find('interactionFeedback');
    this.buttons={voice:find('voicePreference'),gestures:find('gesturePreference')};
    this.huds={voice:find('voiceStatus'),gestures:find('gestureStatus')};
    this.hudMotion=Object.fromEntries(Object.entries(this.huds).map(([mode,node])=>[mode,createStatusMotion(node,{reduced})]));
    this.cursor=new GestureCursor(find('gestureCursor'));
    this.viewport=new ViewportScroll();this.scrollControl=find('gestureScrollControl');
    this.voice=new VoiceNavigation(catalog,{onCommand:command=>bus.dispatch(command),onUtterance:onAssistantQuestion,canAsk:()=>this.bus.getState().route==='assistant',onStatus:status=>this.status('voice',status),onChange:on=>this.changed('voice',on)});
    this.gestures=new GestureNavigation({onFrame:intent=>this.frame(intent),onStatus:status=>this.status('gestures',status),onChange:on=>this.changed('gestures',on),canSwipe:()=>{const state=this.bus.getState();return Boolean(state.isProject&&!state.busy&&!this.bus.pending);}});
    for(const mode of ['voice','gestures']) {
      this.buttons[mode].onclick=()=>this[mode].enabled?this.disable(mode):this.showGuide(mode);
      find(mode+'Stop').onclick=()=>this.disable(mode);
    }
    this.confirm.onclick=()=>this.enable();this.cancel.onclick=()=>this.closeGuide(true);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.closeGuide(true);});
    this.keys=event=>{if(this.dialog.open&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();this.closeGuide(true);}};
    addEventListener('keydown',this.keys,true);
    this.manualInput=event=>{if(event.isTrusted&&this.viewport.mode)this.cancelScroll();};
    addEventListener('wheel',this.manualInput,{passive:true});addEventListener('pointerdown',this.manualInput,{passive:true});
    addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))this.manualInput(event);});
    this.visibility=()=>{if(document.hidden)this.stopAll();};
    document.addEventListener('visibilitychange',this.visibility);addEventListener('pagehide',()=>this.stopAll());
    this.changed('voice',false);this.changed('gestures',false);
  }
  showGuide(mode) {
    this.cancelScroll();if(!this.dialog.open)this.guideTrigger=document.activeElement;this.beforeGuide();this.voice.pause();this.gestures.pause();this.cursor.clear();this.mode=mode;this.attempt++;
    this.message.textContent='';this.message.classList.remove('is-error');this.confirm.disabled=false;this.confirm.textContent='OK';
    document.getElementById('interactionGuideTitle').textContent=mode==='help'?'Using this site.':mode==='voice'?(this.bus.getState().route==='assistant'?'Ask about the work with your voice.':'Navigate with your voice.'):'Navigate with your hands.';
    document.getElementById('interactionPrivacy').textContent=mode==='help'?'Use the menu or arrow keys to explore projects. On mobile, swipe left and right. Press Escape to go back. Hand tracking stays on your device. Browser voice recognition may process audio online; this site does not record audio or camera frames.':mode==='voice'?
      'Voice uses your browser’s built-in speech service, which may process audio online. This site does not record or store your audio.':
      'Hand tracking runs entirely on your device. Camera frames stay on your machine; this site does not record or store them.';
    document.getElementById('interactionGuideHint').textContent=mode==='help'?'Press / to open or close the menu. Use ↑ and ↓ to select items, or type the first letter of a project name. Use the microphone to dictate a draft. Use the wave button for voice mode: ask questions or say “Open PlayStation”, “Next”, “Scroll down” or “Close menu”. Speak to interrupt a spoken reply with a new question, or say “Stop” to listen again. Use the hand icon for gestures.':mode==='voice'?'Say “Open PlayStation”, “Next”, “Previous”, “Scroll up”, “Scroll down” or “Close menu”. Speak to interrupt a spoken reply, or say “Stop”. Say “Chat” or “Assistant” to open Chat. In voice mode, ordinary questions go to Chat.':'Enable your camera after OK. Keep one hand visible. Flat, angled and back-facing open hands can scroll.';
    this.dialog.dataset.mode=mode;this.dialog.dataset.loading='false';
    if(!this.dialog.open)this.dialog.showModal();this.confirm.focus({preventScroll:true});
  }
  async enable() {
    if(this.mode==='help'){this.closeGuide(false);return;}
    const mode=this.mode,attempt=++this.attempt;
    this.confirm.disabled=true;this.dialog.dataset.loading='true';this.message.classList.remove('is-error');
    try {
      const active=await this[mode].start();
      if(attempt!==this.attempt)return;
      if(active){this.closeGuide(false);this[mode==='voice'?'gestures':'voice'].resume();}
      else{this.confirm.disabled=false;this.dialog.dataset.loading='false';}
    } catch(error) {
      if(attempt!==this.attempt)return;
      this.message.textContent=error.message;this.message.classList.add('is-error');this.confirm.disabled=false;this.confirm.textContent='Try again';this.dialog.dataset.loading='false';
    }
  }
  async startConversation(){
    this.cancelScroll();this.beforeGuide();
    try{return await this.voice.start({conversation:true});}catch(error){this.notify(error.message,{tone:'error'});return false;}
  }
  closeGuide(cancelled=false) {
    ++this.attempt;if(cancelled&&this.dialog.dataset.loading==='true')this[this.mode]?.stop();
    if(this.dialog.open)this.dialog.close();this.dialog.dataset.loading='false';
    this.voice.resume();this.gestures.resume();(this.guideTrigger?.isConnected&&!this.guideTrigger.closest?.('dialog')?this.guideTrigger:document.getElementById('assistantIndexToggle')).focus({preventScroll:true});
  }
  changed(mode,on) {
    this.buttons[mode].setAttribute('aria-checked',String(on));setIconSwitchState(this.buttons[mode],on?'on':'off');if(this.modeStates[mode]!==undefined&&this.modeStates[mode]!==on)this.onModeChange(mode,on);this.modeStates[mode]=on;this.setInputVisible(mode,on&&(mode!=='voice'||!['listening','hearing','ready','paused','output','error'].includes(this.huds.voice.dataset.phase)));
    if(mode==='voice')syncComposerVoice(document.getElementById('assistantAction'),on&&this.voice.conversation);
    if(!on&&mode==='gestures'){this.cursor.clear();this.viewport.stopRate();this.scrollControl.hidden=true;}
  }
  setInputVisible(mode,on){const parent=document.getElementById('interactionHud');if(on)parent.hidden=false;this.hudMotion[mode].set(on,{onHidden:()=>{parent.hidden=Object.values(this.huds).every(node=>node.hidden);}});}
  status(mode,{message,phase}) {
    if(mode==='voice')this.onVoiceState({message,phase});
    const hud=this.huds[mode],text=hud.querySelector('[data-input-status]');
    if(text.textContent!==message)text.textContent=message;hud.dataset.phase=phase;if(mode==='voice')this.setInputVisible(mode,!['listening','hearing','ready','paused','output','error'].includes(phase));
    if(this.dialog.open&&this.mode===mode&&this.dialog.dataset.loading==='true')this.message.textContent=message;
    if(phase==='error'&&!this.dialog.open)this.notify(message,{tone:'error'});
  }
  async frame(intent) {
    if(this.dialog.open)return;
    // Activate the captured control before any cursor-clear or new hit test.
    // Bending the fingers to meet the thumb must not retarget the click.
    if(intent.command?.id==='pointer.activate'){
      this.viewport.stop();this.scrollControl.hidden=true;
      if(this.bus.pending||this.bus.getState().busy){this.notify('Let the current transition finish.',{tone:'neutral'});return;}
      this.cursor.hold(intent.command.point);
      this.notify(this.cursor.activate().message);return;
    }
    if(intent.scrolling) {
      this.cursor.clear();
      if(this.bus.pending||this.bus.getState().busy){this.viewport.stopRate();this.scrollControl.hidden=true;return;}
      const rate=intent.scroll?.rate||0;
      this.scrollControl.hidden=false;this.scrollControl.dataset.direction=rate>0?'down':rate<0?'up':'neutral';
      this.scrollControl.style.setProperty('--scroll-offset',`${rate*46}px`);
      this.viewport.rate(rate,{element:this.scrollSurface(),point:intent.scroll?.point});
      return;
    }
    this.viewport.stopRate();this.scrollControl.hidden=true;
    if(intent.cursorMode==='hold')this.cursor.hold(intent.cursor);else this.cursor.move(intent.cursor);
    if(!intent.command)return;
    try{const result=await this.bus.dispatch(intent.command);this.notify(result.message,{tone:result.ok===false?'error':'success'});}catch{this.notify('Could not activate that gesture. Try again.',{tone:'error'});}
  }
  scrollPage(direction,options={}){this.cancelScroll();return this.viewport.step(direction,{element:this.scrollSurface(),...options});}
  cancelScroll(){this.viewport.stop();this.scrollControl.hidden=true;this.gestures?.intent.cancelScroll();}
  notify(message,{tone='success'}={}) {
    if(this.onNotify){this.onNotify(message,{tone});return;}
    this.feedback.setAttribute('data-status-tone',tone);
    clearTimeout(this.feedbackTimer);this.feedback.textContent=message;this.feedback.hidden=false;
    this.feedbackTimer=setTimeout(()=>{this.feedback.hidden=true;this.feedback.textContent='';},3500);
  }
  disable(mode){this[mode].stop();}
  stopAll(){this.cancelScroll();this.voice.stop();this.gestures.stop();this.cursor.clear();if(this.dialog.open)this.closeGuide(true);clearTimeout(this.feedbackTimer);if(!this.onNotify){this.feedback.hidden=true;this.feedback.textContent='';}this.onStop();}
}
