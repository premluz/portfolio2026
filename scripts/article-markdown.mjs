// An article as one Markdown file: a JSON header fenced by `---` (everything about the document except its id and
// blocks), then the body. No inline Markdown is interpreted; text is stored and shown as plain text.
//
//   ## A heading {#optional-id}      starts a text block; the paragraphs under it (blank-line separated) belong to it
//   plain paragraphs                 the first ones, before any heading, make an untitled text block
//   ::text{id="x" title="T" label="L"}   a text block that needs a label or an id without a heading
//   ::image{media="asset-id" alt="..." caption="..." width="960"}     ::video{media="..." poster="..."}
//   ::section{title="Key work"} ... ::end        groups blocks under a heading; sections nest
//   ::table{id="x"} then | a | b | / | --- | --- | / | cell | cell | rows
//
// The header's "blocks": "below" marks where the body's blocks sit among the document's fields.
// A block without an id gets one from the article's id. Block types not listed here (quote, metric, reference...)
// keep the article as a .json file.
import {BLOCK_WIDTHS} from '../dist/content/model.js';

const ATTRIBUTES={text:['id','title','label'],section:['id','title','label'],table:['id','title','label'],image:['id','title','label','media','alt','caption','width'],video:['id','title','label','media','poster','caption','width']};
const ATTRIBUTE=/\s*(?:([a-z]+)="((?:[^"\\]|\\.)*)"|#([\w-]+))/y;
const HEADING=/^## (.+?)(?: \{#([\w-]+)\})?$/;
const DIRECTIVE=/^::([a-z]+)(?:\{(.*)\})?$/;
export const BLOCKS_MARKER='below';
const unescapeValue=value=>value.replace(/\\(["\\])/g,'$1');
const put=(target,key,value)=>{if(value!==undefined&&value!=='')target[key]=value;return target;};

class BodyParser{
 constructor({file,id,firstLine}){Object.assign(this,{file,id,line:firstLine,root:[],stack:[],opened:[],text:null,paragraph:[],table:null,count:0});this.stack.push(this.root);}
 fail(message,line=this.line){throw new Error(`${this.file}:${line}: ${message}`);}
 add(block){this.stack.at(-1).push(block);return block;}
 nextId(){return `${this.id}-${++this.count}`;}
 attributes(name,source=''){
  const attrs={},allowed=ATTRIBUTES[name];ATTRIBUTE.lastIndex=0;let rest=source.trim();
  while(rest){
   ATTRIBUTE.lastIndex=0;const match=ATTRIBUTE.exec(rest);
   if(!match)this.fail(`Cannot read the attributes of ::${name}: ${source}`);
   const key=match[3]?'id':match[1];
   if(!allowed.includes(key))this.fail(`::${name} has no "${key}" attribute (it takes ${allowed.join(', ')})`);
   attrs[key]=match[3]??unescapeValue(match[2]);rest=rest.slice(match[0].length).trimStart();
  }
  return attrs;
 }
 // Paragraph and table lines are pending until a blank line, a heading or a directive ends them.
 flush(){this.endParagraph();this.endTable();this.text=null;}
 endParagraph(){
  if(!this.paragraph.length)return;
  this.text??=this.add({id:this.nextId(),type:'text',paragraphs:[]});
  this.text.paragraphs.push(this.paragraph.join(' '));this.paragraph=[];
 }
 openText(attrs){
  const block={id:attrs.id||this.nextId(),type:'text'};put(block,'title',attrs.title);put(block,'label',attrs.label);block.paragraphs=[];
  this.text=this.add(block);
 }
 endTable(){
  const table=this.table;if(!table)return;this.table=null;
  const cells=line=>{const inner=line.trim();if(!inner.startsWith('|')||!/(?<!\\)\|$/.test(inner))this.fail('A table row starts and ends with |',table.at);return inner.slice(1,-1).split(/(?<!\\)\|/).map(cell=>cell.trim().replace(/\\\|/g,'|'));};
  const [head,rule,...rows]=table.lines.map(cells);
  if(!head||!rule||!rule.every(cell=>/^:?-{3,}:?$/.test(cell)))this.fail('A table has a header row, then a | --- | --- | row',table.at);
  if(head.length<2||rows.some(row=>row.length!==head.length))this.fail('Every table row has the same number of cells as the header, and at least two',table.at);
  const block={id:table.attrs.id||this.nextId(),type:'table'};put(block,'title',table.attrs.title);put(block,'label',table.attrs.label);
  this.add({...block,columns:head,rows});
 }
 directive(name,source){
  this.flush();
  if(name==='end'){if(this.stack.length===1)this.fail('::end without an open ::section');this.stack.pop();this.opened.pop();return;}
  if(!ATTRIBUTES[name])this.fail(`Unknown block ::${name} (use text, section, image, video, table or end)`);
  const attrs=this.attributes(name,source);
  if(name==='text')this.openText(attrs);
  else if(name==='table')this.table={attrs,lines:[],at:this.line};
  else if(name==='section'){const block={id:attrs.id||this.nextId(),type:'section'};put(block,'title',attrs.title);put(block,'label',attrs.label);block.items=[];this.add(block);this.stack.push(block.items);this.opened.push(this.line);}
  else this.add(this.media(name,attrs));
 }
 media(name,attrs){
  if(!attrs.media)this.fail(`::${name} needs media="asset-id"`);
  if(attrs.width&&!BLOCK_WIDTHS.includes(attrs.width))this.fail(`width must be one of ${BLOCK_WIDTHS.join(', ')}`);
  const block={id:attrs.id||this.nextId(),type:name};put(block,'title',attrs.title);put(block,'label',attrs.label);block.mediaId=attrs.media;
  if(name==='video')put(block,'posterMediaId',attrs.poster);else put(block,'alt',attrs.alt);
  put(block,'caption',attrs.caption);if(attrs.width)block.layout={width:attrs.width};
  return block;
 }
 feed(raw){
  const line=raw.replace(/\s+$/,'');
  if(this.table&&line.startsWith('|')){this.table.lines.push(line);return;}
  const heading=HEADING.exec(line),directive=DIRECTIVE.exec(line);
  // A blank line ends a paragraph or a table but not the text block it belongs to; a heading or directive ends all.
  if(line===''){this.endParagraph();this.endTable();return;}
  if(heading||directive)this.flush();
  if(heading)this.openText({title:heading[1],id:heading[2]});
  else if(directive)this.directive(directive[1],directive[2]);
  else this.paragraph.push(line.trim());
 }
 finish(){
  this.flush();
  if(this.stack.length>1)this.fail('::section is never closed with ::end',this.opened.at(-1));
  return this.root;
 }
}

export function parseArticleMarkdown(text,{file,id}){
 const match=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
 if(!match)throw new Error(`${file}: an article starts with a --- fenced JSON header`);
 let header;try{header=JSON.parse(match[1]);}catch(error){throw new Error(`${file}: the header is not valid JSON`,{cause:error});}
 if(header.id!==undefined&&header.id!==id)throw new Error(`${file}: the id comes from the file name (${id}), not the header`);
 if(header.blocks!==undefined&&header.blocks!==BLOCKS_MARKER)throw new Error(`${file}: write "blocks": "${BLOCKS_MARKER}" in the header and the blocks under it`);
 const parser=new BodyParser({file,id,firstLine:text.slice(0,text.length-match[2].length).split('\n').length});
 match[2].split(/\r?\n/).forEach((line,index)=>{parser.line=parser.line+(index?1:0);parser.feed(line);});
 const blocks=parser.finish();
 // The marker keeps the blocks where the header puts them, so the document reads like its JSON form; without one they come last.
 return {id,...Object.fromEntries(Object.entries({...header,blocks}))};
}
