import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isBackdrop} from '../dist/asset-roles.js';
import {registerAssetQuirks,sourceCornerRadius,sourceEdgeInset} from '../dist/asset-quirks.js';
import {contentModel,ContentValidationError} from '../dist/content/model.js';
import {catalog} from '../dist/content/catalog.js';
import {createContentStore} from '../dist/content/provider.js';
import {measureAsset} from '../scripts/media-metadata.mjs';

const root=fileURLToPath(new URL('..',import.meta.url)),dist=path.join(root,'dist');
const image=(id,extra={})=>({id,type:'image',status:'published',url:`assets/${id}.jpg`,alt:'x',...extra});

// A role is enough on its own; the suffix alone still works; neither means not a backdrop.
assert.equal(isBackdrop(image('panorama',{role:'backdrop'})),true,'role without the -bg suffix');
assert.equal(isBackdrop(image('merlin-bg')),true,'suffix without a role');
assert.equal(isBackdrop(image('merlin-bg',{role:'backdrop'})),true);
assert.equal(isBackdrop(image('merlin')),false);
assert.equal(isBackdrop(image('background')),false,'A name that merely contains bg is not a backdrop');

// The Python twin agrees with the module on every catalog asset, on the default content set's own file, and on the fixtures.
const files=JSON.parse(await fs.readFile(path.join(root,'content/catalog/assets.json'),'utf8'));
const samples=[...catalog.assets,...files,image('panorama',{role:'backdrop'}),image('merlin-bg'),image('merlin'),image('background')];
const python=spawnSync('python3',['-c','import sys,json;sys.path.insert(0,"scripts");from asset_roles import is_backdrop;print(json.dumps([is_backdrop(a) for a in json.load(sys.stdin)]))'],{cwd:root,input:JSON.stringify(samples),encoding:'utf8'});
assert.equal(python.status,0,`python3 failed: ${python.stderr}`);
assert.deepEqual(JSON.parse(python.stdout),samples.map(isBackdrop),'Python and JavaScript classify every asset the same way');

// Every script that decides what a backdrop is goes through the shared rule.
for(const file of ['scripts/image-freshness.mjs','scripts/build-backgrounds.mjs','scripts/media-metadata.mjs'])assert((await fs.readFile(path.join(root,file),'utf8')).includes("from '../dist/asset-roles.js'"),`${file} imports isBackdrop`);
assert((await fs.readFile(path.join(root,'scripts/optimise-images.py'),'utf8')).includes('from asset_roles import is_backdrop'),'optimise-images.py imports is_backdrop');
for(const file of ['scripts/image-freshness.mjs','scripts/build-backgrounds.mjs','scripts/media-metadata.mjs','scripts/optimise-images.py'])assert(!/endsWith\(['"]-bg['"]\)|endswith\(['"]-bg['"]\)/.test(await fs.readFile(path.join(root,file),'utf8')),`${file} has no private suffix check`);
assert.equal(await measureAsset(image('panorama',{role:'backdrop',url:'assets/merlin-bg.jpg'}),dist),null,'A role-only backdrop is not measured as card media');

// The schema accepts the new fields and rejects bad values.
const withAsset=extra=>{const c=structuredClone(catalog);c.assets.push(image('fixture',extra));return c;};
assert.deepEqual(contentModel.validate(withAsset({role:'backdrop',sourceCornerRadius:12,sourceEdgeInset:1})),[]);
for(const bad of [{role:'hero'},{sourceCornerRadius:1.5},{sourceEdgeInset:-1}])assert.throws(()=>contentModel.assert(withAsset(bad)),ContentValidationError,JSON.stringify(bad));

// The two recorded quirks reach the image frame exactly as the old hard-coded table gave them, and loading a catalog registers them.
createContentStore(catalog);
assert.equal(sourceCornerRadius('https://example.test/assets/tracr-transfer.jpg?v=2'),34,'Tracr matte corners');
assert.equal(sourceEdgeInset('assets/playstation-content.jpg'),2,'PlayStation baked frame');
assert.equal(sourceCornerRadius('assets/playstation-content.jpg'),0);
assert.equal(sourceEdgeInset('assets/tracr-transfer.jpg'),0);
assert.equal(sourceCornerRadius('assets/vodafone-iot.jpg')+sourceEdgeInset('assets/vodafone-iot.jpg'),0,'An unrecorded asset has no quirk');
registerAssetQuirks([image('wide-matte',{sourceCornerRadius:9})]);
assert.equal(sourceCornerRadius('assets/wide-matte.jpg'),9,'A new asset needs only its record, no code change');

console.log('Asset roles passed: role or suffix, Python twin agreement, no private suffix checks, schema fields, quirks read from the catalog.');
