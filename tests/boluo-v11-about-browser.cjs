"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const artifacts=path.join(root,"artifacts/v11-about");
fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const mobile=width===390;
   const context=await browser.newContext({viewport:{width,height:mobile?844:960},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   const page=await context.newPage();
   const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   const response=await page.goto("http://127.0.0.1:8765/v11/about.html",{waitUntil:"networkidle"});
   assert.equal(response.status(),200);
   assert.match(await page.locator("#heroTitle").innerText(),/亲手试/);
   assert.equal(await page.locator(".journey").count(),4);
   assert.equal(await page.locator(".capability").count(),12);
   assert.equal(await page.locator(".audience").count(),3);
   const first=page.locator(".capability").first();
   await first.locator("summary").click();
   assert.ok(await first.locator(".capability-body").isVisible());
   assert.match(await first.innerText(),/为什么重要/);
   const link=await first.locator(".capability-body a").getAttribute("href");
   assert.equal(link,"./index.html");
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(layout.overflow<=2,width+"px horizontal overflow "+JSON.stringify(layout));
   assert.deepEqual(errors,[],width+"px browser script errors");
   await first.locator("summary").click();
   await page.screenshot({path:path.join(artifacts,mobile?"about-mobile.png":"about-desktop.png"),fullPage:true,animations:"disabled"});
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
