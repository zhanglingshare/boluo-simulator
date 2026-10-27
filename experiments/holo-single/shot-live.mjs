import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.js');
const browser = await chromium.launch({
  executablePath: '/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell',
  ignoreHTTPSErrors: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-certificate-errors']
});
const errors = [];
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));
const url = 'https://zhanglingshare.github.io/boluo-simulator/experiments/holo-single/index.html';
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const gl = await page.evaluate(() => {
  const c = document.getElementById('universeCanvas');
  return { hasCanvas: !!c, w: c?.width, h: c?.height, modes: document.querySelectorAll('.mode-tab').length, engine: !!window.__boluoDebug };
});
await page.screenshot({ path: 'shots/live-online.png' });
console.log('LIVE RENDER:', JSON.stringify(gl));
console.log('CONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
