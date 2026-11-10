import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const tests=(await fs.readdir(new URL('../tests/',import.meta.url))).filter(name=>name.endsWith('.mjs')).sort();
const run=args=>{const result=spawnSync(process.execPath,args,{cwd,encoding:'utf8'});if(result.error)throw result.error;return result;};
// Node prints the stack after the source excerpt, so the first line naming an Error is the useful one.
const firstError=output=>{const lines=output.split('\n').map(line=>line.trim()).filter(Boolean);return lines.find(line=>/\bError\b/.test(line))||lines[0]||'(no output)';};

// Build, image and memory checks stay fatal: a stale build makes every test result meaningless.
for(const args of [['scripts/build-settings.mjs','--check'],['scripts/build-content.mjs','--check'],['scripts/check-images.mjs'],['scripts/memory.mjs','check'],['--check','dist/app.js']]){
 const result=spawnSync(process.execPath,args,{cwd,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
const failures=[];
for(const name of tests){
 const result=run(['tests/'+name]);
 if(result.status===0){process.stdout.write(result.stdout);continue;}
 failures.push(name);console.error(`FAIL tests/${name}: ${firstError(result.stderr||result.stdout)}`);
}
console.log(`${tests.length-failures.length} of ${tests.length} test files passed.`);
if(failures.length)process.exit(1);
