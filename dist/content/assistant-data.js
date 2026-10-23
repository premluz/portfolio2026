// Content files hold what visitors see. Assistant-only data (search keywords and any extra cited facts) lives in
// content/assistant.json, keyed by document id and shared by every content set. Facts the page already shows
// (highlights, impact, testimonial quotes) are never written twice: their evidence is generated from the page text.
export const ASSISTANT_FIELDS=Object.freeze(['aliases','domains','capabilities','tags','evidence']);
const FORMAT='prem-assistant-data';
const author={kind:'author-provided'},testimonial={kind:'author-provided',label:'Testimonial supplied by Prem'};
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

export function readAssistantData(value){
 if(value===undefined||value===null)return {};
 if(!plain(value)||value.format!==FORMAT||value.version!==1||!plain(value.documents))throw new Error(`Assistant data must be {format:'${FORMAT}',version:1,documents:{…}}.`);
 for(const [id,entry] of Object.entries(value.documents)){
  if(!plain(entry))throw new Error(`Assistant data for ${id} must be an object.`);
  const unknown=Object.keys(entry).filter(key=>!ASSISTANT_FIELDS.includes(key));
  if(unknown.length)throw new Error(`Assistant data for ${id} has unsupported fields: ${unknown.join(', ')}. Allowed: ${ASSISTANT_FIELDS.join(', ')}.`);
 }
 return value.documents;
}

// Shared assistant data may name documents a given content set does not have; those entries are skipped there.
export function mergeAssistantData(catalog,documents={}){
 return {...catalog,documents:catalog.documents.map(doc=>{
  const entry=documents[doc.id];if(!entry)return doc;
  const both=Object.keys(entry).filter(key=>doc[key]!==undefined);
  if(both.length)throw new Error(`${doc.id} sets ${both.join(', ')} in both the content file and assistant.json; keep one.`);
  return {...doc,...structuredClone(entry)};
 })};
}

function walk(blocks,visit){for(const block of blocks||[]){visit(block);walk(block.items,visit);}}

export function deriveEvidence(catalog){
 return {...catalog,documents:catalog.documents.map(source=>{
  const doc=structuredClone(source),evidence=doc.evidence||[],ids=new Set(evidence.map(item=>item.id));
  const add=item=>{if(!ids.has(item.id)){ids.add(item.id);evidence.push(item);}};
  if(doc.type==='portfolio-item'){
   if(doc.highlights)add({id:'highlights',kind:'statement',text:doc.highlights,provenance:author});
   if(doc.impact)add({id:'impact',kind:'statement',text:doc.impact,provenance:author});
  }
  walk(doc.blocks,block=>{
   if(block.type!=='quote'||block.evidenceIds?.length)return;
   add({id:block.id,kind:'quote',text:block.text,provenance:testimonial});block.evidenceIds=[block.id];
  });
  if(evidence.length)doc.evidence=evidence;
  return doc;
 })};
}

export function prepareCatalog(catalog,assistant){
 return deriveEvidence(mergeAssistantData(catalog,readAssistantData(assistant)));
}
