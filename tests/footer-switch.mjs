import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

// The footer has its own switch, on by default, saved and exported like the other settings.
const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');
const [app,transfer,design,index]=await Promise.all(['app.js','settings-transfer.js','design-system.css','index.html'].map(read));
assert.equal(DEFAULT_STORAGE_VALUES['prem-show-footer'],'true');
assert(transfer.includes("showFooter:'prem-show-footer'"),'The switch is part of settings export and import');
assert(index.includes('<input id="showFooter" type="checkbox" checked> Show footer'),'The page carries the switch');
// Every route change re-syncs the footer; it must follow the switch instead of always showing it.
assert(app.includes("footer.hidden=!showFooter;"),'Route changes respect the switch');
assert(!app.includes("if(footer)footer.hidden=false;"),'Nothing forces the footer visible');
// The footer is a flex container, which would override the hidden attribute without a rule.
assert(design.includes('.site-footer[hidden]{display:none}'),'A hidden footer is removed from layout');
console.log('Footer switch passed: default on, saved and exported, both pages, route changes respect it, hidden rule.');
