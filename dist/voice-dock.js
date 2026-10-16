const micPath='<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v2"/>',stopPath='<rect x="7" y="7" width="10" height="10" rx="1"/>',speakerPath='<path d="M4 9v6h4l5 4V5L8 9H4Z"/>',speakerWaves='<path d="M16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',offSlash='<path class="voice-off-slash" d="m3 3 18 18"/>';
const icon=path=>`<svg aria-hidden="true" viewBox="0 0 24 24">${path}</svg>`;
export class VoiceDock{
 constructor(dock,{onMic=()=>{},onStop=()=>{},onSound=()=>{},onClose=()=>{},reduced=()=>false,loadWave=()=>import('./siri-wave.js')}={}){
  Object.assign(this,{dock,reduced,onMic,onStop,onSound,onClose,loadWave,active:false,token:0,phase:'listening'});
  this.el=document.createElement('div');this.el.className='voice-composer';this.el.hidden=true;this.el.setAttribute('role','group');this.el.setAttribute('aria-label','Voice conversation');
  this.el.innerHTML='<span class="voice-wave-field" aria-hidden="true"><canvas></canvas></span>';
  this.canvas=this.el.querySelector('canvas');
  const button=(path,action)=>{const el=document.createElement('button');el.type='button';el.innerHTML=icon(path);el.onclick=action;this.el.append(el);return el;};
  this.mic=button('<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v2"/>',onMic);
  this.stop=button(stopPath,onStop);this.stop.dataset.voiceStop='true';this.stop.hidden=true;this.label(this.stop,'Stop speaking');
  this.sound=button('<path d="M4 9v6h4l5 4V5L8 9H4ZM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',onSound);
  this.close=button('<path d="m6 6 12 12M18 6 6 18"/>',onClose);this.label(this.close,'Return to composer');dock.el.querySelector('nav').append(this.el);
 }
 label(button,label,on){button.setAttribute('aria-label',label);button.dataset.tooltip=label;if(on!==undefined)button.setAttribute('aria-pressed',String(on));}
 async setActive(active){
  this.active=!!active;const token=++this.token;this.el.hidden=!active;this.dock.el.classList.toggle('voice-mode',!!active);this.dock.setVoiceCompact?.(!!active);
  const form=this.dock.el.querySelector('#askForm');form.inert=!!active;form.setAttribute('aria-hidden',String(!!active));if(active){form.querySelector('input')?.blur();this.close.focus({preventScroll:true});try{const {SiriWave}=await this.loadWave();if(token!==this.token||!this.active)return;this.wave?.destroy();this.wave=new SiriWave(this.canvas,{reduced:this.reduced});this.wave.setPhase(this.phase);this.el.classList.add('wave-ready');}catch{this.el.classList.remove('wave-ready');}}
  else{this.wave?.destroy();this.wave=null;this.el.classList.remove('wave-ready');}
 }
 sync({paused=false,sound=true,phase=this.phase}={}){this.phase=phase;const speaking=phase==='speaking';this.mic.innerHTML=icon(micPath+(paused?offSlash:''));this.stop.hidden=!speaking;this.stop.setAttribute('aria-hidden',String(!speaking));this.sound.innerHTML=icon(speakerPath+(sound?speakerWaves:offSlash));this.label(this.mic,paused?'Turn microphone on':'Turn microphone off',!paused);this.label(this.stop,'Stop speaking');this.label(this.sound,sound?'Turn spoken voice off':'Turn spoken voice on',sound);this.el.dataset.phase=phase;this.wave?.setPhase(phase);}
 destroy(){this.setActive(false);this.el.remove();}
}
