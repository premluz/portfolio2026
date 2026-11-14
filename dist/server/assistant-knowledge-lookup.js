// Lookup behaviour for the curated answers. The data is content/knowledge.json (see scripts/knowledge-source.mjs);
// dist/assistant-knowledge.js is generated from it and calls this factory, so importers keep one module.
export const normalizeAssistantPhrase=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

export function createKnowledgeLookup(knowledge){
 const findCuratedAnswer=question=>{
  const normalized=normalizeAssistantPhrase(question);
  return knowledge.answers.find(answer=>answer.phrases.some(phrase=>normalizeAssistantPhrase(phrase)===normalized))||null;
 };
 const suggestionsFor=(sourceIds=[])=>{
  const featured=sourceIds.includes('tracr')?['What changed at Tracr?','What did Prem do there?']:sourceIds.includes('home')?['What has Prem worked on?','What is Prem focused on now?']:knowledge.suggestedQuestions;
  return featured.slice(0,3);
 };
 return {findCuratedAnswer,suggestionsFor};
}
