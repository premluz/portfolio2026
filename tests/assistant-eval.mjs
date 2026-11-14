import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateEval,scoreAnswer,formatTable,runEval} from '../scripts/assistant-eval-core.mjs';
import {resetAssistantRateLimitsForTests} from '../worker/assistant-core.mjs';
import {publishedAssistantDocuments,publishedAssistantAssets} from '../dist/server/content.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const evalSet=JSON.parse(await fs.readFile(new URL('../content/assistant-eval.json',import.meta.url),'utf8'));
const published=new Set(publishedAssistantDocuments.map(document=>document.id));

// The seed file is valid against the published documents, and says it is a seed for the owner to extend.
assert.doesNotThrow(()=>validateEval(evalSet,published));
assert.equal(evalSet.questions.length,10,'Ten seed questions');
assert(/owner/i.test(evalSet.review)&&/30/.test(evalSet.review),'The file asks the owner to review and extend it to 30 or more');

// Scoring: each rule on its own.
const entry={id:'q',question:'?',kind:'grounded',mustCite:['tracr'],mustNotClaim:['red dot']};
const answer=(extra={})=>({kind:'grounded',text:'Tracr cut navigation.',spoken:'Tracr cut navigation.',documentIds:['tracr'],...extra});
assert.deepEqual(scoreAnswer(entry,200,answer()),{id:'q',pass:true,kind:'grounded',cited:['tracr'],failures:[]});
assert.deepEqual(scoreAnswer(entry,200,answer({documentIds:[]})).failures,['did not cite tracr']);
assert.deepEqual(scoreAnswer(entry,200,answer({kind:'general'})).failures,['kind general is not grounded']);
assert.deepEqual(scoreAnswer(entry,200,answer({text:'He won a RED DOT.'})).failures,['claimed "red dot"'],'Forbidden phrases match case-insensitively');
assert.deepEqual(scoreAnswer(entry,200,answer({spoken:'A Red Dot winner.'})).failures,['claimed "red dot"'],'The spoken line counts too');
assert.equal(scoreAnswer({...entry,kind:['unknown','grounded']},200,answer({kind:'unknown'})).pass,true,'A list of kinds accepts any of them');
assert.equal(scoreAnswer({...entry,kind:undefined},200,answer({kind:'general'})).pass,true,'No kind means any kind');
const fallback=scoreAnswer(entry,502,{error:'model_unavailable',responseMode:'published-fallback',text:'Tracr.',documentIds:['tracr']});
assert.equal(fallback.pass,false);assert.match(fallback.failures[0],/no live model answer \(HTTP 502, model_unavailable\)/,'The offline fallback is not credited as a model answer');
assert.equal(scoreAnswer(entry,200,{responseMode:'published-fallback'}).pass,false,'A fallback is a failure even with a 200');

// Validation fails loudly.
const bad=mutate=>{const copy=structuredClone(evalSet);mutate(copy);assert.throws(()=>validateEval(copy,published),/assistant-eval\.json is invalid/);return copy;};
bad(copy=>{copy.questions[0].mustCite=['no-such-document'];});
bad(copy=>{copy.questions[1].id=copy.questions[0].id;});
bad(copy=>{copy.questions[0].kind='sarcastic';});
bad(copy=>{copy.questions[0].question=' ';});
bad(copy=>{delete copy.questions[0].mustNotClaim;});
bad(copy=>{copy.questions=[];});

// A whole run through the real request handler with a mocked provider: it cites what the mock says, so one question is made to fail.
const REPLIES={'no-awards':{answer:'The site does not mention any award.',sourceIds:[],kind:'unknown'},'no-salary':{answer:'Prem expects a salary of 100k.',sourceIds:[],kind:'unknown'}};
const idsByQuestion=new Map(evalSet.questions.map(question=>[question.question,question]));
const fetcher=async(url,options)=>{
 const asked=JSON.parse(JSON.parse(options.body).messages[2].content).question,question=idsByQuestion.get(asked);
 const reply=REPLIES[question.id]||{answer:`Answer for ${question.id}.`,sourceIds:question.mustCite,kind:'grounded'};
 return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({requirements:[],...reply})}}]}),{headers:{'content-type':'application/json'}});
};
resetAssistantRateLimitsForTests();
const results=await runEval({evalSet,documents:publishedAssistantDocuments,assets:publishedAssistantAssets,env:{AI_API_BASE_URL:'https://models.example/v1',AI_API_KEY:'test-only',AI_MODEL:'mock'},fetcher});
assert.equal(results.length,10,'Every question was asked, with no rate-limit interference');
assert.deepEqual(results.filter(result=>!result.pass).map(result=>result.id),['no-salary'],'Only the answer that claims a salary fails');
assert.deepEqual(results.find(result=>result.id==='tracr-simplify').cited,['tracr'],'Cited documents come from the handler response');
const table=formatTable(results);
assert(table.includes('9 of 10 passed'),'The table totals the run');
assert(table.includes('claimed "expects a salary of"'),'and names the failing claim');
assert.equal(table.split('\n').filter(line=>/^\S.* {2}pass {2}/.test(line)).length,9,'Nine pass rows');

// Without keys: a clear message and a non-zero status, and the script never reads a file for them.
const env={...process.env};for(const name of ['AI_API_KEY','OPENAI_API_KEY','AI_API_BASE_URL','AI_MODEL'])delete env[name];
const run=spawnSync(process.execPath,['scripts/assistant-eval.mjs'],{cwd:root,env,encoding:'utf8'});
assert.equal(run.status,2,'Exit status 2 without keys');
assert(/missing AI_API_BASE_URL, AI_API_KEY or OPENAI_API_KEY, AI_MODEL/.test(run.stderr),'The message names the missing variables');
const source=await fs.readFile(new URL('../scripts/assistant-eval.mjs',import.meta.url),'utf8');
assert(!/readFile\([^)]*\.env/.test(source)&&source.includes('process.env'),'It uses process.env only');

console.log('Assistant eval passed: seed file valid, scoring rules, loud validation, a mocked end-to-end run, and a clear failure without keys.');
