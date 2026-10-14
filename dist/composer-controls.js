export const microphoneIcon='<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v2"/></svg>';
export const stopIcon='<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></svg>';
export function syncComposerMic(button,active,{disabled=false}={}){
 button.disabled=disabled&&!active;button.innerHTML=active?stopIcon:microphoneIcon;button.setAttribute('aria-pressed',String(active));const label=active?'Stop dictation':'Start dictation';button.setAttribute('aria-label',label);button.dataset.tooltip=label;
}
export function syncComposerAction(input,button,{pending=false,count=0,limit=20,voice=false}={}){
 const text=!!input.value.trim(),response=button.dataset.responseActive==='true';input.disabled=pending||count>=limit;button.disabled=input.disabled&&!response;
 button.type=text&&!response?'submit':'button';button.dataset.mode=response?'stop':text?'send':'voice';button.setAttribute('aria-pressed',String(!text&&voice));
 const label=response?'Stop response':text?'Send question':voice?'Stop voice':'Start voice';button.setAttribute('aria-label',label);button.dataset.tooltip=label;
}

export function syncComposerVoice(button,on){
 if(!button)return;button.dataset.voiceEnabled=String(on);if(button.dataset.mode!=='voice')return;button.setAttribute('aria-pressed',String(on));const label=on?'Stop voice':'Start voice';button.setAttribute('aria-label',label);button.dataset.tooltip=label;
}
