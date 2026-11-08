/* Reviewed story fragments. Dates identify the source snapshot, not a live monitor. */
(function(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.BoluoWorldData = data;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  const sources = {};
  const nodes=[], edges=[], scenes=[];
  const nodeMap=new Map(), edgeMap=new Map();
  function N(id,name,group,source,detail,kind='record',short='') {
    if (!nodeMap.has(id)) { const n={id,name,short:short||name,group,source:source?[source]:[],detail,kind,reviewed:true}; nodes.push(n); nodeMap.set(id,n); }
    return id;
  }
  function E(id,a,b,label,source,detail,options={}) {
    if (!edgeMap.has(id)) { const e={id,a,b,label,source:source?[source]:[],detail,kind:source?'record':'question',before:'unreported',after:'record',reveal:1,reviewed:true,...options}; if(e.kind==='question')e.after='question'; edges.push(e);edgeMap.set(id,e); }
    return id;
  }
  const Q=(id,name,group,detail)=>N(id,name,group,null,detail,'question');
  function scene(id,label,group,title,source,root,ids,links,metrics,steps,insight,gaps,compare) {
    scenes.push({id,label,group,title,source,root,nodes:ids,edges:links,metrics,steps,insight,gaps,compare});
  }
  const M=(label,value,unit,note,before=null,number=null)=>({label,value,unit,note,before,number});
  const step=(label,caption,ids)=>({label,caption,nodes:ids});
  const gap=(label,text)=>({label,text});
  N('hande','汉德精密','industry','yuanzhou','园洲空压机制造企业；三期施工有报道，计划投资不是已完成投资。');
  N('local-suppliers','本地配套企业','industry','yuanzhou','汉德受访的本地采购对象集合，不是全镇企业清单。');
  N('supplier','密特斯滤清器','industry','yuanzhou','负责人称跟随汉德从深圳迁入园洲；来自汉德的业务约40%。');
  N('hande-project','汉德三期','industry','yuanzhou','2026年9月已有施工现场报道，不能沿用“只有签约”的旧状态。');
  N('supplier-move','深圳迁入园洲','regional','yuanzhou','密特斯迁入的受访记录；迁入时间未在本页补成连续轨迹。');
  Q('hande-jobs','新增岗位','people','扩产之后招什么人、何时招聘，还需要带日期的岗位记录。');
  Q('certification','供货认证','industry','核实供货规格和认证，不能仅凭同一行业认定能合作。');
  Q('payment','回款与垫资','people','订单和利润、现金回笼是不同问题，需核实合同与回款条件。');
  Q('access','班次与通勤','mobility','先核实厂门、起点、上下班和交通服务时间。');
  const hEdges=[
    E('local-procurement','local-suppliers','hande','配套采购','yuanzhou','汉德本地配套采购从最初不足10%到报道时约40%。',{before:'record'}),
    E('supplier-orders','hande','supplier','订单联系','yuanzhou','密特斯来自汉德的业务约40%；分母是密特斯业务，不是汉德采购。'),
    E('hande-expansion','hande','hande-project','三期施工','yuanzhou','报道记载施工场景，后续投产与产出仍需跟踪。'),
    E('supplier-relocation','supplier-move','supplier','迁入园洲','yuanzhou','企业受访描述迁入与订单支撑。'),
    E('hande-employment','hande-project','hande-jobs','是否扩招？',null,'没有由投资额自动推算岗位。'),
    E('supplier-entry','local-suppliers','certification','准入条件？',null,'需求与本地能力之间的供货条件待核实。'),
    E('supplier-payment','supplier','payment','多久回款？',null,'订单不能直接等于已收到的钱。'),
    E('hande-reach','hande-jobs','access','能否到岗？',null,'工作机会是否可达，需另核实。')
  ];
  scene('hande','大客户与配套','industry','订单来了，谁接住了？','yuanzhou','hande', ['hande','local-suppliers','supplier','hande-project','supplier-move','hande-jobs','certification','payment','access'],hEdges,
    [M('汉德 · 本地采购','约40','%','最初不足10%','不足10%',40),M('密特斯 · 汉德业务','约40','%','这是另一个分母','未披露',40)],
    [step('先看采购','先看一家公司怎样接上本地配套。',['hande','local-suppliers']),step('再看客户','同样是40%，一边看本地采购，一边看客户依赖。',['supplier','supplier-move']),step('扩产之外','三期在建的记录，不能自动换算成岗位。',['hande-project','hande-jobs']),step('把桥补全','认证、回款、班次，决定不同人能否接住机会。',['certification','payment','access'])],
    {local:['本地接到了什么？','采购在本地发生之后，还要看哪些需求与能力没接上。'],company:['一个大客户，\n也是一份依赖。','订单带来机会，也要看清回款与替代客户条件。']},
    [gap('供货认证','哪些采购类别、本地能力与质量认证能够对应？'),gap('回款条件','接单之后要垫多久，付款条款是什么？'),gap('岗位班次','新增岗位、技能与实际到岗时间，分别在哪里核实？')],
    {before:'早期 · 受访回顾',after:'2026.09 · 报道快照',note:'只披露本地采购的早期占比；其他早期联系未披露，不能当作不存在。'});

  N('jf','江丰精密','industry','yuanzhou','园洲精密制造企业；订单量、设备进厂、道路是不同记录。');
  N('jf-orders','江丰订单','industry','yuanzhou','受访称订单量约为上年同期3倍；不是全县订单指数。');
  N('jf-equipment','新增精密设备','industry','yuanzhou','报道记载设备陆续进厂，没有对应产能利用率。');
  N('jf-road','厂门口道路','mobility','yuanzhou','2024年5月正式通车；没有实测节时或订单贡献系数。');
  N('jf-production','初次量产','industry','yuanzhou','报道回顾2023年11月初次量产。');
  Q('jf-jobs','岗位与技能','people','设备增加后是增员还是工种变化，需具体用工资料。');
  Q('jf-delivery','交付与回款','people','订单兑现、交付、回款需要分别核实。');
  const jEdges=[E('jf-order-record','jf-orders','jf','订单记录','yuanzhou','订单量约为上年同期3倍。'),E('jf-equipment-record','jf','jf-equipment','设备进厂','yuanzhou','新增设备与企业的对应记录。'),E('jf-road-record','jf','jf-road','厂门口道路','yuanzhou','道路改善物流出行的受访线索，不是因果识别。'),E('jf-production-record','jf','jf-production','量产记录','yuanzhou','2023年11月初次量产。',{before:'record'}),E('jf-work','jf-equipment','jf-jobs','技能变化？',null,'设备到岗与人员到岗要分别看。'),E('jf-cash','jf-orders','jf-delivery','兑现了吗？',null,'尚不能把订单增幅当成利润增幅。'),E('jf-commute','jf-road','access','完整通勤？',null,'路通了不等于每个人都能赶上班。')];
  scene('jiangfeng','订单与设备','industry','订单涨了，哪里跟上了？','yuanzhou','jf',['jf','jf-orders','jf-equipment','jf-road','jf-production','jf-jobs','jf-delivery','access'],jEdges,
    [M('江丰 · 订单量','约3','倍','相对上年同期','未披露',3),M('厂门口道路通车','2024.05','','报道回顾，不是今天的路况','尚未通车')],
    [step('企业起点','从已记录的量产进展开始。',['jf','jf-production']),step('订单与设备','订单和新增设备同时有报道；不能据此直接认定因果。',['jf-orders','jf-equipment']),step('道路条件','厂门口道路是配套条件的一部分。',['jf-road']),step('落到工作','岗位、交付、回款和实际通勤仍要继续查。',['jf-jobs','jf-delivery','access'])],
    {local:['扩产的条件，\n不只在车间。','把订单、设备、物流放到一起，才能找到下一处配套障碍。'],company:['有订单，\n还要能兑现。','从生产到交付和回款，不能只盯一个增长数字。']},
    [gap('设备运行','设备何时安装运行，实际产出如何？'),gap('技能岗位','哪些工种与资格正在变化？'),gap('交付回款','订单兑现和回款的证据在哪里？')],
    {before:'2023.11 · 初次量产',after:'2026.09 · 报道快照',note:'早期订单量未披露；道路到2024年5月正式通车。'});

  N('park','深博福田产业园','regional','park','跨区域园区，开园和首批厂房交付有报道。');
  N('sz','深圳','regional','park','本专题具体涉及深圳福田，不能外推深圳全部产业。');
  N('boluo-site','博罗制造基地','regional','park','园区承接制造环节；不表示所有项目都已投产。');
  N('jq','嘉奇新能源','industry','park','总部与制造基地分置，报道时仍有即将投产的表述。');
  N('xunling','讯凌新科技','industry','park','首批入驻企业；报道中的投产安排是计划，需后续核实。');
  N('shengjian','胜鉴新材料','industry','park','集中入驻的企业之一。');
  N('public-services','跨城政务服务','people','park','报道记载12项核心业务实现跨城通办。');
  Q('park-output','实际产出','industry','厂房交付、签约入驻、投产与达产不能合并。');
  Q('park-local','本地配套接单','people','需要核实园区企业采购与本地供应商记录。');
  const pEdges=[E('park-cooperation','sz','park','两地共建','park','福田与博罗共建园区。',{before:'record'}),E('park-base','park','boluo-site','制造空间','park','首批标准化厂房交付。'),E('park-jq','park','jq','入驻记录','park','企业入驻与后续产出分别核验。'),E('park-xunling','park','xunling','入驻记录','park','报道记载入驻，不把计划投产当作已投产。'),E('park-shengjian','park','shengjian','入驻记录','park','集中入驻的企业之一。'),E('park-services','park','public-services','跨城通办','park','12项核心业务的服务记录。'),E('park-result','boluo-site','park-output','产出兑现？',null,'达产预计值不作为当前实际产出。'),E('park-orders','park','park-local','配套接住？',null,'同处园区或同一行业，不等于有真实订单。')];
  scene('park','总部与制造','regional','总部在外地，本地留下什么？','park','park',['park','sz','boluo-site','jq','xunling','shengjian','public-services','park-output','park-local'],pEdges,
    [M('报道列举集中入驻','5','家','首批厂房交付，不等于全部达产','未披露',5),M('跨城通办核心业务','12','项','企业服务的报道口径','未披露',12)],
    [step('跨城共建','先看福田与博罗之间的共建联系。',['park','sz','boluo-site']),step('企业接入','把入驻企业接到园区，保留各自进展。',['jq','xunling','shengjian']),step('服务也要跟上','注册、税务等跨城服务是另一条连接。',['public-services']),step('本地能否接住','继续核实产出与本地配套，不停在招商金额。',['park-output','park-local'])],
    {local:['项目来了，\n本地接住什么？','制造、采购与服务是不同环节，逐条核实才能看清本地带动。'],company:['两地布局，\n哪些条件真能用？','入驻和实际经营之间，还有政策兑现、配套与产出。']},
    [gap('产出进度','哪些企业已实际生产，哪些仍在准备？'),gap('本地采购','本地企业接到哪些可核实订单？'),gap('服务兑现','跨城服务是否覆盖企业当前要办的业务？')],
    {before:'前期共建记录',after:'2026.07 · 开园报道',note:'早期未披露的企业进展不补为零；不能把“此前在建”解释成此前没有企业。'});

  N('tech-school','广东省技师学院','people','park','报道记载参与园区定向人才实训合作。');
  N('gd-college','广东科技学院','people','park','参与园区定向人才实训合作。');
  N('hz-engineering','惠州工程职业学院','people','park','参与园区定向人才实训合作。');
  N('training-base','定向人才实训','people','park','三所院校与园区共建，课程涉及锂电运维、储能装备、液冷散热等。');
  Q('graduates','实际就业结果','people','合作签约和实际招生、结业、录用要分别核实。');
  Q('trainee-match','岗位技能匹配','people','核实岗位要求、课程与证书是否真正对应。');
  const tEdges=[E('training-park','park','training-base','实训合作','park','园区与院校的合作记录，不是录用保证。'),E('training-tech','tech-school','training-base','院校合作','park','报道列举的合作院校。'),E('training-gd','gd-college','training-base','院校合作','park','报道列举的合作院校。'),E('training-hz','hz-engineering','training-base','院校合作','park','报道列举的合作院校。'),E('training-job','training-base','graduates','实际录用？',null,'需要结业和录用记录。'),E('training-match','training-base','trainee-match','要求对应？',null,'不能只凭合作协议认定能找到工作。'),E('training-commute','graduates','access','能否到岗？',null,'就业之外还要核实出行和班次。')];
  scene('talent','学校与工作','people','产业缺的人，学校接上了吗？','park','training-base',['training-base','park','tech-school','gd-college','hz-engineering','graduates','trainee-match','access'],tEdges,
    [M('参与定向实训合作','3','所院校','合作记录，不是已录用人数','未披露',3),M('实际结业与录用','待补证','','公开报道未披露结果','未披露')],
    [step('先看需求接口','园区与实训合作已有记录。',['training-base','park']),step('学校接上来','三所具体院校，不能只画一个抽象“人才”。',['tech-school','gd-college','hz-engineering']),step('看实际结果','签约之后，需要核实课程、结业和录用。',['graduates','trainee-match']),step('看能否到岗','岗位之外，班次与出行同样需要接上。',['access'])],
    {local:['合作协议，\n要落到技能与岗位。','把需求、课程和实际录用对应，才知道人才供给卡在哪里。'],company:['学了以后，\n能接哪份工作？','先核实具体课程与岗位要求，再看结业和录用结果。']},
    [gap('招生课程','什么课程、招什么人、何时开班？'),gap('岗位要求','课程与企业技能要求如何对应？'),gap('录用记录','实际结业、录用和留任记录在哪里？')],
    {before:'前期结果未披露',after:'2026.07 · 合作报道',note:'本页不把合作协议换算成就业率或个人录用概率。'});

  N('tea-coop','新陂生态茶园合作社','agriculture','tea','柏塘一家具体合作社，春茶生产销售与带动记录来自负责人受访。','record','新陂茶园合作社');
  N('tea-households','35户农户','people','tea','合作社受访称直接带动35户农户；不是全镇覆盖。');
  N('tea-dry','春茶干茶','agriculture','tea','受访称2500斤干茶，报道时基本售完。');
  N('tea-fresh','村民鲜叶收购','agriculture','tea','受访称额外收购鲜叶3000斤；不与干茶直接相加。');
  N('tea-work','50余人就业','people','tea','合作社受访的带动就业记录；不是新增招聘数量。');
  N('tea-garden','合作社茶园','agriculture','tea','受访称茶园面积超500亩，统计对象为该合作社。');
  Q('tea-profit','成本与利润','people','基本售完不等于盈利，需要成本和渠道费用。');
  Q('tea-cash','茶农实际回款','people','售出、收购与回款是不同记录，需另核实。');
  const teaEdges=[E('tea-farmer','tea-households','tea-coop','合作带动','tea','一家合作社的受访口径。'),E('tea-garden-link','tea-garden','tea-coop','基地经营','tea','合作社茶园范围。'),E('tea-dry-link','tea-coop','tea-dry','生产销售','tea','2500斤干茶，报道时基本售完。'),E('tea-fresh-link','tea-fresh','tea-coop','鲜叶收购','tea','额外收购3000斤鲜叶，不与干茶合计。'),E('tea-work-link','tea-coop','tea-work','就业带动','tea','50余人就业的受访记录，不是新增岗位。'),E('tea-profit-link','tea-dry','tea-profit','赚了多少？',null,'没有成本就不能计算利润。'),E('tea-cash-link','tea-households','tea-cash','钱收到了？',null,'需要实际回款证据。')];
  scene('tea','春茶与农户','agriculture','茶基本卖完，钱留下多少？','tea','tea-coop',['tea-coop','tea-households','tea-dry','tea-fresh','tea-work','tea-garden','tea-profit','tea-cash'],teaEdges,
    [M('这家合作社 · 干茶','2500','斤','报道时基本售完；不是鲜叶','未披露',2500),M('受访称直接带动','35','户','仅该合作社的农户范围','未披露',35)],
    [step('从具体农户开始','只看这家合作社，不用全镇产值代替农户经营。',['tea-coop','tea-households','tea-garden']),step('两种茶分开','干茶销售与鲜叶收购是两套口径。',['tea-dry','tea-fresh']),step('看具体的人','受访有50余人就业记录，不是新增招聘。',['tea-work']),step('把经营账补齐','售完之后，继续核实成本、利润和回款。',['tea-profit','tea-cash'])],
    {local:['销售之外，\n还有农户这一端。','把合作社、鲜叶收购、就业和回款分别接起来。'],company:['卖完了，\n不等于钱都挣到了。','加工和渠道成本、实际回款，决定收入如何落到农户。']},
    [gap('经营成本','采摘、加工、包装与渠道分别花了多少？'),gap('实际回款','合作社与农户分别何时拿到钱？'),gap('带动范围','35户、50余人各是什么统计口径？')],
    {before:'早期经营账未披露',after:'2026.04 · 春茶受访',note:'未披露的早期产销与回款，不补造成增长率；这是春茶档案。'});

  N('litchi-session','荔枝技术培训','agriculture','litchi','2026年4月27日在观音阁镇举办的一次培训。');
  N('agri-center','县农业综合服务中心','agriculture','litchi','联合举办单位之一。');
  N('gdaas','广东省农业科学院','agriculture','litchi','质量标准与监测技术研究所、果树研究所参与联合举办。');
  N('litchi-farmers','55名技术人员与大户','people','litchi','各镇街技术人员与荔枝种植大户共55人，不是55户全部农户。','record','55名参训人员');
  N('litchi-skills','大小年与病虫害','agriculture','litchi','培训涉及隔年结果、病虫害防控与用药安全。');
  N('yashiyuan','雅时园合作社','agriculture','litchi','合作社负责人参训并表达试验意愿；不等于试验已经产生效果。');
  Q('litchi-field','田间应用结果','people','谁应用了什么技术，有无同条件对照与实际效果？');
  Q('litchi-income','实际产量与收益','people','培训不能自动换算增产或增收。');
  const lEdges=[E('litchi-center','agri-center','litchi-session','联合举办','litchi','联合举办记录。'),E('litchi-institute','gdaas','litchi-session','科研支持','litchi','科研机构参与的具体培训。'),E('litchi-audience','litchi-session','litchi-farmers','55人参训','litchi','一次培训的人员数。'),E('litchi-teaching','litchi-session','litchi-skills','技术授课','litchi','三个实际技术议题。'),E('litchi-coop','litchi-session','yashiyuan','参训受访','litchi','负责人提出回去试验的意愿。'),E('litchi-application','litchi-skills','litchi-field','应用了吗？',null,'愿意试验不等于已有成效。'),E('litchi-effect','litchi-field','litchi-income','效果如何？',null,'需要田间对照与经营记录。')];
  scene('litchi','技术与果农','agriculture','技术到了，田里用上了吗？','litchi','litchi-session',['litchi-session','agri-center','gdaas','litchi-farmers','litchi-skills','yashiyuan','litchi-field','litchi-income'],lEdges,
    [M('这次培训参加者','55','人','技术人员与种植大户合计','未披露',55),M('培训日期','04.27','','2026年 · 观音阁镇','未披露')],
    [step('找到具体接口','从实际举办的培训开始。',['litchi-session','agri-center','gdaas']),step('到具体的人','55名参训人员不是全县覆盖率。',['litchi-farmers','yashiyuan']),step('技术是什么','大小年、防虫、安全用药分别对应问题。',['litchi-skills']),step('回到田间','下一步核实应用与成效，而不是宣布增收。',['litchi-field','litchi-income'])],
    {local:['服务到了，\n效果还要跟到田里。','培训次数之外，更需要技术应用和同条件效果记录。'],company:['听懂了，\n怎样验证真有用？','从一项技术、一块地与一份对照记录开始。']},
    [gap('实际应用','参训者实际用了哪项技术？'),gap('田间对照','是否有同条件地块或前期记录可比较？'),gap('经营成效','产量、成本和售价怎样分别核实？')],
    {before:'本次培训前未披露',after:'2026.04.27 · 培训记录',note:'不把参训人数当作覆盖率，也不推算技术带来的增收。'});

  N('rail-luofu','罗浮山高铁站','mobility','mobility','2026年5月试运行专线的起点。');
  N('tour-bus','环罗浮山文旅专线','mobility','mobility','5月试运行，报道明确试运行至6月上旬；当前运营安排需更新。','record','文旅专线 · 试运行');
  N('luofu-square','景区旅游文化广场','mobility','mobility','试运行线路串联站点之一。');
  N('zhuming','朱明洞景区','tourism','mobility','报道列举的试运行串联站点之一。');
  N('mofang','磨房户外运动中心','tourism','mobility','报道列举的试运行串联站点之一。');
  N('caoping','疏林草坪活动区','tourism','mobility','报道列举的试运行串联站点之一。');
  N('guoyun','过云山居·显岗驿站','tourism','mobility','报道列举的试运行串联站点之一。','record','过云山居·显岗驿站');
  N('shangliang','上良民宿站','tourism','mobility','报道列举的试运行串联站点之一。');
  Q('bus-now','今天还怎样运行？','people','这是5月试运行档案，今天的班次、票价和运行状态需要新记录。');
  const stops=['rail-luofu','luofu-square','zhuming','mofang','caoping','guoyun','shangliang'];
  const mEdges=stops.map((id,i)=>E('bus-stop-'+i,'tour-bus',id,i===0?'高铁接驳':'串联站点','mobility','2026年5月试运行线路的站点记录，不提供今天的出行承诺。'));
  mEdges.push(E('bus-current','tour-bus','bus-now','运营待更新',null,'试运行到6月上旬，不能把历史时刻表作为当前班次。'));
  scene('mobility','高铁与民宿','mobility','下了高铁，机会接到村里了吗？','mobility','tour-bus',['tour-bus',...stops,'bus-now'],mEdges,
    [M('试运行串联站点','7','个','含高铁站的历史线路','未披露',7),M('试运行线路全程','20','公里','不是门到门用时','未披露',20)],
    [step('先到高铁站','从真实的试运行接驳起点开始。',['tour-bus','rail-luofu']),step('连接景区','线路与站点有记录，不用直线距离替代通达。',['luofu-square','zhuming','mofang']),step('再到乡村停留点','把活动区、驿站和民宿站放回同一条线路。',['caoping','guoyun','shangliang']),step('历史不等于今天','今天能否搭乘，必须核实更新的运营资料。',['bus-now'])],
    {local:['资源在附近，\n还得有连接。','交通接驳把高铁与景区、乡村停留点联系起来；真实客流仍需另查。'],company:['到了高铁站，\n还差最后一段。','这是试运行档案，先确认今天的运营安排再计划行程。']},
    [gap('运营更新','当前是否运营，线路与站点有无变化？'),gap('服务时段','现行班次与首末班在哪里核实？'),gap('实际停留','接驳之后游客在哪些点停留、消费？')],
    {before:'试运行前资料未披露',after:'2026.05 · 试运行档案',note:'本次只回放历史线路记录，不提供当前班次、票价或到站时间。'});

  N('glc','固力水泥博罗分公司','industry','cement','公庄企业主体保留；通告只涉及一条熟料生产线。');
  N('glc-line','日产2500吨熟料线','industry','cement','通告明确关停、主体设备拆除。');
  N('clinker','该线熟料生产','industry','cement','仅指该条生产线的生产环节。');
  N('glc-equipment','主体设备拆除','industry','cement','通告披露的退出事实。');
  N('gongzhuang','公庄镇','regional','cement','该生产线所在地，不意味着公庄全部建材业务退出。');
  Q('glc-other','企业其他业务','industry','原通告未说明其他业务的变化，不能一并判定退出。');
  Q('glc-people','人员与配套影响','people','具体岗位、配套和承接安排需要另外核实。');
  const cEdges=[E('glc-ownership','glc','glc-line','所属产线','cement','企业与该条产线的对应。',{before:'record'}),E('clinker-output','glc-line','clinker','该线生产','cement','只断开这条产线的生产联系，保留企业主体。',{before:'record',after:'closed'}),E('glc-removal','glc-line','glc-equipment','设备拆除','cement','退出事实，不是推演假设。'),E('glc-location','gongzhuang','glc','属地记录','cement','生产线所在地区。',{before:'record'}),E('glc-business','glc','glc-other','其他业务？',null,'不能把整家公司从图上删掉。'),E('glc-effects','glc-line','glc-people','影响待查',null,'通告没有给出岗位或配套损失。')];
  scene('cement','产线与退出','industry','退出一条线，不能删掉整家公司。','cement','glc-line',['glc-line','glc','clinker','glc-equipment','gongzhuang','glc-other','glc-people'],cEdges,
    [M('关停产线原规模','2500','吨/日','熟料线 · 不是全厂规模','2500吨/日',2500),M('明确退出范围','1','条产线','其他业务未说明','该线在产',1)],
    [step('先看主体和产线','企业与具体产线分开。',['glc-line','glc','gongzhuang']),step('看这一条联系','退出涉及的是该线生产联系。',['clinker']),step('明确退出事实','设备拆除有通告依据。',['glc-equipment']),step('保留未知','其他业务、人员和配套影响继续核实。',['glc-other','glc-people'])],
    {local:['退出在哪里，\n接续就查到哪里。','只追踪这条产线的退出，不能把整个行业一笔划掉。'],company:['一条线停了，\n谁受影响仍要查。','企业主体和其他业务保留，具体经营影响没有自动推算。']},
    [gap('业务范围','企业其他业务是否变化？'),gap('人员安排','岗位与人员承接有哪些公开记录？'),gap('配套关系','哪些供应商或客户确实依赖该条产线？')],
    {before:'该线关停之前',after:'2026.02 · 关停通告',note:'对照只断开该线生产联系；企业及其他未知业务不被删除。'});

  N('tls','铜来顺新材料','industry','copper','新材料企业生产线点火的报道记录。');
  N('tls-line','新材料生产线','industry','copper','2026年10月13日举行点火仪式。');
  N('tls-ignite','10月13日点火','industry','copper','点火是一个生产进展节点，不是全年产销结果。');
  N('tls-goal','2027产值目标','industry','copper','目标不能当作当前实际产值。');
  Q('tls-output','实际产销量','industry','点火后产量、销售与产能利用需要更新记录。');
  Q('tls-local','本地采购与岗位','people','需要具体采购与用工记录，不能按目标金额折算。');
  Q('tls-orders','本地客户连接','industry','同为铜基产业不等于两家企业有订单。');
  const coEdges=[E('tls-line-owner','tls','tls-line','企业产线','copper','企业与生产线的对应。'),E('tls-event','tls-line','tls-ignite','点火记录','copper','2026年10月13日点火。'),E('tls-plan','tls','tls-goal','目标口径','copper','属于2027年目标，不是当前产值。'),E('tls-real','tls-ignite','tls-output','产销兑现？',null,'需要后续生产经营证据。'),E('tls-employment','tls','tls-local','本地带动？',null,'采购与岗位分别核实。'),E('tls-supply','tls','tls-orders','真实订单？',null,'不把同行业共存写成交易。')];
  scene('copper','点火与产出','industry','点火之后，还差哪些兑现？','copper','tls',['tls','tls-line','tls-ignite','tls-goal','tls-output','tls-local','tls-orders'],coEdges,
    [M('生产进展','10.13','','2026年 · 点火记录','未披露'),M('实际产销量','待跟踪','','目标不填进实际产出','未披露')],
    [step('主体与产线','先确认谁的哪条线。',['tls','tls-line']),step('明确已发生进展','点火有报道，不跨越后续阶段。',['tls-ignite']),step('目标单列','2027目标与实际产销分开。',['tls-goal']),step('继续查兑现','产销、本地采购与客户连接都需要记录。',['tls-output','tls-local','tls-orders'])],
    {local:['新增主体，\n还要长出真实联系。','点火之后追踪产销和本地配套，不能停在计划金额。'],company:['已经点火，\n订单兑现了吗？','经营记录、回款与真实客户，是下一层问题。']},
    [gap('生产兑现','实际产销量和产能利用怎样？'),gap('本地采购','具体供应商与采购记录在哪里？'),gap('真实客户','哪些交易已经形成，哪些仍是行业想象？')],
    {before:'点火前进展未披露',after:'2026.10 · 点火报道',note:'不把投产进展与2027年目标混成当前实际产值。'});
  return {version:'2026-11-07-world3',sources,nodes,edges,scenes,groups:{industry:'制造与接续',agriculture:'农业与加工',people:'工作与经营',mobility:'交通与接驳',regional:'跨城连接',tourism:'文旅与停留'}};
});
