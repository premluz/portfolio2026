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
for(const id of ['featuredLarger','labLayout','labColumns','labFeaturedLarger','labCardDetails','labFullWidth','labHeading'])assert(index.includes(`id="${id}"`),`The dev settings have ${id}`);
assert(app.includes("'route.lab':()=>activateRoute('lab')"),'The Lab has its own route command');
assert(app.includes('if(ripple)void ripple.click();')&&app.includes('if(ripple&&LAB_RIPPLE.landing)void Promise.resolve(landing?.finished).then(()=>ripple.land());')&&!app.includes('await ripple'),'A short ring answers the click without delaying the transition, and the landing ring is behind LAB_RIPPLE.landing');
assert.equal(LAB_RIPPLE.landing,false,'Only the click ring runs for now');
assert(app.includes("const showBackControl=route=>route==='assistant'&&!inlineChat(route)||projectIds.includes(route);"),'About, Contact and the menu-dock chat page get no Back pill');
assert(index.indexOf('data-nav="work"')<index.indexOf('data-nav="lab"')&&index.indexOf('data-nav="lab"')<index.indexOf('data-nav="about"'),'Lab sits right after Work in the dock');
assert(menu.indexOf("routeButton('work'")<menu.indexOf("routeButton('lab'")&&menu.indexOf("routeButton('lab'")<menu.indexOf("routeButton('about'"),'Lab sits right after Home in the site menu');
assert(commandDefinitions.some(command=>command.id==='route.lab'),'The Lab command is in the command catalog');
assert(menu.includes("routeButton('lab','Lab',icons.lab)"),'The site menu opens the Lab in-app');
{const {LAB_HEADING,labHeadingMarkup}=await import('../dist/lab-page.js');const css=await read('lab.css');
assert.deepEqual({...LAB_HEADING},{title:'Experiments',summary:'Prototypes, R&D and projects that never made it to market.'},'The Lab is titled Experiments, with no eyebrow');
assert(labHeadingMarkup().includes('</h1><div class="info-body"><p>Prototypes, R&amp;D and projects that never made it to market.</p></div>'),'The body text uses About\'s structure');
const about=await read('about-page.css');assert(about.includes(':is(.about-hero-copy,.lab-heading) .info-body{')&&about.includes(':is(.about-hero-copy,.lab-heading) .info-body p{'),'The Lab shares About\'s body text rules');
assert((await read('design-system.css')).includes('main .lab-heading .info-body p,'),'Its body text takes the shared body-text colour');
assert(labHeadingMarkup().startsWith('<section class="lab-heading" aria-labelledby="labTitle"><h1 id="labTitle" tabindex="-1">Experiments</h1>'),'The heading is a real page heading');
assert(css.includes('main.lab-canvas .homepage-layout>:not(.lab-heading,.home-work){display:none}'),'The Lab shows only its heading and the grid, not the home hero or sections');
assert(css.includes(':root.lab-card-details-hidden #main .gallery-grid .project-card>.visual{--image-padding-top:0px;--image-padding-bottom:0px;margin-block:0}'),'Images-only rows are one gap apart, like the columns');
assert(css.includes(':root.lab-grid-full main.lab-canvas .gallery-grid{width:calc(var(--app-canvas-width) - 2 * var(--content-gutter));max-width:none;'),'Lab grid full width uses the app breakout, so it never exceeds the app maximum');
assert(css.includes(':root.lab-heading-hidden .lab-heading{display:none}')&&css.includes(':root.lab-heading-hidden main.lab-canvas .gallery-grid{margin-top:var(--page-content-top)}'),'With the heading hidden the grid starts where the heading did');
assert(css.includes(':root.lab-card-details-hidden #main .gallery-grid[data-masonry-rhythm="true"]{grid-auto-rows:1px}')&&(await read('home-layout.js')).includes('const row=parseFloat(getComputedStyle(this.gallery).gridAutoRows)||8;'),'Images-only masonry rows are 1px, so no rounding gap is added');
assert(app.includes("if(labMode)main.querySelector('.homepage-layout').insertAdjacentHTML('afterbegin',labHeadingMarkup());"),'The heading is placed above the grid');}
console.log('Lab route passed: in-app route, four-column cards, dock and menu entries, command, legacy page redirect.');
