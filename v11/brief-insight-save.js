/* Public, explicit save action for page 08. Only save the selected link and missing evidence, not a private model. */
(function(){
"use strict";
const b=document.getElementById("saveInsightForBrief"),toReport=document.getElementById("iqToBrief");
if(!b)return;
function notice(text){const el=document.getElementById("iqToast");if(!el)return;el.textContent=text;el.classList.add("on");clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.classList.remove("on"),2900)}
b.addEventListener("click",()=>{
 const view=window.BoluoInsightsV2,topics=window.BoluoPublicTopics&&window.BoluoPublicTopics.targets;
 if(!view||!topics){notice("页面尚未准备好，请刷新后重试");return}
 const s=view.getState(),target=topics[s.target],factor=target&&target.factors.find(f=>f.id===s.factor);
 if(!factor){notice("尚未选定可保存的联系");return}
 const record={v:1,target:s.target,factor:s.factor,name:factor.name,missing:factor.missing,
  question:factor.why,cut:!!s.cut,severity:Number(s.severity),savedAt:new Date().toISOString()};
 try{localStorage.setItem("boluo-v11-insight-focus",JSON.stringify(record));notice("已保存这条关注联系，可进入第十一页报告");}
 catch(e){notice("当前浏览器未允许本机保存，请复制核验问题链接")}
});
if(toReport)toReport.addEventListener("click",()=>{
 /* Navigation itself does not count as a saved finding. Only the explicit save button does. */
});
})();