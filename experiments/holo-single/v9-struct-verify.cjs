/* v9 概念图结构改造验证：双视口（1440x900 / 390x844）
 * 检查：默认选中优先级第一（C004）、列表优先级排序+影响条、变化档案四模块、
 *       情景尾注、旧版入口、标题、无 JS 错误；点击 C008 后四模块与尾注切换。
 * 运行：仓库内 node experiments/holo-single/v9-struct-verify.cjs
 */
const { chromium } = require("/opt/vm/preinstall/npm-global/lib/node_modules/playwright");
const path = require("path");

const EXE = "/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome";
const URL = "http://localhost:8899/holo-home-v9.html";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function txt(sel, page) { return page.$eval(sel, el => (el.textContent || "").trim()).catch(() => ""); }

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  let allOk = true;
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const title = await txt("#deckTitle", page);
    const desc = await txt("#deckDesc", page);
    const hash = await page.evaluate(() => location.hash);
    const detailTitle = await txt("#detailTitle", page);
    const listTitles = await page.$$eval("#changeList .cc-title", els => els.map(e => e.textContent.trim()).slice(0, 4));
    const impactBars = await page.$$eval("#changeList .impact-fill", els => els.map(e => e.style.width || "").slice(0, 4));
    const smNames = await page.$$eval("#smGrid .sm-name", els => els.map(e => e.textContent.trim()));
    const smTitle = await txt("#smTitle", page);
    const foot = await txt("#timelineFoot", page);
    const legacy = await page.$("a.appbar-legacy");
    const smCount = await page.$$eval("#smGrid .sm-card", els => els.length);
    const smOpts = await page.$$eval("#smGrid .sm-opt", els => els.map(e => e.textContent.trim()));
    const smRels = await page.$$eval("#smGrid .sm-rel", els => els.length);

    // 点击 C008 验证切换
    const c008Card = await page.$('#changeList .change-card[data-id="C008"]');
    let after = {};
    if (c008Card) {
      await c008Card.click();
      await page.waitForTimeout(800);
      after.hash = await page.evaluate(() => location.hash);
      after.detail = await txt("#detailTitle", page);
      after.foot = await txt("#timelineFoot", page);
      after.smTitle = await txt("#smTitle", page);
    }

    const checks = [
      ["标题=博罗·变化现场", title === "博罗·变化现场"],
      ["默认选中优先级第一（C004）", detailTitle.includes("链主级项目") || (after.detail && after.detail.includes("链主"))],
      ["列表第一=进入型C004", listTitles[0] && listTitles[0].includes("链主级项目")],
      ["列表第二=退出型C008", listTitles[1] && listTitles[1].includes("固力水泥")],
      ["列表含影响条", impactBars.length >= 4 && impactBars.every(b => b.endsWith("%"))],
      ["四模块=4张卡", smCount === 4],
      ["四模块名称", smNames.length === 4 && smNames[0] === "前后对比" && smNames[1] === "牵动的联系" && smNames[2] === "连锁反应" && smNames[3] === "你会怎么看"],
      ["牵动的联系含真实边", smRels > 0],
      ["你会怎么看三选项", smOpts.length === 3],
      ["时间轴尾注存在", foot.includes("换个剧本看看")],
      ["旧版入口存在", !!legacy],
      ["无JS错误", errors.length === 0],
    ];
    if (c008Card) {
      checks.push(
        ["点击C008后hash更新", (after.hash || "").includes("C008")],
        ["点击C008后档案切换", (after.smTitle || "").includes("固力水泥")],
        ["C008专属情景尾注", (after.foot || "").includes("不关停")],
      );
    }
    const failed = checks.filter(c => !c[1]);
    const ok = failed.length === 0;
    if (!ok) allOk = false;
    console.log("== " + vp.name + " ==");
    checks.forEach(c => console.log((c[1] ? "PASS" : "FAIL") + "  " + c[0] + (c[1] ? "" : "  → " + JSON.stringify({ title, detailTitle, listTitles, smNames, foot, after }))));
    if (errors.length) console.log("CONSOLE ERRORS:", errors.slice(0, 5));
    await page.screenshot({ path: `/tmp/v9-struct-${vp.name}.png`, fullPage: false });
    await page.close();
  }
  await browser.close();
  console.log(allOk ? "\nALL PASS" : "\nSOME FAILED");
  process.exit(allOk ? 0 : 1);
})();
