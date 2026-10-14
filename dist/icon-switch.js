import {escapeText} from './content/html.js';
const paths={
 light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 dark:'<path d="M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z"/>',
 system:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
 sound:'<path d="M4 9v6h4l5 4V5L8 9H4Zm12 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/>',
 muted:'<path d="M4 9v6h4l5 4V5L8 9H4Zm12 1 5 5m0-5-5 5"/>',
 motion:'<path d="M2 8c4-5 6 5 10 0s6 5 10 0M2 16c4-5 6 5 10 0s6 5 10 0"/>',
 still:'<path d="M4 8h16M4 16h16"/>',
 hand:'<path d="M8 13V4a2 2 0 0 1 4 0v9M12 5a2 2 0 0 1 4 0v8M16 11a2 2 0 0 1 4 0v6a5 5 0 0 1-5 5h-3a5 5 0 0 1-4-2l-5-6a2 2 0 0 1 3-2l2 2"/>',
 fingers:'<path d="M7 13V6a2 2 0 0 1 4 0v6M11 8a2 2 0 0 1 4 0v5M15 11a2 2 0 0 1 4 0v5a5 5 0 0 1-5 5h-3a5 5 0 0 1-4-2l-4-5a2 2 0 0 1 3-2l2 2"/>',
 play:'<path d="M7 4.8a1 1 0 0 1 1.5-.86l10.2 6.2a2.2 2.2 0 0 1 0 3.72l-10.2 6.2A1 1 0 0 1 7 19.2Z"/>',
 pause:'<path d="M8 5h3v14H8zm5 0h3v14h-3z"/>',
 mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v2"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1.1-1.5 2M12 17h.01"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>'
};
export const switchIcon=name=>`<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]||paths.help}</svg>`;
export function iconSwitchMarkup({id,label,states=['off','on'],icons=['muted','sound'],value=states[0]}){
 const binary=states.length===2,index=Math.max(0,states.indexOf(value)),next=states[(index+1)%states.length];
 return `<button type="button" id="${escapeText(id)}" class="icon-switch" data-icon-switch data-switch-label="${escapeText(label)}" data-switch-states="${states.join(',')}" data-switch-icons="${icons.join(',')}" data-state="${escapeText(value)}" ${binary?`role="switch" aria-checked="${index===1}"`:''} aria-label="${escapeText(label)}: ${escapeText(value)}" data-tooltip="${escapeText(label)}: ${escapeText(value)} · ${binary?'Switch':'Next:'} ${escapeText(next)}">${switchIcon(icons[index])}</button>`;
}
export function setIconSwitchState(button,value){
 if(!button||button.dataset?.iconSwitch===undefined)return;
 const states=button.dataset.switchStates.split(','),index=Math.max(0,states.indexOf(String(value))),state=states[index],next=states[(index+1)%states.length];
 button.dataset.state=state;button.innerHTML=switchIcon(button.dataset.switchIcons.split(',')[index]);
 if(states.length===2)button.setAttribute('aria-checked',String(index===1));
 button.setAttribute('aria-label',`${button.dataset.switchLabel}: ${state}`);
 button.dataset.tooltip=`${button.dataset.switchLabel}: ${state} · ${states.length===2?'Switch':'Next:'} ${next}`;
}
export const nextSwitchState=(states,current)=>states[(Math.max(0,states.indexOf(current))+1)%states.length];
