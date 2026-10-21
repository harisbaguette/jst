import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

// Run with the Vite dev server running. No paid API or source image editing.
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir('output/research', { recursive: true });
try {
  for (const variant of [
    { name: 'high-rest-dpr1', tier: 'high', pose: 'rest', ratio: 1 },
    { name: 'full-rest-dpr1', tier: 'full', pose: 'rest', ratio: 1 },
    { name: 'high-idle-dpr1', tier: 'high', pose: 'idle', ratio: 1 },
    { name: 'high-rest-dpr2', tier: 'high', pose: 'rest', ratio: 2 },
    { name: 'high-rest-corrected', tier: 'high', pose: 'rest', ratio: 2, corrected: true },
    { name: 'full-rest-corrected', tier: 'full', pose: 'rest', ratio: 2, corrected: true },
    { name: 'high-idle-corrected', tier: 'high', pose: 'idle', ratio: 2, corrected: true },
  ]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 850 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/research-probe.html*', route => route.fulfill({
      contentType: 'text/html', body: '<!doctype html><style>body{margin:0}canvas{width:100vw;height:100vh;display:block}</style><canvas></canvas><script type="module" src="/scripts/probe-scene.js"></script>',
    }));
    await page.goto(`http://127.0.0.1:5178/research-probe.html?${new URLSearchParams(variant)}`);
    await page.waitForFunction(() => window.probe, null, { timeout: 90_000 });
    await page.waitForTimeout(700);
    const data = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return {
        splats: window.probe.character.splat.numSplats,
        animation: window.probe.character.currentAnimationName,
        resolution: { width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight },
      };
    });
    await page.screenshot({ path: `output/research/${variant.name}.png`, scale: 'css' });
    results.push({ ...variant, ...data, errors });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  await writeFile('output/research/render-probe.json', JSON.stringify(results, null, 2) + '\n');
} finally { await browser.close(); }
