import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stageHomeReturn} from '../dist/home-return-stage.js';
import {neighborPush} from '../dist/placement.js';

class Style{
 get cssText(){return Object.entries(this).map(([key,value])=>`${key}:${value}`).join(';');}
 set cssText(value){for(const key of Object.keys(this))delete this[key];for(const pair of value.split(';').filter(Boolean)){const at=pair.indexOf(':');this[pair.slice(0,at)]=pair.slice(at+1);}}
}
class Node{
 constructor(rect={}){this.rect=rect;this.style=new Style();this.children=[];this.attributes={};}
 setAttribute(key,value){this.attributes[key]=value;}
 append(...nodes){for(const node of nodes){node.remove();this.children.push(node);node.parentNode=this;}}
 before(node){node.remove();const parent=this.parentNode;parent.children.splice(parent.children.indexOf(this),0,node);node.parentNode=parent;}
 replaceWith(node){node.remove();const parent=this.parentNode;parent.children.splice(parent.children.indexOf(this),1,node);node.parentNode=parent;this.parentNode=null;}
 remove(){if(this.parentNode){const children=this.parentNode.children;children.splice(children.indexOf(this),1);this.parentNode=null;}}
 getBoundingClientRect(){return this.rect;}
 querySelectorAll(selector){return selector==='.home-hero'?this.children.filter(node=>node.hero):[];}
 cloneNode(){throw Error('Live cards and canvases must not be cloned');}
}
globalThis.getComputedStyle=node=>({position:node.style.position||node.position||'static',marginTop:'0px',marginBottom:'0px'});
const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
assert(css.includes('.motion-viewport{position:fixed;inset:0;overflow:hidden;contain:paint;'),'The viewport contains paint and scrolling in both axes');
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
assert(app.includes("route==='work'&&wasCard&&!reduce.matches?stageHomeReturn(main):null"));
assert(app.includes('finally{restoreReturningHome?.();'),'The live grid is restored even if the animation is interrupted');

for(const width of [1000,1200,1440])for(const reverse of [false,true]){
 const viewport={width:1920,height:1080},left=(viewport.width-width)/2;
 const body=new Node(),header=new Node(),main=new Node({left,top:-400,width,height:2600}),footer=new Node();main.id='main';main.style.color='inherit';
 const hero=new Node({left,top:112,width:360,height:480});hero.hero=true;hero.position='sticky';hero.style.color='gray';
 const card=new Node(),canvas=new Node();card.append(canvas);main.append(hero,card);body.append(header,main,footer);
 globalThis.document={body,createElement:()=>new Node()};
 const initialCSS=main.style.cssText,heroCSS=hero.style.cssText,restore=stageHomeReturn(main);
 const stage=body.children.find(node=>node.className==='motion-viewport'),placeholder=body.children[1];
 assert.equal(stage.children[0],main);assert.equal(main.id,'main','Content-width and breakout selectors stay active');
 assert.equal(main.style.overflow,'visible','The narrow root cannot clip incoming neighbours');
 assert.equal(main.style.left,left+'px');assert.equal(main.style.width,width+'px');assert.equal(main.style.top,'-400px');
 assert.equal(placeholder.style.height,'2600px','The original page scroll extent stays in flow');
 assert.equal(hero.style.top,'512px','Sticky hero stays at its measured screen position');
 const selected={left,top:300,width:width/2-20,height:500},other={...selected,left:left+width/2+20};
 const push=neighborPush(other,selected,viewport);
 assert.equal(other.left+push.x,1944,'Incoming cards originate outside the screen at every content width');
 assert.equal(card.children[0],canvas,'The live image renderer keeps its identity');
 // Both successful docking and Escape use the same restore path.
 if(reverse)card.style.transform=`translate3d(${push.x}px,0px,0px)`;
 restore();restore();
 assert.deepEqual(body.children,[header,main,footer]);assert.equal(main.style.cssText,initialCSS);assert.equal(hero.style.cssText,heroCSS);assert.equal(card.children[0],canvas);
}
console.log('Home return staging passed: narrow widths, viewport origins, live canvas identity, scroll extent, sticky placement and reversible restoration.');
