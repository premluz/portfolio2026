import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const tests=(await fs.readdir(new URL('../tests/',import.meta.url))).filter(name=>name.endsWith('.mjs')).sort();
for(const args of [['scripts/build-settings.mjs','--check'],['scripts/build-content.mjs','--check'],['scripts/build-backgrounds.mjs','--check'],['--check','dist/app.js'],...tests.map(name=>['tests/'+name])]){
 const result=spawnSync(process.execPath,args,{cwd,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
console.log(`All ${tests.length} test files passed.`);
