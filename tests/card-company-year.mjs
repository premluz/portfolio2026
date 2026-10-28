import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContentStore} from '../dist/content/provider.js';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';
import {card} from '../dist/card-renderer.js';

// Projects carry a year; a card's description can switch to "Company · Year" (Cards setting, off by default, under Show project description).
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const [html,app,transfer]=await Promise.all(['index.html','app.js','settings-transfer.js'].map(read));
const catalog=JSON.parse(await readFile(new URL('../content/catalog.json',import.meta.url),'utf8'));
const years=Object.fromEntries(catalog.documents.filter(doc=>doc.year).map(doc=>[doc.id,doc.year]));
assert.deepEqual(years,{bastion:'2025',merlin:'2026',playstation:'2018','vodafone-iot':'2020',galachain:'2025','gala-defi':'2025',tracr:'2024',rios:'2026',porter:'2026'},'Every project has its year');
const markup=card({id:'x',name:'Tracr',client:'Tracr',year:'2024',title:'Redesign',summary:'A • B',assets:[]},0,'masonry',{});
assert(markup.includes('data-company-year="Tracr · 2024"')&&markup.includes('data-summary="A • B"'),'The card carries both description texts');
assert(!card({id:'y',name:'Y',client:'Y',title:'T',summary:'S',assets:[]},0,'masonry',{}).includes('data-company-year="Y ·'),'Without a year only the company is offered');
assert(html.indexOf('id="cardShowDescription"')<html.indexOf('id="cardCompanyYear"'),'The switch sits below Show project description');
assert.equal(DEFAULT_STORAGE_VALUES['prem-card-company-year'],'false');assert(transfer.includes("cardCompanyYear:'prem-card-company-year'"),'The switch is exported');
assert(app.includes("$('#cardCompanyYear').closest('label').hidden=!showCardDescription"),'The switch only shows while the description is on');
console.log('Card company and year passed: years on every project, both texts on the card, switch below the description switch, default off, exported, hidden when the description is off.');
