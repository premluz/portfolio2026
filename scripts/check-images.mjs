import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {staleImages,staleImagesMessage} from './image-freshness.mjs';
import {staleVideos,staleVideosMessage} from './video-freshness.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const stale=await staleImages(root),staleVideoCopies=await staleVideos(root);
if(stale.length)console.error(staleImagesMessage(stale));
if(staleVideoCopies.length)console.error(staleVideosMessage(staleVideoCopies));
if(stale.length||staleVideoCopies.length)process.exit(1);
console.log('Images up to date: every catalog image has current thumbnails or backdrop copies, and every MP4 a current optimised copy.');
