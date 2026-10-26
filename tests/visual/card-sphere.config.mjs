import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const PORT=3923;
export default defineConfig({
 testDir:'.',testMatch:'card-sphere.spec.mjs',timeout:90000,workers:1,
 expect:{timeout:15000},
 use:{baseURL:`http://localhost:${PORT}`,viewport:{width:1440,height:900}},
 webServer:{cwd:fileURLToPath(new URL('../../',import.meta.url)),command:`PORT=${PORT} node deploy/node-server.mjs --dev`,url:`http://localhost:${PORT}/`,reuseExistingServer:false,timeout:20000}
});
