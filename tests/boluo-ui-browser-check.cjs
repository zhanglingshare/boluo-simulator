/* Browser UI smoke checks for Boluo's non-holographic pages only. */
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const ORIGIN='http://127.0.0.1:8765/';
const pages=[
 'index.html','role.html','who.html','choices.html','future.html',
 'windtunnel.html','blindspot.html','report.html','ending.html',
 'network.html','town.html','lab.html','step2.html','v3.html',
 'v4.html','v2/index.html','v2/data.html'
];
const screenshotPages=new Set(['index.html','role.html','choices.html','future.html','windtunnel.html','report.html','network.html','town.html','lab.html','v4.html','v2/index.html']);
const fileName=p=>p.replace(/[/.]/g,'-');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const artifactDir=path.join(process.cwd(),'artifacts');
 fs.mkdirSync(artifactDir,{recursive:true});
 const summary=[];
 const failures=[];
 try{
  for(const viewport of [{width:390,height:844,label:'mobile'},{width:1365,height:900,label:'desktop'}]){
   const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce'});
   const page=await context.newPage();
   for(const name of pages){
    const pageErrors=[];
    const onError=e=>pageErrors.push(String(e.message||e));
    page.on('pageerror',onError);
    let entry={name:name,device:viewport.label,loaded:false,overflowsBy:null,cssLoaded:false,bodyTagged:false,scrollable:false};
    try{
     const response=await page.goto(ORIGIN+name,{waitUntil:'domcontentloaded',timeout:30000});
     assert.ok(response&&response.status()<400,name+' HTTP failure '+(response&&response.status()));
     await page.waitForTimeout(220);
     entry=Object.assign(entry,await page.evaluate(()=>{
      const doc=document.documentElement;
      const cs=Array.from(document.styleSheets).some(s=>s.href&&s.href.includes('boluo-ui.css'));
      return {
       loaded:true,
       overflowsBy:Math.max(0,Math.ceil(doc.scrollWidth-window.innerWidth)),
       cssLoaded:cs,
       bodyTagged:document.body.classList.contains('bl-ui'),
       scrollable:doc.scrollHeight>window.innerHeight+1,
       title:document.title,
       navLinks:document.querySelectorAll('.nav a').length,
       firstHeaderVisible:(()=>{const el=document.querySelector('h1');if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;})()
      };
     }));
     if(!entry.cssLoaded||!entry.bodyTagged)failures.push(viewport.label+' '+name+': UI stylesheet/body marker missing');
     if(entry.overflowsBy>24)failures.push(viewport.label+' '+name+': document horizontal overflow '+entry.overflowsBy+'px');
     if(!entry.firstHeaderVisible)failures.push(viewport.label+' '+name+': primary heading hidden/collapsed');
     if(screenshotPages.has(name))await page.screenshot({path:path.join(artifactDir,viewport.label+'-'+fileName(name)+'.png'),fullPage:true,timeout:20000});
     if(pageErrors.length)entry.pageErrors=pageErrors.slice(0,5);
    }catch(e){entry.error=String(e.stack||e).slice(0,400);failures.push(viewport.label+' '+name+': '+e.message);}
    page.off('pageerror',onError);
    summary.push(entry);
    console.log(viewport.label+' '+name+': css='+entry.cssLoaded+' overflow='+entry.overflowsBy+' heading='+entry.firstHeaderVisible+' '+(entry.error||''));
   }
   await context.close();
  }
  fs.writeFileSync(path.join(artifactDir,'nonholo-ui-audit.json'),JSON.stringify({pages:summary,failures},null,2)+'\n');
  console.log('UI_CHECK_SUMMARY',JSON.stringify({checked:summary.length,failures:failures,screenshots:fs.readdirSync(artifactDir).filter(f=>f.endsWith('.png')).length}));
  assert.equal(failures.length,0,'Non-holographic UI must be mobile/desktop readable: '+JSON.stringify(failures));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
