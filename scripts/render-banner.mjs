import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import gifenc from 'gifenc';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playwrightRoot = process.env.PLAYWRIGHT_MODULE
  ?? path.resolve(__dirname, '../../../../../PORTFOLIO1.2/node_modules/playwright/index.mjs');
const threeDir = path.resolve(__dirname, '../../../../../PORTFOLIO1.2/node_modules/three/build');
const { chromium } = await import(playwrightRoot);

const htmlPath = path.resolve(__dirname, 'banner-scene.html');
const outGif = path.resolve(__dirname, '../banner.gif');
const outPng = path.resolve(__dirname, '../banner.png');
const FRAMES = 48;
const FRAME_DELAY_MS = 42;
const GIF_COLORS = 128;

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
const page = await browser.newPage({ viewport: { width: 900, height: 260 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/banner-scene.html`);
await page.waitForFunction(() => window.__bannerReady === true, null, { timeout: 15000 });

const frames = [];

for (let i = 0; i < FRAMES; i += 1) {
  const phase = i / FRAMES;
  await page.evaluate((p) => window.renderBannerFrame(p), phase);
  frames.push(PNG.sync.read(await page.screenshot({ type: 'png' })));
}

const { width, height } = frames[0];
const allPixels = new Uint8Array(width * height * 4 * frames.length);
for (let i = 0; i < frames.length; i += 1) {
  allPixels.set(frames[i].data, i * frames[i].data.length);
}

const palette = quantize(allPixels, GIF_COLORS);
const gif = GIFEncoder();

for (const frame of frames) {
  const index = applyPalette(frame.data, palette);
  gif.writeFrame(index, width, height, { palette, delay: FRAME_DELAY_MS });
}

gif.finish();
fs.writeFileSync(outGif, Buffer.from(gif.bytes()));

await page.evaluate(() => window.renderBannerFrame(0));
await page.screenshot({ path: outPng, type: 'png' });

await browser.close();
server.close();

const kb = Math.round(fs.statSync(outGif).size / 1024);
console.log(`Wrote ${outGif} (${kb} KB, ${FRAMES} frames)`);
console.log(`Wrote ${outPng}`);
