import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isInterruption} from '../dist/voice-navigation.js';

const reply='I’ve put the two closest projects in the chat. Tracr is the strongest match.';
// The microphone hearing the reply itself is ignored, even when recognition garbles or trims it.
assert.equal(isInterruption('the two closest projects in the chat',reply),false);
assert.equal(isInterruption('tracker is the strongest match',reply),false,'A near echo with one misheard word is still an echo');
assert.equal(isInterruption('Let me check his projects',"Let me check his projects."),false,'The acknowledgement echo is ignored too');
// Real speech from the visitor interrupts.
assert.equal(isInterruption('what about his design system work',reply),true);
assert.equal(isInterruption('tell me more about Tracr',reply),true,'Mentioning a word from the reply still counts as a new question');
assert.equal(isInterruption('stop that and show bastion',reply),true);
// Noise and single words do not.
assert.equal(isInterruption('uh',reply),false);assert.equal(isInterruption('',reply),false);
assert.equal(isInterruption('show bastion',''),true,'With nothing known to be playing, two clear words interrupt');

const source=await readFile(new URL('../dist/voice-navigation.js',import.meta.url),'utf8');
assert(source.includes("isInterruption(text,this.outputText))this.execute({id:'assistant.utterance',text}"),'During a reply, a non-echo phrase becomes the next question');
assert(source.includes("if(final&&command&&outputCommands.has(command.id)){this.execute(command,recognition,generation);return;}"),'Stop and other output commands still win first');
const speech=await readFile(new URL('../dist/assistant-speech.js',import.meta.url),'utf8');assert((speech.match(/this\.onStart\(text\)/g)||[]).length===2,'Both lanes tell the listener what is being said');
console.log('Voice interruption passed: echo of the reply and acknowledgement ignored, real questions interrupt, noise ignored, commands keep priority.');
