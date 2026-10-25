/* ============================================================
 * bl-viz/data.js —— 博罗产业风洞 统一数据层（2026-10-26 联网核实）
 *
 * 全部数字来自官方公开渠道，每条带来源与统计时期，分 A/B/C/D 四级。
 *  - A 官方直接观测（统计公报/统计局简析/政府文件）
 *  - B 间接推算（由公开数据计算）
 *  - C 模型校准参数（情景设定，非实测）
 *  - D 未验证假设
 * 本文件不写任何无来源数字。
 * ============================================================ */

/* ---------- 官方来源（可核对原文） ---------- */
const BL_SRC = {
  g2025:  'http://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html', // 2025年统计公报
  h12026: 'https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5823/mpost_5823636.html', // 2026上半年分析
  m82026: 'https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5860/post_5860920.html', // 2026年1-8月简析
  plan2026:'https://www.boluo.gov.cn/zwgk/zfgb/2026n/deq/xzfwj/content/post_5781438.html', // 2026计划指标
  gz2026: 'http://www.boluo.gov.cn/zwgk/zfgzbg/content/post_5717382.html' // 2026政府工作报告
};

/* ============================================================
 * 2025 全年（统计公报，A类）—— 八项体检卡
 * status: good 增长向好 / warm 温和承压 / risk 明显下滑 / neutral 中性
 * trend: 迷你趋势线所用的真实历年序列（公报官方图，A类）
 * ============================================================ */
const BL_2025 = {
  year: 2025,
  source: BL_SRC.g2025,
  sourceName: '2025年博罗国民经济和社会发展统计公报（博罗县统计局，2026-07-01）',
  metrics: [
    {k:'地区生产总值', v:'1005.45亿', rate:'+5.5%', status:'good', detail:'人均GDP 81757元',
     note:'2025年全县GDP 1005.45亿元，增长5.5%，广东首个千亿县。三产结构10.7:54.6:34.7。',
     trend:[801.4,891.7,918.6,952.7,953.1,1005.45]},
    {k:'规上工业增加值', v:'+8.7%', rate:'+8.7%', status:'good', detail:'五年年均+8.9%',
     note:'2025年规上工业增加值增长8.7%，电子设备制造+23.0%、电气机械+13.7%。这是生产端，不是总产值。',
     trend:[12.3,13.4,13.1,12.9,10.1,8.7]},
    {k:'固定资产投资', v:'−18.8%', rate:'−18.8%', status:'risk', detail:'2024年已为 −10.4%',
     note:'2025年全社会固定资产投资下降18.8%，连续第二年负增长。工业投资−12.7%、房地产开发投资−47.6%、基建−0.3%。',
     trend:[16.8,34.5,11.5,9.3,-10.4,-18.8]},
    {k:'房地产开发投资', v:'−47.6%', rate:'−47.6%', status:'risk', detail:'商品房销售面积−19.2%',
     note:'2025年房地产开发投资下降47.6%；商品房销售面积77.82万㎡、销售额50.13亿（−33.3%），销售面积比2020年跌73%。',
     trend:[11.6,-16.8,-16.6,-34.0,-27.0,-19.2]},
    {k:'社会消费品零售', v:'296.99亿', rate:'+3.9%', status:'warm', detail:'餐饮+2.3%、住宿−2.3%',
     note:'2025年社零总额296.99亿元，增长3.9%。游客1028.09万人次+11.7%，旅游综合收入51.88亿+19.1%。',
     trend:[3.1,3.8,3.5,4.3,4.6,4.9]},
    {k:'外贸进出口总额', v:'402.59亿', rate:'+26.1%', status:'good', detail:'2026计划增5%',
     note:'2025年外贸进出口总额402.59亿元，增长26.1%（据2026年计划指标表）。实际利用外资1.94亿+11.6%。',
     trend:null},
    {k:'一般公共预算收入', v:'95.27亿', rate:'+0.2%', status:'warm', detail:'总税收101.17亿 −1.1%',
     note:'2025年一般公共预算收入95.27亿元，增长0.2%；税收收入52.48亿占55.1%。总税收101.17亿元下降1.1%。',
     trend:[1.1,-23.9,-9.7,-4.3,0,0.2]},
    {k:'居民人均可支配收入', v:'40626元', rate:'+4.5%', status:'warm', detail:'实际增长5.0%',
     note:'2025年居民人均可支配收入40626元，增长4.5%；城镇45832元+3.5%、农村32915元+6.2%。',
     trend:null}
  ]
};

/* ============================================================
 * 2026 最新（截至1-8月，统计局简析，A类）—— 剪刀差的核心证据
 * 生产端一路回升、投资端深度失速
 * ============================================================ */
const BL_2026 = {
  latestLabel: '2026年1-8月',
  latestSource: BL_SRC.m82026,
  latestSourceName: '2026年1-8月全县经济运行基本情况（博罗县统计局，2026-09-29）',
  h1Source: BL_SRC.h12026,
  h1SourceName: '博罗县2026年上半年经济运行情况分析（2026-07-31）',
  // 生产端（回升）
  production: [
    {k:'规上工业增加值', v:'+8.9%', sub:'1-8月 · 上半年+7.5%', status:'good',
     note:'1-8月规上工业增加值增长8.9%，比上半年明显抬升；电子设备+12.7%、电气机械+14.1%，两行业贡献率59.3%。'},
    {k:'规上工业总产值', v:'+8.5%', sub:'1-8月 · 上半年+6.1%', status:'good',
     note:'1-8月规上工业总产值增长8.5%，33个工业行业大类中22个正增长，增长面66.7%。'},
    {k:'高技术制造业', v:'+11.1%', sub:'上半年 · 高于全县5个点', status:'good',
     note:'上半年高技术制造业总产值增长11.1%，拉动全县规上工业总产值增长3.2个百分点。'},
    {k:'全社会用电量', v:'+11.9%', sub:'1-8月 · 工业用电+11.5%', status:'good',
     note:'1-8月用电量90.47亿千瓦时+11.9%，工业用电60.04亿千瓦时+11.5%，印证工厂仍在高负荷运转。'}
  ],
  // 投资端（失速）
  investment: [
    {k:'固定资产投资', v:'−34.1%', sub:'1-8月 · 上半年−36.4%', status:'risk',
     note:'1-8月固投下降34.1%，降幅比1-7月收窄0.9个百分点。年初1-2月曾短暂转正+1.1%，此后一路下滑。'},
    {k:'工业投资', v:'−46.7%', sub:'1-8月 · 上半年−51.3%', status:'risk',
     note:'1-8月工业投资下降46.7%，上半年一度腰斩至−51.3%。而2026年计划工业投资110亿元，缺口巨大。'},
    {k:'基础设施投资', v:'−35.3%', sub:'1-8月 · 上半年−34.5%', status:'risk',
     note:'1-8月基建投资下降35.3%。2025年基建仅−0.3%，2026年明显失速。'},
    {k:'房地产开发投资', v:'−32.5%', sub:'1-8月 · 上半年−32.1%', status:'risk',
     note:'1-8月房地产开发投资下降32.5%；商品房销售面积38.74万㎡−22.2%，降幅在收窄。'}
  ],
  // 2026 固投月度累计走势（A类，官方走势图）—— 最关键的"年初闪转"
  fixedInvestmentMonthly: [
    {m:'1-2月', v:1.1}, {m:'1-3月', v:-17.2}, {m:'1-4月', v:-26.9},
    {m:'1-5月', v:-31.9}, {m:'上半年', v:-36.4}, {m:'1-7月', v:-35.0}, {m:'1-8月', v:-34.1}
  ],
  // 2026 工业增加值月度累计走势（A类）
  industryMonthly: [
    {m:'一季度', v:3.5}, {m:'1-4月', v:3.7}, {m:'1-5月', v:4.0},
    {m:'上半年', v:7.5}, {m:'1-7月', v:8.7}, {m:'1-8月', v:8.9}
  ],
  h1: {
    gdp:'453.65亿', gdpRate:'+3.0%', gdpNote:'2026上半年GDP 453.65亿元，增长3.0%；一产+5.5%、二产+3.1%、三产+1.9%。',
    retail:'154.59亿', retailRate:'+5.4%',
    budget:'48.08亿', budgetRate:'+0.8%',
    tax:'57.35亿', taxRate:'+5.7%'
  }
};

/* ============================================================
 * 2026 年计划目标（博府〔2026〕8号，A类）
 * ============================================================ */
const BL_PLAN_2026 = {
  source: BL_SRC.plan2026,
  sourceName: '博罗县2026年国民经济和社会发展计划主要指标（2026-04-08）',
  gzSource: BL_SRC.gz2026,
  items: [
    {k:'GDP增速', target:'6.5%—7%', actual:'上半年+3.0%'},
    {k:'规上工业增加值', target:'9%以上', actual:'1-8月+8.9%'},
    {k:'固定资产投资', target:'实现正增长', actual:'1-8月−34.1%'},
    {k:'社会消费品零售', target:'+4.5%', actual:'1-8月+3.6%'},
    {k:'一般公共预算收入', target:'+3%', actual:'1-8月+0.4%'},
    {k:'外贸进出口', target:'+5%', actual:'2025年+26.1%'}
  ],
  // 十五五（2026-2030）目标
  target2030: {
    gdp: 1600, // 力争2030年GDP达到1600亿
    industryOutput: 3600, // 规上工业总产值突破3600亿
    enterprises: 2500, // 规上工业企业突破2500家
    note:'十五五目标：GDP达到1600亿元、规上工业总产值突破3600亿元、规上工业企业突破2500家。',
    source: BL_SRC.gz2026
  },
  // 2026 园区目标（政府工作报告）
  park2026: {
    newStarts: 25, // 供地新动工25宗
    newProduction: 30, // 新投产30宗
    industrialInvestment: 110, // 工业投资110亿元
    industrialOutput: 550 // 规上工业产值550亿元
  }
};

/* ============================================================
 * 真实事件证据（A类，供 evidence/events 与风洞"现实苗头"引用）
 * ============================================================ */
const BL_EVENTS = [
  {id:'BL-2026-0001', level:'A', type:'project_progress',
   title:'欣旺达广东首座独立储能电站在博罗并网送电',
   date:'2026-10',
   detail:'位于惠州博罗产业园区的欣城新能源独立储能电站并网试运行，欣旺达在广东首座，预计年产值约0.7亿元、税收约1200万元。',
   url:'https://www.boluo.gov.cn/xzygdw/xgbdst/blxw/content/post_5868321.html'},
  {id:'BL-2026-0002', level:'A', type:'project_progress',
   title:'锂威新能源锂离子电芯生产线项目（园洲镇，预计2027年8月投产）',
   date:'2026-07',
   detail:'位于园洲镇欣旺达产业园16号厂房，总投资6377万元，建智能穿戴设备用锂离子电芯生产线。',
   url:'https://www.boluo.gov.cn/hzblfzggj/gkmlpt/content/5/5801/mpost_5801838.html'},
  {id:'BL-2026-0003', level:'A', type:'investment',
   title:'2026上半年工业投资下降51.3%，较一季度降幅扩大18.1个百分点',
   date:'2026-07',
   detail:'工业投资腰斩，是本轮经济最大的承压点；同期规上工业增加值仍增长7.5%，呈现"生产增、投资降"的剪刀差。',
   url:BL_SRC.h12026},
  {id:'BL-2026-0004', level:'A', type:'policy',
   title:'2026年园区目标：新动工25宗、新投产30宗、工业投资110亿、产值550亿',
   date:'2026-02',
   detail:'政府工作报告提出推动园区提质扩能，做大新一代电子信息、智能装备、新能源新材料三大主导产业。',
   url:BL_SRC.gz2026}
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {BL_SRC, BL_2025, BL_2026, BL_PLAN_2026, BL_EVENTS};
}

/* ============================================================
 * 压力情景（受控场景压测，与参数敏感性是两本账）
 * 同种子 SEED=42、N=20000 重跑，差异只来自注入的事件
 * 每个情景都挂真实"现实苗头"，不是凭空制造压力
 * ============================================================ */
const BL_SEED = 42, BL_N = 20000;
const BL_SCENES = {
  base: {
    name: '规划兑现（基准）',
    desc: '三大产业按十五五规划推进，园区年550亿产值、工业投资110亿目标兑现',
    sprout: null,
    adjust: paths => paths
  },
  investment: {
    name: '工业投资持续低迷',
    desc: '2026上半年工业投资−51.3%、1-8月−46.7%延续，新项目开工投产放缓',
    sprout: '现实苗头：2026年1-8月工业投资−46.7%，与计划"工业投资110亿"形成缺口；新投产项目节奏直接决定双引擎兑现。',
    adjust: paths => { paths[0].mu=Math.max(0,paths[0].mu*0.70); paths[1].mu=Math.max(0,paths[1].mu*0.75); paths[3].mu=Math.max(0,paths[3].mu*0.50); return paths; }
  },
  property: {
    name: '房地产继续探底',
    desc: '开发投资−32.5%、销售面积仍−22.2%，拖累三产与基建配套',
    sprout: '现实苗头：2026年1-8月房地产开发投资−32.5%、销售面积−22.2%；销售面积已较2020年高点跌超七成。',
    adjust: paths => { paths[2].mu=Math.max(0,paths[2].mu*0.70); return paths; }
  },
  combined: {
    name: '投资失速+地产叠加',
    desc: '工业投资低迷与房地产探底同时发生，财政与基建同步承压',
    sprout: '现实苗头：2026年1-8月固投−34.1%、基建−35.3%；一般公共预算收入仅+0.4%，腾挪空间有限。',
    adjust: paths => { paths[0].mu=Math.max(0,paths[0].mu*0.65); paths[1].mu=Math.max(0,paths[1].mu*0.70); paths[2].mu=Math.max(0,paths[2].mu*0.70); paths[3].mu=Math.max(0,paths[3].mu*0.45); return paths; }
  },
  trend: {
    name: '现状延续（不加码）',
    desc: '按2025-2026上半年实际增速自然外推，不额外发力',
    sprout: '现实苗头：2026上半年GDP仅+3.0%（计划6.5%-7%）；若不扭转投资，自然增长难以摸到1600亿。',
    adjust: () => JSON.parse(JSON.stringify(HT.TREND_PATHS))
  },
  upside: {
    name: '双引擎超预期',
    desc: '电子信息、储能与新能源项目提前放量，招商超预期',
    sprout: '现实苗头：2026年1-8月电子设备+12.7%、电气机械+14.1%；欣旺达广东首座独立储能电站已并网。',
    adjust: paths => { paths[0].mu=Math.max(0,paths[0].mu*1.15); paths[1].mu=Math.max(0,paths[1].mu*1.10); return paths; }
  }
};

const BL_SHARED_KEY='bl_v1_2026_selected_scenario';
const blCache={};
function blRunScene(key){
  if(!BL_SCENES[key]) key='base';
  if(blCache[key]) return blCache[key];
  let paths=JSON.parse(JSON.stringify(HT.DEFAULT_PATHS));
  paths=BL_SCENES[key].adjust(paths);
  return blCache[key]=HT.run(BL_SEED,BL_N,paths);
}
function blInitialScene(){
  let fromUrl=new URLSearchParams(location.search).get('scene');
  if(BL_SCENES[fromUrl]) return fromUrl;
  try{ let k=localStorage.getItem(BL_SHARED_KEY); if(BL_SCENES[k]) return k; }catch(e){}
  return 'base';
}
function blSaveScene(key){ try{ localStorage.setItem(BL_SHARED_KEY,key); }catch(e){} }
function blFmt(n){ return Math.round(n).toLocaleString('zh-CN'); }
function blStateLabels(key){
  let s=blRunScene(key), b=blRunScene('base');
  return {hit:s.hit.toFixed(1)+'%', p50:blFmt(s.p50), p10:blFmt(s.p10), p90:blFmt(s.p90),
    gap:(s.hit-b.hit).toFixed(1), diff:blFmt(s.p50-b.p50), name:BL_SCENES[key].name};
}
