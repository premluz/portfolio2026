import assert from 'node:assert/strict';
import {createCommandCatalog,parseVoiceCommand,isVoiceNavigationRequest,CommandBus} from '../dist/interaction-commands.js';
import {homeProjects,projects as allProjects} from '../dist/documents.js';

const catalog=createCommandCatalog([...homeProjects,allProjects.find(project=>project.id==='porter')]);
assert.equal(catalog.version,1);assert.equal(catalog.projects.length,8);
for(const [phrase,id,target] of [
  ['Open PlayStation','project.open','playstation'],['open play station','project.open','playstation'],
  ['Please open the Sony project.','project.open','playstation'],['Open Tracer','project.open','tracr'],
  ['Open Merlin','project.open','merlin'],['Open Bastion','project.open','bastion'],['Open Porter','project.open','porter'],
  ['Open Gala chain','project.open','galachain'],['Open Vodafone','project.open','vodafone-iot'],
  ['Open Amble','project.open','rios'],['open Rios','project.open','rios'],['Open Planner','project.open','rios'],
  ['Next','project.next'],['previous project','project.previous'],['Work','route.work'],
  ['Right','project.next'],['Left','project.previous'],['Move right','project.next'],['Go left','project.previous'],
  ['Close menu','overlay.projects.close'],['Close the menu','overlay.projects.close'],['Close index','overlay.projects.close'],
  ['About','route.about'],['Open Contact','route.contact'],['Chat','route.assistant'],['Open Chat','route.assistant'],['Assistant','route.assistant'],['Settings','overlay.settings'],
  ['Menu','overlay.projects'],['Index','overlay.projects'],['List','overlay.projects'],
  ['Open menu','overlay.projects'],['Open index','overlay.projects'],
  ['Back','navigation.back'],['Close Chat','navigation.back'],['Back to Chat','navigation.back'],['Stop listening','input.voice.stop'],
  ['Stop','assistant.speech.stop'],['Stop speaking','assistant.speech.stop'],['Stop reading','assistant.speech.stop'],
  ['Scroll up','viewport.scroll.up'],['Up','viewport.scroll.up'],['Move up','viewport.scroll.up'],
  ['Scroll down','viewport.scroll.down'],['Down','viewport.scroll.down'],['Move down','viewport.scroll.down']
]) {
  const command=parseVoiceCommand(phrase,catalog);
  assert.equal(command?.id,id,phrase);assert.equal(command?.target,target,phrase);
}
assert.equal(parseVoiceCommand('open',catalog),null,'Bare open waits for a target or endpoint');
assert.equal(parseVoiceCommand('open',catalog,{final:true}).id,'overlay.projects');
assert.equal(parseVoiceCommand('Assistant, who is Prem?',catalog,{final:true})?.text,'who is prem');
assert.equal(parseVoiceCommand('Assistant, who is Prem?',catalog,{final:true})?.id,'assistant.ask','Assistant-prefixed questions route to Chat');
assert.equal(parseVoiceCommand('Chat, ask about Tracr',catalog,{final:true})?.id,'assistant.ask');
assert.equal(parseVoiceCommand('Assistant, open Tracr',catalog,{final:true})?.id,'project.open');
assert.equal(parseVoiceCommand('Assistant, close menu',catalog,{final:true})?.id,'overlay.projects.close');
assert.equal(parseVoiceCommand('Assistant, open unknown',catalog,{final:true}),null);
for(const phrase of ['open unknown','close something','scroll sideways','please open mystery','Assistant open mystery'])assert(isVoiceNavigationRequest(phrase));
for(const phrase of ['What does open mean?','Who is Prem?','Tell me about Tracr'])assert(!isVoiceNavigationRequest(phrase));
assert.equal(parseVoiceCommand('Assistant, who is Prem?',catalog,{final:false}),null,'Questions wait for a final voice result');
for(const phrase of ['I was at work yesterday','next week','open Play','PlayStation','do not open Sony','my contact is here','listening','open unknown','move up the list','scroll down later','up next','do not scroll up'])
  assert.equal(parseVoiceCommand(phrase,catalog,{final:true}),null,'Background speech is not a command: '+phrase);
const ambiguous=createCommandCatalog([{id:'a',name:'Shared'},{id:'b',name:'Shared'}]);
assert.equal(parseVoiceCommand('open shared',ambiguous),null,'Ambiguous aliases never choose arbitrarily');

let state={busy:false,isProject:false,isWork:false},called=[],release;
const bus=new CommandBus(catalog,{
  'project.open':command=>{called.push(command.target);return new Promise(resolve=>release=resolve);},
  'project.next':()=>called.push('next'),
  'project.previous':()=>called.push('previous'),
  'viewport.scroll.up':()=>{called.push('scroll up');return {ok:true};},
  'viewport.scroll.down':()=>{called.push('scroll down');return {ok:true};},
  'input.voice.stop':()=>{called.push('voice off');return {ok:true};},
  'navigation.back':()=>{called.push('back');return {ok:true};},
  'overlay.projects.close':()=>{called.push('close menu');return {ok:true};},
  'assistant.speech.stop':()=>{called.push('stop response');return {ok:true};},
  'assistant.ask':command=>{called.push(command.text);return {ok:true};}
},{getState:()=>state});
assert.equal((await bus.dispatch({id:'project.next'})).ok,false,'Info/home routes are outside the project carousel');
state={busy:false,isProject:false,isWork:true};
await bus.dispatch({id:'project.next'});await bus.dispatch({id:'project.previous'});
assert.deepEqual(called.splice(0),['next','previous'],'Project sequence controls can be used from Work');
state={busy:false,isProject:false,isWork:false};
await bus.dispatch({id:'viewport.scroll.up',source:'voice'});await bus.dispatch({id:'viewport.scroll.down',source:'voice'});
assert.deepEqual(called.splice(0),['scroll up','scroll down'],'Voice scroll is available on home/information routes as well as projects');
assert.equal((await bus.dispatch({id:'project.open',target:'unknown'})).ok,false);
const opening=bus.dispatch({id:'project.open',target:'playstation-02',source:'pointer'});
assert.deepEqual(called,['playstation-02'],'Layout duplicates keep their direct pointer identity');
assert.equal((await bus.dispatch({id:'project.open',target:'tracr'})).ok,false,'Commands cannot overlap a navigation transaction');
assert.equal((await bus.dispatch({id:'navigation.back',source:'gesture'})).ok,true,'Back can interrupt the active transaction');
release({ok:true});await opening;assert.equal(bus.pending,0);
assert.equal((await bus.dispatch({id:'assistant.ask',text:'who is prem',source:'voice'})).ok,true,'Assistant questions are routed through the shared command bus');
state={busy:true,isProject:true,isWork:false};assert.equal((await bus.dispatch({id:'project.next'})).ok,false);
assert.equal((await bus.dispatch({id:'viewport.scroll.down'})).ok,false,'Scrolling cannot fight a running card transition');
assert.equal((await bus.dispatch({id:'assistant.ask',text:'interrupt the spoken answer'})).ok,true,'An addressed assistant question can interrupt a running transition');
assert.equal((await bus.dispatch({id:'input.voice.stop'})).ok,true,'Stopping capture never waits for navigation');
assert.equal((await bus.dispatch({id:'overlay.projects.close'})).ok,true,'Closing the menu can interrupt a transition');
assert.equal((await bus.dispatch({id:'assistant.speech.stop'})).ok,true,'Stopping a response never waits for the current command');
state={busy:false,isProject:true,isWork:false};await bus.dispatch({id:'project.next'});assert(called.includes('next'));
const failure=new CommandBus(catalog,{'route.work':()=>{throw Error('test');}});
await assert.rejects(failure.dispatch({id:'route.work'}));assert.equal(failure.pending,0,'Failed handlers release the input gate');
console.log('Commands passed: schema, exact speech/aliases, canonical voice targets, duplicate pointer routes, noise rejection, project scope, serialized actions and interruptible Back.');
