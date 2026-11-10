"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),art=path.join(root,"artifacts/v11-future");fs.mkdirSync(art,{recursive:true});
const origin="http://127.0.0.1:8765/v11/";
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const mobile=width===390,context=await browser.newContext({viewport:{width,height:mobile?844:960},isMobile:mobile,hasTouch:mobile,acceptDownloads:true,deviceScaleFactor:1});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   const response=await page.goto(origin+"future.html",{waitUntil:"networkidle"});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>Boolean(window.BoluoFutureLab));
   assert.equal(await page.locator("#networkA .network-node").count(),7);
   assert.equal(await page.locator("#networkB .network-node").count(),7);
   assert.equal(await page.locator("#metricsGrid .metric-card").count(),4);
   assert.match(await page.locator("#worldBTitle").innerText(),/加强/);
   assert.ok(Number((await page.locator("#linkChange").innerText()).replace(/[+]/g,""))>0);
   assert.equal(await page.locator("#saveCount").innerText(),"0 条");
   if(mobile){
    assert.ok(await page.locator("#worldCardB").isVisible());
    assert.ok(!(await page.locator("#worldCardA").isVisible()));
    await page.locator("#worldTabA").click();assert.ok(await page.locator("#worldCardA").isVisible());
    await page.locator("#worldTabB").click();assert.ok(await page.locator("#worldCardB").isVisible());
   }
   await page.locator('[data-scene="agriculture"]').click();
   assert.match(await page.locator("#sceneQuestion").innerText(),/茶叶/);
   await page.locator('#linkOptions [data-link="a-new"]').click();
   assert.equal(await page.locator("#modeOptions button").count(),1);
   assert.equal(await page.locator("#modeOptions button").innerText(),"新增");
   await page.locator("#intensityRange").fill("90");
   await page.locator("#yearRange").fill("2030");
   assert.equal(await page.locator("#yearValue").innerText(),"2030");
   assert.ok(Number(await page.locator("#linkChange").innerText())>40);
   await page.locator("#saveExperiment").click();
   const store=await page.evaluate(()=>JSON.parse(localStorage.getItem("boluo-v11-future-snapshots-v1")));
   assert.equal(store.length,1);assert.equal(store[0].scene,"agriculture");
   assert.equal(store[0].link,"a-new");assert.equal(store[0].year,2030);
   assert.equal(await page.locator("#saveCount").innerText(),"1 条");
   const replay=new URL(page.url());
   assert.equal(replay.searchParams.get("link"),"a-new");
   assert.equal(replay.searchParams.get("mode"),"add");
   assert.equal(replay.searchParams.get("year"),"2030");
   await page.reload({waitUntil:"networkidle"});
   assert.match(await page.locator("#worldBTitle").innerText(),/新增/);
   assert.equal(await page.locator("#yearValue").innerText(),"2030");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=2,"page12 "+width+"px overflow="+overflow);
   if(!mobile){
    const event=page.waitForEvent("download");await page.locator("#exportFuture").click();
    const file=await event,raw=JSON.parse(fs.readFileSync(await file.path(),"utf8"));
    assert.equal(raw.format,"boluo-v11-future-structural-experiment");
    assert.equal(raw.snapshot.scene,"agriculture");
    assert.match(raw.note,/不是GDP/);
    await page.screenshot({path:path.join(art,"future-desktop.png"),fullPage:true,animations:"disabled"});
   }else{
    await page.screenshot({path:path.join(art,"future-mobile.png"),fullPage:true,animations:"disabled"});
   }
   await page.goto(origin+"brief.html",{waitUntil:"networkidle"});
   assert.equal(await page.locator("#savedCount").innerText(),"1");
   assert.match(await page.locator("#futureAudit").innerText(),/柏塘|农品/);
   assert.match(await page.locator("#futureAudit").innerText(),/2030/);
   assert.match(await page.locator("#futureAudit").innerText(),/证据缺口/);
   const link=await page.locator("#futureAudit .audit-link").getAttribute("href");
   const u=new URL(link,origin+"brief.html");
   assert.equal(u.searchParams.get("link"),"a-new");
   assert.equal(u.searchParams.get("year"),"2030");
   assert.deepEqual(errors,[]);
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:900,height:850}}),page=await context.newPage();
  await page.goto(origin+"future.html?scene=commuting&link=c-route&mode=cut&intensity=100&year=2030",{waitUntil:"networkidle"});
  assert.match(await page.locator("#sceneQuestion").innerText(),/岗位/);
  assert.ok(Number(await page.locator("#linkChange").innerText())<0);
  await page.locator("#yearRange").fill("2026");
  assert.equal(await page.locator("#linkChange").innerText(),"0.0");
  await page.locator("#playTime").click();
  await page.waitForFunction(()=>document.getElementById("yearValue").textContent!=="2026",{timeout:6000});
  await page.locator("#playTime").click();
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
