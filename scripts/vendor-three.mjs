// Copies the pinned Three.js browser build into dist/vendor so the buildless site can import it.
import fs from 'node:fs/promises';
const source=new URL('../node_modules/three/',import.meta.url),target=new URL('../dist/vendor/three/',import.meta.url);
const pkg=JSON.parse(await fs.readFile(new URL('package.json',source),'utf8'));
await fs.mkdir(target,{recursive:true});
await fs.copyFile(new URL('build/three.module.min.js',source),new URL('three.module.js',target));
await fs.copyFile(new URL('LICENSE',source),new URL('LICENSE',target));
await fs.writeFile(new URL('VERSION',target),pkg.version+'\n');
console.log(`Vendored three ${pkg.version}.`);
