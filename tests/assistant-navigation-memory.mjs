import assert from 'node:assert/strict';
import {AssistantNavigationMemory} from '../dist/assistant-navigation-memory.js';

const memory=new AssistantNavigationMemory();
memory.beforeNavigate('tracr','assistant');
assert.equal(memory.origin,'tracr','Chat remembers the page it was opened from');
memory.beforeNavigate('assistant','playstation');
assert.equal(memory.returnToChat,true,'Leaving Chat keeps one Back step to Chat');
assert.equal(memory.backTarget('playstation'),'assistant');
assert.deepEqual(memory.beforeNavigate('playstation','assistant'),{returningToChat:true});
assert.equal(memory.origin,'tracr','Returning to Chat preserves its original entry route');
assert.equal(memory.backTarget('assistant'),'tracr','A second Back returns to the original page');
memory.beforeNavigate('assistant','tracr');
assert.equal(memory.returnToChat,false,'Closing Chat does not create a loop back into Chat');
assert.equal(memory.backTarget('tracr'),null);

const cardReturn=new AssistantNavigationMemory();
cardReturn.beforeNavigate('about','assistant');
cardReturn.beforeNavigate('assistant','playstation');
// ProjectEntryMemory sends Back directly to Chat without calling backTarget
// on AssistantNavigationMemory first.
assert.deepEqual(cardReturn.beforeNavigate('playstation','assistant'),{returningToChat:true});
assert.equal(cardReturn.origin,'about');
assert.equal(cardReturn.backTarget('assistant'),'about');
cardReturn.beforeNavigate('assistant','about');
assert.equal(cardReturn.backTarget('about'),null,'The second Back finishes at the original page, without looping to the project');

const reversed=new AssistantNavigationMemory();
reversed.beforeNavigate('work','assistant');reversed.beforeNavigate('assistant','tracr');
reversed.reverseToChat();assert.equal(reversed.returnToChat,false,'Escape reversal clears the pending Chat return step');
assert.equal(reversed.backTarget('assistant'),'work');

const reopened=new AssistantNavigationMemory();
reopened.beforeNavigate('work','assistant');reopened.beforeNavigate('assistant','work');
assert.equal(reopened.backTarget('work'),'assistant');reopened.beforeNavigate('work','assistant');
assert.equal(reopened.backTarget('assistant'),'work');reopened.beforeNavigate('assistant','work');
assert.deepEqual(reopened.beforeNavigate('about','assistant'),{returningToChat:false},'Manually opening Chat records the current page as its new origin');
assert.equal(reopened.origin,'about');

const home=new AssistantNavigationMemory();
home.beforeNavigate('work','assistant');home.beforeNavigate('assistant','tracr');
home.prepareHomeNavigation();
assert.equal(home.returnToChat,false,'Home clears the pending Chat return');
assert.equal(home.preserveOrigin,false,'Home clears the preserved Chat origin');
assert.deepEqual(home.beforeNavigate('assistant','work'),{returningToChat:false},'Explicit Home navigation does not create a Chat loop');
home.beforeNavigate('work','assistant');
assert.deepEqual(home.beforeNavigate('assistant','work'),{returningToChat:false},'A later Chat session still starts with a clean Home return state');
console.log('Assistant navigation memory passed: origin, Chat return, explicit close, Escape reversal and fresh entry.');
