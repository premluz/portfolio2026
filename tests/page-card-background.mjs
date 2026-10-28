import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

// Pages (project details, About, Contact, articles) have their own card background switch, apart from the listing cards.
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const [html,app,transfer,style,design,glass]=await Promise.all(['index.html','app.js','settings-transfer.js','style.css','design-system.css','glass-style.css'].map(read));
assert(html.indexOf('id="cardBackground"')<html.indexOf('id="pageCardBackground"'),'The page switch sits under Card background');
assert.equal(DEFAULT_STORAGE_VALUES['prem-hide-page-card-background'],'false','Pages keep their card by default');
assert(transfer.includes("key==='pageCardBackground'")&&transfer.includes("prem-hide-page-card-background"),'It is exported, inverted like Card background');
assert(app.includes("document.body.classList.toggle('page-card-background-hidden',hidePageCardBackground)"),'It sets its own body class');
assert(!/body\.card-background-hidden[^{]*\.surface\.detail/.test(style)&&!/body\.card-background-hidden \.info-detail/.test(design),'The listing switch no longer touches page cards');
assert(style.includes('body.page-card-background-hidden .surface.detail{background:transparent!important}')&&design.includes('body.page-card-background-hidden .info-detail>.liquid-skin{display:none!important}'),'The page switch removes the page card');
assert(glass.includes('body:not(.page-card-background-hidden) .surface.detail>.liquid-skin'),'Page cards keep their glass edge unless their own switch hides them');
console.log('Page card background passed: own switch under Card background, default shown, exported, listing switch no longer affects pages.');
