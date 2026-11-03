import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {captionTravelTargets,captionRevealLines} from '../dist/caption-travel.js';
import {visibleClone} from '../dist/shared-copy.js';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=name=>readFile(new URL(`../dist/${name}`,import.meta.url),'utf8');
const line=(name,textContent)=>({textContent,classList:{contains:value=>value===`detail-caption-${name}`}});
const detail=lines=>({querySelector:selector=>selector===':scope > .detail-caption'?{children:lines}:null});
const source=(textContent,hidden=false)=>({node:{textContent},hidden});

// Company · year on the card: its title and that line travel; the intro and the results only the page has stagger in.
const withLead=[line('title','Web3 film platform'),line('lead','Gala · 2025'),line('intro','I designed a platform'),line('results','End-to-end 0 → 1')];
const targets=captionTravelTargets({client:source('Gala',true),title:source('Web3 film platform'),summary:source(' Gala ·  2025 ')},detail(withLead));
assert.deepEqual([...targets.keys()],['title','summary'],'Only the lines the card shows travel; a hidden company never does');
assert.equal(targets.get('title').index,0);assert.equal(targets.get('summary').index,1);
assert.deepEqual(captionRevealLines(detail(withLead)).map(item=>item.textContent),['I designed a platform','End-to-end 0 → 1'],'With travel on, the intro and the results stagger in');
assert.equal(captionRevealLines(detail(withLead),false).length,4,'With travel off, every caption line staggers in');

// Results on the card (no company · year): the results line travels and only the intro staggers in.
const withResults=[line('title','Blockchain traceability'),line('intro','Tracr brought me in'),line('results','Design System 0→1')];
assert.deepEqual([...captionTravelTargets({title:source('Blockchain traceability'),summary:source('Design System 0→1')},detail(withResults)).values()].map(item=>item.index),[0,2]);
assert.deepEqual(captionRevealLines(detail(withResults)).map(item=>item.textContent),['Tracr brought me in']);
assert.equal(captionTravelTargets({title:source('A different card title')},detail(withResults)).size,0,'Text the page does not repeat is not carried');
assert.deepEqual(captionRevealLines(null),[],'Pages without a caption add no reveal steps');

// The moving copy drops parts the card does not paint, such as the company hidden inside its heading.
const element=(rendered,children=[])=>{const node={rendered,children,tagName:'SPAN',removed:false,remove(){this.removed=true;},getClientRects:()=>rendered?[{}]:[]};return node;};
const hiddenClient=element(false),titleText=element(true),copies=[element(false),element(true)];
const heading={querySelectorAll:()=>[hiddenClient,titleText],cloneNode:()=>({querySelectorAll:()=>copies})};
visibleClone(heading);
assert(copies[0].removed&&!copies[1].removed,'The hidden company is removed from the copy and the title stays');

const [app,html,transfer,surface,reveal]=await Promise.all(['app.js','index.html','settings-transfer.js','liquid-surface.js','detail-content-reveal.js'].map(read));
assert(html.includes('<input id="cardTextTravel" type="checkbox" checked>'),'The Motion switch is on, as the current behaviour');
assert.equal(DEFAULT_STORAGE_VALUES['prem-card-text-travel'],'true');
assert(transfer.includes("cardTextTravel:'prem-card-text-travel'"),'The switch is exported and imported with the settings');
assert(app.includes("dataset.cardText=cardTextTravel?'travel':'stagger'")&&app.includes('textTravel:cardTextTravel'),'The root mode and the morph read the same switch');
assert(app.includes('shared[key]={node:visibleClone(node),')&&app.includes('!node.getClientRects().length'),'Card copy is captured as painted');
assert(surface.includes('fadeCardCopy=!cardEntry||textTravel'),'With travel off the card copy is not faded out separately');
assert(reveal.includes("dataset?.cardText!=='stagger'"),'The reveal reads the same root mode');
assert(surface.includes('placeCaptions(a.left,a.top);')&&surface.includes('placeCaptions(x,y);')&&app.includes("captionRect:el.querySelector(':scope > .detail-caption')?.getBoundingClientRect()"),'The caption is pinned to the live page from the first staged frame, entering and leaving');
assert(surface.includes('...placedPadding(to)})')&&surface.includes("margin:'0',...from.padding})")&&app.includes('padding:placedPadding(el),'),'Both morph copies keep the padding main gives the live page, so text wraps the same and the column sits at its landed place');
assert(surface.includes('const incomingDrift=cardEntry?1:.12;'),'A project page opened from a card is held at its final place; only the picture travels');
assert(surface.includes('if(fadeCardCopy&&!travel.has(key)&&!source.hidden){')&&surface.includes('const target=independentReturn?sharedCopyNode(to,key):null;if(target?.getClientRects().length){'),'Card text the card hides gets no copy in either direction, so nothing lands at the top-left corner');
console.log('Card text travel passed: travelling lines, staggered lines in both modes, hidden parts dropped, and the setting wiring.');
