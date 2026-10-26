import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// lab.html is a hand-kept copy of index.html, and app.js wires controls by id, so a control added to one
// page but not the other crashes app start on that page. The two must expose the same ids.
const ids=html=>new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]));
const [index,lab]=await Promise.all(['index.html','lab.html'].map(file=>readFile(new URL('../dist/'+file,import.meta.url),'utf8')));
const indexIds=ids(index),labIds=ids(lab);
assert.deepEqual([...indexIds].filter(id=>!labIds.has(id)),[],'lab.html has every id index.html has');
assert.deepEqual([...labIds].filter(id=>!indexIds.has(id)),[],'lab.html adds no ids of its own');
assert(lab.includes('data-page-product-display="cards"')&&lab.includes('data-lab-page'),'lab.html keeps its page attributes');
console.log('Lab page passed: same control ids as the home page, own page attributes kept.');
