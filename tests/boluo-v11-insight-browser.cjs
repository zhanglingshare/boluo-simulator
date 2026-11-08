"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base="http://127.0.0.1:8765/v11/insights.html?shock=orders&bs=1.15&bp0=1.10";
const dir=path.resolve(__dirname,"../artifacts/v11-insight");
fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const isMobile=width===390;
   const context=await browser.newContext({viewport:{width,height:isMobile?844:960},isMobile,hasTouch:isMobile,deviceScaleFactor:1});
   const page=await context.newPage();
   const errors=[];
   page.on("pageerror",err=>errors.push(err.message));
   await page.goto(base,{waitUntil:"domcontentloaded"});
   await page.locator("#iqNetworkNodes .iq-node").first().waitFor({timeout:10000});
   assert.equal(await page.locator("#iqNetworkNodes .iq-node").count(),5,"five interactive relationships");
   assert.equal(await page.locator("#iqHeatGrid .iq-heat-cell").count(),36,"36 computed sensitivity cells");
   assert.equal(await page.locator("#iqRankingBars .iq-rank-button").count(),5);
   const initial=Number(await page.locator("#iqHubValue").innerText());
   await page.locator("#iqSeverity").evaluate(el=>{el.value="95";el.dispatchEvent(new Event("input",{bubbles:true}));});
   const stressed=Number(await page.locator("#iqHubValue").innerText());
   assert.ok(stressed>initial,`severity moves actual index: ${initial} -> ${stressed}`);
   await page.locator("#iqSever").click();
   const cut=Number(await page.locator("#iqHubValue").innerText());
   assert.ok(cut<stressed,`cut changes counterfactual: ${cut} < ${stressed}`);
   assert.equal(await page.locator("#iqSever").getAttribute("aria-pressed"),"true");
   await page.locator("#iqSever").click();
   await page.locator("#iqHeatGrid .iq-heat-cell").last().click();
   assert.equal(await page.locator("#iqSubstitute").inputValue(),"100");
   await page.locator('[data-iq-target="resilience"]').click();
   assert.equal(await page.locator("#iqNetworkNodes .iq-node").count(),5);
   assert.equal(await page.locator("#iqHeatGrid .iq-heat-cell").count(),36);
   await page.locator("#iqRun").click();
   await page.locator("#iqToWind").waitFor({state:"visible"});
   const wind=await page.locator("#iqToWind").getAttribute("href");
   assert.ok(wind.includes("bs=1.15"),"preserves original baseline from page 7");
   assert.ok(wind.includes("shock="),"sends a relevant wind scenario");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<12,`page not wider than mobile viewport: overflow ${overflow}`);
   await page.screenshot({path:path.join(dir,isMobile?"mobile-390.png":"desktop-1440.png"),fullPage:true});
   assert.deepEqual(errors,[],"page has no uncaught script errors");
   await context.close();
   console.log(`page08 ${width}: initial=${initial} stressed=${stressed} cut=${cut} overflow=${overflow}`);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
