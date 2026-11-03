// The inverse of parseArticleMarkdown: an article document as Markdown. It refuses anything the Markdown form cannot
// carry exactly (other block types, extra fields, text with line breaks), so converting never loses content silently.
import {BLOCKS_MARKER} from './article-markdown.mjs';
const BLOCK_KEYS={
 text:['id','type','title','label','paragraphs'],section:['id','type','title','label','items'],table:['id','type','title','label','columns','rows'],
 image:['id','type','title','label','mediaId','alt','caption','layout'],video:['id','type','title','label','mediaId','posterMediaId','caption','layout']
};
const fail=(block,message)=>{throw new Error(`Block "${block.id}" (${block.type}) cannot be written as Markdown: ${message}`);};
const plain=(block,value,what)=>{
 if(typeof value!=='string'||value!==value.trim()||/[\r\n]/.test(value)||value==='')fail(block,`${what} must be one trimmed line of text`);
 return value;
};
const quote=(block,value,what)=>`"${plain(block,value,what).replace(/(["\\])/g,'\\$1')}"`;
const attributes=(block,pairs)=>pairs.filter(([,value])=>value!==undefined).map(([name,value])=>`${name}=${quote(block,value,name)}`).join(' ');

function checkKeys(block){
 const allowed=BLOCK_KEYS[block.type];
 if(!allowed)fail(block,'only text, section, image, video and table blocks are supported; keep this article as .json');
 const extra=Object.keys(block).filter(key=>!allowed.includes(key));
 if(extra.length)fail(block,`it has ${extra.join(', ')}, which Markdown does not carry`);
 if(block.layout&&(Object.keys(block.layout).join()!=='width'))fail(block,'only layout.width is supported');
}
function paragraph(block,text){
 plain(block,text,'a paragraph');
 if(/^(## |::|\|)/.test(text))fail(block,`a paragraph cannot start with "${text.slice(0,2)}"`);
 return text;
}
const cell=(block,value)=>plain(block,value,'a table cell').replace(/\|/g,'\\|');
const row=(block,cells)=>`| ${cells.map(value=>cell(block,value)).join(' | ')} |`;

function formatText(block){
  const titled=block.title!==undefined&&block.label===undefined;
  if(titled){plain(block,block.title,'the title');if(/ \{#[\w-]+\}$/.test(block.title))fail(block,'the title ends like an id marker');}
  const head=titled?`## ${block.title} {#${block.id}}`:`::text{${attributes(block,[['id',block.id],['title',block.title],['label',block.label]])}}`;
  return [head,...block.paragraphs.map(text=>paragraph(block,text))].join('\n\n');
}
function formatBlock(block){
 checkKeys(block);
 const labelled=[['id',block.id],['title',block.title],['label',block.label]];
 if(block.type==='text')return formatText(block);
 if(block.type==='section')return [`::section{${attributes(block,labelled)}}`,...block.items.map(formatBlock),'::end'].join('\n\n');
 if(block.type==='table')return [`::table{${attributes(block,labelled)}}`,[row(block,block.columns),row(block,block.columns.map(()=>'---')),...block.rows.map(cells=>row(block,cells))].join('\n')].join('\n');
 const media=[['media',block.mediaId],block.type==='video'?['poster',block.posterMediaId]:['alt',block.alt],['caption',block.caption],['width',block.layout?.width]];
 return `::${block.type}{${attributes(block,[...labelled,...media])}}`;
}

export function formatArticleMarkdown(doc){
 const {id,blocks}=doc;
 if(!Array.isArray(blocks))throw new Error(`Article ${id} has no blocks`);
 const header=Object.fromEntries(Object.entries(doc).filter(([key])=>key!=='id').map(([key,value])=>[key,key==='blocks'?BLOCKS_MARKER:value]));
 return `---\n${JSON.stringify(header,null,2)}\n---\n\n${blocks.map(formatBlock).join('\n\n')}\n`;
}
