import assert from 'node:assert/strict';
import {content} from '../dist/content/local.js';
import {answerPublishedQuestion,describeProject,previousProjectIds} from '../dist/assistant-answer.js';
import {handleAssistantRequest,resetAssistantRateLimitsForTests} from '../worker/assistant-core.mjs';
import {catalog} from '../dist/content/catalog.js';

const ask=(question,history=[])=>answerPublishedQuestion(question,{store:content,history});
const shown=answer=>(answer.cards||[]).map(card=>card.documentId||card.id);
const turn=answer=>({role:'assistant',text:answer.text,documentIds:shown(answer)});

// A list answer gives each project a name and one or two sentences, not only cards.
const list=ask('What AI projects Prem worked on'),projects=shown(list);
assert(projects.length>=2,'The list finds several AI projects');
for(const id of projects){const project=content.get(id);assert(list.text.includes(describeProject(project)),`${id} is described in the answer`);}
for(const part of list.text.split('\n\n').slice(1))assert((part.match(/[.!?](\s|$)/g)||[]).length<=3,'Each description stays at one or two sentences');
assert(list.text.startsWith('Related work from Prem’s portfolio:'));

// "Describe each" after a list answers about those projects, in more detail.
const history=[{role:'user',text:'What AI projects Prem worked on'},turn(list)];
const each=ask('Describe each',history);
assert.deepEqual(shown(each),projects,'The follow-up keeps the same projects');
assert(each.text.length>list.text.length,'Each description is a little deeper than the list');
assert(!each.text.includes('couldn’t find'),'A follow-up is not a miss');
assert.equal(ask('Describe each').text.includes('couldn’t find'),true,'Without chat context there is nothing to point at');

// Ordinals and single-project asks resolve against the previous answer.
assert.deepEqual(shown(ask('tell me about the last one',history)),[projects.at(-1)]);
assert.deepEqual(shown(ask('what about the first one',history)),[projects[0]]);
const role=ask('what was his role in the second one',history);
assert.deepEqual(shown(role),[projects[1]]);assert(role.text.startsWith(content.get(projects[1]).name||content.get(projects[1]).title));

// A named project or a fresh topic is never hijacked by an earlier answer.
assert.deepEqual(shown(ask('What did Prem do at Bastion',[turn(list)])),['bastion']);
assert.deepEqual(previousProjectIds([{role:'assistant',text:'x',documentIds:['knowledge-focus','home']}],content),[],'Only portfolio projects count as context');
assert.deepEqual(previousProjectIds([],content),[]);

// The model path tells the model which projects the last answer showed, since its text never names them.
const env={AI_API_BASE_URL:'https://models.example/v1',AI_API_KEY:'test-only-secret',AI_MODEL:'small-model'};
let captured;
const fetcher=async(url,options)=>{captured=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'Porter tracks agents.',sourceIds:['porter']})}}]}),{headers:{'content-type':'application/json'}});};
resetAssistantRateLimitsForTests();
const body=JSON.stringify({question:'Describe each',sessionId:'follow-up',history:[{role:'user',text:'What AI projects Prem worked on'},{role:'assistant',text:'Related work from Prem’s portfolio:',documentIds:['porter','bastion','not-a-document',42]}]});
const response=await handleAssistantRequest(new Request('https://portfolio.example/api/assistant',{method:'POST',headers:{'content-type':'application/json',origin:'https://portfolio.example','cf-connecting-ip':'198.51.100.77'},body}),env,{documents:catalog.documents,fetcher});
assert.equal(response.status,200);
const prompt=JSON.parse(captured.messages[1].content);
assert.deepEqual(prompt.history[1].shownProjects,['Porter','Bastion'],'Earlier cards are named for the model; unknown ids are dropped');
assert(captured.messages[0].content.includes('shownProjects')&&captured.messages[0].content.includes('one or two sentences'),'The model is told to use them and to give each project context');
assert.equal(captured.max_tokens,420);

// With no model configured, the published fallback still understands the chat.
resetAssistantRateLimitsForTests();
const offline=await handleAssistantRequest(new Request('https://portfolio.example/api/assistant',{method:'POST',headers:{'content-type':'application/json',origin:'https://portfolio.example','cf-connecting-ip':'198.51.100.78'},body}),{},{documents:catalog.documents});
const offlineBody=await offline.json();
assert(offlineBody.documentIds.includes('porter')&&offlineBody.documentIds.includes('bastion')&&!offlineBody.text.includes('couldn’t find'),'The server fallback answers the follow-up from the chat context');
console.log('Assistant follow-ups passed: described lists, "describe each", ordinals, model context and offline fallback.');
