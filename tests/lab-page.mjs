import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {commandDefinitions} from '../dist/interaction-commands.js';
import {LAB_RIPPLE} from '../dist/motion-tokens.js';

// The Lab is an in-app route (#lab), not a second HTML page: the home page's cards as an even four-column grid.
// lab.html remains only so old links keep working.
const read=file=>readFile(new URL('../dist/'+file,import.meta.url),'utf8');
const [index,lab,app,menu]=await Promise.all(['index.html','lab.html','app.js','project-menu.js'].map(read));
assert(/<a href="#lab" data-nav="lab">Lab/.test(index),'The Lab link is in the dock and is an in-app route');
assert(!index.includes('lab-transition.js'),'The page does not load the ripple separately; app.js imports it');
assert(lab.includes("location.replace('./#lab')")&&lab.includes('url=./#lab')&&!lab.includes('app.js'),'lab.html only redirects to the in-app route');
assert(app.includes("function labView(){return {layout:labSettings.layout,columns:labSettings.columns,productDisplay:'cards',featuredLarger:labSettings.featuredLarger};}"),'The Lab takes its grid from the Lab settings');
for(const id of ['featuredLarger','labLayout','labColumns','labFeaturedLarger','labCardDetails'])assert(index.includes(`id="${id}"`),`The dev settings have ${id}`);
assert(app.includes("'route.lab':()=>activateRoute('lab')"),'The Lab has its own route command');
assert(app.includes('if(ripple)void ripple.click();')&&app.includes('if(ripple&&LAB_RIPPLE.landing)void Promise.resolve(landing?.finished).then(()=>ripple.land());')&&!app.includes('await ripple'),'A short ring answers the click without delaying the transition, and the landing ring is behind LAB_RIPPLE.landing');
assert.equal(LAB_RIPPLE.landing,false,'Only the click ring runs for now');
assert(app.includes("const showBackControl=route=>route==='assistant'||projectIds.includes(route);"),'About and Contact, being dock menu items, get no Back pill');
assert(index.indexOf('data-nav="work"')<index.indexOf('data-nav="lab"')&&index.indexOf('data-nav="lab"')<index.indexOf('data-nav="about"'),'Lab sits right after Work in the dock');
assert(menu.indexOf("routeButton('work'")<menu.indexOf("routeButton('lab'")&&menu.indexOf("routeButton('lab'")<menu.indexOf("routeButton('about'"),'Lab sits right after Home in the site menu');
assert(commandDefinitions.some(command=>command.id==='route.lab'),'The Lab command is in the command catalog');
assert(menu.includes("routeButton('lab','Lab',icons.lab)"),'The site menu opens the Lab in-app');
{const {LAB_HEADING,labHeadingMarkup}=await import('../dist/lab-page.js');const css=await read('lab.css');
assert.deepEqual({...LAB_HEADING},{title:'Experiments',eyebrow:'Work in progress',summary:'Prototypes, R&D and projects that never made it to market.'},'The Lab is titled Experiments');
assert(labHeadingMarkup().startsWith('<section class="lab-heading" aria-labelledby="labTitle"><h1 id="labTitle" tabindex="-1">Experiments</h1>'),'The heading is a real page heading');
assert(css.includes('main.lab-canvas .homepage-layout>:not(.lab-heading,.home-work){display:none}'),'The Lab shows only its heading and the grid, not the home hero or sections');
assert(app.includes("if(labMode)main.querySelector('.homepage-layout').insertAdjacentHTML('afterbegin',labHeadingMarkup());"),'The heading is placed above the grid');}
console.log('Lab route passed: in-app route, four-column cards, dock and menu entries, command, legacy page redirect.');
