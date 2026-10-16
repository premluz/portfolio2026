import {profileFacts} from './knowledge/profile.js';
// Curated answers are offline recovery copy, not a replacement for model synthesis.
export const assistantKnowledge={
 version:1,
 facts:profileFacts,
 answers:[
  {id:'about-prem',phrases:['who is prem','tell me about prem','about prem','who is prem luczak'],text:'Prem is a builder turned designer. For the last 10+ years, he’s designed products for technical and expert users. Today, his focus is AI-native experiences, generative interfaces and building in code. He also built Rios, a life-first planner.',sourceIds:['home'],followUps:['What has Prem worked on?','What is Prem focused on now?']},
  {id:'prem-work',phrases:['what is work by prem','what has prem worked on','what work has prem done','tell me about prems work','what projects has prem worked on'],text:'Prem has designed a PlayStation publishing pipeline, Vodafone’s IoT connectivity platform, Tracr’s diamond traceability platform and Gala Film’s creator experience. His independent work includes Rios, a life-first planner; Porter, a Mac switchboard for AI agents; and the AI prototypes Merlin and Bastion.',sourceIds:['playstation','vodafone-iot','tracr','galachain','rios','porter','merlin','bastion'],followUps:['What did Prem build with Porter?','What changed at Tracr?']},
 ],
 suggestedQuestions:['Who is Prem?','What has Prem worked on?','Can I paste a job description?'],
};

export const normalizeAssistantPhrase=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function findCuratedAnswer(question){
 const normalized=normalizeAssistantPhrase(question);
 return assistantKnowledge.answers.find(answer=>answer.phrases.some(phrase=>normalizeAssistantPhrase(phrase)===normalized))||null;
}

export function suggestionsFor(sourceIds=[]){
 const featured=sourceIds.includes('tracr')?['What changed at Tracr?','What did Prem do there?']:sourceIds.includes('home')?['What has Prem worked on?','What is Prem focused on now?']:assistantKnowledge.suggestedQuestions;
 return featured.slice(0,3);
}
