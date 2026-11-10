/* V11 / 08 — transparent discovery data and scenario-only calculations. */
(function(root){
"use strict";
const clamp=function(n,min,max){n=Number(n);return Math.min(max,Math.max(min,Number.isFinite(n)?n:min));};
const signals=[
 {id:"industrial-gap",kind:"observed",label:"公开统计反差",title:"工业增加值增长，工业投资却明显下降",valueA:"+8.9%",nameA:"规上工业增加值 · 同比",valueB:"−44.7%",nameB:"工业投资 · 同比",period:"2026年前三季度 · 页面现有公开来源",detail:"这是两项统计指标的方向背离。统计口径、覆盖对象和时间传导可能不同，不能直接据此认定投资下降导致工业增长转弱。",question:"增长由存量产能、行业结构还是新项目共同支撑？",evidence:"分行业增加值、企业产能利用率、项目建设与投产进度、企业订单",factor:"project",source:"https://www.fz0752.com/fontHtml/html/issue/000143025_1.html"},
 {id:"local-value",kind:"question",label:"待核验结构问题",title:"工业增长的价值，有多少留在本地？",valueA:"产出",nameA:"不等于",valueB:"留存",nameB:"本地增加值、利润、工资与采购",period:"不是已观测结论",detail:"总产出不能替代本地增加值、企业利润、工资或居民收入。需要把采购地、供应商、增加值与收入的口径接起来。",question:"新增产出是否带来本地供应链和居民收入同步变化？",evidence:"企业采购合同、供应商所在地、分行业增加值、工资总额",factor:"network"},
 {id:"project-lag",kind:"question",label:"待核验结构问题",title:"投资、建设、投产，是否错开了时间？",valueA:"投资",nameA:"建设期",valueB:"产出",nameB:"达产期",period:"时间传导假设",detail:"投资发生、设备安装、试产、达产和形成统计产出通常不是同一时点。需要项目级时间序列才能判断接续情况。",question:"哪些项目处于开工、设备安装、试产或达产阶段？",evidence:"项目清单、设备安装、试产记录、达产时间",factor:"project"},
 {id:"agri-value",kind:"question",label:"待核验结构问题",title:"农产品卖出去了，增值环节留在哪里？",valueA:"销售",nameA:"不等于",valueB:"加工",nameB:"本地加工、品牌和渠道收益",period:"待核验，不代表农业表现差",detail:"农业产量、销售额、加工率、渠道回款和农户收入是不同环节。缺少加工与交易数据时，不能判断价值留存。",question:"采收、加工、渠道和回款之间，哪一环决定本地增值？",evidence:"本地加工量、加工损耗、渠道合同、回款周期、农户结算",factor:"agri"},
 {id:"talent-access",kind:"question",label:"待核验结构问题",title:"岗位增加，关键人才是否到得了、留得住？",valueA:"岗位",nameA:"不等于",valueB:"到岗",nameB:"技能匹配、通勤时间与人员稳定",period:"待核验，不代表通勤已经恶化",detail:"岗位数量不能说明关键工种供给、通勤可达性和人员稳定性。需要岗位、招聘、通勤与流动样本。",question:"哪些关键岗位受技能供给或通勤约束？",evidence:"岗位工种与薪酬、招聘周期、通勤样本、员工流动",factor:"people"},
 {id:"supplier-risk",kind:"question",label:"待核验结构问题",title:"一条订单断了，本地供应商多久能找到替代？",valueA:"客户",nameA:"集中度",valueB:"替代",nameB:"第二客户与转换周期",period:"待核验，不代表已经发生断供",detail:"企业数量多不等于网络韧性强。客户集中度、认证周期、替代供应商和现金流缓冲可能决定冲击传导。",question:"哪些企业依赖少数客户，替代订单需要多久？",evidence:"客户集中度、供应商名录、认证周期、应收账款与替代订单",factor:"network"}
];
const variables=[
 {id:"project",name:"项目兑现周期",group:"资本与项目",factor:"project",why:"投资从计划到形成产能有多个阶段，单看投资额无法识别项目何时转化为产出。",mechanism:"项目进度可能影响新增产能形成时间；需要逐项目确认，不能由投资总量直接推断。",question:"哪些重点项目已完成设备安装、试产和达产？",evidence:"项目阶段清单、设备安装与试产记录、达产时间",relations:["capacity","orders","skills","services"]},
 {id:"capacity",name:"存量产能利用率",group:"产业生产",factor:"capacity",why:"产出增长可能由既有产线支撑，也可能来自新增产能；两者对未来接续的含义不同。",mechanism:"订单、开机率、库存和设备利用情况共同影响存量产能能否持续承接。",question:"增长主要来自哪些行业、企业和既有产线？",evidence:"分行业产量、产能利用率、开机率、库存与订单",relations:["project","orders","skills","energy"]},
 {id:"local-buy",name:"本地采购深度",group:"价值留存",factor:"network",why:"企业在博罗生产，不代表所有中间品、服务和利润都留在博罗。",mechanism:"本地供应商进入采购体系的程度，可能影响本地增加值与配套企业成长。",question:"新增采购中，有多少由博罗本地企业实际承接？",evidence:"采购合同、供应商注册地、采购金额与产品类别",relations:["customer","services","agri-process"]},
 {id:"customer",name:"客户集中度",group:"企业网络",factor:"network",why:"企业规模或数量不能直接说明网络抗冲击能力，客户集中和替代时间可能更关键。",mechanism:"少数客户占比高时，单一订单变化可能放大经营波动；需企业级客户数据验证。",question:"关键配套企业是否依赖少数客户？",evidence:"前五大客户占比、订单变动、替代客户和账期",relations:["local-buy","substitute","cash-cycle"]},
 {id:"substitute",name:"替代供应商周期",group:"企业网络",factor:"network",why:"网络中存在其他节点，不代表它们能在需要时迅速替代。认证、模具、质量和交付都需要时间。",mechanism:"替代周期可能决定局部冲击会不会扩散成持续性断点。",question:"从失去订单到获得替代订单，平均需要多久？",evidence:"供应商认证周期、换线时间、替代订单与交付记录",relations:["customer","capacity","cash-cycle"]},
 {id:"skills",name:"关键工种供给",group:"人口与人才",factor:"people",why:"就业总量不能代替技能匹配。部分项目对技术工种、工程师和维修人员有特定要求。",mechanism:"关键工种缺口可能影响项目爬坡、设备维护和生产服务协同。",question:"哪些工种招聘周期长、流动率高或难以本地补充？",evidence:"岗位工种、招聘周期、薪酬、员工流动与培训记录",relations:["commute","capacity","services","project"]},
 {id:"commute",name:"通勤可达性",group:"人口与空间",factor:"people",why:"岗位所在地、居住地和交通时间共同决定劳动者是否能稳定抵达岗位。",mechanism:"通勤成本可能影响招聘半径与人员稳定性，但需出行和用工样本验证。",question:"关键岗位员工的真实通勤时间和成本是多少？",evidence:"匿名通勤样本、班次、居住地分布、公共交通可达性",relations:["skills","services"]},
 {id:"services",name:"生产性服务本地化",group:"产业服务",factor:"services",why:"研发、检测、维修、物流、工业软件等服务可能在产业链之外发生，影响本地价值留存。",mechanism:"本地服务供给与企业需求匹配程度，可能影响协同效率和价值留存。",question:"企业关键生产性服务由本地还是外地机构提供？",evidence:"服务采购合同、供应商所在地、服务类型和费用",relations:["local-buy","skills","project","agri-process"]},
 {id:"agri-process",name:"农产品本地加工率",group:"农业与乡村",factor:"agri",why:"农产品销售规模不能替代加工量、损耗、品牌溢价和农户实际结算。",mechanism:"加工能力与渠道议价可能改变价值在农户、加工厂和渠道之间的分配。",question:"本地产出有多少在本地加工，最终价值由谁获得？",evidence:"加工量、原料收购价、出厂价、损耗、合同与结算",relations:["local-buy","services","cash-cycle"]},
 {id:"cash-cycle",name:"农业账期与回款",group:"农业与乡村",factor:"agri",why:"销售额不等于现金到账。采收、加工垫资、渠道账期和农户结算存在时间差。",mechanism:"回款周期可能影响加工厂垫资压力和农户现金流，需合同与流水核实。",question:"从采收交货到农户实际收款，各环节分别需要多久？",evidence:"采购合同、应收账款账龄、加工厂垫资、农户结算记录",relations:["agri-process","customer","substitute"]},
 {id:"energy",name:"能源与物流约束",group:"空间与基础设施",factor:"capacity",why:"产业项目的产能兑现还依赖电力、用地、物流和配套设施，不应只看项目投资。",mechanism:"要素供给约束可能改变项目建设、生产和交付节奏。",question:"重点项目是否出现能源、用地或物流瓶颈？",evidence:"用电负荷、接电周期、物流时效、用地交付与项目进度",relations:["capacity","project","services"]}
];
const hypotheses=[
 {id:"stock",title:"存量产能仍在支撑增长",summary:"既有产线的订单、开机率或生产效率可能支撑当前工业增加值；投资变化未必同步反映当期产出。",predictions:["存量企业产量和开机率保持韧性","新增产出更多来自既有企业或产线","订单与库存变化能解释产出表现"],evidence:["分行业、分企业产量与增加值贡献","产能利用率、开机率、库存与订单","存量企业技改和设备更新记录"],factor:"capacity"},
 {id:"timing",title:"投资与产出存在时间错位",summary:"投资发生、设备安装、试产、达产和形成统计产出有先后顺序；需要逐项目观察时间链。",predictions:["投资变化先于产出变化","不同项目的建设阶段差异明显","项目投产与产出贡献存在滞后"],evidence:["项目开工、设备安装、试产和达产时间","项目投资完成额与实际产能形成时间","新投产项目的季度产出贡献"],factor:"project"},
 {id:"mix",title:"行业与项目结构发生变化",summary:"总量指标可能掩盖行业间的不同方向；少数行业或企业的变化可能主导整体表现。",predictions:["行业之间的投资与产出走势不一致","少数行业贡献了较大比例的增量","不同项目的资本强度和投产周期差异明显"],evidence:["分行业工业增加值和投资数据","重点企业与项目的贡献拆分","行业订单、产能与资本开支变化"],factor:"network"}
];
const evidence=[
 {id:"project-records",name:"项目建设与投产进度",holder:"项目业主、园区或主管部门",variable:"项目兑现周期",question:"项目分别处于立项、开工、设备安装、试产还是达产？",impact:"可能改变对新增产能接续时间的判断。",factor:"project",focus:"growth"},
 {id:"capacity-records",name:"存量企业产能与订单",holder:"企业、行业协会或统计部门",variable:"存量产能利用率",question:"分行业产能利用率、开机率、订单和库存如何变化？",impact:"可能区分增长来自存量产能还是新增项目。",factor:"capacity",focus:"growth"},
 {id:"purchase-records",name:"本地采购合同与供应商",holder:"链主企业、配套企业或园区",variable:"本地采购深度",question:"采购金额、供应商所在地、产品类别和结算周期分别是什么？",impact:"可能改变对本地价值留存和配套能力的判断。",factor:"network",focus:"retention"},
 {id:"customer-records",name:"客户集中度与替代订单",holder:"企业、行业协会或供应链平台",variable:"客户集中度",question:"前五大客户占比、替代客户认证和替代订单周期是多少？",impact:"可能改变对产业网络韧性的判断。",factor:"network",focus:"resilience"},
 {id:"labor-records",name:"关键工种招聘与通勤样本",holder:"企业、人社部门或交通调查",variable:"关键工种与通勤可达性",question:"岗位工种、薪酬、招聘周期、居住地和通勤时间如何分布？",impact:"可能改变对人才约束和岗位获得的判断。",factor:"people",focus:"growth"},
 {id:"agri-records",name:"农业加工、渠道与回款记录",holder:"合作社、加工厂、渠道商或行业协会",variable:"本地加工与资金周转",question:"本地加工量、采购合同、账期、垫资和农户结算周期是多少？",impact:"可能改变对农业价值留存和经营压力的判断。",factor:"agri",focus:"retention"}
];
function exposure(dependence,shock,substitute){
 const d=clamp(dependence,0,100)/100,s=clamp(shock,0,100)/100,b=1-.75*clamp(substitute,0,100)/100;
 return Math.round(d*s*b*1000)/10;
}
function heatmap(dependence,shocks,substitutes){
 return shocks.map(function(shock){return substitutes.map(function(substitute){return {shock:shock,substitute:substitute,value:exposure(dependence,shock,substitute)};});});
}
root.BoluoDiscoveryCore=Object.freeze({clamp,signals,variables,hypotheses,evidence,exposure,heatmap});
})(typeof window!=="undefined"?window:globalThis);
