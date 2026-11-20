"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),{chromium}=require("playwright");
(async()=>{
 fs.mkdirSync("artifacts",{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  for(const mobile of [false,true]){
   const c=await browser.newContext({viewport:mobile?{width:390,height:840}:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
   const page=await c.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("console",e=>{if(e.type()==="error"&&!/favicon/i.test(e.text()))errors.push(e.text())});
   await page.goto("http://127.0.0.1:8765/core/world/",{waitUntil:"networkidle",timeout:45000});
   await page.waitForFunction(()=>document.querySelector("#runStatus")?.textContent.includes("已推进 0"),{timeout:20000});
   assert.match(await page.locator("#publicGDP").innerText(),/1,005\.45/);
   assert.match(await page.locator("#public2026").innerText(),/721\.10/);
   assert.equal(await page.locator("#firmCount").innerText(),"830");
   assert.equal(await page.locator("#edgeCount").innerText(),"1,699");
   assert.equal(await page.locator(".choice").count(),4);
   assert.ok((await page.locator("#networkMap [data-node]").count())>=2);
   await page.locator("#worldScenario").selectOption("supply");
   await page.locator('[data-action="substitute"]').click();
   await page.locator("#compareButton").click();
   assert.match(await page.locator("#comparison").innerText(),/相同初始状态/);
   await page.locator("#advance").click();
   await page.waitForFunction(()=>document.querySelector("#timelineLabel")?.textContent.includes("1 / 28"),{timeout:20000});
   assert.equal(await page.locator("#ledger").innerText(),"已平衡");
   assert.ok((await page.locator("#grossProduction").innerText()).includes(","));
   await page.locator("#advance4").click();
   await page.waitForFunction(()=>document.querySelector("#timelineLabel")?.textContent.includes("5 / 28"),{timeout:30000});
   assert.equal(await page.locator("#ledger").innerText(),"已平衡");
   assert.match(await page.locator("#news").innerText(),/供应冲击|需求|项目|企业/);
   const exportPromise=page.waitForEvent("download");
   await page.locator("#exportWorld").click();
   const d=await exportPromise;
   assert.match(d.suggestedFilename(),/boluo-living-world-5-quarters.json/);
   await page.locator("#networkMap").screenshot({path:"artifacts/boluo-living-network-"+(mobile?"mobile":"desktop")+".png"});
   await page.screenshot({path:"artifacts/boluo-living-world-"+(mobile?"mobile":"desktop")+".png",fullPage:false});
   const dims=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   assert(dims.doc<=dims.viewport+3,"horizontal overflow "+JSON.stringify(dims));
   if(!mobile){
    for(let i=0;i<6;i++)await page.locator("#advance4").click();
    await page.waitForFunction(()=>document.querySelector("#timelineLabel")?.textContent.includes("28 / 28"),{timeout:30000});
    assert.equal(await page.locator("#advance").isDisabled(),true);
    assert.match(await page.locator("#runStatus").innerText(),/28季度完成/);
    assert.equal(await page.locator("#ledger").innerText(),"已平衡");
    await page.locator("#reset").click();
    await page.waitForFunction(()=>document.querySelector("#timelineLabel")?.textContent.includes("0 / 28"),{timeout:20000});
   }
   assert.deepEqual(errors,[],"browser console and JS errors");
   await c.close();
  }
  console.log("PASS desktop/mobile: public data, 830 firms, scenario, policy, paired preview, real quarter transitions, cash/input ledgers, 28Q season, download, reset");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
