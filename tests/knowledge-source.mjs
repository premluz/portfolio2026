import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readKnowledge,validateKnowledge,knowledgeModules} from '../scripts/knowledge-source.mjs';
import {contentSets} from '../dist/content/sets.js';
import {assistantKnowledge,findCuratedAnswer,suggestionsFor,normalizeAssistantPhrase} from '../dist/assistant-knowledge.js';
import {profileFacts} from '../dist/knowledge/profile.js';
import {createKnowledgeLookup} from '../dist/assistant-knowledge-lookup.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const knowledge=await readKnowledge(root);
const published=new Map();
for(const set of contentSets)published.set(set,new Set(JSON.parse(await fs.readFile(new URL(`../dist/content/${set}.json`,import.meta.url),'utf8')).documents.filter(doc=>doc.status==='published').map(doc=>doc.id)));
const clone=()=>structuredClone(knowledge);
const rejects=(mutate,pattern,label)=>{const k=clone();mutate(k);assert.throws(()=>validateKnowledge(k,published),pattern,label);};

// The source validates, and the generated modules export exactly its values.
assert.doesNotThrow(()=>validateKnowledge(knowledge,published),'content/knowledge.json is valid against every content set');
assert.deepEqual(JSON.parse(JSON.stringify(profileFacts)),knowledge.facts,'profile.js exports the facts');
assert.deepEqual(JSON.parse(JSON.stringify(assistantKnowledge)),{version:knowledge.version,facts:knowledge.facts,answers:knowledge.answers,suggestedQuestions:knowledge.suggestedQuestions},'assistant-knowledge.js exports the whole record');
assert.equal(assistantKnowledge.facts,profileFacts,'The facts are one array, as before');
for(const [name,text] of Object.entries(knowledgeModules(knowledge)))assert.equal(await fs.readFile(new URL(`../dist/${name}`,import.meta.url),'utf8'),text,`dist/${name} is what the generator writes (run npm run build)`);
assert.equal(spawnSync(process.execPath,['scripts/build-content.mjs','--check'],{cwd:root,encoding:'utf8'}).status,0,'build-content --check passes');

// Every kind of mistake fails the build with a message naming it.
rejects(k=>{k.facts[0].sourceIds.push('no-such-document');},/fact knowledge-approach names source no-such-document, which is not a published document in catalog/,'an unknown sourceId');
rejects(k=>{k.answers[0].sourceIds=['no-such-document'];},/answer about-prem names source no-such-document/,'an unknown answer source');
{const k=clone();const drafts=new Map([...published].map(([set,ids])=>[set,new Set([...ids].filter(id=>id!==k.facts[0].sourceIds[0]))]));assert.throws(()=>validateKnowledge(k,drafts),/is not a published document/,'a source that is not published');}
{const k=clone();const partial=new Map(published);const [set]=partial.keys();partial.set(set,new Set());assert.throws(()=>validateKnowledge(k,partial),new RegExp(`in ${set}`),'a source missing from one content set');}
rejects(k=>{k.facts[1].id=k.facts[0].id;},/duplicates an id/,'a duplicate id');
rejects(k=>{k.answers[0].id=k.facts[0].id;},/duplicates an id/,'an id shared by a fact and an answer');
rejects(k=>{delete k.facts[0].text;},/fact knowledge-approach needs text/,'a fact without text');
rejects(k=>{k.facts[0].tags=[];},/needs a non-empty tags list/,'a fact without tags');
rejects(k=>{k.answers[0].phrases=[];},/answer about-prem needs a non-empty phrases list/,'an answer without phrases');
rejects(k=>{k.version=2;},/version must be 1/,'a different version');
rejects(k=>{k.suggestedQuestions=[];},/suggestedQuestions/,'no suggested questions');
rejects(k=>{delete k.facts;},/facts must be a list/,'no facts');
await assert.rejects(()=>readKnowledge('/nonexistent'),/Cannot read .*knowledge\.json/,'A missing file fails loudly');

// Lookup behaviour is unchanged: phrases match after normalising, suggestions follow the sources shown.
assert.equal(normalizeAssistantPhrase('  Wéird, Q!  '),'weird q');
assert.equal(findCuratedAnswer('WHO IS PREM?')?.id,'about-prem');
assert.equal(findCuratedAnswer('something else'),null);
assert.deepEqual(suggestionsFor(['tracr']),['What changed at Tracr?','What did Prem do there?']);
assert.deepEqual(suggestionsFor(['home']),['What has Prem worked on?','What is Prem focused on now?']);
assert.deepEqual(suggestionsFor([]),knowledge.suggestedQuestions.slice(0,3));
const lookup=createKnowledgeLookup({answers:[{phrases:['Hello there']}],suggestedQuestions:['a','b','c','d']});
assert.ok(lookup.findCuratedAnswer('hello, there'),'The factory serves any record, not only this one');assert.deepEqual(lookup.suggestionsFor(),['a','b','c']);

console.log('Knowledge source passed: valid against every set, generated modules equal the source, every kind of mistake fails, lookups unchanged.');
