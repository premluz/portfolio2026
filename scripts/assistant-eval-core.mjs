import {answerKinds} from '../worker/assistant-policy.mjs';
import {handleAssistantRequest} from '../worker/assistant-core.mjs';

// Scoring for the golden-question run (scripts/assistant-eval.mjs). Pure functions, so tests/assistant-eval.mjs can
// cover them with a mocked provider and no network.
const isText=value=>typeof value==='string'&&value.trim()!=='';
const kindsOf=entry=>[].concat(entry.kind??[]);

// publishedIds: ids of documents the assistant can cite. A question naming anything else could never pass.
export function validateEval(evalSet,publishedIds){
 const problems=[],seen=new Set();
 if(evalSet?.version!==1)problems.push('version must be 1');
 if(!Array.isArray(evalSet?.questions)||!evalSet.questions.length)problems.push('questions must be a non-empty list');
 for(const entry of evalSet?.questions||[]){
  const label=`question ${entry?.id??'(no id)'}`;
  if(!isText(entry?.id))problems.push(`${label} needs an id`);else if(seen.has(entry.id))problems.push(`${label} duplicates an id`);else seen.add(entry.id);
  if(!isText(entry?.question))problems.push(`${label} needs question text`);
  for(const kind of kindsOf(entry))if(!answerKinds.includes(kind))problems.push(`${label} has unknown kind ${kind}`);
  if(!Array.isArray(entry?.mustCite)||!Array.isArray(entry?.mustNotClaim)||!entry.mustNotClaim.every(isText))problems.push(`${label} needs mustCite and mustNotClaim lists of text`);
  else for(const id of entry.mustCite)if(!publishedIds.has(id))problems.push(`${label} must cite ${id}, which is not a published document`);
 }
 if(problems.length)throw new Error(`content/assistant-eval.json is invalid:\n- ${problems.join('\n- ')}`);
}

// body: the parsed JSON answer; status: the HTTP status. A published-fallback answer is not the model, so it fails.
export function scoreAnswer(entry,status,body){
 const failures=[];
 if(status!==200||body?.responseMode==='published-fallback')return {id:entry.id,pass:false,kind:'',cited:[],failures:[`no live model answer (HTTP ${status}${body?.error?`, ${body.error}`:''})`]};
 const allowed=kindsOf(entry),cited=body.documentIds||[];
 if(allowed.length&&!allowed.includes(body.kind))failures.push(`kind ${body.kind} is not ${allowed.join(' or ')}`);
 for(const id of entry.mustCite)if(!cited.includes(id))failures.push(`did not cite ${id}`);
 const said=`${body.text||''}\n${body.spoken||''}`.toLowerCase();
 for(const phrase of entry.mustNotClaim)if(said.includes(phrase.toLowerCase()))failures.push(`claimed "${phrase}"`);
 return {id:entry.id,pass:failures.length===0,kind:body.kind||'',cited,failures};
}

export function formatTable(results){
 const width=Math.max(2,...results.map(result=>result.id.length));
 const lines=[`${'question'.padEnd(width)}  result  kind           cited`,...results.map(result=>`${result.id.padEnd(width)}  ${result.pass?'pass  ':'FAIL  '}  ${(result.kind||'-').padEnd(13)}  ${result.cited.join(', ')||'-'}${result.failures.length?`\n${' '.repeat(width+2)}  - ${result.failures.join('\n'+' '.repeat(width+4)+'- ')}`:''}`)];
 const passed=results.filter(result=>result.pass).length;
 return `${lines.join('\n')}\n\n${passed} of ${results.length} passed`;
}

// Asks every question through the real request handler, so the corpus, prompt and answer parsing are what visitors get.
// `fetcher` is the provider call: the real fetch in the script, a canned reply in tests.
export async function runEval({evalSet,documents,assets,env,fetcher=globalThis.fetch}){
 const results=[];
 for(const [index,entry] of evalSet.questions.entries()){
  // A distinct session and address per question keeps the assistant's rate limits out of the measurement.
  const request=new Request('https://eval.invalid/api/assistant',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':`198.51.100.${index+1}`},body:JSON.stringify({question:entry.question,sessionId:`eval-${index}`})});
  const response=await handleAssistantRequest(request,env,{documents,assets,fetcher});
  results.push(scoreAnswer(entry,response.status,await response.json()));
 }
 return results;
}
