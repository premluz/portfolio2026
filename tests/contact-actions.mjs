import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {copyContactEmail,mountContactEmailCopy} from '../dist/contact-actions.js';

let copied;const notices=[];
const notify=(text,options)=>notices.push({text,...options});
assert(await copyContactEmail(notify,{writeText:async value=>copied=value}));
assert.equal(copied,['prem.luczak','gmail.com'].join('@'));assert.equal(notices.at(-1).text,'Copied to clipboard');
const warnings=[],warn=console.warn;console.warn=(...args)=>warnings.push(args);
try{
 assert.equal(await copyContactEmail(notify,{writeText:async()=>{throw Error('Permission denied');}}),false);
 assert.equal(notices.at(-1).tone,'error');assert.equal(warnings.length,1);
}finally{console.warn=warn;}
const source=await readFile(new URL('../dist/contact-actions.js',import.meta.url),'utf8');
assert(!source.includes(copied),'The public module does not contain the readable contact address');
let handler,removed=false,prevented=false;
const root={addEventListener:(type,fn)=>handler=fn,removeEventListener:()=>removed=true};
const originalNavigator=globalThis.navigator;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async value=>copied=value}}});
try{
 const dispose=mountContactEmailCopy(root,notify);
 handler({target:{closest:()=>({})},preventDefault:()=>prevented=true});await Promise.resolve();
 assert(prevented);assert.equal(copied,['prem.luczak','gmail.com'].join('@'));dispose();assert(removed);
}finally{Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator});}
console.log('Contact actions passed: exact clipboard value, encoded public source, delegated copy and visible permission failures.');
