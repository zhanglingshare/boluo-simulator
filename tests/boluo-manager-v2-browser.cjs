"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),{chromium}=require("playwright");
(async()=>{
 fs.mkdirSync("artifacts",{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},deviceScaleFactor:1,acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("console",m=>{if(m.type()==="error"&&!/favicon/i.test(m.text()))errors.push(m.text())});
   await page.goto("http://127.0.0.1:8765/core/world/",{waitUntil:"networkidle",timeout:45000});
   try{await page.waitForFunction(()=>document.querySelector("#screen-hub .hero-title"),{timeout:7500})}
   catch(e){console.log("EARLY_RENDER_DEBUG",JSON.stringify({errors,text:(await page.locator("body").innerText()).slice(0,1600),scripts:await page.evaluate(()=>[...document.scripts].map(s=>s.src))}));throw e}
   assert.equal(await page.locator("#nav .navbutton").count(),7,"seven manager destinations");
   assert.match(await page.locator("#liveCaption").innerText(),/830家企业/);
   assert.match(await page.locator("#topCredits").innerText(),/100/);
   await page.locator("#nav [data-view='scout']").click();
   assert.match(await page.locator("#screen-scout").innerText(),/830家/);
   await page.locator("#scoutQuery").fill("I0236");
   await page.locator("[data-do='apply-search']").click();
   assert.equal(await page.locator("#screen-scout .resultrow").count(),1);
   await page.locator("#screen-scout .resultrow").first().click();
   assert.equal(await page.locator("#drawerOverlay").isVisible(),true);
   assert.equal(await page.locator("#drawerContent .report").count(),6);
   assert.ok(await page.locator("#drawerContent .attribute").count()>=6);
   assert.match(await page.locator("#drawerContent").innerText(),/完整36项战术档案/);
   await page.locator("#drawer [data-do='watch']").click();
   assert.match(await page.locator("#drawerContent").innerText(),/加入观察名单/);
   await page.locator("#drawer [data-do='close-drawer']").click();
   await page.locator("#nav [data-view='tactics']").click();
   assert.equal(await page.locator("#screen-tactics .policy").count(),4);
   await page.locator("#scenarioSelector").selectOption("supply");
   await page.locator("#screen-tactics [data-do='queue'][data-type='skills']").click();
   assert.equal(await page.locator("#screen-tactics .queueitem").count(),1);
   await page.locator("#screen-tactics [data-do='compare']").click();
   assert.match(await page.locator("#comparisonBox").innerText(),/相同条件/);
   await page.locator("#topAdvance").click();
   await page.waitForFunction(()=>document.querySelector("#topProgress").textContent.includes("1/28"),{timeout:12000});
   assert.equal(await page.locator("#topCredits").innerText(),"93 点","spent 10 plus 3 quarterly replenishment");
   await page.locator("#nav [data-view='season']").click();
   assert.equal(await page.locator("#screen-season .quarter").count(),28);
   assert.match(await page.locator("#screen-season").innerText(),/2026/);
   await page.locator("#nav [data-view='office']").click();
   assert.match(await page.locator("#screen-office").innerText(),/经营总账/);
   assert.match(await page.locator("#screen-office").innerText(),/1,005.45/);
   await page.locator("#nav [data-view='lab']").click();
   assert.match(await page.locator("#screen-lab").innerText(),/模型引擎/);
   await page.locator("#screen-lab [data-do='lab-run']").click();
   assert.match(await page.locator("#labRunResult").innerText(),/独立执行完成/);
   const blob=page.waitForEvent("download");
   await page.locator("#screen-lab [data-do='export']").click();
   const dl=await blob;
   assert.match(dl.suggestedFilename(),/boluo-franchise-world-q1/);
   await page.locator("#nav [data-view='hub']").click();
   await page.screenshot({path:"artifacts/boluo-franchise-v2-"+(mobile?"mobile":"desktop")+".png",fullPage:false});
   if(!mobile){
    for(let i=0;i<7;i++){
      await page.locator("#screen-hub [data-do='fast-forward']").click();
    }
    await page.waitForFunction(()=>document.querySelector("#topProgress").textContent.includes("28/28"),{timeout:20000});
    assert.equal(await page.locator("#topAdvance").isDisabled(),true);
    await page.locator("#nav [data-view='season']").click();
    assert.equal(await page.locator("#screen-season .quarter.past").count(),28);
   }
   const d=await page.evaluate(()=>({width:document.documentElement.scrollWidth,vw:window.innerWidth}));
   assert.ok(d.width<=d.vw+3,"horizontal overflow "+JSON.stringify(d));
   assert.deepEqual(errors,[],"no runtime errors");
   await context.close();
  }
  console.log("PASS franchise v2: seven workspaces, 830 searchable firms, V13 36 traits, seasonal action queue, policy counterfactual, complete 28Q season, mobile and download");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
