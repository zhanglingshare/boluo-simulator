/* C004 签约—落地—成链改造：双端验证（CommonJS，http://localhost:8899） */
const { chromium } = require("/opt/vm/preinstall/npm-global/lib/node_modules/playwright");
const BASE = "http://localhost:8899/holo-home-v9.html";
const PENDING = ["hpm", "crs", "acc", "lcs"];
const PEDGE = ["E019", "E020", "E021"];
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("PASS -", name); }
  else { fail++; console.log("FAIL -", name, extra !== undefined ? JSON.stringify(extra) : ""); }
}
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", m => { if (m.type() === "error" && !m.text().includes("503")) errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);

  // 默认 after
  const after = await page.evaluate(({PENDING, PEDGE}) => {
    const A = window.__Atlas3D;
    const nodeState = PENDING.map(id => {
      const mi = A.nodeMeshes.findIndex(m => m.userData.nodeId === id);
      return { id, mesh: A.nodeMeshes[mi].visible, wire: A.nodeWires[mi].visible, wireOp: A.nodeWires[mi].material.opacity };
    });
    const edgeState = PEDGE.map(id => {
      const i = A.edgeData.findIndex(e => e.edge_id === id);
      return { id, line: A.edgeLines[i].visible, tubeOp: A.edgeTubes[i].material.opacity };
    });
    return {
      hash: location.hash, panelShown: !document.querySelector("#c004Panel").hidden,
      view: A.c004View, nodeState, edgeState,
      badge: document.querySelector("#c004Badge").textContent,
      chainHidden: document.querySelector("#projectChain").hidden,
      steps: document.querySelectorAll("#pcSteps .pc-step").length,
      done: document.querySelectorAll("#pcSteps .pc-step.done").length,
      todo: document.querySelectorAll("#pcSteps .pc-step.todo").length,
      impactLbl: document.querySelector("#changeList .impact-label").textContent,
      sub: document.querySelector(".panel-sub").textContent,
      scoreNote: !!document.querySelector("#scoreNote")
    };
  }, {PENDING, PEDGE});
  ok("默认选中 C004", after.hash === "#change=C004", after.hash);
  ok("C004 面板显示", after.panelShown);
  ok("默认 view=after", after.view === "after", after.view);
  ok("after 待落地实心球全部隐藏", after.nodeState.every(n => n.mesh === false), after.nodeState);
  ok("after 空心线框全部显示", after.nodeState.every(n => n.wire === true && n.wireOp > 0.8), after.nodeState);
  ok("after 待验证边显示但发光管不亮", after.edgeState.every(e => e.line === true && e.tubeOp === 0), after.edgeState);
  ok("badge 签约已确认待落地", after.badge.includes("待落地"), after.badge);
  ok("进度链显示且 4 步(1完成3待验证)", !after.chainHidden && after.steps === 4 && after.done === 1 && after.todo === 3, after);
  ok("列表标签改结构重要性", after.impactLbl === "结构重要性", after.impactLbl);
  ok("副标含结构重要性待观察价值", after.sub.includes("结构重要性"), after.sub);
  ok("口径侧注存在", after.scoreNote);

  // before
  await page.click('#c004Panel [data-c004="before"]');
  await page.waitForTimeout(700);
  const before = await page.evaluate(({PENDING, PEDGE}) => {
    const A = window.__Atlas3D;
    const ns = PENDING.map(id => {
      const mi = A.nodeMeshes.findIndex(m => m.userData.nodeId === id);
      return { mesh: A.nodeMeshes[mi].visible, wireOp: A.nodeWires[mi].material.opacity };
    });
    const es = PEDGE.map(id => {
      const i = A.edgeData.findIndex(e => e.edge_id === id);
      return A.edgeLines[i].visible;
    });
    return { ns, es, badgePre: document.querySelector("#c004Badge").classList.contains("pre") };
  }, {PENDING, PEDGE});
  ok("before 节点隐藏仅淡虚位", before.ns.every(n => n.mesh === false && n.wireOp < 0.2), before.ns);
  ok("before 边全部隐藏", before.es.every(v => v === false), before.es);
  ok("before badge pre 样式", before.badgePre);

  // future
  await page.click('#c004Panel [data-c004="future"]');
  await page.waitForTimeout(700);
  const future = await page.evaluate(({PENDING, PEDGE}) => {
    const A = window.__Atlas3D;
    const ns = PENDING.map(id => {
      const mi = A.nodeMeshes.findIndex(m => m.userData.nodeId === id);
      return A.nodeMeshes[mi].visible;
    });
    const es = PEDGE.map(id => {
      const i = A.edgeData.findIndex(e => e.edge_id === id);
      return "#" + A.edgeLines[i].material.color.getHexString();
    });
    return { ns, es, sim: document.querySelector("#c004Badge").classList.contains("sim") };
  }, {PENDING, PEDGE});
  ok("future 节点变实心(假设投产)", future.ns.every(v => v === true), future.ns);
  ok("future 边变琥珀色", future.es.every(c => c === "#f4c66b"), future.es);
  ok("future badge 模拟假设", future.sim);

  // 切回 after 再切其他事件
  await page.click('#c004Panel [data-c004="after"]');
  await page.waitForTimeout(500);
  await page.click('#changeList .change-card[data-id="C008"]');
  await page.waitForTimeout(1200);
  const other = await page.evaluate(() => ({
    panelHidden: document.querySelector("#c004Panel").hidden,
    chainHidden: document.querySelector("#projectChain").hidden,
    view: window.__Atlas3D.c004View
  }));
  ok("切 C008 后面板隐藏", other.panelHidden);
  ok("切 C008 后进度链隐藏", other.chainHidden);
  ok("切 C008 后 c004View 清空", other.view === null, other.view);

  ok("无 JS 逻辑错误", errors.length === 0, errors);

  // 手机端
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const merr = [];
  mp.on("pageerror", e => merr.push(String(e)));
  await mp.goto(BASE, { waitUntil: "networkidle" });
  await mp.waitForTimeout(3500);
  const mob = await mp.evaluate(() => {
    const deck = document.querySelector(".deck"), side = document.querySelector(".side");
    const dr = getComputedStyle(deck).order, sr = getComputedStyle(side).order;
    const stageTop = document.querySelector("#stage").getBoundingClientRect().top;
    const listTop = document.querySelector("#changeList").getBoundingClientRect().top;
    return { dr, sr, stageTop, listTop };
  });
  ok("手机 deck order 在前(1)", mob.dr === "1", mob);
  ok("手机 side order 在后(2)", mob.sr === "2", mob);
  ok("手机 3D 画布位置早于列表", mob.stageTop < mob.listTop, mob);
  ok("手机无 JS 错误", merr.length === 0, merr);

  await browser.close();
  console.log("\n结果：" + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})();
