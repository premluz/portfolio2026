import assert from 'node:assert/strict';
import fs from 'node:fs';
import {card} from '../dist/card-renderer.js';
import {DEFAULT_STORAGE_VALUES} from '../dist/default-settings.js';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const KEY='prem-card-show-category';

for(const page of ['dist/index.html','dist/lab.html'])assert.match(read(page),/<input id="cardShowCategory" type="checkbox">/,`${page} has the category switch, unchecked`);
assert.match(read('dist/settings-transfer.js'),new RegExp(`cardShowCategory:'${KEY}'`),'The switch is exported with the other settings');
assert.equal(DEFAULT_STORAGE_VALUES[KEY],'false','The switch starts off');

const project={id:'x',name:'Tracr',title:'Strategic redesign',shortCategory:'Blockchain traceability',summary:'s',assets:[]};
const markup=card(project,0,'masonry',{});
assert.match(markup,/data-title="Strategic redesign"/,'The title is kept for switching back');
assert.match(markup,/data-category="Blockchain traceability"/,'The short category is carried on the heading');
assert.match(card({...project,shortCategory:''},0,'masonry',{}),/data-category="Tracr"/,'Without a short category the name is shown');

const catalog=JSON.parse(read('content/catalog.json'));
const expected={galachain:'Web3 film platform',playstation:'Publishing pipeline',merlin:'AI financial analysis',rios:'Life-first planner',tracr:'Blockchain traceability',bastion:'AI wallet','vodafone-iot':'IoT connectivity'};
const items=catalog.documents;
const shorts=Object.fromEntries(items.filter(item=>item.shortCategory).map(item=>[item.id,item.shortCategory]));
assert.deepEqual(shorts,expected,'Short categories match the owner\'s list');
console.log('card category ok');
