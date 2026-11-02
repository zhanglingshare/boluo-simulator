/* 博罗柏塘茶产业 · 分级情报底座 v3 / 2026-11-02
  A 原始官方/标准存在事实; B 具名报道/镇级被引统计; C 证据派生/情景估计; D 无依据或演示.
  注意: 文件中任何“规划目标”都不是“已实现”。
*/
(function(root){
'use strict';
const sources=[
{id:"gov15",grade:"A",title:"博罗县十五五规划纲要发布通知",publisher:"博罗县人民政府",date:"2026-08-31",url:"https://www.boluo.gov.cn/zwgk/qt/gzjh/content/post_5842396.html",limit:"已核实正式发布；附件全文尚未逐条审读，不填入未经核实的柏塘任务"},
{id:"city15",grade:"A",title:"惠州市十五五规划纲要",publisher:"惠州市人民政府",date:"2026-07-08",url:"https://www.cnbayarea.org.cn/city/huizhou/zxdt/content/mpost_1334550.html",limit:"城市政策背景，不等于柏塘镇单项绩效"},
{id:"std",grade:"A",title:"DB4413/T 6—2019 地理标志产品 柏塘山茶",publisher:"全国标准信息公共服务平台",date:"2019-12-26",url:"https://std.samr.gov.cn/db/search/stdDBDetailed?id=9AF7A3B2130735D6E05397BE0A0A00E1",limit:"证明标准存在，不等于所有经营主体执行或通过检验"},
{id:"prov2026",grade:"B",title:"罗浮山茶从散装走向整装",publisher:"南方日报",date:"2026-04-10",url:"https://epaper.nfnews.com/nfdaily/html/202604/10/content_10167542.html",limit:"镇级数据由媒体转述，产值统计范围有待核实"},
{id:"tea2026",grade:"B",title:"博罗春茶季活动与产业基础",publisher:"新华网客户端",date:"2026-04-13",url:"https://app.xinhuanet.com/news/article.html?articleId=20260413be238442576b4b6b99a0ff4b48bef8d4",limit:"部分数据来自同一镇级披露，不能算作独立样本"},
{id:"tour2026",grade:"B",title:"全链突围激活千年茶山新动能",publisher:"羊城晚报",date:"2026-03-20",url:"https://ep.ycwb.com/epaper/ywdf/h5/html5/2026-03/20/content_1001_745177.htm",limit:"350万人次和15亿元为报道的镇级目标；2570吨与另一统计口径不同"},
{id:"nf2026",grade:"B",title:"广东首个茶产业综合体，为什么在博罗柏塘？",publisher:"南方+",date:"2026-04-11",url:"https://static.nfnews.com/content/202604/11/c12327865.html",limit:"产业调查，B端原料茶为发展方向；不证明当前已形成稳定采购规模"},
{id:"nfvisitor",grade:"B",title:"茶园来了采茶机器人！博罗春茶季今日启幕",publisher:"南方+",date:"2026-04-11",url:"https://static.nfnews.com/content/202604/11/c12327937.html",limit:"游客同比、峰值属于节假日或局部场景；不等于年度增长率"},
{id:"workreport",grade:"B",title:"柏塘镇2025年政府工作报告收录记录",publisher:"国研网数据库镜像",date:"2025-11-07",url:"https://guoyanwang.clcn.net.cn/DRCNet.Mirror.Documents.Web/DocSummary.aspx?DocID=8069124&leafID=3405",limit:"仅核到摘要/收录信息；全文未验证，不能导入其中未读数值"},
{id:"county2030",grade:"B",title:"博罗县十五五未来格局和2030目标报道",publisher:"南方日报",date:"2026-01-27",url:"https://epaper.nfnews.com/nfdaily/html/202601/27/content_10161535.html",limit:"县级目标非柏塘茶产业目标"},
{id:"yingde",grade:"B",title:"英德茶产业标准化与B端供应案例",publisher:"英德政府与媒体资料",date:"2026",url:"https://www.yingde.gov.cn/",limit:"仅作机制参照，不能把英德路径增长率直接套用柏塘"},
{id:"national",grade:"B",title:"茶产业提质升级指导意见（2026—2030年）相关政策",publisher:"工信部等五部门政策（媒体转引）",date:"2026-02",url:"https://ep.ycwb.com/epaper/ywdf/h5/html5/2026-03/20/content_1001_745177.htm",limit:"当前链接为报道而非已核原始发文，政策存在性待直接匹配后再提升原始来源等级"}
];
const facts=[
{id:"tea2025",name:"2025年茶叶产量",value:2449,unit:"吨",grade:"B",sourceIds:["prov2026","tea2026"],qualifier:"约值，媒体引用镇级统计；另有2570吨口径",use:"tea_volume",kind:"observed"},
{id:"tea2025alt",name:"2025年茶叶产量不同口径",value:2570,unit:"吨",grade:"B",sourceIds:["tour2026"],qualifier:"不可与2449吨取平均，需对照原始统计底表",kind:"conflict"},
{id:"teaValue",name:"2025年茶产业产值",value:12,unit:"亿元",grade:"B",sourceIds:["prov2026","tea2026"],qualifier:"未核实是否含上下游/服务增加值，不据此乘指数预测真实收入",kind:"observed"},
{id:"garden",name:"茶园面积",value:4.32,unit:"万亩",grade:"B",sourceIds:["tea2026"],qualifier:"另有4.3—4.5万亩口径",kind:"observed"},
{id:"farmers",name:"茶农户数",value:6000,unit:"户以上",grade:"B",sourceIds:["tea2026"],qualifier:"约数，非全职劳动力",kind:"observed"},
{id:"firms",name:"合作社及茶企",value:58,unit:"家",grade:"B",sourceIds:["tea2026"],qualifier:"与茶文旅协会65家成员统计范围不同",kind:"observed"},
{id:"capacity",name:"产业综合体单体年设计干茶加工能力",value:150,unit:"吨",grade:"B",sourceIds:["prov2026","tour2026"],qualifier:"30万斤折算，单厂设计能力不等于全镇总产能或实际产量",kind:"observed"},
{id:"investment",name:"茶产业综合体披露投入",value:3.66,unit:"亿元",grade:"B",sourceIds:["tour2026"],qualifier:"项目披露总投资，不是实际完成投资或每年投产收益",kind:"reported_plan"},
{id:"visits",name:"2025年全镇游客",value:130,unit:"万人次以上",grade:"B",sourceIds:["nfvisitor","tour2026"],qualifier:"取130万为建模下限参考，不当作茶产品采购人数",use:"tourism_visits",kind:"observed"},
{id:"goalvisit",name:"2030年旅游接待目标",value:350,unit:"万人次以上",grade:"B",sourceIds:["tour2026"],qualifier:"规划目标不是预测，亦非茶园单点游客数",use:"tourism_target",kind:"plan"},
{id:"goalincome",name:"2030年文旅综合收入目标",value:15,unit:"亿元",grade:"B",sourceIds:["tour2026"],qualifier:"文旅综合收入统计口径需核实；不等于茶叶销售",use:"tourism_target_income",kind:"plan"},
{id:"standard",name:"柏塘山茶地方标准",value:"DB4413/T 6—2019",unit:"",grade:"A",sourceIds:["std"],qualifier:"可核验标准存在；标准执行覆盖率未知",kind:"observed"},
{id:"productModes",name:"B端原料茶方向",value:"标准化供应+特色品牌茶",unit:"",grade:"B",sourceIds:["nf2026"],qualifier:"发展策略，不代表已实现订单占比",kind:"direction"},
{id:"cagrGoal",name:"从130到350万人次的最低年复合增速",value:21.9,unit:"%/年",grade:"C",sourceIds:["tour2026"],qualifier:"(350/130)^(1/5)-1；用2025 130万近似基线",kind:"derived"},
{id:"perVisitGoal",name:"若2030游客350万实现15亿收入所需人均贡献",value:428.57,unit:"元/人次",grade:"C",sourceIds:["tour2026"],qualifier:"1500000000/3500000，统计口径与重复计算有待验证",kind:"derived"}
];
const unknowns=[
{id:"annualVisit",name:"游客年增长率",grade:"C",min:0.04,mid:0.15,max:0.30,unit:"年增速",rationale:"2030目标所需约21.9%作为约束参照；4%—30%为情景压力区间，非本地统计置信区间",sourceIds:["tour2026"]},
{id:"avgSpend",name:"可归入当地文旅综合收入的人均收入",grade:"D",min:180,mid:350,max:650,unit:"元/人次",rationale:"尚未取得柏塘游客消费台账；仅为可编辑压力输入，不作现实估计",sourceIds:["tour2026"]},
{id:"b2bShare",name:"B端标准化原料茶份额",grade:"D",min:0.08,mid:0.22,max:0.38,unit:"干茶份额",rationale:"尚无本地交易合同与分类销量；需采购/加工台账验证",sourceIds:["nf2026"]},
{id:"processingUse",name:"产业综合体实际使用率",grade:"D",min:0.20,mid:0.58,max:0.90,unit:"设计产能比例",rationale:"只知设计产能150吨，未核实投产和利用情况；不得直接作为全镇加工能力",sourceIds:["prov2026"]},
{id:"qualityUptake",name:"标准执行与批次一致性改善速度",grade:"C",min:0.00,mid:0.035,max:0.08,unit:"年改善参数",rationale:"存在标准与科研合作，效果速度是假设",sourceIds:["std","nf2026"]},
{id:"laborElasticity",name:"劳动力和天气约束的产量敏感性",grade:"C",min:0.015,mid:0.045,max:0.11,unit:"冲击幅度",rationale:"参考春茶季集中用工、天气风险；未取得逐日采摘数据",sourceIds:["tour2026"]}
];
const byId=id=>facts.find(x=>x.id===id);
const source=id=>sources.find(x=>x.id===id);
root.BaitangEvidence=Object.freeze({version:"3.0",asOf:"2026-11-02",sources,facts,unknowns,byId,source,method:"A/B/C/D分级：事实与目标分开；C/D估计必须在模型界面显式披露，且可由后续实测覆盖"});
})(typeof window!=="undefined"?window:globalThis);
