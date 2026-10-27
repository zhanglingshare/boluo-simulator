import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.js');

const dir = process.argv[2] || '.';
const outDir = process.argv[3] || 'shots';
const file = pathToFileURL(path.join(process.cwd(), dir, 'index.html')).href;

process.chdir(dir);
import('fs').then(fs => {
  fs.mkdirSync(outDir, { recursive: true });
});

const browser = await chromium.launch({
  executablePath: '/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
});
const errors = [];

async function shot(name, width, height, setup) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(file);
  await page.waitForTimeout(1200);
  if (setup) await setup(page);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, name + '.png') });
  await ctx.close();
}

// 桌面
await shot('d1-overview', 1440, 900);
await shot('d2-industry', 1440, 900, async p => {
  await p.evaluate(() => window.__boluoDebug.openCluster('industry'));
});
await shot('d3-node', 1440, 900, async p => {
  await p.evaluate(() => { window.__boluoDebug.openCluster('industry'); });
  await p.waitForTimeout(600);
  await p.evaluate(() => window.__boluoDebug.openNode('xwd'));
});
await shot('d4-scenario', 1440, 900, async p => {
  await p.evaluate(() => { window.__boluoDebug.mode('scenario'); });
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__boluoDebug.setScenario(0.88));
});
await shot('d5-flows', 1440, 900, async p => {
  await p.evaluate(() => window.__boluoDebug.mode('flows'));
});

// 手机
await shot('m1-overview', 390, 844);
await shot('m2-industry', 390, 844, async p => {
  await p.evaluate(() => window.__boluoDebug.openCluster('industry'));
});
await shot('m3-node', 390, 844, async p => {
  await p.evaluate(() => window.__boluoDebug.openCluster('industry'));
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__boluoDebug.openNode('xwd'));
});

await browser.close();
console.log('DONE');
console.log('CONSOLE ERRORS:', errors.length ? errors : 'none');
