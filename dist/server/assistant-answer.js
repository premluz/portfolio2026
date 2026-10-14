import {assistantKnowledge,findCuratedAnswer} from './assistant-knowledge.js';
const normalize=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const words=value=>normalize(value).split(' ').filter(Boolean);
const stop=new Set('a an and are at about can could did do does for from have has he her his how i in is it me my of on or our please prem project projects show some tell the their there these this to us was were what which who with work you your design product products shipped launched live lab role roles result results outcome outcomes impact impacts approach process challenge metric metrics'.split(' '));
const synonyms={iot:['iot','connectivity','connected','sim','telco'],blockchain:['blockchain','web3','defi','traceability'],ai:['ai','agentic','artificial intelligence'],publishing:['publishing','publisher','playstation'],planner:['planner','rios']};
const haystack=(...fields)=>' '+normalize(fields.flat(Infinity).filter(Boolean).join(' '))+' ';
const contains=(text,term)=>text.includes(' '+term+' ');
const expand=word=>synonyms[word]||[word];
const fallback='I couldn’t find a supported answer. Try something else.';
const cited=(store,text,ids)=>store.resolveAnswer({type:'text',text,citations:ids.map(documentId=>({documentId}))});
const sentence=value=>String(value||'').trim().replace(/[.!?]+$/,'');
export const knowledgeById=new Map(assistantKnowledge.facts.map(fact=>[fact.id,fact]));
export function resolvedAnswer(store,text,documentIds=[],knowledgeSourceIds=[],suggestions=[]){
 const ids=[...new Set(documentIds)].filter(id=>store.get(id));
 const cards=ids.filter(id=>store.getCard(id));
 const base=store.resolveAnswer(cards.length?{type:'mixed',text,documentIds:cards,citations:ids.map(documentId=>({documentId}))}:{type:'text',text,citations:ids.map(documentId=>({documentId}))});
 const sources=[...base.sources,...knowledgeSourceIds.map(id=>knowledgeById.get(id)).filter(Boolean).map(({id,title,route})=>({documentId:id,title,route}))];
 return {...base,sources,suggestions:suggestions.slice(0,3)};
}

/** Each response is assembled from published fields and resolved against canonical IDs. */
export function answerPublishedQuestion(question,{store}={}){
 if(typeof question!=='string'||question.length>240)throw new RangeError('Questions must be text of at most 240 characters.');
 const curated=findCuratedAnswer(question);if(curated)return resolvedAnswer(store,curated.text,curated.sourceIds,[],curated.followUps);
 const query=normalize(question),tokens=[...new Set(words(query).filter(word=>!stop.has(word)))];
 if(!query)return cited(store,'Ask me about Prem’s work, roles, or results.',[]);
 const portfolio=store.list({type:'portfolio-item'});
 const has=(re)=>re.test(query);
 const type=has(/\b(roles?|responsibilit\w*|contribut\w*|what did|involvement)\b/)?'role':has(/\b(impacts?|results?|outcomes?|metrics?|improv\w*|achiev\w*|chang\w*|nps)\b/)?'result':has(/\b(approach|process|problem|challenge|key work|how did)\b/)?'approach':'overview';
 const kind=has(/\blab\b/)?'lab':has(/\b(shipped|launched|live)\b/)?'shipped':null;
 if(has(/\b(contact|email|reach|hire|talk to)\b/)){
  const d=store.get('contact');return d?store.resolveAnswer({type:'mixed',text:d.summary||d.title,documentIds:['contact'],citations:[{documentId:'contact'}]}):cited(store,fallback,[]);
 }
 if(has(/\b(who is prem|about prem|background|bio|introduction)\b/)){
  const d=store.get('home');return d?cited(store,d.summary,['home']):cited(store,fallback,[]);
 }
 const named=portfolio.filter(d=>[d.name,d.title,...(d.aliases||[])].some(value=>{const alias=normalize(value);return alias.length>2&&(' '+query+' ').includes(' '+alias+' ');}));
 if(!named.length&&!kind&&has(/\b(years? of experience|how long|current focus|what is your focus)\b/)){
  const d=store.get('home');return d?cited(store,d.summary,['home']):cited(store,fallback,[]);
 }
 if(!named.length&&!kind&&has(/\b(clients?|companies|worked with)\b/)){
  return store.resolveAnswer({type:'mixed',text:'Published work from Prem’s portfolio:',documentIds:portfolio.map(d=>d.id),citations:portfolio.map(d=>({documentId:d.id}))});
 }
 const candidates=(kind?portfolio.filter(d=>d.kind===kind):portfolio).map(d=>{
  const title=haystack(d.name,d.title,d.pageTitle,d.aliases),topics=haystack(d.category,d.domains,d.capabilities,d.tags),body=haystack(d.summary,d.intro,d.context,d.challenge,d.role,d.highlights,d.keyWork,d.impact,d.blocks?.map(b=>[b.title,b.paragraphs]));
  const matched=tokens.filter(token=>expand(token).some(term=>contains(title,term)||contains(topics,term)||contains(body,term)));
  const score=matched.reduce((sum,token)=>sum+Math.max(...expand(token).map(term=>contains(title,term)?9:contains(topics,term)?5:contains(body,term)?2:0)),0);
  return {d,score,matched:matched.length};
 }).filter(({d,score})=>named.length?named.includes(d):tokens.length?score>=Math.max(2,tokens.length*1.5):Boolean(kind)).sort((a,b)=>b.score-a.score||a.d.title.localeCompare(b.d.title));
 const listIntent=has(/\b(show|find|list|examples|portfolio|case studies|which projects|projects in)\b/)||kind||named.length>1;
 if(!candidates.length){
  if(!tokens.length&&has(/\b(projects|portfolio|work)\b/))return store.resolveAnswer({type:'mixed',text:'Explore Prem’s published projects.',documentIds:portfolio.slice(0,5).map(d=>d.id),citations:[]});
  if(tokens.includes('ai')){const home=store.get('home');if(home)return cited(store,'Prem focuses on AI-native experiences, generative interfaces and building in code. His published case studies do not yet describe a specific AI project.',['home']);}
  return cited(store,fallback,[]);
 }
 const selected=candidates.slice(0,listIntent?4:3).map(({d})=>d);
 if(listIntent||!named.length){
  return store.resolveAnswer({type:'mixed',text:kind?`${kind==='lab'?'Lab':'Shipped'} projects from Prem’s portfolio:`:'Related work from Prem’s portfolio:',documentIds:selected.map(d=>d.id),citations:selected.map(d=>({documentId:d.id}))});
 }
 const d=selected[0],fields=type==='role'?[d.role]:type==='result'?[d.highlights,d.impact]:type==='approach'?[d.intro,d.context,d.challenge,d.keyWork]:[d.summary,d.intro,d.context];
 const facts=[...new Set(fields.map(sentence).filter(Boolean))];
 if(!facts.length)return cited(store,fallback,[]);
 const citations=type==='result'?(d.evidence||[]).filter(e=>['highlights','impact'].includes(e.id)).map(e=>({documentId:d.id,evidenceId:e.id})):[{documentId:d.id}];
 return store.resolveAnswer({type:'mixed',text:`${d.name||d.title}: ${facts.join('. ')}.`,documentIds:[d.id],citations});
}

