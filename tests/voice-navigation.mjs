import assert from 'node:assert/strict';
import {VoiceNavigation} from '../dist/voice-navigation.js';
import {createCommandCatalog} from '../dist/interaction-commands.js';
import {projects} from '../dist/documents.js';

const catalog=createCommandCatalog(projects),timers=new Map(),originalTimeout=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
let serial=0;globalThis.setTimeout=(callback,delay)=>{const id=++serial;timers.set(id,{callback,delay});return id;};globalThis.clearTimeout=id=>timers.delete(id);
const run=id=>{const timer=timers.get(id);assert(timer,'Expected scheduled callback');timers.delete(id);timer.callback();};
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
let events=[],instances=[];
class Recognition {
  constructor(){this.processLocally=false;instances.push(this);}
  static async available(){throw Error('Language-pack checks must not be requested.');}
  static async install(){throw Error('Language-pack installation must not be requested.');}
  start(){events.push(['start',this.processLocally]);this.onstart?.();}
  abort(){events.push(['abort']);this.onend?.();}
  stop(){events.push(['stop']);this.onend?.();}
  result(text,final=false){this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:text}],{isFinal:final})]});}
  end(){this.onend?.();}
}
try {
  let finish,commands=[],status=[];
  const voice=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Recognition},onStatus:s=>status.push(s),onCommand:command=>{events.push(['command',command.id]);commands.push(command);return new Promise(resolve=>finish=resolve);}});
  assert.equal(await voice.start(),true);const rec=voice.recognition;
  assert.equal(rec.processLocally,false);assert.equal(rec.continuous,false);assert.equal(rec.interimResults,true);
  assert.deepEqual(events[0],['start',false],'The browser speech service starts without checking or downloading a language pack');
  rec.result('Open PlayStation');assert.equal(commands.length,1);assert.equal(voice.recognition,null);
  assert.deepEqual(events.slice(-2).map(e=>e[0]),['abort','command'],'Microphone recognition ends before activation');
  rec.result('Open PlayStation',true);rec.end();assert.equal(commands.length,1,'Late/final results cannot execute the utterance again');
  assert.equal(timers.size,0,'Listening cannot resume during the command transition');
  finish({ok:true,message:'Opened PlayStation'});await flush();assert(timers.has(voice.timer));run(voice.timer);
  const second=voice.recognition;assert(second&&second!==rec);rec.end();assert.equal(voice.recognition,second,'A stale end event cannot affect the next utterance');
  voice.pause();assert.equal(voice.recognition,null);assert.equal(timers.size,0);voice.resume();run(voice.timer);assert(voice.recognition);
  voice.stop();assert.equal(timers.size,0);assert.equal(voice.enabled,false);assert.equal(voice.transcript,'');

  const pauseCommands=[];
  const paused=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Recognition},onCommand:command=>{pauseCommands.push(command);return {ok:true};}});
  await paused.start();const bare=paused.recognition;bare.result('Open');assert.equal(pauseCommands.length,0);
  bare.onspeechend();run(paused.pauseTimer);await flush();assert.equal(pauseCommands[0].id,'overlay.projects','A speech pause finishes bare Open as List');paused.stop();

  const scrollCommands=[];
  const scrolling=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Recognition},onCommand:command=>{scrollCommands.push(command);return {ok:true};}});
  await scrolling.start();const down=scrolling.recognition;down.result('Down');down.result('Down',true);await flush();
  assert.equal(scrollCommands.length,1);assert.equal(scrollCommands[0].id,'viewport.scroll.down','A short spoken Down activates one scrolling command');
  run(scrolling.timer);scrolling.recognition.result('Move up',true);await flush();assert.equal(scrollCommands[1].id,'viewport.scroll.up');scrolling.stop();

  const spoken=[],navigation=[];
  const assistant=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Recognition},canAsk:()=>true,onUtterance:text=>{spoken.push(text);return {ok:true,message:'Answered'};},onCommand:command=>{navigation.push(command.id);return {ok:true};}});
  await assistant.start();assistant.recognition.result('Who is Prem?',true);await flush();
  assert.deepEqual(spoken,['Who is Prem?'],'A final unmatched utterance becomes an assistant question.');
  run(assistant.timer);assistant.recognition.result('Open PlayStation',true);await flush();
  assert.deepEqual(navigation,['project.open'],'Known navigation commands still take precedence on the assistant page.');assistant.stop();

  const questions=[],siteCommands=[];
  const conversation=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Recognition},onCommand:command=>siteCommands.push(command),onUtterance:text=>{questions.push(text);conversation.pause();return {ok:true,message:'Answered'};}});
  await conversation.start({conversation:true});conversation.recognition.result('Open PlayStation');assert.equal(questions.length,0,'Conversation waits for a completed phrase');
  assert.equal(siteCommands.length,0,'A partial conversation phrase cannot accidentally navigate');
  conversation.recognition.result('Open PlayStation',true);await flush();assert.deepEqual(questions,[]);assert.equal(siteCommands[0].id,'project.open');assert(timers.has(conversation.timer),'Voice keeps listening after navigation');
  for(const [phrase,id] of [['Next','project.next'],['Left','project.previous'],['Right','project.next'],['Close menu','overlay.projects.close'],['Scroll down','viewport.scroll.down'],['Move up','viewport.scroll.up'],['Chat','route.assistant'],['Assistant','route.assistant']]){
    run(conversation.timer);const rec=conversation.recognition;rec.result(phrase,true);rec.result(phrase,true);rec.end();await flush();assert.equal(siteCommands.at(-1).id,id);assert.equal(questions.length,0,'Navigation never submits a question: '+phrase);
  }
  run(conversation.timer);conversation.recognition.result('Open unknown',true);conversation.recognition.end();await flush();assert.equal(questions.length,0,'Unknown Open targets stay out of chat');
  run(conversation.timer);conversation.recognition.result('Open');conversation.recognition.end();await flush();assert.equal(siteCommands.at(-1).id,'overlay.projects','Bare Open at the pause endpoint opens the index');
  run(conversation.timer);conversation.recognition.result('Who is Prem?',true);await flush();assert.deepEqual(questions,['Who is Prem?']);assert.equal(timers.size,0,'Listening stays paused while the answer is spoken');
  conversation.resume();run(conversation.timer);conversation.recognition.result('What did he do at Tracr?',true);await flush();assert.deepEqual(questions,['Who is Prem?','What did he do at Tracr?'],'Subsequent ordinary phrases still become questions');conversation.stop();assert.equal(timers.size,0);

  let finishAnswer,interrupted=0;const outputQuestions=[],outputCommands=[];
  const interruptible=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Recognition},onUtterance:text=>{outputQuestions.push(text);interruptible.setOutputActive(true);return new Promise(done=>finishAnswer=done);},onCommand:command=>{outputCommands.push(command.id);interrupted++;interruptible.setOutputActive(false);return {ok:true};}});
  await interruptible.start({conversation:true});interruptible.recognition.result('Who is Prem?',true);await flush();assert(interruptible.pending);
  run(interruptible.timer);const during=interruptible.recognition;assert(during,'A command-only microphone stays active during output even while the answer callback is pending');
  during.result('Prem designed products for technical users',true);during.end();await flush();assert.equal(outputQuestions.length,1,'Reply audio is never echoed into a new chat question');
  run(interruptible.timer);const stopping=interruptible.recognition;stopping.result('Stop',true);stopping.result('Stop',true);stopping.end();await flush();
  assert.deepEqual(outputCommands,['assistant.speech.stop']);assert.equal(interrupted,1);assert(interruptible.enabled&&!interruptible.outputActive&&!interruptible.pending,'Stop clears output, keeps voice mode, and releases the listening gate');
  run(interruptible.timer);const listening=interruptible.recognition;finishAnswer({ok:true,message:'Old answer finished'});await flush();assert.equal(interruptible.recognition,listening,'Late answer completion cannot replace the post-interruption listener');
  for(const phrase of ['Chat','Assistant']){interruptible.setOutputActive(true);run(interruptible.timer);interruptible.recognition.result(phrase,true);await flush();assert.equal(outputCommands.at(-1),'route.assistant');assert(interruptible.enabled);run(interruptible.timer);}
  interruptible.setOutputActive(true);run(interruptible.timer);const staleOutput=interruptible.recognition,lateResult=staleOutput.onresult;interruptible.stop();lateResult({results:[Object.assign([{transcript:'Stop'}],{isFinal:true})]});assert.equal(interrupted,3);assert.equal(timers.size,0,'Disabling voice also releases the output listener and ignores stale results');

  class Legacy extends Recognition {constructor(){super();delete this.processLocally;}}
  const legacy=new VoiceNavigation(catalog,{environment:{webkitSpeechRecognition:Legacy}});
  assert.equal(await legacy.start(),true);assert(!('processLocally' in legacy.recognition),'Native/prefixed speech works without experimental on-device APIs');legacy.stop();
  const unsupported=new VoiceNavigation(catalog,{environment:{}});
  await assert.rejects(unsupported.start(),/unavailable in this browser/);assert.equal(unsupported.enabled,false);

  class Slow extends Recognition {start(){events.push(['permission-pending']);}}
  const cancelled=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Slow}});const waiting=cancelled.start();
  const stale=cancelled.recognition,lateStart=stale.onstart;cancelled.stop();lateStart();
  assert.equal(await waiting,false);assert.equal(cancelled.recognition,null);assert.equal(cancelled.enabled,false,'Late microphone permission cannot revive a cancelled session');
  const errors=[];
  class Denied extends Recognition {start(){this.onerror({error:'not-allowed'});}}
  const denied=new VoiceNavigation(catalog,{environment:{SpeechRecognition:Denied},onStatus:s=>errors.push(s)});
  await assert.rejects(denied.start(),/Microphone access/);assert.equal(denied.enabled,false);assert.equal(denied.recognition,null);assert.equal(errors.at(-1).phase,'error');
  assert.equal(timers.size,0,'Every stopped/failed session releases its timers');
  console.log('Voice passed: native/prefixed service, assistant dictation, navigation precedence, pause endpoint, abort-before-action, stale races, cancellation, denial and timer cleanup.');
} finally {globalThis.setTimeout=originalTimeout;globalThis.clearTimeout=originalClear;}
