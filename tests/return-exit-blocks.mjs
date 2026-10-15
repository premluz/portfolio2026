import assert from 'node:assert/strict';
const {returnExitBlocks}=await import('../dist/liquid-surface.js').catch(error=>{throw new Error('liquid-surface must import in Node for this test: '+error.message);});

const node=(name,top,left=0,classes=[])=>({name,classes,getBoundingClientRect:()=>({top,left}),matches:selector=>selector.split(',').some(item=>classes.includes(item.trim().slice(1)))});
const skin=node('skin',0,0,['liquid-skin']),client=node('client',10),title=node('title',30),summary=node('summary',90),layout=node('layout',160,0,['detail-layout']),media=node('media',160,0,['detail-media-column']),description=node('description',160,600,['description']),actions=node('actions',500),factA=node('context',160,600),factB=node('challenge',260,600),factC=node('role',160,900);
const root={querySelectorAll:()=>[skin,client,title,summary,layout,media,actions,description,factA,factB,factC],children:[skin,client,title,summary,layout]};
assert.deepEqual(returnExitBlocks(root).map(item=>item.name),['client','title','summary','context','role','challenge','actions'],'Every fact and paragraph exits on its own, in reading order; wrappers and the image stay out');
assert.deepEqual(returnExitBlocks({querySelectorAll:()=>[],children:[skin,title,summary]}).map(item=>item.name),['title','summary'],'Pages without facts stagger their direct blocks');
console.log('Return exit blocks passed: leaf facts, reading order, skipped wrappers and image.');
