const tabState=(tab,active)=>{
 tab.setAttribute('aria-selected',String(active));
 tab.tabIndex=active?0:-1;
};

export function mountSettingsTabs(panel){
 if(!panel)return;
 const tabs=[...panel.querySelectorAll('[data-settings-tab]')],panels=[...panel.querySelectorAll('[data-settings-tabpanel]')];
 if(!tabs.length||!panels.length)return;
 const activate=id=>{
  for(const tab of tabs){const active=tab.dataset.settingsTab===id;tabState(tab,active);}
  for(const view of panels)view.hidden=view.dataset.settingsTabpanel!==id;
 };
 const focusTab=offset=>{
  const index=tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true');
  const tab=tabs[(index+offset+tabs.length)%tabs.length];
  activate(tab.dataset.settingsTab);
  tab.focus();
 };
 for(const tab of tabs){
  tab.onclick=()=>activate(tab.dataset.settingsTab);
  tab.onkeydown=event=>{
   if(event.key==='ArrowRight'){event.preventDefault();focusTab(1);}
   if(event.key==='ArrowLeft'){event.preventDefault();focusTab(-1);}
   if(event.key==='Home'){event.preventDefault();activate(tabs[0].dataset.settingsTab);tabs[0].focus();}
   if(event.key==='End'){event.preventDefault();const tab=tabs.at(-1);activate(tab.dataset.settingsTab);tab.focus();}
  };
 }
 activate(tabs[0].dataset.settingsTab);
}
