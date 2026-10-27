import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=name=>readFile(new URL(name.startsWith('scripts/')?'../'+name:'../dist/'+name,import.meta.url),'utf8');
const [css,app,transfer,index,lab,styles]=await Promise.all(['plain-nav.css','app.js','settings-transfer.js','index.html','lab.html','scripts/client-styles.mjs'].map(read));

// An opt-in override mode, off by default, saved and exported with the other navigation settings.
assert.equal(DEFAULT_STORAGE_VALUES['prem-plain-nav'],'false');
assert(transfer.includes("plainNav:'prem-plain-nav'"),'The switch is exported');
for(const page of [index,lab])assert(page.includes('<input id="plainNav" type="checkbox"> Plain navigation'),'Both pages carry the switch, unchecked');
assert(app.includes("document.documentElement.dataset.plainNav=plainNav?'on':'off'"),'The root attribute follows the preference');
assert(styles.includes("'plain-nav.css'"),'The stylesheet ships in the bundle');

// Scope: every rule needs the attribute, and the composer (an input, not a link) keeps its glass.
const rules=css.split('\n').filter(line=>line.startsWith(':root'));
assert(rules.length>=3&&rules.every(rule=>rule.startsWith(':root[data-plain-nav="on"]')),'Every rule is behind data-plain-nav="on"');
assert(rules.filter(rule=>rule.includes('#dock')).every(rule=>rule.includes('#dock:not(.is-composer)')),'Dock rules skip composer mode');
for(const part of ['.dock-glass','.dock-outline','nav a','.assistant-launcher','.assistant-back','.glass-utility-button','.detail-media-actions button','background:none','box-shadow:none','backdrop-filter:none','text-decoration:underline'])assert(css.includes(part),`Plain mode covers ${part}`);
console.log('Plain navigation passed: default off, exported, both pages, every rule scoped, composer exempt, chrome removed and active link underlined.');
