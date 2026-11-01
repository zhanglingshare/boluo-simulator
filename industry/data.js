(function (root) {
  'use strict';
  const industries = [
    { id: 'tea', title: '茶产业', subtitle: '从柏塘山茶进入', group: '特色农业 / 茶产业', icon: 'leaf', class: 'tea', question: '一片茶叶，怎样变成一门生意？', questions: ['湾区订单，谁来接稳？', '课程之后，陪跑做什么？'], nodes: ['sc','lswh','hh'], note: '沿真实的科研、协会、课程与茶旅线索，寻找值得先做的一步。', capability: '公开主体 · 证据研判 · 条件试验' },
    { id: 'electronics', title: '电子信息', subtitle: '看生产与配套怎样接起来', icon: 'chip', class: 'electronics', question: '有了大项目，配套就一定跟得上吗？', questions: ['谁连接上下游？', '哪一环缺少替代？'], nodes: ['htd','jf','gj','sj','bmc','mj','jly','tls','dg','sz'], note: '先看已登记的企业、材料与配套关系，再追项目和供给变化。', capability: '公开关系与事件' },
    { id: 'energy', title: '新能源', subtitle: '看项目、供给与能源连接', icon: 'bolt', class: 'energy', question: '项目在增加，哪一环最不能掉链子？', questions: ['哪些供给相互依赖？', '项目处于哪个阶段？'], nodes: ['xwd','jq','ess','zw','tls','ddc','sz','dg','dj'], note: '签约、在建与投产分别看；储能存在不等于已知企业电价改变。', capability: '公开关系与事件' },
    { id: 'tourism', title: '文旅住宿', subtitle: '看客人为什么来，又为什么留下', icon: 'mountain', class: 'tourism', question: '客人来了，能不能多留一晚？', questions: ['住宿与消费怎样承接？', '旺季之后还看什么？'], nodes: ['lswh','hh','sc','lsz','lfsgy','hz','gz'], note: '看人流、住宿、茶旅与服务之间的联系；县域游客数不当成景区人数。', capability: '公开关系与事件' },
    { id: 'agriculture', title: '特色农业', subtitle: '从产品进入整条产业链', icon: 'sprout', class: 'agriculture', question: '好产品，怎样接上更长的价值链？', questions: ['品牌与渠道在哪里？', '哪些支持还缺依据？'], nodes: ['sc','xc','gyg','gyght','sb','lsmd','lsz','lfsgy','lswh','dj'], note: '可以先选一个产品，再看加工、品牌、流通与相关服务。', capability: '公开关系与事件' }
  ];
  const teaNodes = [
    { id: 'sc', name: '柏塘山茶', sub: '产品与种植', x: 105, y: 295, icon: 'leaf', registered: true, group: 0, question: '好产品如何接上品牌与渠道？', detail: '仓库已登记柏塘山茶及其公开来源。具体茶园、经营主体、产量与交易关系仍需逐条补充。', sources: ['S047','S054'] },
    { id: 'processing', name: '加工主体', sub: '角色待填', x: 300, y: 295, icon: 'factory', group: 0, question: '旺季加工有多少承接余量？', detail: '这是产业机制中的角色，不指向某一家已核实企业。需要了解加工能力、批次、品质和排期。' },
    { id: 'packing', name: '包装服务', sub: '角色待填', x: 495, y: 295, icon: 'box', group: 1, question: '订单来了，交付跟得上吗？', detail: '查看包装批次、服务范围、交期与可替代支持。图中连接是待核实的机制关系，不是真实订单。' },
    { id: 'brand', name: '品牌经营', sub: '角色待填', x: 690, y: 295, icon: 'tag', group: 1, question: '品质、品牌与渠道能否接续？', detail: '品牌经营需要与品质稳定、渠道定位和持续供给一起观察。当前没有各主体利润分配数据。' },
    { id: 'online', name: '电商渠道', sub: '角色待填', x: 875, y: 340, icon: 'store', group: 2, question: '增加流量以后，后端能接住吗？', detail: '需要核实店铺与经营者、产品的关联，以及订单结构、费用、交付与复购。公开账号活跃度不能直接当作销量。' },
    { id: 'offline', name: '线下经销', sub: '角色待填', x: 850, y: 135, icon: 'store', group: 2, question: '销售是否过度依赖某个渠道？', detail: '经销和零售是待补充角色；当前不掌握经销商名单、合同或销售份额。' },
    { id: 'consumer', name: '消费者', sub: '购买与反馈', x: 1060, y: 295, icon: 'users', group: 2, question: '客户为什么回来，或为什么离开？', detail: '复购受到品质、价格、渠道与服务共同影响。交付试验不直接预测真实复购。' },
    { id: 'lswh', name: '茶旅场景', sub: '已登记相关线索', x: 685, y: 95, icon: 'mountain', registered: true, group: 1, question: '茶旅连接会怎样影响销售场景？', detail: '现有底座登记了环两山引领区与柏塘山茶的茶旅关联。节假日经营线索不能直接外推全年收入。', sources: ['S054','S047'] },
    { id: 'support', name: '可替代支持', sub: '待核实的连接', x: 495, y: 480, icon: 'link', group: 1, question: '这一环还有谁可能接得上？', detail: '先拆清任务，再核实服务范围、近期余量、交期与责任，逐步形成可选择的支持路径。' },
    { id: 'quality', name: '品质与标准', sub: '待补充角色', x: 280, y: 100, icon: 'shield', group: 0, question: '扩大销售，品质能不能保持？', detail: '需要核实分级、检验与质量管理记录。当前不为任何产品提供质量背书。' }
  ];
  const teaEdges = [ ['sc','processing'], ['processing','packing'], ['packing','brand'], ['brand','online'], ['brand','offline'], ['online','consumer'], ['offline','consumer'], ['quality','processing'], ['packing','support'], ['sc','lswh','registered'], ['lswh','consumer'] ];
  const candidates = [
    { id: 'packaging', name: '包装服务主体', icon: 'box', line: '从承接范围与交期入手', why: '包装制作或配套交付服务可能覆盖当前任务。须核实具体产品、批次和时间，才能形成真实连接。', kind: '服务方向，待找具体主体', checks: ['是否承接这类产品', '近期是否有可用余量', '交期、费用与质量如何确认', '由谁对最终交付负责'], adjustment: '比较时假设每期增加30份包装承接能力；不代表任何企业的实际能力。' },
    { id: 'coordination', name: '交付协调支持', icon: 'truck', line: '从发货与排期入手', why: '排期和发货支持可能帮助已经完成包装的订单交付，不能替代加工或包装能力。', kind: '服务方向，待核实适配', checks: ['当前是否确实卡在发货', '可支持哪些交付环节', '怎样衔接企业与渠道', '交付异常由谁处理'], adjustment: '比较时假设每期增加30份发货承接能力；加工和包装能力保持不变。' },
    { id: 'process', name: '加工与产学协作', icon: 'school', line: '从真实任务与作品入手', why: '可沿加工服务、技术支持或院校实践任务继续找线索。具体团队与资质需要逐项核实，不能用结课代替交付。', kind: '潜在支持方向，未确认合作', checks: ['加工任务是否适合该主体', '设备、经验与质量如何验证', '能投入多少时间和资源', '验收标准怎样约定'], adjustment: '比较时假设每期增加30份加工承接能力；不是已确认产能。' }
  ];
  const fallback = {
    generated_at: '2026-10-29（仓库资料快照）',
    nodes: [ {node_id:'sc',name:'柏塘山茶',town:'柏塘',description:'原项目已登记的茶产业产品条目。具体企业、产量和交易关系待补充。',source_ids:['S047','S054']}, {node_id:'lswh',name:'环两山引领区',town:'博罗相关片区',description:'原项目已登记茶旅相关线索。',source_ids:['S054']} ],
    edges: [{edge_id:'E038',source_node_id:'lswh',target_node_id:'sc',relation_description:'原资料登记的茶旅关联，经营量和实际合作需继续核实',evidence_grade:'A',source_ids:['S054','S047']}],
    changes: [], sources: [ {source_id:'S047',title:'博罗入选国家农业现代化示范区',publisher:'惠州市农业农村局',url:'http://nyncj.huizhou.gov.cn/gkmlpt/content/5/5797/mpost_5797223.html',published_at:'2026-06-25'}, {source_id:'S054',title:'广东最美旅游公路出圈记',publisher:'博罗发布',url:'http://m.toutiao.com/group/7699824374493086259/',published_at:'2026-10-23'} ]
  };
  root.IndustryData = { industries, teaNodes, teaEdges, candidates, fallback };
})(window);
