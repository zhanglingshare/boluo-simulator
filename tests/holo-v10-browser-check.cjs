const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const outDir = path.join(process.cwd(), "artifacts");
  fs.mkdirSync(outDir, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    page.on("pageerror", err => errors.push("pageerror: " + err.message));
    page.on("console", msg => {
      if (msg.type() === "error" && !/favicon\.ico/i.test(msg.text())) errors.push("console: " + msg.text());
    });

    await page.goto("http://127.0.0.1:8765/holo-home-v10.html", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("evidenceState")?.textContent === "证据已连接", { timeout: 15000 });
    await page.waitForFunction(() => document.getElementById("liveStatus")?.textContent.includes("公开证据已就绪"), { timeout: 5000 });
    assert.equal(await page.locator("[data-cluster]").count(), 7, "概念网络应显示 7 个关系群落");
    await page.screenshot({ path: path.join(outDir, "holo-v10-desktop-concept.png"), fullPage: true });

    // Dragging a concept hub should change its coordinates rather than acting like a static image.
    await page.locator('.topnav button[data-filter="all"]').click();
    const hub = page.locator('[data-cluster="industry"] .hub-core');
    const beforeX = Number(await hub.getAttribute("cx"));
    const hubBox = await hub.boundingBox();
    await page.mouse.move(hubBox.x + hubBox.width / 2, hubBox.y + hubBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(hubBox.x + hubBox.width / 2 + 38, hubBox.y + hubBox.height / 2 + 20, { steps: 4 });
    await page.mouse.up();
    const afterX = Number(await page.locator('[data-cluster="industry"] .hub-core').getAttribute("cx"));
    assert.ok(Math.abs(afterX - beforeX) > 10, "概念群落拖拽应改变节点坐标");

    // Search for a real entity from the concept landing state; it should open the evidence graph.
    await page.locator("#search").fill("铜来顺");
    await page.waitForFunction(() => document.body.classList.contains("evidence-mode"));
    await page.waitForSelector('[data-evidence-node="tls"]');
    assert.match(await page.locator("#evidenceDetail").innerText(), /铜来顺/);
    assert.ok(await page.locator(".evidence-node.search-match").count() >= 1, "搜索结果应在图中高亮");
    await page.screenshot({ path: path.join(outDir, "holo-v10-desktop-search.png"), fullPage: true });

    // Clear search and test the real category filter.
    await page.locator("#search").fill("");
    await page.waitForSelector(".evidence-node");
    await page.locator('.topnav button[data-filter="investment"]').click();
    const investmentHighlighted = await page.locator(".evidence-edge:not(.dim)").count();
    assert.equal(investmentHighlighted, 1, "投资筛选应高亮唯一登记的投资关系");
    await page.locator('.topnav button[data-filter="all"]').click();

    // Check label-card rectangles in SVG user coordinates for collisions.
    const overlaps = await page.locator(".evidence-node-card").evaluateAll(cards => {
      const boxes = cards.map((node, index) => {
        const r = node.getBBox();
        return { index, x: r.x, y: r.y, right: r.x + r.width, bottom: r.y + r.height };
      });
      const result = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const w = Math.min(a.right, b.right) - Math.max(a.x, b.x);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
          if (w > 1 && h > 1) result.push({ a: a.index, b: b.index, overlapWidth: w, overlapHeight: h });
        }
      }
      return result;
    });
    assert.equal(overlaps.length, 0, "证据节点标签不应相互重叠: " + JSON.stringify(overlaps));
    assert.ok(await page.locator(".evidence-edge").count() > 0, "证据图应有真实关系线");
    await page.screenshot({ path: path.join(outDir, "holo-v10-desktop-evidence.png"), fullPage: true });

    // Mobile: evidence mode and search must remain reachable.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("evidenceState")?.textContent === "证据已连接", { timeout: 15000 });
    assert.equal(await page.locator("#evidenceMode").isVisible(), true, "手机端必须显示证据网络入口");
    await page.locator("#evidenceMode").click();
    await page.waitForSelector(".evidence-node");
    await page.locator(".searchbox").click();
    assert.equal(await page.locator("#search").isVisible(), true, "手机端点击搜索图标后应展开搜索框");
    await page.locator("#search").fill("铜来顺");
    await page.waitForSelector('[data-evidence-node="tls"]');
    assert.match(await page.locator("#evidenceDetail").innerText(), /铜来顺/);
    await page.screenshot({ path: path.join(outDir, "holo-v10-mobile-search.png"), fullPage: true });

    assert.deepEqual(errors, [], "浏览器运行期间不应有 JavaScript/控制台错误");
    console.log("PASS: desktop load, concept graph, draggable hub, entity search, evidence filter, label collision check, mobile toggle/search.");
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
