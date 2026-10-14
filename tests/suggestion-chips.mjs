import assert from 'node:assert/strict';
import {renderSuggestionChips} from '../dist/suggestion-chips.js';

class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.listeners={};this.properties={};this.className='';this.classList={add:name=>{this.properties[name]=true;}};this.style={setProperty:(name,value)=>{this.properties[name]=value;}};}
 replaceChildren(){this.children=[];}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,handler){this.listeners[name]=handler;}
 append(child){this.children.push(child);}
 click(){this.listeners.click?.();}
}

globalThis.document={createElement:tag=>new Element(tag)};
const root=new Element('div');let selected='';
renderSuggestionChips(root,['Who is Prem?','',null,'What has Prem worked on?','What changed at Tracr?','extra'],{onSelect:question=>{selected=question;}});
assert.equal(root.attributes.role,'group');
assert.equal(root.attributes['aria-label'],'Suggested questions');
assert.equal(root.children.length,3,'The shared component keeps the prompt set compact.');
assert.deepEqual(root.children.map(button=>button.textContent),['Who is Prem?','What has Prem worked on?','What changed at Tracr?']);
assert.equal(root.children[2].properties['--suggestion-index'],'2');
root.children[1].click();
assert.equal(selected,'What has Prem worked on?','Selecting a chip delegates the action to its host.');
let viewed=false;
renderSuggestionChips(root,['Question one','Question two'],{leadingAction:{label:'View chat',onSelect:()=>viewed=true}});
assert.equal(root.children[0].textContent,'View chat');root.children[0].click();assert(viewed,'Leading action opens chat without submitting a question');
console.log('Suggested question chips passed: safe text, three-item limit, accessible group, stagger index and host selection callback.');
