// M2 跨层探索闭环实测：桌面1440 + 手机390，截图 + 控制台错误 + 数据加载核验
import { createRequire } from 'module';
const require = createRequire('/opt/vm/preinstall/npm-global/lib/node_modules/playwright/');
const { chromium } = require('/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.js');
const fs = require('fs');
const OUT = new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const PAGE_URL = 'http://localhost:8765/experiments/holo-single/index.html';
const HEADLESS = '/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell';
const ARGS = ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];

async function run(viewport, tag) {
  const browser = await chromium.launch({ executablePath: HEADLESS, headless: true, args: ARGS });
  const page = await browser.newPage({ viewport, deviceScaleFactor: viewport.mobile ? 2 : 1 });
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${tag}] PAGEERROR ${e.message}`));
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__boluoDebug && window.__boluoDebug.state.dataSource === 'live', { timeout: 8000 }).catch(() => {});
  await sleep(700);
  const dbg = () => page.evaluate(() => window.__boluoDebug);
  // 数据加载核验
  const st0 = await page.evaluate(() => { const s = window.__boluoDebug.state; const g = window.__boluoDebug.getGraph(); return { ...s, ...g }; });
  console.log(`[${tag}] 初始:`, JSON.stringify(st0));
  const shot = async name => { await page.screenshot({ path: `${OUT}${name}.png` }); console.log('  截图', name); };

  await shot(`${tag}-1-overview`);
  // 进入产业簇
  await page.evaluate(() => window.__boluoDebug.openCluster('industry')); await sleep(1400);
  await shot(`${tag}-2-industry`);
  // 选欣旺达（园洲）
  await page.evaluate(() => window.__boluoDebug.openNode('xwd')); await sleep(1400);
  const hasEnter = await page.evaluate(() => !!document.querySelector('[data-town="园洲"]'));
  console.log(`[${tag}] 欣旺达 inspector 含"进入园洲"按钮:`, hasEnter);
  await shot(`${tag}-3-xwd`);
  // 进入园洲镇
  await page.evaluate(() => window.__boluoDebug.enterTown('园洲')); await sleep(1500);
  const townSt = await page.evaluate(() => ({ town: window.__boluoDebug.state.focusTown, layer: window.__boluoDebug.state.layer }));
  console.log(`[${tag}] 镇视图:`, JSON.stringify(townSt));
  await shot(`${tag}-4-town-industry`);
  // 切生活层
  await page.evaluate(() => window.__boluoDebug.setLayer('life')); await sleep(1200);
  await shot(`${tag}-5-town-life`);
  // 切事件层
  await page.evaluate(() => window.__boluoDebug.setLayer('events')); await sleep(1200);
  await shot(`${tag}-6-town-events`);
  // 回产业层，选外部深圳
  await page.evaluate(() => window.__boluoDebug.setLayer('industry')); await sleep(1000);
  await page.evaluate(() => window.__boluoDebug.openNode('sz')); await sleep(1400);
  const szSel = await page.evaluate(() => window.__boluoDebug.state.selected);
  console.log(`[${tag}] 选中外部节点:`, szSel);
  await shot(`${tag}-7-shenzhen`);
  // 场景/流场区间
  await page.evaluate(() => window.__boluoDebug.mode('scenario')); await sleep(1200);
  const flowText = await page.evaluate(() => document.body.innerText.includes('跨界通勤') && document.body.innerText.includes('4500'));
  console.log(`[${tag}] 流场区间可见(4500/跨界通勤):`, flowText);
  await shot(`${tag}-8-scenario`);
  // flows 模式
  await page.evaluate(() => window.__boluoDebug.mode('flows')); await sleep(1100);
  await shot(`${tag}-9-flows`);
  // 返回
  await page.evaluate(() => window.__boluoDebug.back()); await sleep(1100);
  await page.evaluate(() => window.__boluoDebug.home()); await sleep(1300);
  await shot(`${tag}-10-home`);

  if (viewport.mobile) {
    // 手机：进镇并打开详情抽屉
    await page.evaluate(() => window.__boluoDebug.enterTown('园洲')); await sleep(1400);
    await page.evaluate(() => document.getElementById('mobileInfoButton').click()); await sleep(1000);
    await shot(`${tag}-11-mobile-drawer`);
  }
  await browser.close();
}

await run({ width: 1440, height: 900 }, 'm2d');
await run({ width: 390, height: 844, mobile: true }, 'm2m');
console.log('\n===== 控制台错误数:', errors.length, '=====');
errors.forEach(e => console.log(' ', e));
