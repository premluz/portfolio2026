import {assistantLimits} from './assistant-limits.js';
import {readRequirements} from './assistant-fit-table.js';
import {answerPublishedQuestion,resolvedAnswer,knowledgeById} from './assistant-answer.js';
import {suggestionsFor} from './assistant-knowledge.js';

export function offlineAssistantAnswer(question,store,history){
 if(question.length>assistantLimits.offlineQuestionCharacters)return resolvedAnswer(store,'A detailed review needs the AI service, which is unavailable right now. Your pasted text has not been evaluated. Please try again shortly.');
 return answerPublishedQuestion(question,{store,history});
}

export async function requestAssistant(question,history,{store,sessionId,fetcher=globalThis.fetch}){
 try{
  const response=await fetcher('/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,sessionId,history}),signal:AbortSignal.timeout(assistantLimits.clientTimeout)});
  const result=await response.json();
  if(typeof result.text!=='string'||!Array.isArray(result.documentIds))throw new Error('Invalid assistant response');
  const documentIds=[...new Set(result.documentIds)].filter(id=>store.get(id));
  const knowledgeIds=(Array.isArray(result.knowledgeSources)?result.knowledgeSources:[]).map(source=>source?.id).filter(id=>knowledgeById.has(id));
  const notice=!response.ok||result.error?'AI is temporarily unavailable; this is a published-content fallback, not a new AI evaluation.':'';
  return {...resolvedAnswer(store,result.text,documentIds,knowledgeIds,Array.isArray(result.suggestions)?result.suggestions:suggestionsFor(documentIds)),
   speechToken:typeof result.speechToken==='string'?result.speechToken:null,spoken:typeof result.spoken==='string'&&result.spoken.length<=assistantLimits.spokenCharacters?result.spoken:null,requirements:readRequirements(result.requirements,store,{limit:assistantLimits.requirementCount}),responseMode:result.responseMode||'model',kind:result.kind||'grounded',notice};
 }catch(error){
  return {...offlineAssistantAnswer(question,store,history),responseMode:'local-fallback',notice:`AI could not connect (${error.name}); showing available published content only.`};
 }
}
