import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=name=>readFile(new URL(name.startsWith('scripts/')?'../'+name:'../dist/'+name,import.meta.url),'utf8');
const [css,app,transfer,index,styles]=await Promise.all(['plain-cards.css','app.js','settings-transfer.js','index.html','scripts/client-styles.mjs'].map(read));

// An opt-in override mode, off by default, saved and exported like the other card settings.
assert.equal(DEFAULT_STORAGE_VALUES['prem-plain-cards'],'false');
assert(transfer.includes("plainCards:'prem-plain-cards'"),'The switch is exported');
assert(index.includes('<input id="plainCards" type="checkbox"> Plain cards'),'The page carries the switch, unchecked');
assert(app.includes("document.documentElement.dataset.plainCards=plainCards?'on':'off'"),'The root attribute follows the preference');
assert(styles.includes("'plain-cards.css'"),'The stylesheet ships in the bundle');

// Scope and coverage: every rule sits behind the attribute and removes the shell and the layers "Card background" leaves behind.
const rules=css.split('\n').filter(line=>line.startsWith(':root'));
assert(rules.length>=3&&rules.every(rule=>rule.startsWith(':root[data-plain-cards="on"]')),'Every rule is behind data-plain-cards="on"');
for(const part of ['.surface{background:none','box-shadow:none','backdrop-filter:none','.liquid-skin','.material-reflection','.image-edge','.note-card'])assert(css.includes(part),`Plain cards covers ${part}`);
assert(!/\.visual\s*\{|img\s*\{|display:none[^}]*\.visual/.test(css),'Images and their frames are left alone');
console.log('Plain cards passed: default off, exported, both pages, every rule scoped, skin, reflections, edge glow and note cards removed, media untouched.');
