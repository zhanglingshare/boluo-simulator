/* Dated public-report snapshots. Links describe records or questions, never causal coefficients. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.BoluoRelationsData = data;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const source = {
    id: 'yuanzhou-20260922', title: '从“工业大镇”迈向“科创新城”', publisher: '南方日报', date: '2026-09-22', grade: 'B',
    url: 'https://epaper.nfnews.com/nfdaily/html/202609/22/content_10181994.html?origin=4',
    nature: '记者现场报道与企业受访；不是交易台账、招聘调查或实测通勤。'
  };
  const node = (id, label, sub, icon, kind, detail, boundary, next, at = 'current') => ({ id, label, sub, icon, kind, detail, boundary, next, at, source: kind === 'record' ? source.id : null });
  const edge = (id, a, b, label, kind, detail, at = 'current') => ({ id, a, b, label, kind, detail, at, source: kind === 'record' ? source.id : null });
  const question = (id, label, ask, evidence) => ({ id, label, ask, evidence });
  const workQuestions = [
    question('vacancies', '岗位类别', '扩产后具体新增哪些岗位，现在是否已经开始招聘？', '带日期的招聘公告、岗位清单或企业用工记录。'),
    question('skills', '技能要求', '这些岗位需要什么技能，培训或认证要花多长时间？', '岗位说明、资格要求与公开培训信息。'),
    question('schedule', '招聘时间', '招聘时间能否与项目的试产、投产进度对应？', '企业最新进展与招聘公告的时间对应。')
  ];
  const commuteQuestions = [
    question('origin', '从哪里出发', '居住地到哪个实际厂门，才是这趟通勤的起终点？', '双方明确的位置；不需要提交家庭精确住址，可先核实公共地点。'),
    question('shift', '上班时段', '首末班、换乘和步行，能否赶上实际班次？', '企业班次、公交首末班、换乘和步行信息。'),
    question('duration', '门到门时间', '工作日对应时段，完整通勤要多久？', '同一时段的路线记录，区分规划时间与实际用时。')
  ];
  const workNodes = (company, projectLabel, projectDetail) => [
    company,
    node('project', projectLabel, '报道记录', 'layers', 'record', projectDetail, '建设或设备进厂不能直接换算新增岗位。', '核实后续生产进度与实际用工。'),
    node('jobs', '新增岗位', '待核实', 'briefcase', 'question', '现有报道没有披露足够的新增岗位数量、类别和招聘安排。', '未知不表示没有岗位，也不表示一定扩招。', workQuestions[0].ask),
    node('skills', '岗位与技能', '待核实', 'person', 'question', '岗位能否被本地居民接住，需要具体技能与资格要求。', '产业增长不能替代岗位匹配资料。', workQuestions[1].ask),
    node('hiring', '招聘时间', '待核实', 'calendar', 'question', '项目进展和公开招聘需要分别核实。', '不能把签约、施工日期当成招聘日期。', workQuestions[2].ask),
    node('access', '能否到岗', '继续看通勤 →', 'bus', 'question', '岗位存在之外，还要看地点、班次与门到门通勤。', '镇内有厂，不等于每位居民都能到岗。', commuteQuestions[1].ask)
  ];
  const workEdges = [
    edge('activity', 'company', 'project', '报道进展', 'record', '报道中企业与项目或新增设备的对应记录。'),
    edge('new-jobs', 'project', 'jobs', '是否新增？', 'question', '这是需要核实的用工问题，没有由投资额自动推算。'),
    edge('requirements', 'jobs', 'skills', '技能要求？', 'question', workQuestions[1].ask),
    edge('when', 'jobs', 'hiring', '何时招聘？', 'question', workQuestions[2].ask),
    edge('reach', 'jobs', 'access', '能否到岗？', 'question', commuteQuestions[1].ask)
  ];
  const commuteNodes = (company, road) => [
    company,
    road,
    node('origin', '从哪里出发', '起终点待核实', 'pin', 'question', '现有资料没有指定居民的出发地点与实际厂门。', '本页不收集精确家庭住址，也不生成未经测算的等时圈。', commuteQuestions[0].ask),
    node('shift', '上班时段', '班次待核实', 'calendar', 'question', '需要把企业上下班时间与交通服务时间放在一起核实。', '有公交站点不代表能赶上早晚班。', commuteQuestions[1].ask),
    node('route', '通勤路线', '路线待核实', 'bus', 'question', '步行、候车、换乘与末段接驳都属于实际通勤。', '直线距离不能替代门到门时间。', commuteQuestions[2].ask),
    node('time', '门到门时间', '实测待核实', 'clock', 'question', '先明确起终点、班次和交通方式，再核实对应时段的完整用时。', '道路通车本身不能证明节省了多少分钟。', commuteQuestions[2].ask)
  ];
  const commuteEdges = [
    edge('road-link', 'company', 'road', '出行条件', 'question', '需要进一步核实这个厂区的实际出入口与交通条件。'),
    edge('endpoints', 'road', 'origin', '起终点？', 'question', commuteQuestions[0].ask),
    edge('shift-link', 'origin', 'shift', '几点到岗？', 'question', commuteQuestions[1].ask),
    edge('route-link', 'shift', 'route', '能赶上吗？', 'question', commuteQuestions[1].ask),
    edge('time-link', 'route', 'time', '完整用时？', 'question', commuteQuestions[2].ask)
  ];
  const handeCompany = node('company', '汉德精密', '园洲 · 空压机制造', 'factory', 'record', '报道记载汉德2016年落脚园洲，随后形成厂区和配套联系。', '企业及其所在地记录，不代表掌握完整供应链。', '查看已报道的本地采购和具体配套企业。', 'both');
  const jiangfengCompany = node('company', '江丰精密', '园洲 · 精密制造', 'factory', 'record', '广东江丰精密制造有限公司在园洲从事显示面板与半导体设备关键部件等业务。', '一家企业的记录不能外推整个行业。', '继续核实实际产出、岗位与交通条件。', 'both');
  const cases = {
    hande: {
      label: '园洲 · 汉德配套', title: '订单来了，谁接到了？', subtitle: '同一条链，看见机会，也看见依赖。',
      period: '2026.09.22 · 企业采访', beforeLabel: '早期 · 受访回顾', beforeNote: '只回放报道明确回顾的本地采购；其余早期联系未披露。',
      currentLabel: '报道时', takeaway: '本地联系更深，也要看清彼此依赖。',
      snapshots: { before: '早期（具体统计时点未披露）', current: '2026-09-22 报道时' },
      views: {
        orders: {
          label: '看订单', heading: '本地采购与客户依赖，分别看。',
          metrics: [
            { label: '汉德 · 本地采购占比', current: '约40%', before: '不足10%', note: '最初不足10% → 报道时约40%', tone: 'blue', denominator: '汉德配套采购', source: source.id },
            { label: '密特斯 · 来自汉德的业务占比', current: '约40%', before: '未披露', note: '两项占比的统计对象不同', tone: 'violet', denominator: '密特斯业务', source: source.id }
          ],
          nodes: [
            node('local', '本地配套企业', '采购联系 · 企业受访', 'layers', 'record', '报道记载汉德本地配套采购占比从最初不足10%提高到约40%，并吸引十几家上下游配套企业落户。', '采购占比不是供应商数量占比，也不是整个园洲的本地采购率。', '具体采购类别、供应商名单与交易记录仍需继续核对。', 'both'),
            handeCompany,
            node('supplier', '密特斯滤清器', '来自汉德的业务约40%', 'filter', 'record', '受访负责人称，密特斯跟随汉德从深圳搬到园洲，汉德业务占其业务约40%。', '这显示客户集中线索；不据此认定经营困难或估算未来损失。', '进一步核实其他客户构成、合同期限与替代订单。'),
            node('jobs', '岗位与技能', '待核实 · 看工作 →', 'briefcase', 'question', '扩产与订单之后，岗位数量、技能要求和招聘时间仍需核实。', '不能把计划投资折算成招聘人数。', workQuestions[0].ask),
            node('access', '通勤条件', '待核实 · 看通勤 →', 'bus', 'question', '居民能否接住岗位，还取决于地点与班次。', '没有本地实测通勤资料，不绘制假等时圈。', commuteQuestions[2].ask),
            node('bridge', '还有谁没接上？', '条件待核实', 'bridge', 'question', '采购需求与本地能力是否匹配，需要供货类别与条件证据。', '同属一个行业，不足以证明可以供货；未查到记录也不等于没有合作。', '先核实供货认证、交付能力和回款条件。')
          ],
          edges: [
            edge('local-procurement', 'local', 'company', '配套采购', 'record', '汉德的本地配套采购记录；约40%只指其采购占比。', 'both'),
            edge('supplier-orders', 'company', 'supplier', '订单联系', 'record', '密特斯负责人受访披露来自汉德的业务约40%；与汉德本地采购占比使用不同分母。'),
            edge('orders-jobs', 'company', 'jobs', '岗位待核实', 'question', '从订单到用工仍有未核实的环节。'),
            edge('jobs-access', 'jobs', 'access', '可达性？', 'question', '岗位能否被居民接住，要看地点、班次与实际路线。'),
            edge('candidate-bridge', 'company', 'bridge', '缺什么条件？', 'question', '寻找值得核实的需求与能力连接，不声称已形成合作。')
          ],
          insights: {
            local: { title: ['扩产之外，', '看本地接到什么。'], copy: '采购联系已经出现；哪些类别仍在外采，值得继续核实。', question: '本地有能力的配套，还有哪些条件没有接上？' },
            company: { title: ['一个大客户，', '也是一份依赖。'], copy: '稳定订单带来机会，也要看清客户集中程度与替代条件。', question: '这份订单之外，还有哪些可核实的客户与合作条件？' }
          },
          questions: [
            question('certification', '供货认证', '哪些采购类别可以本地供货，认证和质量要求是什么？', '公开采购类别、技术规格、供应商认证或企业确认。'),
            question('delivery', '交付能力', '本地企业的产能、最小批量和交期，是否匹配需求？', '双方可核验的规格、产能与交付条件。'),
            question('payment', '回款条件', '接到订单之后，付款与垫资条件能否承受？', '付款条款与经营周转记录；不要公开商业敏感信息。')
          ]
        },
        jobs: {
          label: '看工作', heading: '扩产之后，哪些岗位能被接住？',
          metrics: [
            { label: '新增岗位', current: '待核实', before: '未披露', note: '投资额不直接换算招聘人数', tone: 'neutral' },
            { label: '岗位与技能', current: '待核实', before: '未披露', note: '先看岗位要求与招聘时间', tone: 'amber' }
          ],
          nodes: workNodes(handeCompany, '三期施工', '2026年9月报道记载三期工地施工场景；计划投资15亿元，不能当作已完成投资。'), edges: workEdges,
          insights: {
            local: { title: ['项目在建，', '用工还要接着查。'], copy: '企业、项目与岗位分别核实，才能看本地技能供给是否接得上。', question: '岗位要求与本地培训之间，缺哪一条可核实的连接？' },
            company: { title: ['有新项目，', '还要看招什么人。'], copy: '从岗位、技能、时间继续追问，才能判断机会是否适合自己。', question: '下一份招聘记录，能否说明岗位、要求和入职时间？' }
          }, questions: workQuestions
        },
        commute: {
          label: '看通勤', heading: '有岗位，还要看能否赶上班。',
          metrics: [
            { label: '上班时段', current: '待核实', before: '未披露', note: '企业班次与交通服务分别核实', tone: 'neutral' },
            { label: '门到门时间', current: '待核实', before: '未披露', note: '不把直线距离当通勤时间', tone: 'amber' }
          ],
          nodes: commuteNodes(handeCompany, node('road', '厂区出入口', '具体位置待核实', 'pin', 'question', '已知企业位于园洲，仍需核实实际招聘厂区和厂门。', '镇级所在地不足以计算个人通勤。', commuteQuestions[0].ask)), edges: commuteEdges,
          insights: {
            local: { title: ['机会在附近，', '也可能赶不上。'], copy: '把班次、首末班与末段接驳放在一起，才能识别实际到岗障碍。', question: '哪些出行条件，妨碍居民接住附近的岗位？' },
            company: { title: ['离家近，', '还要能准时到。'], copy: '起终点、班次与完整路线核实后，再谈通勤是否可行。', question: '你的上班时段，与交通服务时间能否对应？' }
          }, questions: commuteQuestions
        }
      }
    },
    jiangfeng: {
      label: '园洲 · 江丰订单', title: '订单涨了，哪一环接上了？', subtitle: '设备、道路、工作，放在同一条线索里分别核实。',
      period: '2026.09.22 · 企业采访', beforeLabel: '2023.11 · 初次量产', beforeNote: '回放报道记载的早期量产状态；早期订单与岗位数据未披露。',
      currentLabel: '报道时', takeaway: '道路、设备与订单有关联，贡献大小还需核实。',
      snapshots: { before: '2023-11 初次量产', current: '2026-09-22 报道时' },
      views: {
        orders: {
          label: '看订单', heading: '订单、设备与配套条件，分开核实。',
          metrics: [
            { label: '江丰 · 订单量同比', current: '约3倍', before: '未披露', note: '企业受访 · 上年同期为参照', tone: 'blue', denominator: '江丰上年同期订单量', source: source.id },
            { label: '新增精密设备', current: '陆续进厂', before: '未披露', note: '设备进厂不等于全部产能释放', tone: 'violet', source: source.id }
          ],
          nodes: [
            node('orders', '订单量', '约为上年同期3倍', 'layers', 'record', '2026年9月报道，江丰精密订单量约为上年同期的3倍。', '受访口径，不代表全县订单；不等于利润翻倍。', '核实订单兑现、产出与回款。'),
            jiangfengCompany,
            node('equipment', '新增设备', '陆续进厂', 'factory', 'record', '报道记载一批精密设备陆续进厂。', '没有由设备进厂推算产能或岗位数量。', '核实设备安装、运行与产能利用。'),
            node('road', '厂门口道路', '2024年5月正式通车', 'bus', 'record', '报道回顾，厂门口道路2024年5月正式通车，受访人提到物流出行条件改善。', '没有实测节时或对订单的因果贡献。', '查看实际出入口、线路与工作日通行。'),
            node('jobs', '岗位与技能', '待核实 · 看工作 →', 'briefcase', 'question', '订单和设备之外，岗位类别与技能资料仍需补充。', '订单增长不能直接推算招聘人数。', workQuestions[0].ask),
            node('access', '通勤条件', '待核实 · 看通勤 →', 'clock', 'question', '道路通车与个人通勤是不同问题。', '缺少居民起点、班次和路线信息。', commuteQuestions[2].ask)
          ],
          edges: [
            edge('orders-record', 'orders', 'company', '订单记录', 'record', '企业订单量受访记录，不是完整客户交易网。'),
            edge('equipment-record', 'company', 'equipment', '设备进厂', 'record', '企业与新增设备进展的报道对应。'),
            edge('road-record', 'company', 'road', '出行改善', 'record', '受访人描述道路改善物流出行；不代表已识别订单增长原因。'),
            edge('jobs-question', 'company', 'jobs', '岗位待核实', 'question', workQuestions[0].ask),
            edge('commute-question', 'road', 'access', '完整用时？', 'question', commuteQuestions[2].ask)
          ],
          insights: {
            local: { title: ['设备在增加，', '条件也要接得上。'], copy: '道路改善与企业扩产都有报道；各自贡献需要进一步核实。', question: '企业下一处配套障碍，是哪项可核实的条件？' },
            company: { title: ['订单有增长，', '也要看怎样兑现。'], copy: '设备、生产、交付与回款，仍需逐环核实。', question: '哪一条新的产销记录，会改变当前判断？' }
          },
          questions: [question('output', '实际产出', '新增订单与设备进厂后，实际产出如何变化？', '同口径订单、产出、设备运行与交付记录。'), question('logistics', '物流条件', '厂门口道路之外，物流还有哪些实际障碍？', '企业运输需求、路线、时段与现场记录。'), question('cash', '交付回款', '订单何时交付，回款与生产投入如何对应？', '可公开核对的交付进展；经营敏感数据不公开。')]
        },
        jobs: {
          label: '看工作', heading: '设备进厂之后，岗位怎么变化？',
          metrics: [{ label: '岗位数量', current: '待核实', before: '未披露', note: '设备增加不能直接推算人数', tone: 'neutral' }, { label: '岗位与技能', current: '待核实', before: '未披露', note: '分别查招聘要求与培训条件', tone: 'amber' }],
          nodes: workNodes(jiangfengCompany, '设备进厂', '2026年9月报道，新增精密设备陆续进厂；未披露对应新增岗位。'), edges: workEdges,
          insights: { local: { title: ['先进设备，', '还要有匹配技能。'], copy: '核实岗位与培训条件，才能识别机会怎样被本地接住。', question: workQuestions[1].ask }, company: { title: ['设备在变，', '工作要求也要查。'], copy: '岗位需求尚未披露，先核实具体工种与资格。', question: workQuestions[0].ask } }, questions: workQuestions
        },
        commute: {
          label: '看通勤', heading: '厂门口路通了，通勤还要核实。',
          metrics: [{ label: '厂门口道路正式通车', current: '2024.05', before: '尚未通车', note: '报道回顾 · 不是新增的实测节时', tone: 'blue', source: source.id }, { label: '门到门时间', current: '待核实', before: '未披露', note: '仍需起终点、班次与完整路线', tone: 'amber' }],
          nodes: commuteNodes(jiangfengCompany, node('road', '厂门口道路', '2024年5月正式通车', 'bus', 'record', '报道回顾，江丰2023年11月初次量产，厂门口道路2024年5月正式通车。', '通车记录不等于实测个人通勤收益。', commuteQuestions[2].ask)),
          edges: commuteEdges.map(item => item.id === 'road-link' ? edge(item.id, item.a, item.b, '厂门口道路', 'record', '企业受访回顾的厂门口道路通车记录。') : item),
          insights: { local: { title: ['路通到厂门，', '人能否赶上班？'], copy: '企业出行条件改善之后，继续核实居民实际可达性。', question: commuteQuestions[1].ask }, company: { title: ['路通了，', '还要核实完整一程。'], copy: '班次、候车和换乘可能改变门到门时间。', question: commuteQuestions[2].ask } }, questions: commuteQuestions
        }
      }
    }
  };
  return { version: '2026-11-07.1', source, cases, views: ['orders', 'jobs', 'commute'], lenses: ['local', 'company'], phases: ['before', 'current'] };
});
