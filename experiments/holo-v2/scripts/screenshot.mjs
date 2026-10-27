/* 双端真实交互截图 + 控制台错误采集。
 * 用法：node scripts/screenshot.mjs
 * 前置：python3 -m http.server 8765（在 holo-v2 目录） */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const require = createRequire(import.meta.url);
// Playwright 位于全局预装目录（环境固定），直接引用以避免 ESM 不读 NODE_PATH
const { chromium } = require("/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "screenshots");
const URL = "http://localhost:8765/index.html";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function screenPos(page, id) {
  return page.evaluate((nid) => {
    const a = window.__atlas;
    if (!a) return null;
    const w = a.positions.get(nid);
    if (!w) return null;
    const v = w.clone().project(a.camera);
    const cw = a.renderer.domElement.clientWidth;
    const ch = a.renderer.domElement.clientHeight;
    return { x: (v.x * 0.5 + 0.5) * cw, y: (-v.y * 0.5 + 0.5) * ch };
  }, id);
}

async function clickNode(page, id) {
  const p = await screenPos(page, id);
  if (!p) throw new Error("no screen pos for " + id);
  await page.mouse.click(Math.round(p.x), Math.round(p.y));
}

async function run() {
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
  });
  const errors = [];

  /* ---------- 桌面 ---------- */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));

  await page.goto(URL, { waitUntil: "load" });
  await page.waitForFunction(() => document.getElementById("loading").style.display === "none", null, { timeout: 15000 });
  await sleep(2200);
  await page.screenshot({ path: path.join(OUT, "desktop-1-overview.png") });

  // 操作1+2：点击产业星群（欣旺达位于产业群）→ 进入 + 展开
  await clickNode(page, "xwd");
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT, "desktop-2-industry.png") });

  // 操作3：点中园洲链主（欣旺达）→ 选择，其余降亮
  await clickNode(page, "xwd");
  await sleep(1400);
  await page.screenshot({ path: path.join(OUT, "desktop-3-select.png") });

  // 操作4：点一条边（追踪）——点 xwd-mj 边中点
  const mid = await page.evaluate(() => {
    const a = window.__atlas;
    const p1 = a.positions.get("xwd").clone(), p2 = a.positions.get("mj").clone().add(p1).multiplyScalar(0.5);
    const v = p2.clone().project(a.camera);
    return { x: (v.x * 0.5 + 0.5) * a.renderer.domElement.clientWidth, y: (-v.y * 0.5 + 0.5) * a.renderer.domElement.clientHeight };
  });
  await page.mouse.click(Math.round(mid.x), Math.round(mid.y));
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "desktop-4-edge.png") });

  // 操作5：切换观察层（生活）
  await page.click('.holo-bottombar .seg-btn:has-text("生活")');
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, "desktop-5-layer.png") });
  // 回到全景层
  await page.click('.holo-bottombar .seg-btn:has-text("全景")');
  await sleep(500);

  // 证据等级：仅 A
  await page.click('.holo-bottombar .seg-btn:has-text("仅A")');
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, "desktop-6-levelA.png") });
  await page.click('.holo-bottombar .seg-btn:has-text("全部")');
  await sleep(400);

  // 操作6：返回全景
  await page.click(".back-btn");
  await sleep(1800);
  await page.screenshot({ path: path.join(OUT, "desktop-7-back.png") });

  // 数据自检结果（页面侧）
  const audit = await page.evaluate(() => {
    const a = window.__atlas;
    return { hasAtlas: !!a, nodeCount: a.nodeViews.size, edgeCount: a.edgeViews.size };
  });
  await ctx.close();

  /* ---------- 手机 ---------- */
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
  });
  const mp = await mctx.newPage();
  mp.on("console", m => { if (m.type() === "error") errors.push("MOBILE CONSOLE: " + m.text()); });
  mp.on("pageerror", e => errors.push("MOBILE PAGEERROR: " + e.message));
  await mp.goto(URL, { waitUntil: "load" });
  await mp.waitForFunction(() => document.getElementById("loading").style.display === "none", null, { timeout: 15000 });
  await sleep(2200);
  await mp.screenshot({ path: path.join(OUT, "mobile-1-overview.png") });

  // 手机点击产业节点
  const mp1 = await screenPos(mp, "xwd");
  await mp.touchscreen.tap(Math.round(mp1.x), Math.round(mp1.y));
  await sleep(2000);
  await mp.screenshot({ path: path.join(OUT, "mobile-2-industry.png") });
  const mp2 = await screenPos(mp, "xwd");
  await mp.touchscreen.tap(Math.round(mp2.x), Math.round(mp2.y));
  await sleep(1400);
  await mp.screenshot({ path: path.join(OUT, "mobile-3-select.png") });

  // 手机搜索
  await mp.fill(".holo-search-input", "东莞");
  await sleep(700);
  await mp.screenshot({ path: path.join(OUT, "mobile-4-search.png") });
  await mp.click(".search-row");
  await sleep(1600);
  await mp.screenshot({ path: path.join(OUT, "mobile-5-dongguan.png") });

  await mctx.close();
  await browser.close();

  console.log("=== 截图完成 ===");
  console.log("audit:", JSON.stringify(audit));
  console.log("=== 控制台错误（%d）===", errors.length);
  errors.forEach(e => console.log(e));
}

run().catch(e => { console.error(e); process.exit(1); });
