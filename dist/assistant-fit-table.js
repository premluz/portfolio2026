import {knowledgeById} from './assistant-answer.js';

// A role brief answered as a table: one row per requirement, its fit, and the published evidence behind it.
// The model only names records by id; labels and links come from the site's own content.
export const fitStatuses=Object.freeze({
 covered:{label:'Covered',icon:'<circle cx="12" cy="12" r="8"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/>'},
 partial:{label:'Partly',icon:'<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/>'},
 missing:{label:'Not shown',icon:'<circle cx="12" cy="12" r="8" stroke-dasharray="2.5 2.5"/>'}
});
// Home sections that evidence can point at, by the component that holds them.
const homeSections={'home-about':'about','home-approach':'approach','home-services':'services','home-testimonials':'testimonials','home-writing':'writing'};

export function evidenceLink(entry,store){
 const doc=store.get(entry.sourceId);
 if(doc?.type==='portfolio-item')return {kind:'project',label:doc.client||doc.name||doc.title,href:'#'+doc.id};
 if(entry.sourceId==='home-testimonials'&&entry.quoteId){
  const quote=doc?.blocks?.find(block=>block.id===entry.quoteId);
  if(quote)return {kind:'testimonial',label:quote.attribution,detail:quote.label||'',quote:quote.text,href:'#work',section:'testimonials'};
 }
 if(homeSections[entry.sourceId])return {kind:'section',label:doc?.title||'Home',href:'#work',section:homeSections[entry.sourceId]};
 if(doc?.type==='page')return {kind:'page',label:doc.name||doc.title,href:doc.id==='home'?'#work':'#'+doc.id};
 const fact=knowledgeById.get(entry.sourceId);
 if(fact)return {kind:'fact',label:fact.title,href:fact.route||null};
 return doc?{kind:'other',label:doc.title,href:null}:null;
}

// The browser re-checks what it renders or restores from history: known statuses and records only, bounded sizes.
export function readRequirements(value,store,{limit=16}={}){
 if(!Array.isArray(value))return [];
 return value.slice(0,limit).filter(item=>typeof item?.requirement==='string'&&item.requirement.trim()&&Object.hasOwn(fitStatuses,item.status)).map(item=>({
  requirement:item.requirement.slice(0,90),status:item.status,note:typeof item.note==='string'?item.note.slice(0,120):'',
  evidence:(Array.isArray(item.evidence)?item.evidence:[]).slice(0,3).filter(entry=>typeof entry?.sourceId==='string'&&(store.get(entry.sourceId)||knowledgeById.has(entry.sourceId))).map(entry=>({sourceId:entry.sourceId,quoteId:typeof entry.quoteId==='string'?entry.quoteId:''}))
 }));
}
const icon=path=>`<svg aria-hidden="true" viewBox="0 0 24 24">${path}</svg>`;
function cell(tag,className){const el=document.createElement(tag);if(className)el.className=className;return el;}

export function fitTable(requirements,{store}){
 const wrap=cell('div','ask-fit'),table=cell('table','ask-fit-table'),head=cell('thead'),body=cell('tbody');
 const headRow=cell('tr');for(const label of ['Requirement','Fit','Evidence']){const th=cell('th');th.scope='col';th.textContent=label;headRow.append(th);}
 head.append(headRow);
 for(const item of requirements){
  const status=fitStatuses[item.status]||fitStatuses.missing,row=cell('tr');row.dataset.fitStatus=item.status;
  const requirement=cell('td','ask-fit-requirement'),name=cell('span','ask-fit-name');name.textContent=item.requirement;requirement.append(name);
  if(item.note){const note=cell('span','ask-fit-note');note.textContent=item.note;requirement.append(note);}
  const fit=cell('td','ask-fit-status');const mark=cell('span','ask-fit-icon');mark.innerHTML=icon(status.icon);const word=cell('span');word.textContent=status.label;fit.append(mark,word);
  const evidence=cell('td','ask-fit-evidence'),seen=new Set();
  for(const entry of item.evidence){
   const link=evidenceLink(entry,store),key=link&&link.label+link.href;if(!link||seen.has(key))continue;seen.add(key);
   const el=cell(link.href?'a':'span','ask-fit-source');el.dataset.evidenceKind=link.kind;el.textContent=link.kind==='testimonial'?`Testimonial · ${link.label}`:link.label;
   if(link.href)el.href=link.href;if(link.section)el.dataset.scrollSection=link.section;
   if(link.quote)el.dataset.tooltip=`“${link.quote}”${link.detail?' — '+link.detail:''}`;
   evidence.append(el);
  }
  if(!evidence.childNodes.length)evidence.textContent='—';
  row.append(requirement,fit,evidence);body.append(row);
 }
 table.append(head,body);
 const covered=requirements.filter(item=>item.status==='covered').length,partial=requirements.filter(item=>item.status==='partial').length;
 const summary=cell('p','ask-fit-summary');summary.textContent=`${covered} of ${requirements.length} covered${partial?`, ${partial} partly`:''}`;
 wrap.append(summary,table);
 return wrap;
}
