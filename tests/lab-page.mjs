import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {commandDefinitions} from '../dist/interaction-commands.js';

// The Lab is an in-app route (#lab), not a second HTML page: the home page's cards as an even four-column grid.
// lab.html remains only so old links keep working.
const read=file=>readFile(new URL('../dist/'+file,import.meta.url),'utf8');
const [index,lab,app,menu]=await Promise.all(['index.html','lab.html','app.js','project-menu.js'].map(read));
assert(/<a href="#lab" data-nav="lab">Lab/.test(index),'The Lab link is in the dock and is an in-app route');
assert(!index.includes('lab-transition.js'),'The page does not load the ripple separately; app.js imports it');
assert(lab.includes("location.replace('./#lab')")&&lab.includes('url=./#lab')&&!lab.includes('app.js'),'lab.html only redirects to the in-app route');
assert(app.includes("const LAB_VIEW=Object.freeze({layout:'regular',columns:4,productDisplay:'cards'});"),'The Lab shows four even columns of the cards');
assert(app.includes("'route.lab':()=>activateRoute('lab')"),'The Lab has its own route command');
assert(commandDefinitions.some(command=>command.id==='route.lab'),'The Lab command is in the command catalog');
assert(menu.includes("routeButton('lab','Lab',icons.lab)"),'The site menu opens the Lab in-app');
console.log('Lab route passed: in-app route, four-column cards, dock and menu entries, command, legacy page redirect.');
