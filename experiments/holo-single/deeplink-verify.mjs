import { chromium, devices } from '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';

const ROOT = 'http://localhost:8765';
const errors = [];
function attach(page, tag) {
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${tag}] pageerror ${e.message}`));
}

// 1. network.html?entity=xxx：力导向稳定后应选中节点
async function checkNetwork(page, entity, { expectHit } = {}) {
  await page.goto(`${ROOT}/network.html?entity=${entity}&from=holo`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // 等力导向 + 120ms 轮询选中
  const res = await page.evaluate(() => {
    let sel = null;
    try { sel = selected; } catch (e) { sel = null; } // 全局 let 变量，不挂 window
    return {
      selected: sel,
      tipShown: document.getElementById('tooltip').style.display === 'block',
      tipText: document.getElementById('tooltip').innerText || ''
    };
  });
  return res;
}

// 2. v2/index.html?scene=xxx：开始后聚焦情景 + 提示
async function checkV2(page, scene) {
  await page.goto(`${ROOT}/v2/index.html?scene=${scene}&topic=inv-industry&from=holo`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // 点开始（startGame）
  const start = page.locator('#startBtn, .start-btn, [onclick*="startGame"]').first();
  if (await start.isVisible().catch(() => false)) await start.click().catch(() => {});
  await page.waitForTimeout(600);
  return page.evaluate(() => ({
    worry: window.state ? window.state.worry : null,
    noticeShown: document.getElementById('challengeNotice').classList.contains('show'),
    noticeText: document.getElementById('challengeNotice').innerText || ''
  }));
}

// 3. 全息版节点浮卡有跳转按钮
async function checkHolo(page, isMobile) {
  await page.goto(`${ROOT}/experiments/holo-single/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  // 进入产业星群
  await page.evaluate(() => {
    window.__boluoDebug.openCluster('industry');
  });
  await page.waitForTimeout(900);
  // 选中 xwd
  await page.evaluate(() => window.__boluoDebug.openNode('xwd'));
  await page.waitForTimeout(900);
  if (isMobile) { /* 手机 inspector 在抽屉里，尝试打开 */ await page.evaluate(() => { try { openMobile(); } catch (e) {} }); await page.waitForTimeout(500); }
  return page.evaluate(() => ({
    learn: !!document.querySelector('[data-learn]'),
    analyze: !!document.querySelector('[data-analyze]'),
    learnHref: (() => { const b = document.querySelector('[data-learn]'); return b ? b.outerHTML.slice(0, 0) : null; })()
  }));
}

async function run(browser, isMobile) {
  const ctx = isMobile
    ? await browser.newContext({ ...devices['Pixel 7'] })
    : await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  attach(page, isMobile ? 'mobile' : 'desktop');

  // 有效 entity
  const net = await checkNetwork(page, 'xwd');
  // 无效 entity：退回全景，不报错
  const netBad = await checkNetwork(page, 'notanid');
  // v2 scene
  const v2 = await checkV2(page, 'investment');
  // 全息入口
  const holo = await checkHolo(page, isMobile);

  // 截图
  await page.goto(`${ROOT}/network.html?entity=xwd&from=holo`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `shots/dl-${isMobile ? 'mobile' : 'desktop'}-network.png`, fullPage: false });
  await page.goto(`${ROOT}/v2/index.html?scene=investment&topic=inv-industry&from=holo`, { waitUntil: 'networkidle' });
  const start = page.locator('#startBtn, .start-btn, [onclick*="startGame"]').first();
  if (await start.isVisible().catch(() => false)) await start.click().catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/dl-${isMobile ? 'mobile' : 'desktop'}-v2notice.png`, fullPage: false });

  await ctx.close();
  return {
    netHit: net.selected === 'xwd' && net.tipShown && net.tipText.includes('欣旺达'),
    badEntityIgnored: netBad.selected === null && netBad.tipShown === false,
    v2Scene: v2.worry === 'investment' && v2.noticeShown && v2.noticeText.includes('全息版'),
    holoButtons: holo.learn && holo.analyze
  };
}

const browser = await chromium.launch({ executablePath: '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome' });
const desktop = await run(browser, false);
const mobile = await run(browser, true);
await browser.close();
console.log('desktop', JSON.stringify(desktop));
console.log('mobile', JSON.stringify(mobile));
console.log('errors:', errors.length, errors.slice(0, 6));
