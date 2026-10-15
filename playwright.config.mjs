import {defineConfig} from '@playwright/test';

const PORT=3919;
export default defineConfig({
 testDir:'tests/visual',
 timeout:60000,
 workers:1,
 use:{baseURL:`http://localhost:${PORT}`,viewport:{width:1440,height:900},reducedMotion:'no-preference'},
 webServer:{command:`PORT=${PORT} node deploy/node-server.mjs`,url:`http://localhost:${PORT}/`,reuseExistingServer:false,timeout:20000}
});
