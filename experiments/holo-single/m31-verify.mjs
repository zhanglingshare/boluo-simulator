import { chromium, devices } from '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:8765/experiments/holo-single/index.html';
const errors = [];

function attach(page, tag) {
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${tag}] pageerror ${e.message}`));
  page.on('response', r => { if (r.status() === 404) errors.push(`[${tag}] 404 ${r.url()}`); });
}

// 在页面内 simulate + 复制 point 投影，返回节点屏幕坐标（CSS 像素，含 canvas 偏移）
async function nodePos(page, world, nodeId, u) {
  return page.evaluate(async ({ world, nodeId, u }) => {
    const eng = await import('./m3/engine.mjs');
    const D = window.BOLUO_DATA;
    const mdl = eng.simulate(D.nodes, D.edges, u);
    const p = mdl.positions.get(nodeId);
    const cv = document.getElementById(world === 0 ? 'm3-canvas-a' : 'm3-canvas-b');
    const w = cv.clientWidth, h = cv.clientHeight;
    const yaw = -0.2, pitch = -0.20, zoom = 1;
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rx = ca * p[0] - sa * p[2], rz0 = sa * p[0] + ca * p[2];
    const ry = cp * p[1] - sp * rz0, z = sp * p[1] + cp * rz0;
    const scale = Math.min(w / 5.4, h / 4.4) * zoom / (1 - z * .075);
    const sx = w * .5 + rx * scale, sy = h * .51 - ry * scale;
    const r = cv.getBoundingClientRect();
    return { x: r.left + sx, y: r.top + sy };
  }, { world, nodeId, u });
}

// 返回一条 focal 边上、远离所有节点（>24px）的点，确保命中边而非节点
async function edgeMidPos(page, world, u) {
  return page.evaluate(async ({ world, u }) => {
    const eng = await import('./m3/engine.mjs');
    const D = window.BOLUO_DATA;
    const mdl = eng.simulate(D.nodes, D.edges, u);
    const cv = document.getElementById(world === 0 ? 'm3-canvas-a' : 'm3-canvas-b');
    const w = cv.clientWidth, h = cv.clientHeight, r0 = cv.getBoundingClientRect();
    const proj = (p) => {
      const yaw = -0.2, pitch = -0.20, zoom = 1;
      const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const rx = ca * p[0] - sa * p[2], rz0 = sa * p[0] + ca * p[2];
      const ry = cp * p[1] - sp * rz0, z = sp * p[1] + cp * rz0;
      const scale = Math.min(w / 5.4, h / 4.4) * zoom / (1 - z * .075);
      return [w * .5 + rx * scale, h * .51 - ry * scale];
    };
    const nodePts = mdl.nodes.map(n => proj(mdl.positions.get(n.id)));
    for (const e of mdl.edges.filter(x => x.focal)) {
      const a = proj(mdl.positions.get(e.source)), b = proj(mdl.positions.get(e.target));
      for (let t = 0.3; t <= 0.7; t += 0.05) {
        const mx = a[0] + (b[0] - a[0]) * t, my = a[1] + (b[1] - a[1]) * t;
        let minD = Infinity;
        for (const np of nodePts) minD = Math.min(minD, Math.hypot(mx - np[0], my - np[1]));
        if (minD > 24) return { x: r0.left + mx, y: r0.top + my, id: e.id };
      }
    }
    return null;
  }, { world, u });
}

async function dragB(page, val = 80) {
  await page.evaluate((val) => {
    const r = document.getElementById('m3-range-b');
    r.value = String(val); r.dispatchEvent(new Event('input', { bubbles: true }));
  }, val);
}

async function runDesktop(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  attach(page, 'desktop');
  await page.addInitScript(() => { try { localStorage.removeItem('boluo_m3_guided'); } catch (e) {} });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('#m3-launch');
  await page.waitForSelector('#m3-shell:not([hidden])');
  await page.waitForTimeout(700);
  const guideVisible = await page.locator('#m3-guide').isVisible();
  await page.screenshot({ path: 'shots/m31-desktop-0-guide0.png' });

  // 走完引导
  await page.click('#m3-guide-next');           // step0 → step1
  await page.waitForTimeout(200);
  await dragB(page, 80);                       // step1 → step2
  await page.waitForTimeout(900);
  const jq = await nodePos(page, 1, 'jq', .8); // 精确点 onlyB 节点
  await page.mouse.click(jq.x, jq.y);          // step2 → step3
  await page.waitForTimeout(700);
  const btn = page.locator('#m3-guide-next');
  if (await btn.isVisible() && (await btn.textContent()).includes('开始探索')) await btn.click();
  await page.waitForTimeout(500);
  const guideClosed = !(await page.locator('#m3-guide').isVisible());
  await page.screenshot({ path: 'shots/m31-desktop-2-guidedone.png' });

  // 验证节点：精确点 xwd → 浮卡含路径
  const xwd = await nodePos(page, 1, 'xwd', .8);
  await page.mouse.click(xwd.x, xwd.y);
  await page.waitForTimeout(700);
  const nodePop = page.locator('#m3-pop-b');
  const nodeText = await nodePop.isVisible() ? await nodePop.innerText() : '';
  const hasPath = nodeText.includes('路径');
  await page.screenshot({ path: 'shots/m31-desktop-3-nodepath.png' });

  // 验证边：点一条 focal 边中点 → 浮卡含权重
  const em = await edgeMidPos(page, 1, .8);
  console.log('edgeMidPos:', JSON.stringify(em));
  if (em) await page.mouse.click(em.x, em.y);
  await page.waitForTimeout(700);
  const edgeText = await nodePop.isVisible() ? await nodePop.innerText() : '';
  const edgeHit = edgeText.includes('级 ·') && edgeText.includes('权重');
  await page.screenshot({ path: 'shots/m31-desktop-4-edgepop.png' });

  await ctx.close();
  return { guideVisible, guideClosed, nodePop: hasPath, edgeHit };
}

async function runMobile(browser) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  attach(page, 'mobile');
  await page.addInitScript(() => { try { localStorage.removeItem('boluo_m3_guided'); } catch (e) {} });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('#m3-launch-mobile');
  await page.waitForSelector('#m3-shell:not([hidden])');
  await page.waitForTimeout(600);

  const legend = await page.locator('.m3-legend').boundingBox();
  const worldA = await page.locator('#m3-canvas-a').boundingBox();
  const worldsFirst = !!(legend && worldA && worldA.y < 500);
  await page.screenshot({ path: 'shots/m31-mobile-0-worldsfirst.png' });

  // 走完引导（手机）
  if (await page.locator('#m3-guide').isVisible()) {
    await page.locator('#m3-guide-next').click().catch(() => {});
    await page.waitForTimeout(200);
    await dragB(page, 80);
    await page.waitForTimeout(900);
    await page.locator('#m3-canvas-b').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const jq = await nodePos(page, 1, 'jq', .8);
    await page.mouse.click(jq.x, jq.y);
    await page.waitForTimeout(700);
    const btn = page.locator('#m3-guide-next');
    if (await btn.isVisible() && (await btn.textContent()).includes('开始探索')) await btn.click();
    await page.waitForTimeout(400);
  }

  // 验证节点浮卡
  await page.locator('#m3-canvas-b').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const xwd = await nodePos(page, 1, 'xwd', .8);
  await page.mouse.click(xwd.x, xwd.y);
  await page.waitForTimeout(700);
  const pop = page.locator('#m3-pop-b');
  const nodeText = await pop.isVisible() ? await pop.innerText() : '';
  await page.screenshot({ path: 'shots/m31-mobile-1-nodepath.png' });

  await ctx.close();
  return { worldsFirst, nodePop: nodeText.includes('路径') };
}

const browser = await chromium.launch({ executablePath: '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome' });
const desktop = await runDesktop(browser);
const mobile = await runMobile(browser);
await browser.close();

console.log('=== M3.1 验证 ===');
console.log('desktop', JSON.stringify(desktop));
console.log('mobile', JSON.stringify(mobile));
console.log('errors:', errors.length, errors.slice(0, 5));
