"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {chromium}=require("playwright");
(async()=>{
 fs.mkdirSync("artifacts",{recursive:true});
 const browser=await chromium.launch({headless:true});
 const failures=[];
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1360,height:930},deviceScaleFactor:1});
   const page=await context.newPage();
   page.on("pageerror",error=>failures.push((mobile?"mobile:":"desktop:")+error.message));
   page.on("console",m=>{if(m.type()==="error"&&!/favicon/i.test(m.text()))failures.push((mobile?"mobile:":"desktop:")+m.text())});
   await page.goto("http://127.0.0.1:8765/core/workbench/",{waitUntil:"networkidle",timeout:40000});
   await page.waitForFunction(()=>document.querySelector("#fullModuleCount")?.textContent.includes("12"),{timeout:20000});
   assert.equal(await page.locator("#fullModuleCount").innerText(),"12 / 12");
   assert.match(await page.locator("#fullRunStatus").innerText(),/已显示2026-11-20真实运行留档/);
   assert.equal(await page.locator("#fullResults article").count(),12);
   assert.ok((await page.locator("#fullResults").innerText()).includes("2026"));
   const item=await page.evaluate(()=>{const p=document.querySelector("#boluoFullRunPanel");return {width:document.documentElement.scrollWidth,viewport:window.innerWidth,p:p?.offsetWidth}});
   assert(item.width<=item.viewport+8,"responsive page must not overflow viewport: "+JSON.stringify(item));
   await page.locator("#boluoFullRunPanel").screenshot({path:"artifacts/boluo-full-workbench-"+(mobile?"mobile":"desktop")+".png"});
   if(!mobile){
    await page.locator("#fullToCareer").click();
    await page.waitForURL(/league\.html#season/,{timeout:15000});
    await page.waitForSelector("#v12HandoffRun",{timeout:15000});
    assert.match(await page.locator("#v12RunIntro").innerText(),/BL-FULL-DEMO-20261120/);
    await page.locator("#v12HandoffRun").click();
    await page.waitForFunction(()=>document.querySelector("#v12HandoffResult")?.textContent.includes("V12季度引擎已执行"),{timeout:90000});
    assert.match(await page.locator("#v12HandoffResult").innerText(),/careerTick/);
   }
   await context.close();
  }
  assert.deepEqual(failures,[],"No runtime/console errors");
  console.log("PASS desktop/mobile full reference snapshot + V12 native career handoff");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
