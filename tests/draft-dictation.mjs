import assert from 'node:assert/strict';
import {DraftDictation,DictationMeter,appendDictation} from '../dist/draft-dictation.js';
assert.equal(appendDictation('Existing draft',' more text '),'Existing draft more text');assert.equal(appendDictation('Draft ','extra'),'Draft extra');assert.equal(appendDictation('Keep this',''),'Keep this');
let serial=0;const timers=new Map(),environment={setTimeout(fn){timers.set(++serial,fn);return serial;},clearTimeout(id){timers.delete(id);}};
const instances=[];
class Recognition{
 constructor(){instances.push(this);}
 start(){this.onstart?.();}
 stop(){this.stopped=true;}
 abort(){this.aborted=true;}
 result(items){this.onresult?.({results:items.map(text=>[{transcript:text}])});}
}
environment.SpeechRecognition=Recognition;
let draft='Already typed',states=[],errors=[];
const dictation=new DraftDictation({environment,getDraft:()=>draft,setDraft:text=>draft=text,onState:s=>states.push(s),onError:e=>errors.push(e)});
dictation.start();const first=instances.at(-1);assert(first.continuous&&first.interimResults);first.result(['new speech']);assert.equal(draft,'Already typed new speech');
first.result(['new speech','continues']);assert.equal(draft,'Already typed new speech continues','Results replace interim speech rather than append it twice');
const stopping=dictation.stop();assert(first.stopped);assert(dictation.active,'Stop waits for the browser’s final transcription');first.result(['new speech','continued.']);first.onend();await stopping;assert.equal(draft,'Already typed new speech continued.');assert(!dictation.active);
const staleResult=first.onresult;assert.equal(staleResult,null);
dictation.start();const second=instances.at(-1);second.result(['Another sentence.']);const done=dictation.stop();second.onend();await done;assert.equal(draft,'Already typed new speech continued. Another sentence.','A new microphone session appends to the current draft');
assert.equal(timers.size,0);

// Old permission and recognition callbacks cannot resurrect a stopped session.
class Slow extends Recognition{start(){}}
environment.SpeechRecognition=Slow;dictation.start();const slow=instances.at(-1),lateStart=slow.onstart,lateResult=slow.onresult;
const cancel=dictation.stop();lateStart();await cancel;const saved=draft;lateResult({results:[[{transcript:'stale'}]]});assert.equal(draft,saved);assert(!dictation.active);assert.equal(timers.size,0);
const unsupported=new DraftDictation({environment:{},onError:e=>errors.push(e)});unsupported.start();assert(errors.at(-1).includes('unavailable'));
environment.SpeechRecognition=Recognition;dictation.start();const fallback=dictation.stop();for(const [id,fn] of [...timers]){timers.delete(id);fn();}await fallback;assert(!dictation.active);assert.equal(timers.size,0);

// Android may end individual recognitions while the user is still dictating.
// Each fresh engine starts its result list at zero; earlier segments must stay.
let starts=0,ends=0;draft='Draft';
const continuous=new DraftDictation({environment,getDraft:()=>draft,setDraft:text=>draft=text,onStart:()=>starts++,onEnd:()=>ends++,onError:e=>errors.push(e)});
const runNextTimer=()=>{const [id,callback]=timers.entries().next().value;timers.delete(id);callback();};
continuous.start();const androidFirst=instances.at(-1),oldResult=androidFirst.onresult,oldEnd=androidFirst.onend;
androidFirst.result(['Tell']);androidFirst.onend();
assert(continuous.active,'A browser end does not stop user dictation');assert.equal(ends,0);assert.equal(draft,'Draft Tell');assert.equal(timers.size,1);
runNextTimer();const androidSecond=instances.at(-1);assert.notEqual(androidSecond,androidFirst);
androidSecond.result(['me about']);assert.equal(draft,'Draft Tell me about');
androidSecond.result(['me about Prem']);assert.equal(draft,'Draft Tell me about Prem','A segment replaces its interim without duplicating older segments');
oldResult({results:[[{transcript:'stale words'}]]});oldEnd();assert.equal(draft,'Draft Tell me about Prem');assert.equal(timers.size,0,'Stale native callbacks cannot schedule another engine');
androidSecond.onend();runNextTimer();const androidThird=instances.at(-1);androidThird.result(['and his']);
const flushed=continuous.stop();androidThird.result(['and his work.']);androidThird.onend();await flushed;
assert.equal(draft,'Draft Tell me about Prem and his work.');assert.equal(starts,1);assert.equal(ends,1,'UI and voice navigation see only the end of the whole dictation');assert.equal(timers.size,0);

// Stop/Cancel during the restart gap must not start another microphone session.
for(const action of ['stop','cancel']){
 continuous.start();const engine=instances.at(-1);engine.result(['more']);engine.onend();
 const lateRestart=timers.values().next().value,before=instances.length;
 await continuous[action]();lateRestart();assert(!continuous.active);assert.equal(instances.length,before);assert.equal(timers.size,0);
}
continuous.start();const denied=instances.at(-1);denied.onerror({error:'not-allowed'});assert(!continuous.active);assert.equal(timers.size,0,'Permission errors never restart');

// Silence restarts are bounded; productive recognitions can keep appending.
continuous.start();
for(let attempt=0;attempt<4;attempt++){
 const engine=instances.at(-1);engine.onerror({error:'no-speech'});engine.onend();
 if(attempt<3){assert(continuous.active);runNextTimer();}
}
assert(!continuous.active);assert.equal(timers.size,0);assert(errors.at(-1).includes('no speech'));

// The waveform samples real levels and releases both tracks and AudioContext.
let stopped=0,closed=0,levels=[];
const stream={getTracks:()=>[{stop(){stopped++;}}]};
class Context{resume(){return Promise.resolve();}createMediaStreamSource(){return {connect(){},disconnect(){}};}createAnalyser(){return {fftSize:256,getByteTimeDomainData(buffer){buffer.fill(150);}};}close(){closed++;return Promise.resolve();}}
const audioEnv={...environment,navigator:{mediaDevices:{getUserMedia:async options=>{assert.deepEqual(options,{audio:true,video:false});return stream;}}},AudioContext:Context};
const meter=new DictationMeter({environment:audioEnv,onLevel:value=>levels.push(value)});await meter.start();assert(levels.some(value=>value>0),'Incoming audio drives the waveform');assert.equal(timers.size,1);meter.stop();assert.equal(timers.size,0);assert.equal(stopped,1);assert.equal(closed,1);assert.equal(levels.at(-1),0);
let permit;audioEnv.navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>permit=resolve);const waiting=meter.start();meter.stop();permit(stream);await waiting;assert.equal(stopped,2,'Late microphone permission releases its stream immediately');assert.equal(timers.size,0);
console.log('Draft dictation passed: interim replacement, final stop flush, repeated-session append, stale callbacks, bounded stop and real-level meter cleanup.');
