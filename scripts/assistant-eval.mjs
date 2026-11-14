// Golden questions against the real model. It costs money and needs keys, so it is not part of `npm run check`.
// Run: node --env-file=.env scripts/assistant-eval.mjs   (this script reads process.env only, never a file)
import fs from 'node:fs/promises';
import {validateEval,runEval,formatTable} from './assistant-eval-core.mjs';

const REQUIRED=[['AI_API_BASE_URL'],['AI_API_KEY','OPENAI_API_KEY'],['AI_MODEL']];
const missing=REQUIRED.filter(names=>!names.some(name=>process.env[name])).map(names=>names.join(' or '));
if(missing.length){
 console.error(`Cannot run the golden questions: missing ${missing.join(', ')}.\nSet them in the environment, for example: node --env-file=.env scripts/assistant-eval.mjs`);
 process.exit(2);
}
let content;
try{content=await import('../dist/server/content.js');}
catch(error){console.error('Cannot load dist/server/content.js; run npm run build first.',error);process.exit(2);}
const evalSet=JSON.parse(await fs.readFile(new URL('../content/assistant-eval.json',import.meta.url),'utf8'));
validateEval(evalSet,new Set(content.publishedAssistantDocuments.map(document=>document.id)));

const results=await runEval({evalSet,documents:content.publishedAssistantDocuments,assets:content.publishedAssistantAssets,env:process.env});
console.log(formatTable(results));
if(results.some(result=>!result.pass))process.exit(1);
