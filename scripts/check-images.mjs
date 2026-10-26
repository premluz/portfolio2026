import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {staleImages,staleImagesMessage} from './image-freshness.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stale=await staleImages(root);
if(stale.length){console.error(staleImagesMessage(stale));process.exit(1);}
console.log('Images up to date: every catalog image has current thumbnails or backdrop copies.');
