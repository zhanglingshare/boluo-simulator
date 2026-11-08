/* Public observations and questions. No causal scores or simulated values. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.BoluoDiscoveryData = data;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const sources = {
    quarter: {
      publisher: '南方+报道／惠民之家转载', kind: '公开统计的媒体转述',
      note: '2026年前三季度，县域统计。不同指标各保留原口径；不据此认定某镇、某企业的经营情况。'
    },
    yuanzhou: {
      publisher: '南方日报', kind: '现场报道与企业受访',
      note: '企业订单、本地采购比例为受访口径；计划投资不等于已完成投资，施工现场报道不等于投产。'
    },
    tea: {
      publisher: '惠州农业农村南方号／惠州日报', kind: '合作社负责人受访',
      note: '春茶档案，统计对象仅为新陂生态茶园专业合作社。干茶与鲜叶口径分开，不外推全镇收益。'
    },
    cement: {
      publisher: '广东省工业和信息化厅', kind: '部门通告与转载对照',
      note: '仅指公庄镇一条日产2500吨熟料生产线关停及主体设备拆除，不表示企业全部业务退出。'
    },
    copper: {
      publisher: '博罗县政府索引／园区世界报道', kind: '政府索引与媒体报道对照',
      note: '10月13日生产线点火。2027年产值目标不是已实现产值，实际产销数据仍待跟踪。'
    }
  };
  const topics = {
    factory: {
      label: '工厂', icon: 'factory', title: ['工业在涨，投资在降。', '谁在接力？'],
      period: '2026年前三季度 · 同比', chart: 'diverge', source: 'quarter', case: 'electronic',
      metrics: [
        { label: '规上工业增加值', value: 8.9, unit: '%', prefix: '+', color: 'blue', digits: 1 },
        { label: '工业投资', value: -44.7, unit: '%', color: 'coral', digits: 1 }
      ],
      chartNote: '不同指标分别看，不能直接相减。',
      defaultQuestion: '工业增长与投资收缩，下一步应该核对什么？',
      inquiries: [
        { id: 'capacity', label: '原有产能在释放', question: '现有产能、订单和产出，哪些能证明增长来自哪里？', clue: '江丰精密有订单和新增设备的受访线索。', gap: '一家公司不能代表全县；产能利用和产出贡献仍需核对。', event: 'jiangfeng' },
        { id: 'handoff', label: '新增项目能否接上', question: '新增项目从施工到产出，还需要核对哪些进展？', clue: '汉德三期有签约及施工现场报道。', gap: '尚不能据此认定项目投产，更不能把计划金额算作已完成投资。', event: 'hande' },
        { id: 'different', label: '不同行业正在分化', question: '一边扩产、一边退出，哪些变化需要分开观察？', clue: '公庄一条熟料生产线有明确的关停拆除通告。', gap: '单条产线退出不等于全行业衰退；需分行业、分企业继续核对。', event: 'cement' }
      ]
    },
    projects: {
      label: '项目', icon: 'layers', title: ['签约之后，', '走到哪一步了？'],
      period: '汉德精密三期 · 2026年9月现场报道', chart: 'stages', source: 'yuanzhou', case: 'projects',
      metrics: [
        { label: '汉德三期 · 计划投资', value: 15, unit: '亿元', color: 'blue', digits: 0 },
        { label: '已报道的进展', text: '施工现场', color: 'ink' }
      ],
      chartNote: '签约、施工、投产分别核验。施工报道不等于投产。',
      defaultQuestion: '项目已经走到哪一步，下一条应核验什么？',
      inquiries: [
        { id: 'progress', label: '现在走到哪一步', question: '这个项目最新的建设、试产或投产记录在哪里？', clue: '9月报道已有三期项目工地施工场景。', gap: '后续是否试产或投产，需要更新的独立记录。', event: 'hande' },
        { id: 'output', label: '何时形成实际产出', question: '生产线点火后，实际产量和销售兑现了吗？', clue: '铜来顺生产线点火已有报道。', gap: '点火和产值目标都不能替代实际产销量。', event: 'copper' },
        { id: 'local', label: '本地配套接到多少', question: '扩产之外，本地企业接到了哪些采购与订单？', clue: '汉德有本地配套采购比例的受访口径。', gap: '仍需交易与供应商记录；不能直接外推其他企业。', event: 'procurement' }
      ]
    },
    food: {
      label: '吃住', icon: 'food', title: ['餐饮回暖，', '住宿跟上了吗？'],
      period: '2026年前三季度 · 限上营业额同比', chart: 'food', source: 'quarter', case: 'ring',
      metrics: [
        { label: '限上餐饮营业额', value: 9.8, unit: '%', prefix: '+', color: 'blue', digits: 1 },
        { label: '限上住宿营业额', value: 1.6, unit: '%', prefix: '+', color: 'teal', digits: 1 }
      ],
      chartNote: '这是限上营业额，不是游客人数或过夜率。',
      defaultQuestion: '餐饮与住宿增长不同步，先补哪一类经营证据？',
      inquiries: [
        { id: 'overnight', label: '吃饭与住下的差别', question: '餐饮与住宿营业额为何不同步，还缺哪些客源与经营数据？', clue: '两类营业额在同一时期的增幅不同。', gap: '尚不能推断游客过夜率，需要游客及住宿经营调查。', event: 'food' },
        { id: 'coverage', label: '样本覆盖了哪些店', question: '限上企业的变化，能代表普通小店吗？', clue: '现有统计明确限定为限上住宿和餐饮。', gap: '普通小店的覆盖与经营变化，仍需补充。', event: 'food' },
        { id: 'retention', label: '消费留下了多少', question: '消费发生之后，多少经营收入和增加值留在本地？', clue: '已有消费营业额起点。', gap: '本地经营主体、采购和中间投入数据尚不足。', event: 'food' }
      ]
    },
    agriculture: {
      label: '农业', icon: 'leaf', title: ['农业在增长，', '增值留在哪？'],
      period: '2026年前三季度 · 农林牧渔业', chart: 'agriculture', source: 'quarter', case: 'tea',
      metrics: [
        { label: '农林牧渔业总产值', value: 130.32, unit: '亿元', color: 'blue', digits: 2 },
        { label: '总产值同比增长', value: 6.9, unit: '%', prefix: '+', color: 'teal', digits: 1 }
      ],
      sectors: [['农业', 4.4], ['林业', 16.1], ['牧业', 5.9], ['渔业', 13.9], ['专业及辅助活动', 29.1]],
      chartNote: '分行业产值同比，不代表茶叶加工收益或农户收入。',
      defaultQuestion: '从产值增长到本地增值，还缺哪些环节的经营账？',
      inquiries: [
        { id: 'processing', label: '加工多留下多少', question: '生产、加工和渠道，分别在本地形成多少增加值？', clue: '县域产值已有统计，单品经营账仍需下探。', gap: '不把县域统计套用成柏塘茶实际收益。', event: 'agriculture' },
        { id: 'tea', label: '一份春茶经营账', question: '这家合作社的春茶售出之后，成本与回款如何？', clue: '新陂合作社有春茶干茶产量和销售的受访记录。', gap: '尚缺成本、利润与回款周期，不能推算茶农收入。', event: 'tea' },
        { id: 'service', label: '服务环节在变什么', question: '农林牧渔专业及辅助活动增长，具体来自哪些服务？', clue: '该类产值同比增长29.1%。', gap: '分项结构未展开，不能自动解释为高附加值达标。', event: 'agriculture' }
      ]
    }
  };
  const events = [
    { id: 'jiangfeng', topic: 'factory', town: '园洲镇', title: '园洲 · 江丰精密', subtitle: '订单约为上年同期3倍', big: '约3', unit: '倍', tag: '企业受访', date: '2026-09-22', dateLabel: '报道日期', visual: 'orders', source: 'yuanzhou', question: '哪些企业还在加设备？', detail: '报道记录了企业订单约为上年同期3倍及新增设备进厂。', boundary: '这是企业受访线索，不能替代全县订单或开工率统计。', next: '产能利用、实际产出与订单兑现。', inquiry: 'capacity' },
    { id: 'hande', topic: 'projects', town: '园洲镇', title: '园洲 · 汉德精密', subtitle: '第三期项目 · 计划投资', big: '15', unit: '亿', tag: '建设跟踪', date: '2026-09-22', dateLabel: '现场报道', visual: 'stages', source: 'yuanzhou', question: '施工之后，下一步核对什么？', detail: '报道提到8月签约，并记录三期项目工地的施工场景。', boundary: '计划投资不是已完成投资；目前资料不足以认定投产或达产。', next: '后续试产、投产及实际产销记录。', inquiry: 'progress' },
    { id: 'food', topic: 'food', town: null, title: '全县 · 吃饭和住下来', subtitle: '2026年前三季度 · 限上营业额', big: '+9.8', unit: '%', tag: '公开统计', date: '2026-11-05', dateLabel: '报道日期', visual: 'food', source: 'quarter', question: '餐饮回暖，住宿跟上了吗？', detail: '限上餐饮营业额增长9.8%，限上住宿营业额增长1.6%。', boundary: '不代表游客人数、过夜率，也不覆盖全部普通小店。', next: '客源、停留时长与不同经营主体的数据。', inquiry: 'overnight' },
    { id: 'agriculture', topic: 'agriculture', town: null, title: '全县 · 农业经营', subtitle: '前三季度农林牧渔业总产值', big: '130.32', unit: '亿', tag: '公开统计', date: '2026-11-05', dateLabel: '报道日期', visual: 'agriculture', source: 'quarter', question: '产值在增长，增值留在哪？', detail: '农林牧渔业总产值增长6.9%，各分行业增幅不同。', boundary: '县域产值不等于单品增加值、利润或农户收入。', next: '单品加工、渠道和本地经营主体的账本。', inquiry: 'processing' },
    { id: 'tea', topic: 'agriculture', town: '柏塘镇', title: '柏塘 · 新陂合作社', subtitle: '受访所述春茶干茶产量', big: '2,500', unit: '斤', tag: '春茶档案', date: '2026-04-07', dateLabel: '报道日期', visual: 'tea', source: 'tea', question: '春茶卖出后，成本和回款呢？', detail: '合作社负责人在4月报道中称，约2500斤春茶干茶当时已基本售完。', boundary: '仅为一家合作社的春茶记录，不是全镇产量、当前销量或利润。', next: '干茶成本、销售回款、农户结算与渠道分成。', inquiry: 'tea' },
    { id: 'cement', topic: 'factory', town: '公庄镇', title: '公庄 · 一条熟料产线', subtitle: '关停拆除产线的日产能力', big: '2,500', unit: '吨', tag: '关停通告', date: '2026-02-11', dateLabel: '通告日期', visual: 'closure', source: 'cement', question: '产线退出，哪些变化要分开看？', detail: '通告确认一条日产2500吨熟料生产线关停，主体设备拆除。', boundary: '仅限这一条生产线，不能据此判定企业其他业务全部退出。', next: '受影响的具体业务与替代供给，分别核对。', inquiry: 'different' },
    { id: 'procurement', topic: 'projects', town: '园洲镇', title: '园洲 · 汉德本地配套', subtitle: '受访所述本地配套采购比例', big: '约40', unit: '%', tag: '企业受访', date: '2026-09-22', dateLabel: '报道日期', visual: 'procurement', source: 'yuanzhou', question: '扩产之外，本地接到了多少？', detail: '企业受访口径称，本地配套采购比例从最初不足10%提升至约40%。', boundary: '前期值是小于10%的范围，不能当作精确10%；不外推至全县。', next: '供应商、实际采购金额和交易记录。', inquiry: 'local' },
    { id: 'copper', topic: 'projects', town: null, title: '博罗园区 · 铜来顺', subtitle: '生产线点火已有报道', big: '10.13', unit: '点火', tag: '投产跟踪', date: '2026-10-16', dateLabel: '报道日期', visual: 'copper', source: 'copper', question: '点火之后，实际产出兑现了吗？', detail: '10月13日举行生产线点火仪式，相关报道已收录。', boundary: '点火不等于达产；2027年产值目标不是当前产值。', next: '实际产量、销售与持续生产情况。', inquiry: 'output' }
  ];
  return {
    version: '20261106-discovery1', checkedAt: '2026-11-06', sources, topics, events,
    towns: ['罗阳街道', '龙溪街道', '石湾镇', '园洲镇', '杨村镇', '公庄镇', '湖镇镇', '长宁镇', '横河镇', '龙华镇', '柏塘镇', '泰美镇', '杨侨镇', '麻陂镇', '观音阁镇', '石坝镇']
  };
});
