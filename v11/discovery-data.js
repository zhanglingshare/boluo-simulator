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
    },
    sign4: {
      publisher: '博罗县政府／惠州市政府通稿', kind: '政府发布',
      note: '8月3日集中签约4宗、总投资80亿元、预计年产值203亿元。签约不是投产，落地仍待跟踪。'
    },
    road: {
      publisher: '博罗县政府／惠州市公共资源交易中心', kind: '政府公告与招标文件',
      note: '惠霞、惠肇、济广、石龙站均为在建或征地阶段；通车、开工、征地是三种不同的进度，不合并。'
    },
    tour: {
      publisher: '博罗县文广旅体局／惠州市政府', kind: '政府发布与媒体转述',
      note: '开业、启用、入驻是已发生的经营事实；签约引进与规划表述单独标注，不当作已落地。'
    }
  };
  const topics = {
    factory: {
      label: '工厂', icon: 'factory', title: ['工业在涨，投资在降。', '谁在接力？'],
      period: '2026年前三季度 · 同比', lede: '今年的产出，靠的是 2021—2024 年投资高峰的结转。投资连着两年往下掉，2027 年下半年起，新投产的会少一截。',
      cliff: { bars: [
          { y: '2023', val: 240.31, txt: '240.31' },
          { y: '2024', val: 266, txt: '266' },
          { y: '2025', val: 230, txt: '超 230' },
          { y: '2026', val: null, txt: '未公布', rate: '−44.7%' }
        ], tail: '2027',
        caption: '投资从 240 亿爬到 266 亿，2025 年往回退，2026 年连绝对额都不再公布。', foot: '钱流连着断两年，缺口落在 2027 年下半年。' }, chart: 'diverge', source: 'quarter', case: 'electronic',
      metrics: [
        { label: '规上工业总产值（亿元）', text: '超 2000', sub: '2025 年度 · 约数', pill: '+8.7%', color: 'blue' },
        { label: '规上工业增加值', text: '未公布', sub: '2024 年起只报增速', pill: '+8.9%', color: 'teal' },
        { label: '工业投资（亿元）', text: '超 230', sub: '2025 年度 · 约数', pill: '−44.7%', color: 'coral' }
      ],
      periodBar: '指标期次：2025 年为年度约数，2026 年为前三季度快报。绝对值与增速不同源，不可混读。',
      chartNote: '不能互抵。两个数说的是两件事。',
      defaultQuestion: '工业增长与投资收缩，下一步应该核对什么？',
      inquiries: [
        { id: 'capacity', label: '原有产能在释放', question: '现有产能、订单和产出，哪些能证明增长来自哪里？', clue: '江丰精密有订单和新增设备的受访线索。', gap: '一家公司不能代表全县；产能利用和产出贡献仍需核对。', event: 'jiangfeng' },
        { id: 'handoff', label: '新增项目能否接上', question: '新增项目从施工到产出，还需要核对哪些进展？', clue: '汉德三期有签约及施工现场报道。', gap: '尚不能据此认定项目投产，更不能把计划金额算作已完成投资。', event: 'hande' },
        { id: 'different', label: '不同行业正在分化', question: '一边扩产、一边退出，哪些变化需要分开观察？', clue: '公庄一条熟料生产线有明确的关停拆除通告。', gap: '单条产线退出不等于全行业衰退；需分行业、分企业继续核对。', event: 'cement' }
      ]
    },
    projects: {
      label: '项目', icon: 'layers', title: ['签约之后，', '走到哪一步了？'],
      period: '汉德精密三期 · 2026年9月现场报道', lede: '签约是纸上的钱，施工是地上的钱，投产才是账上的钱。这条线还停在地上。', chart: 'stages', source: 'yuanzhou', case: 'projects',
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
      period: '2026年前三季度 · 限上营业额同比', lede: '吃饭的人回来了，住店的人没回来。过路的钱留下了，过夜的钱没留下。', chart: 'food', source: 'quarter', case: 'ring',
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
      period: '2026年前三季度 · 农林牧渔业', lede: '六点九的增长里，林业跑得最快。同样叫涨，落在不同的地里。', chart: 'agriculture', source: 'quarter', case: 'tea',
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
    /* —— 已进网：投产／点火／开园／通车／开业，真正改变了关系结构 —— */
    { id: 'shenyuan', month: 6, topic: 'factory', town: '龙溪街道', title: '龙溪 · 深远新能源', subtitle: '电动车基地 · 已投产', big: '60', unit: '万辆', question: '产能开了，订单跟上了吗？', visual: 'stages', stage: 3, rel: 'supply', state: 'live', source: 'quarter' },
    { id: 'yetai', month: 6, topic: 'factory', town: '长宁镇', title: '长宁 · 椰泰实业', subtitle: '第二基地 · 已投产', big: '8', unit: '条线', question: '八条无菌线，跑给谁？', visual: 'stages', stage: 3, rel: 'supply', state: 'live', source: 'quarter' },
    { id: 'jintian', month: 1, topic: 'factory', town: '龙溪街道', title: '龙溪 · 金田科技', subtitle: '半山基地 · 已投产', big: '4.5', unit: '亿', question: '整体搬迁搬走了什么？', visual: 'stages', stage: 3, rel: 'supply', state: 'live', source: 'quarter' },
    { id: 'dongweifeng', month: 4, topic: 'factory', town: '罗阳街道', title: '罗阳 · 东维丰', subtitle: '从东莞迁入 · 已满产', big: '16', unit: '条线', question: '从东莞搬来的，还搬得走吗？', visual: 'stages', stage: 3, rel: 'supply', state: 'live', source: 'quarter' },
    { id: 'xianghao', month: 10, topic: 'factory', town: '麻陂镇', title: '麻陂 · 祥浩实业', subtitle: '甜玉米加工 · 已投产', big: '6', unit: '条线', question: '玉米从哪块地里来？', visual: 'stages', stage: 3, rel: 'supply', state: 'live', source: 'quarter' },
    { id: 'copper', month: 10, topic: 'factory', town: '石湾镇', title: '石湾 · 铜来顺', subtitle: '生产线点火 · 2027 年目标', big: '100', unit: '亿', question: '目标写在纸上，产量在地上。', visual: 'copper', stage: 3, rel: 'supply', state: 'live', source: 'copper' },
    { id: 'futian', month: 6, topic: 'factory', town: '福田镇', title: '福田 · 深博福田产业园', subtitle: '标准厂房 · 已开园', big: '11.7', unit: '万㎡', question: '厂房交出去，谁进了机器？', visual: 'stages', stage: 3, rel: 'coop', state: 'live', source: 'quarter' },
    { id: 'jiage', month: 6, topic: 'factory', town: '福田镇', title: '福田 · 嘉奇能源', subtitle: '动力电池回收 · 已建成投产', big: '1', unit: '家', question: '电池拆回来，铜和锂去哪？', visual: 'stages', stage: 3, rel: 'coop', state: 'live', source: 'tour' },
    { id: 'qicaihong', month: 6, topic: 'factory', town: '罗阳街道', title: '罗阳 · 七彩虹 AI', subtitle: '一期 · 已投产', big: '1', unit: '期', question: 'AI 服务器，谁在本地配套？', visual: 'stages', stage: 3, rel: 'invest', state: 'live', source: 'quarter' },
    { id: 'mofang', month: 2, topic: 'food', town: '横河镇', title: '横河 · 磨房运动中心', subtitle: '户外营地 · 已启用', big: '1', unit: '座', question: '营地开了，谁来住？', visual: 'food', stage: 3, rel: 'tour', state: 'live', source: 'tour' },
    { id: 'henghe', month: 8, topic: 'food', town: '横河镇', title: '横河 · 户外运动小镇', subtitle: '省级荣誉 · 39 项运动', big: '4000', unit: '亩', question: '一个山区镇，靠运动吃饭？', visual: 'food', stage: 3, rel: 'tour', state: 'live', source: 'tour' },
    { id: 'tianhong', month: 9, topic: 'food', town: '罗阳街道', title: '罗阳 · 天虹购物中心', subtitle: '县域商业 · 已开业', big: '1', unit: '座', question: '县城的人，钱留在县里吗？', visual: 'food', stage: 3, rel: 'tour', state: 'live', source: 'tour' },
    { id: 'taimeig', month: 10, topic: 'food', town: '泰美镇', title: '泰美 · 乡村振兴馆', subtitle: '高速服务区 · 已开业', big: '1', unit: '处', question: '过路的人，会不会买一袋米？', visual: 'food', stage: 3, rel: 'tour', state: 'live', source: 'tour' },
    { id: 'minsu', month: 7, topic: 'food', town: '横河镇', title: '横河 · 港式民宿集群', subtitle: '头部品牌 · 已入驻', big: '1', unit: '批', question: '住下来的人，多留了几晚？', visual: 'food', stage: 3, rel: 'tour', state: 'live', source: 'tour' },
    { id: 'road218', month: 5, topic: 'food', town: '横河镇', title: '横河 · 218 最美公路', subtitle: '16 驿站 · 已通车', big: '218', unit: '公里', question: '路通了，沿线镇接住了吗？', visual: 'stages', stage: 3, rel: 'road', state: 'live', source: 'tour' },
    { id: 'fubo', month: 1, topic: 'factory', town: '长宁镇', title: '长宁 · 福博艺术中心', subtitle: '深博共建 · 已投用', big: '1', unit: '座', question: '深圳的钱，长宁用得上吗？', visual: 'stages', stage: 3, rel: 'coop', state: 'live', source: 'tour' },

    /* —— 在途：签约／开工／在建，还在门外排队，不算结构 —— */
    { id: 'hande', month: 8, topic: 'projects', town: '园洲镇', title: '园洲 · 汉德精密', subtitle: '三期 · 签约落户', big: '15', unit: '亿', question: '签约之后，什么时候动土？', visual: 'stages', stage: 1, rel: 'invest', state: 'wip', source: 'yuanzhou' },
    { id: 'sign4', month: 8, topic: 'projects', town: null, title: '全县 · 8月3日一次签4宗', subtitle: '总投资 80 亿 · 预计年产值 203 亿', big: '80', unit: '亿', question: '四宗都签了，哪一宗先动土？', visual: 'stages', stage: 1, rel: 'invest', state: 'wip', source: 'sign4' },
    { id: 'xincheng', month: 1, topic: 'projects', town: '石湾镇', title: '石湾 · 欣城储能', subtitle: '200MW 储能电站 · 开工', big: '5', unit: '亿', question: '电站建在这，电卖给谁？', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'jinliyuan', month: 5, topic: 'projects', town: '杨侨镇', title: '杨侨 · 金利源', subtitle: '绝缘板铜排 · 开工', big: '2', unit: '亿', question: '两家铜材项目挤在一条线上。', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'quanli', month: 5, topic: 'projects', town: '石湾镇', title: '石湾 · 全德力', subtitle: '金属热处理 · 开工', big: '1.8', unit: '亿', question: '给谁做热处理？', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'yixin', month: 7, topic: 'projects', town: '石湾镇', title: '石湾 · 义新新材料', subtitle: '年产 1000 万件鞋材 · 开工', big: '2', unit: '亿', question: '鞋材跟着哪个鞋厂？', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'jiayou', month: 9, topic: 'projects', town: '泰美镇', title: '泰美 · 佳有机械', subtitle: '灌装设备 · 开工', big: '2', unit: '亿', question: '两家关联企业一起搬进来。', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'xingrui', month: 6, topic: 'projects', town: '杨侨镇', title: '杨侨 · 铣锐精密', subtitle: '新厂区 · 奠基', big: '8000', unit: '万', question: '奠基之后，多久出第一件？', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'sanren', month: 9, topic: 'projects', town: '罗阳街道', title: '罗阳 · 三仁电子', subtitle: '3 宗 · 已封顶待投产', big: '3', unit: '宗', question: '封了顶，什么时候进设备？', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'longxi', month: 8, topic: 'projects', town: '龙溪街道', title: '龙溪 · 电子集聚区', subtitle: '15 宗 · 全部动工', big: '15', unit: '宗', question: '一个街道，吃得下十五宗？', visual: 'stages', stage: 2, rel: 'invest', state: 'wip', source: 'quarter' },
    { id: 'xunling', month: 12, topic: 'projects', town: '福田镇', title: '福田 · 讯凌新科技', subtitle: '液冷部件 · 年底投产', big: '1', unit: '家', question: '年底能不能真点火？', visual: 'stages', stage: 2, rel: 'coop', state: 'wip', source: 'tour' },
    { id: 'luofufuture', month: 9, topic: 'projects', town: '长宁镇', title: '长宁 · 罗浮未来城', subtitle: '谋划 29 宗 · 超 123 亿', big: '123', unit: '亿', question: '规划里的钱，什么时候落地？', visual: 'stages', stage: 1, rel: 'coop', state: 'wip', source: 'sign4' },
    { id: 'dongshan', month: 8, topic: 'food', town: '罗阳街道', title: '罗阳 · 东山玖号广场', subtitle: '基本完工 · 待开业', big: '1', unit: '座', question: '完工和开业，差多久？', visual: 'food', stage: 2, rel: 'tour', state: 'wip', source: 'tour' },
    { id: 'luofushanju', month: 6, topic: 'food', town: '长宁镇', title: '长宁 · 罗浮山居', subtitle: '狮峰片区 · 改造中', big: '1', unit: '片', question: '改造完了，客单价能上去吗？', visual: 'food', stage: 2, rel: 'tour', state: 'wip', source: 'tour' },
    { id: 'litian', month: 6, topic: 'food', town: '长宁镇', title: '长宁 · 力天梦幻城', subtitle: '签约引进 · 未开工', big: '1', unit: '项', question: '签了不等于建了。', visual: 'food', stage: 1, rel: 'tour', state: 'wip', source: 'tour' },
    { id: 'huixia', month: 7, topic: 'factory', town: null, title: '全县 · 惠霞高速博罗段', subtitle: '进度超八成 · 年内通车', big: '80', unit: '%', question: '八成了，剩下两成卡在哪？', visual: 'stages', stage: 2, rel: 'road', state: 'wip', source: 'road' },
    { id: 'huizhao', month: 10, topic: 'factory', town: '石湾镇', title: '石湾 · 惠肇高速共线段', subtitle: '2.62km · 已开工', big: '1.09', unit: '亿', question: '两公里，接的是哪条路？', visual: 'stages', stage: 2, rel: 'road', state: 'wip', source: 'road' },
    { id: 'jiguang', month: 10, topic: 'factory', town: null, title: '全县 · 济广高速改扩建', subtitle: '征收土地 112 公顷', big: '112', unit: '公顷', question: '征地之后，多久能通车？', visual: 'stages', stage: 2, rel: 'road', state: 'wip', source: 'road' },
    { id: 'shilong', month: 3, topic: 'factory', town: '石湾镇', title: '石湾 · 石龙铁路站配套', subtitle: '5.6km · 施工至 2028', big: '7.02', unit: '亿', question: '集装箱站通了，货源在哪？', visual: 'stages', stage: 2, rel: 'road', state: 'wip', source: 'road' },

    /* —— 退出：停摆／关停，节点从网络里消失 —— */
    { id: 'huzhen', month: 0, topic: 'projects', town: '湖镇镇', title: '湖镇 · 六个项目', subtitle: '被点名催促 · 仍未动工', big: '6', unit: '个', question: '催促函发出去了，土动了没有？', visual: 'stalled', stage: 0, rel: 'invest', state: 'out', source: 'quarter' },
    { id: 'cement', month: 2, topic: 'factory', town: '公庄镇', title: '公庄 · 一条熟料产线', subtitle: '关停 · 主体设备拆除', big: '2500', unit: '吨/日', question: '拆掉的产能，去哪儿了？', visual: 'closure', stage: 0, rel: 'invest', state: 'out', source: 'cement' },

    /* —— 统计：县域口径，不建节点，只供首页与详情引用 —— */
    { id: 'food', topic: 'food', town: null, title: '全县 · 吃饭和住下来', subtitle: '前三季度 · 限上营业额', big: '+9.8', unit: '%', question: '餐饮回暖，住宿跟上了吗？', visual: 'food', rel: 'tour', state: 'stat', source: 'quarter' },
    { id: 'agriculture', topic: 'agriculture', town: null, title: '全县 · 农业经营', subtitle: '前三季度 · 农林牧渔业总产值', big: '130.32', unit: '亿', question: '六点九的增长，落在谁的地里？', visual: 'agriculture', rel: 'agri', state: 'stat', source: 'quarter' },
    { id: 'tea', topic: 'agriculture', town: '柏塘镇', title: '柏塘 · 新陂合作社', subtitle: '春茶干茶产量', big: '2,500', unit: '斤', question: '茶卖出去了，钱回来了吗？', visual: 'tea', rel: 'agri', state: 'stat', source: 'tea' }
  ];
  /* —— 流向：新投产的现场沿产业链、园区、公路流向谁 ——
     只写在公开信息里能对上主体的方向，线上数字取各自主口径；
     chain 类是同一条产业链上的上下游，公开通稿没有披露具体供货关系。 */
  const flows = [
    { from: 'copper', to: 'shenyuan', label: '铜箔 → 电池', val: '100 亿', basis: 'chain',
      note: '铜箔是电池集流体的原料，同一条产业链上的上下游；公开报道未披露两家之间的供货关系。' },



    { from: 'road218', to: 'henghe', label: '公路 → 流量', val: '218 公里', basis: 'road',
      note: '环罗浮山 218 公里公路把沿线驿站、户外运动小镇串起来，公路通车在前、人流在后。' }
  ];
  return {
    version: '20261109-structure', checkedAt: '2026-11-09', sources, topics, events, flows,
    towns: ['罗阳街道', '龙溪街道', '石湾镇', '园洲镇', '杨村镇', '公庄镇', '湖镇镇', '长宁镇', '横河镇', '龙华镇', '柏塘镇', '泰美镇', '杨侨镇', '麻陂镇', '观音阁镇', '石坝镇']
  };
});
