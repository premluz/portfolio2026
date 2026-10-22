import {siteConfig} from './site-config-client.js';
import {createContentStore,createContentProvider} from './provider.js';

// The live content set is chosen at runtime (dev panel → /api/site-config); every set ships in the deploy.
export const activeContentSet=siteConfig.contentSet;
const {catalog}=await import(`./${activeContentSet}.js`);
// Embedded snapshots keep the existing synchronous navigation and first render.
export const content=createContentStore(catalog);
export const localContentProvider=createContentProvider({load:async()=>catalog});
