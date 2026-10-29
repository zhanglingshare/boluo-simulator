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
    const layoutDiagnostics = await page.evaluate(() => {
      const rect = selector => { const e = document.querySelector(selector); if (!e) return null; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return {x:r.x,y:r.y,width:r.width,height:r.height,position:s.position,top:s.top,bottom:s.bottom}; };
      return {canvas:rect(".canvas"),graphWrap:rect(".graph-wrap"),svg:rect("#network"),timeline:rect(".timeline"),canvasHead:rect(".canvas-head"),clusterCount:document.querySelectorAll("[data-cluster]").length,edgeCount:document.querySelectorAll(".edge").length};
    });
    console.log("LAYOUT_DIAGNOSTICS", JSON.stringify(layoutDiagnostics));
    assert.ok(layoutDiagnostics.graphWrap.height > layoutDiagnostics.canvas.height * 0.75, "SVG network canvas must occupy the main panel, not collapse into the header");
    assert.ok(Math.abs((layoutDiagnostics.timeline.y + layoutDiagnostics.timeline.height) - (layoutDiagnostics.canvas.y + layoutDiagnostics.canvas.height)) < 2, "timeline must stay anchored at the bottom of the canvas");

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
    assert.equal(await page.locator("#network").getAttribute("viewBox"), "0 0 500 760", "手机端概念图应使用紧凑视窗");
    const mobileHubBox = await page.locator('[data-cluster="industry"] .hub-core').boundingBox();
    assert.ok(mobileHubBox && mobileHubBox.width > 6, "手机端概念节点必须有可读、可点的尺寸");
    assert.equal(await page.locator(".brand-name").evaluate(el => getComputedStyle(el).whiteSpace), "nowrap", "展开搜索时品牌名不应折行");
    await page.locator("#evidenceMode").click();
    await page.waitForSelector(".evidence-node");
    await page.locator(".searchbox").click();
    assert.equal(await page.locator("#search").isVisible(), true, "手机端点击搜索图标后应展开搜索框");
    await page.locator("#search").fill("铜来顺");
    await page.waitForSelector('[data-evidence-node="tls"]');
    assert.match(await page.locator("#evidenceDetail").innerText(), /铜来顺/);
    const mobileLabelAudit = await page.evaluate(() => {
      const header = document.querySelector(".canvas-head").getBoundingClientRect();
      const graph = document.querySelector(".graph-wrap").getBoundingClientRect();
      const cards = Array.from(document.querySelectorAll(".evidence-node-card")).map(el => {
        const r = el.getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
      });
      return {graphTop:graph.top,headerBottom:header.bottom,cards,overHeader:cards.filter(r => r.y < header.bottom && r.bottom > header.top && r.x < header.right && r.right > header.left).length};
    });
    assert.equal(mobileLabelAudit.overHeader, 0, "手机端证据节点标签不应被标题/切换控件遮挡");
    assert.ok(mobileLabelAudit.cards.length >= 2 && mobileLabelAudit.cards.length <= 10, "手机端应显示紧凑的可读关系子图");
    await page.screenshot({ path: path.join(outDir, "holo-v10-mobile-search.png"), fullPage: true });

    // Guided exploration should bridge a question, an evidence view, and a shareable state.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("evidenceState")?.textContent === "证据已连接", { timeout: 15000 });
    await page.locator('[data-q="break"]').click();
    assert.equal(await page.locator("#timelineTitle").innerText(), "关系断裂", "点击问题应切换对应情景");
    assert.equal(await page.locator("#journey2").evaluate(el => el.classList.contains("active")), true, "概念视图应提示第 2 步");
    await page.locator("#exploreNext").click();
    await page.waitForFunction(() => document.body.classList.contains("evidence-mode"));
    assert.equal(await page.locator("#journey3").evaluate(el => el.classList.contains("active")), true, "进入证据视图后应提示第 3 步");
    await page.waitForFunction(() => document.querySelectorAll(".evidence-flow-particle").length > 0, { timeout: 5000 });
    const selectedNode = page.locator(".evidence-node").first();
    const selectedNodeId = await selectedNode.getAttribute("data-evidence-node");
    await selectedNode.click();
    const selectedNodeName = await page.locator("#evidenceDetail h4").innerText();
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async text => { window.__copiedText = text; } }
      });
    });
    await page.locator("#shareObservation").click();
    await page.waitForFunction(() => !!window.__copiedText);
    const copiedText = await page.evaluate(() => window.__copiedText);
    const currentUrl = await page.evaluate(() => window.location.href);
    assert.ok(copiedText.includes(currentUrl), "分享卡应包含当前状态的可复现链接");
    assert.match(currentUrl, /mode=evidence/, "分享链接应保存当前视图");
    assert.match(currentUrl, new RegExp("node=" + selectedNodeId), "分享链接应保存当前选中节点");
    assert.equal(await page.locator("#journey4").evaluate(el => el.classList.contains("active")), true, "复制分享链接后应提示第 4 步");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("evidenceState")?.textContent === "证据已连接", { timeout: 15000 });
    await page.waitForFunction(() => document.body.classList.contains("evidence-mode"));
    assert.equal(await page.locator("#evidenceDetail h4").innerText(), selectedNodeName, "分享链接重开后应恢复选中节点");
    await page.screenshot({ path: path.join(outDir, "holo-v10-guided-share.png"), fullPage: true });

    assert.deepEqual(errors, [], "浏览器运行期间不应有 JavaScript/控制台错误");
    console.log("PASS: desktop/mobile layout, draggable concept graph, entity search, evidence filters, guided question-to-evidence flow, animated relation highlights, share-link copy and state restoration.");
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
