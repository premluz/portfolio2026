import {catalog} from './catalog.js';
import {createContentStore,createContentProvider} from './provider.js';
// Embedded snapshots keep the existing synchronous navigation and first render.
export const content=createContentStore(catalog);
export const localContentProvider=createContentProvider({load:async()=>catalog});
