import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playwrightRoot = process.env.PLAYWRIGHT_MODULE
  ?? path.resolve(__dirname, '../../../../../PORTFOLIO1.2/node_modules/playwright/index.mjs');
const threeDir = path.resolve(__dirname, '../../../../../PORTFOLIO1.2/node_modules/three/build');
const { chromium } = await import(playwrightRoot);

const htmlPath = path.resolve(__dirname, 'banner-scene.html');
const outPng = path.resolve(__dirname, '../banner.png');

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '/';
  if (url.startsWith('/three/')) {
    const file = path.join(threeDir, url.slice('/three/'.length));
    if (!file.startsWith(threeDir) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    res.end(fs.readFileSync(file));
    return;
  }
  if (url === '/' || url === '/banner-scene.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(htmlPath));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 260 }, deviceScaleFactor: 2 });
await page.goto(`http://127.0.0.1:${port}/banner-scene.html`);
await page.waitForFunction(() => window.__bannerReady === true, null, { timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: outPng, type: 'png' });
await browser.close();
server.close();
console.log(`Wrote ${outPng}`);
