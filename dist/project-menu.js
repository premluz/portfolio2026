import {iconSwitchMarkup,switchIcon} from './icon-switch.js';
import {CONTACT_LINKEDIN_URL} from './contact-actions.js';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function projectMenuMarkup(projects,current){
 const icon=path=>`<svg aria-hidden="true" viewBox="0 0 24 24">${path}</svg>`;
 const icons={home:icon('<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3Z"/>'),about:icon('<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'),message:icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>')};
 const routeButton=(id,label,glyph)=>`<button type="button" data-page-menu-item="${id}" aria-label="${label}" data-tooltip="${label}"${id==='work'?' data-tooltip-pointer-only':''}${id===current?' class="active" aria-current="page"':''}>${glyph}</button>`;
 const contacts=`<button type="button" data-copy-email aria-label="Copy email" data-tooltip="Copy email">${icons.message}</button><a href="${CONTACT_LINKEDIN_URL}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-tooltip="LinkedIn">${icon('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4M2 9h4v12H2ZM4 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>')}</a>`;
 const toolbar=`<nav class="project-menu-actions" aria-label="Pages and site controls"><div role="group" aria-label="Pages and contact">${routeButton('work','Home',icons.home)}${routeButton('about','About',icons.about)}${contacts}</div><div role="group" aria-label="Site controls">${iconSwitchMarkup({id:'themeToggle',label:'Theme',states:['light','dark','system'],icons:['light','dark','system'],value:'light'})}${iconSwitchMarkup({id:'soundPreference',label:'Sound'})}${iconSwitchMarkup({id:'gesturePreference',label:'Gestures',icons:['hand','hand']})}${iconSwitchMarkup({id:'animationPreference',label:'Animation',icons:['still','motion'],value:'on'})}<button type="button" id="siteHelp" class="icon-switch" aria-label="Using this site" data-tooltip="Using this site">${switchIcon('help')}</button></div></nav>`;
 return `<div class="project-menu-projects">${projectMenuProjectsMarkup(projects,current)}</div>`+toolbar;
}
export function projectMenuProjectsMarkup(projects,current){
 return [['shipped','Shipped'],['lab','Lab']].map(([kind,label])=>{
  const items=projects.filter(project=>(project.projectKind||'shipped')===kind);
  return `<section class="project-menu-group" aria-label="${label}">${items.map(project=>`<button type="button" data-project-menu-item="${escape(project.id)}"${project.id===current?' class="active" aria-current="page"':''}><span class="project-menu-title">${escape(project.name)}</span>${project.client?`<span class="project-menu-client">${escape(project.client)}</span>`:''}</button>`).join('')}</section>`;
 }).join('');
}
