// Parsing for project memory documents: a small front-matter subset, and the items that carry stable IDs.
// An item is a heading such as `### TASK-004 Title` followed directly by `- Key: value` bullets.
import {createHash} from 'node:crypto';

export const hash=text=>createHash('sha1').update(text).digest('hex');
const KINDS={REQ:'requirement',TASK:'task',ADR:'decision',FACT:'fact',Q:'question'};
export const kindOf=id=>KINDS[id.split('-')[0]];
export const ID_SOURCE='(?:REQ|TASK|ADR|FACT|Q)-\\d{3}';
const ITEM_HEADING=new RegExp(`^(#{2,4}) (${ID_SOURCE})\\s+(.+?)\\s*$`);
const ANY_HEADING=/^#{1,6} /;
const BULLET=/^- ([A-Za-z][A-Za-z ]*): (.*)$/;
const LINK=/\[[^\]]*\]\(([^)\s]+)\)/g;
const FRONT_LISTS=new Set(['tags','related']);
const ITEM_LISTS=new Set(['depends','tags','related']);

const unquote=value=>value.replace(/^(['"])(.*)\1$/,'$2');
const splitList=(raw,separator)=>{const inner=raw.trim().replace(/^\[|\]$/g,'').trim();return inner?inner.split(separator).map(part=>unquote(part.trim())).filter(Boolean):[];};

/** {data, errors, bodyStart}: data is null when the document has no front matter. */
export function parseFrontMatter(text){
 if(!text.startsWith('---\n'))return {data:null,errors:[],bodyStart:0};
 const lines=text.split('\n'),close=lines.indexOf('---',1);
 if(close<0)return {data:null,errors:['front matter is not closed with ---'],bodyStart:0};
 const data={},errors=[];
 for(const [offset,line] of lines.slice(1,close).entries()){
  const match=line.match(/^([A-Za-z_]+):\s*(.*)$/);
  if(!match){if(line.trim())errors.push(`line ${offset+2}: expected "key: value"`);continue;}
  data[match[1]]=FRONT_LISTS.has(match[1])?splitList(match[2],','):unquote(match[2].trim());
 }
 return {data,errors,bodyStart:close+1};
}

// Returns the fields and the 0-based indexes of the bullet lines that held them.
function readFields(lines,from){
 const fields={},used=[];let index=from;
 while(index<lines.length&&lines[index].trim()==='')index++;
 for(;index<lines.length;index++){
  const match=lines[index].match(BULLET);if(!match)break;
  const key=match[1].toLowerCase().replace(/ /g,'_');
  fields[key]=key==='verifies'?splitList(match[2],';'):ITEM_LISTS.has(key)?splitList(match[2],','):match[2].trim();
  used.push(index);
 }
 return {fields,used};
}

/** Items, ID mentions and relative links in a document body, skipping fenced code. Line numbers are 1-based. */
export function scanBody(text,bodyStart=0){
 const lines=text.split('\n'),items=[],mentions=[],links=[],fieldLines=new Set();
 let fenced=false;
 for(let index=bodyStart;index<lines.length;index++){
  const line=lines[index];
  if(line.startsWith('```')){fenced=!fenced;continue;}
  if(fenced)continue;
  const heading=line.match(ITEM_HEADING);
  if(heading){
   const {fields,used}=readFields(lines,index+1);
   for(const lineIndex of used)fieldLines.add(lineIndex);
   items.push({id:heading[2],kind:kindOf(heading[2]),title:heading[3],line:index+1,level:heading[1].length,fields});
  }else if(!fieldLines.has(index))for(const id of line.matchAll(new RegExp(`\\b${ID_SOURCE}\\b`,'g')))mentions.push({id:id[0],line:index+1});
  for(const link of line.matchAll(LINK))links.push({target:link[1],line:index+1});
 }
 for(const item of items){
  let end=lines.length;
  for(let index=item.line;index<lines.length;index++)if(ANY_HEADING.test(lines[index])){end=index;break;}
  item.end=end;
 }
 return {items,mentions,links};
}
