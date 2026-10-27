// Input adapters produce intentions. Only this bus may turn an intention into
// a route or overlay action; rendering and liquid motion stay with the site.
export const COMMAND_SCHEMA_VERSION = 1;
export const gestureDefinitions = Object.freeze([
  {pose:'pointer',sequence:['two fingers together with thumb away in an L-shape'],intent:'pointer.move'},
  {pose:'pinch',sequence:['L-shape pointer','touch thumb to both fingertips'],intent:'pointer.activate'},
  {pose:'fist',sequence:['open palm','fist'],intent:'navigation.back'},
  {pose:'palm',sequence:['hold open hand flat','tilt fingertips up or down'],intent:'viewport.scroll'},
  {pose:'pointer',sequence:['two fingers together','swipe left'],intent:'project.next'},
  {pose:'pointer',sequence:['two fingers together','swipe right'],intent:'project.previous'}
].map(gesture=>Object.freeze({...gesture,sequence:Object.freeze(gesture.sequence)})));
export const commandDefinitions = Object.freeze([
  {id:'project.open',label:'Open a project',phrases:['open <project>'],argument:'projectId',scope:'site'},
  {id:'project.next',label:'Next project',phrases:['next','next project','right','go right','move right'],scope:'project'},
  {id:'project.previous',label:'Previous project',phrases:['previous','previous project','prev','left','go left','move left'],scope:'project'},
  {id:'route.work',label:'All work',phrases:['work','all work','home','open work'],scope:'site'},
  {id:'route.about',label:'About',phrases:['about','open about'],scope:'site'},
  {id:'route.lab',label:'Lab',phrases:['lab','open lab'],scope:'site'},
  {id:'route.contact',label:'Contact',phrases:['contact','open contact'],scope:'site'},
  {id:'route.assistant',label:'Chat',phrases:['chat','open chat','assistant','open assistant','ask about the work'],scope:'site'},
  {id:'assistant.ask',label:'Ask the assistant',phrases:[],scope:'site'},
  {id:'overlay.settings',label:'Site settings',phrases:['settings','open settings'],scope:'site'},
  {id:'overlay.projects',label:'Project list',phrases:['menu','index','list','projects','project list','open menu','open index','open list','open projects'],scope:'site'},
  {id:'overlay.projects.close',label:'Close menu',phrases:['close menu','close the menu','close index','close list','close projects'],scope:'site'},
  {id:'viewport.scroll.up',label:'Scroll up',phrases:['scroll up','up','move up'],scope:'site'},
  {id:'viewport.scroll.down',label:'Scroll down',phrases:['scroll down','down','move down'],scope:'site'},
  {id:'navigation.back',label:'Back',phrases:['back','go back','close','close chat','back to chat','escape'],scope:'site'},
  {id:'input.voice.stop',label:'Stop listening',phrases:['stop listening','voice off'],scope:'site'},
  {id:'assistant.speech.stop',label:'Stop response',phrases:['stop','stop speaking','stop reading','stop response','stop the response'],scope:'site'}
].map(definition=>Object.freeze({...definition,phrases:Object.freeze(definition.phrases)})));

export function normalizeSpeech(value='') {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

export function createCommandCatalog(projects) {
  const seen=new Set(),entries=[];
  for(const project of projects) {
    // Layout duplicates are the same spoken project, not competing aliases.
    if(project.sourceProjectId||seen.has(project.id))continue;
    seen.add(project.id);
    const aliases=[project.name,project.title,project.id,...(project.commandAliases||[])];
    entries.push(Object.freeze({id:project.id,label:project.name||project.title,
      aliases:Object.freeze([...new Set(aliases.map(normalizeSpeech).filter(Boolean))])}));
  }
  return Object.freeze({version:COMMAND_SCHEMA_VERSION,commands:commandDefinitions,gestures:gestureDefinitions,
    projects:Object.freeze(entries),projectIds:Object.freeze(projects.map(project=>project.id))});
}

export function parseVoiceCommand(transcript,catalog,{final=false}={}) {
  let text=normalizeSpeech(transcript).replace(/^please /,'').replace(/ please$/,'');
  for(const definition of catalog.commands) {
    if(definition.phrases.includes(text))return {id:definition.id,source:'voice'};
  }
  // A spoken assistant prefix routes the rest of the utterance into Chat,
  // including when the user is on another page. Wait for a final result so an
  // interim recognition fragment never submits a half-formed question.
  const addressed=/^(?:assistant|chat)\s+(.+)$/.exec(text);
  if(final&&addressed){const command=parseVoiceCommand(addressed[1],catalog,{final});if(command)return command;const question=addressed[1].replace(/^(?:please\s+)?(?:ask|tell me|can you|could you)\s+/,'').trim();if(question&&!isVoiceNavigationRequest(question))return {id:'assistant.ask',text:question,source:'voice'};}
  // Do not execute "open" on an interim result: its project name may follow.
  if(text==='open')return final?{id:'overlay.projects',source:'voice'}:null;
  const match=/^open (?:the )?(.+?)(?: project)?$/.exec(text);
  if(!match)return null;
  const targets=catalog.projects.filter(project=>project.aliases.includes(match[1]));
  return targets.length===1?{id:'project.open',target:targets[0].id,source:'voice'}:null;
}

// Incomplete/unknown navigation requests should never buy a chat answer.
export function isVoiceNavigationRequest(transcript){
 const text=normalizeSpeech(transcript).replace(/^please /,'').replace(/ please$/,'').replace(/^(?:assistant|chat)\s+/,'');
 return /^(?:open|close|scroll)(?:\s|$)/.test(text);
}

export class CommandBus {
  constructor(catalog,handlers,{getState=()=>({})}={}) {
    Object.assign(this,{catalog,handlers,getState,pending:0});
    this.ids=new Set(catalog.commands.map(command=>command.id));
  }
  async dispatch(command) {
    if(!command||!this.ids.has(command.id))return {ok:false,message:'Command not recognized.'};
    const state=this.getState(),interrupt=['navigation.back','input.voice.stop','overlay.projects.close','assistant.speech.stop','assistant.ask'].includes(command.id);
    if((state.busy||this.pending)&&!interrupt)return {ok:false,message:'Let the current transition finish.'};
    if(command.id.startsWith('project.')&&command.id!=='project.open'&&!state.isProject&&!(state.isWork&&['project.next','project.previous'].includes(command.id)))
      return {ok:false,message:'Open a project first.'};
    if(command.id==='project.open'&&!this.catalog.projectIds.includes(command.target))
      return {ok:false,message:'Project not found.'};
    const handler=this.handlers[command.id];
    if(!handler)return {ok:false,message:'This command is unavailable.'};
    if(!interrupt)this.pending++;
    try {
      const result=await handler(command);
      return result||{ok:true,message:this.catalog.commands.find(item=>item.id===command.id).label};
    } finally {if(!interrupt)this.pending--;}
  }
}
