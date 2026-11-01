(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.TeaIntelligence = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sources = [
    {id:'T01', title:'罗浮山茶从散装走向整装', publisher:'南方日报', published_at:'2026-04-10', url:'https://epaper.nfnews.com/nfdaily/html/202604/10/content_10167542.html', origin_group:'nfdaily-20260410', kind:'现场报道', access:'全文', limits:'产业总量为报道口径；设计产能、发展方向不等于实际产量或客户合同。'},
    {id:'T02', title:'全链突围激活千年茶山新动能', publisher:'羊城晚报', published_at:'2026-03-20', url:'https://ep.ycwb.com/epaper/ywdf/html/2026-03/20/content_1001_745177.htm', origin_group:'ycwb-20260320', kind:'现场报道', access:'全文', limits:'2025年总量与T01不同；产值含按单价估算，未取得底表。'},
    {id:'T03', title:'茶叶所参加博罗柏塘茶产业高质量发展专题座谈会', publisher:'广东省农业科学院茶叶所', published_at:'2026-06-08', url:'https://www.gdaas.cn/ysdtn/kjfw/content/post_1329183.html', origin_group:'gdaas-meeting-202606', kind:'参与方原始发布', access:'全文', limits:'证明座谈与拟定分工；技术支持有地方落实与资源保障前提，未证明全部任务完成。'},
    {id:'T04', title:'地理标志产品 柏塘山茶 DB4413/T 6-2019', publisher:'全国标准信息公共服务平台', published_at:'2019-12-26', url:'https://std.samr.gov.cn/db/search/stdDBDetailed?id=9AF7A3B2130735D6E05397BE0A0A00E1', origin_group:'standard-db4413-6-2019', kind:'官方标准目录', access:'目录全文', limits:'查询状态为现行、推荐性；目录不能证明某批产品已经达标。'},
    {id:'T05', title:'惠州市地方标准复审结论', publisher:'惠州市市场监督管理局', published_at:'2024-09-26', url:'https://hzamr.huizhou.gov.cn/gkmlpt/content/5/5361/post_5361812.html', origin_group:'huizhou-standard-review-202409', kind:'官方复审', access:'检索条目，正文抓取超时', limits:'检索表列DB4413/T 6-2019继续有效；与T04对应同一标准，不能重复当成两项标准。'},
    {id:'T06', title:'DB44/T 2053-2017 柏塘山茶', publisher:'地方标准信息服务平台', published_at:null, url:'https://ba.sacinfo.org.cn/stdDetail/6f8bb24b7c5a31da4d104aa1791de9c2', origin_group:'standard-db44-2053-2017', kind:'官方标准目录', access:'目录全文', limits:'该历史省级标准标记废止；不能由此推断当前没有标准或地理标志失效。'},
    {id:'T07', title:'2022年第19号地理标志专用标志核准公告', publisher:'广东省市场监督管理局（深圳标准技术研究院转载）', published_at:'2022-08-17', url:'https://www.sist.org.cn/gdtc123/bzhdt/xwdt/202208/t20220824_2413205.html', origin_group:'gd-gi-2022-19', kind:'官方公告转载', access:'全文及名单', limits:'仅证明2022年名单记录，不替代经营状态、当前授权与具体批次核验。'},
    {id:'T08', title:'T/GDNB 87-2022 柏塘山茶扦插育苗技术规程', publisher:'国家数字标准馆', published_at:null, url:'https://www.ndls.org.cn/standard/detail/de44d004e7f5f7e7271eca926aa5cc46', origin_group:'standard-tgdnb-87-2022', kind:'标准编目线索', access:'检索编目，正文抓取超时', limits:'起草单位来自编目检索；未取得标准全文。共同起草不等于供销、投资或当前合作。'},
    {id:'T09', title:'福博“合茗”！这杯茶喝出了“大生意”', publisher:'博罗发布（南方号）', published_at:'2026-08-08', event_at:'2026-08-06', url:'https://static.nfnews.com/content/202608/08/c12703240.html', origin_group:'boluo-fubo-20260806', kind:'地方发布', access:'全文', limits:'记录战略签约和课程捐赠；批量进入供应链是合作方向，未公布成交、复购或学员成效。'},
    {id:'T10', title:'莲花街道赴柏塘镇共探乡村振兴新路径', publisher:'深圳市福田区莲花街道办事处', published_at:'2025-09-15', event_at:'2025-09-12', url:'https://www.szft.gov.cn/xxgk/zdly/gysy/tpgj/content/post_12478031.html', origin_group:'lianhua-visit-20250912', kind:'参与方原始发布', access:'全文', limits:'记录组织旅游企业开发线路及调研；未公布茶叶采购合同或全年转化数据。'},
    {id:'T11', title:'“茶+咖啡”改写流量密码', publisher:'南方日报', published_at:'2025-05-09', url:'https://epaper.nfnews.com/nfdaily/html/202505/09/content_10134795.html', origin_group:'nfdaily-20250509', kind:'现场报道', access:'全文', limits:'游客、曝光与节假日经营各有统计范围；不能换算为全年茶叶销量或复购。'},
    {id:'T12', title:'万亩礼茶旗舰店茶饮及茶点产品开发服务市场价格调研', publisher:'星图同步（转引中易电子交易平台）', published_at:'2026-09-15', url:'https://www.xtsync.com/detail/procurement_items/442-guan-yu-wan-mu-li-cha-qi-jian-dian-cha-yin-ji-cha-dian-chan-pin-kai-fa-fu-wu-xia', original_url:'https://www.cotenders.cn/PublicServer2.0/public/tradeDetail/tradeDetail.html?id=909170C5-7638-13E5-BFBE-2AE17C2D6275', origin_group:'baixing-price-survey-202609', kind:'待核原文的转载线索', access:'转载全文；原站仅返回脚本页面', limits:'原文待人工核对。正文截止2026-09-18，已过期；只是价格调研，不是已授予项目或当前机会。'},
    {id:'T13', title:'从农业大镇到茶香文旅小镇', publisher:'南方日报', published_at:'2026-02-10', url:'https://epaper.nfnews.com/nfdaily/html/202602/10/content_10162868.html', origin_group:'nfdaily-20260210', kind:'现场报道', access:'全文', limits:'中央茶厂当时为试生产，30万斤为满产设计量；投资方、运营方和各项目不混为同一主体。'}
  ];
  const entities = [
    {id:'t-tea',name:'柏塘山茶',short:'柏塘山茶',sub:'产品',icon:'leaf',kind:'产品',sources:['T04','T07'],detail:'现行地方标准与历史标志核准名单均可定位到这一产品。',unknown:'具体批次、种植地与品质检验仍须对应。'},
    {id:'t-town',name:'柏塘镇人民政府',short:'柏塘镇',sub:'地方组织',icon:'globe',kind:'公共机构',sources:['T03','T10'],detail:'参加茶产业座谈、组织区域协作；县级资源保障与镇级工作须分别核实。',unknown:'具体项目的执行单位、经费落实与进度。'},
    {id:'t-park',name:'柏塘镇一二三产融合茶叶产业园',short:'茶叶产业园',sub:'项目与加工场景',icon:'factory',kind:'产业项目',sources:['T13','T01'],detail:'2026年2月报道中央茶厂试生产；公开方向包括标准化加工和B端原料供给。',unknown:'实际干茶产量、可用余量、合格批次与买方，不用设计量代替。'},
    {id:'t-institute',name:'广东省农业科学院茶叶研究所',short:'省农科院茶叶所',sub:'技术与人才支持',icon:'school',kind:'科研机构',sources:['T03','T08'],detail:'原始发布提出品种、管护、加工、标准与基层人才支持，并明确地方落实条件。',unknown:'已完成什么、服务哪些主体、如何验收及是否可承接新任务。'},
    {id:'t-standard',name:'DB4413/T 6-2019',short:'柏塘山茶标准',sub:'现行推荐性地方标准',icon:'shield',kind:'标准',sources:['T04','T05'],detail:'全国平台目录标记现行；2024年市级复审表列继续有效。',unknown:'标准存在不等于每家企业或每个批次已经达标。'},
    {id:'t-fubo',name:'博罗福波生态茶园专业合作社',short:'福波合作社',sub:'2022核准名单',icon:'leaf',kind:'合作社',sources:['T07','T08'],detail:'出现在2022年标志核准名单；另见扦插育苗规程起草单位编目。',unknown:'当前经营、标志使用与供货情况，不能由历史名单直接确认。'},
    {id:'t-sankesong',name:'博罗县柏塘镇三棵松高山茶专业合作社',short:'三棵松合作社',sub:'2022核准名单',icon:'sprout',kind:'合作社',sources:['T07','T08'],detail:'出现在2022年标志核准名单；另见扦插育苗规程起草单位编目。',unknown:'近期批次、服务范围与实际合作，待当事方确认。'},
    {id:'t-guanghua',name:'博罗县柏塘光华食品有限公司',short:'光华食品',sub:'2022核准名单',icon:'factory',kind:'企业',sources:['T07'],detail:'2022年公告列入柏塘山茶标志核准使用者。',unknown:'不能据此判断全部业务均为茶叶，亦无近期订单底表。'},
    {id:'t-shanchawang',name:'惠州市柏塘镇山茶王茶叶专业合作社',short:'山茶王合作社',sub:'2022核准名单',icon:'leaf',kind:'合作社',sources:['T07'],detail:'2022年公告列入柏塘山茶标志核准使用者。',unknown:'当前授权、经营状态与供应能力需更新。'},
    {id:'t-association',name:'柏塘镇茶产业协会',short:'柏塘茶产业协会',sub:'2026签约报道所用名称',icon:'users',kind:'行业组织',sources:['T09'],detail:'2026年8月报道其与莲花街道茶行业工联会签署战略合作协议。',unknown:'报道另有“茶叶产业协会”等写法；登记名称及成员名单待核，暂不合并法人身份。'},
    {id:'t-union',name:'莲花街道茶行业工联会',short:'莲花茶行业工联会',sub:'深圳侧组织',icon:'link',kind:'行业组织',sources:['T09'],detail:'已报道签约，方向涉及茶叶产销和茶旅协作。',unknown:'参与买方、订单要求、实际成交与持续合作。'},
    {id:'t-course',name:'现场捐赠的AI全域营销课程',short:'AI营销课程',sub:'2026-08捐赠记录',icon:'school',kind:'课程资源',sources:['T09'],detail:'活动报道记录课程捐赠，捐赠企业未在该文具名。',unknown:'谁学习、是否完成、能否独立运营及经营结果。'},
    {id:'t-yishanhai',name:'逸山海',short:'逸山海',sub:'文旅品牌，非法人指认',icon:'mountain',kind:'品牌',sources:['T02','T13'],detail:'报道将小茶园、慢享榄园与小光影列为该品牌布局的三个项目。',unknown:'不由品牌关联推断各项目股权、结算或采购关系。'},
    {id:'t-cafe',name:'逸山海·小茶园',short:'小茶园咖啡',sub:'茶园消费场景',icon:'store',kind:'经营场景',sources:['T11','T10'],detail:'2025年报道已开业，并提供以当地山茶制作的冷萃茶饮。',unknown:'具体供茶方、茶叶零售占比与游客复购。'},
    {id:'t-manxiang',name:'慢享榄园民宿',short:'慢享榄园',sub:'住宿场景',icon:'mountain',kind:'经营场景',sources:['T02'],detail:'报道列为逸山海在柏塘布局的项目。',unknown:'客房之外的茶叶销售、成本与淡季留客情况。'},
    {id:'t-xiaoguang',name:'逸山海·小光影',short:'小光影古榄园',sub:'游玩场景',icon:'mountain',kind:'经营场景',sources:['T02'],detail:'报道列为逸山海在柏塘布局的项目。',unknown:'项目间实际导流和转化，未取得经营台账。'},
    {id:'t-baixing',name:'惠州市柏兴产业投资发展有限公司',short:'柏兴产投',sub:'转载调研发布方，待核原文',icon:'factory',kind:'企业线索',sources:['T12'],detail:'转载的2026年9月价格调研将其列为发布方。',unknown:'原公告待核；不视为当前招募、已授标或既有合作。',limited:true},
    {id:'t-productbrief',name:'万亩礼茶产品开发调研',short:'万亩礼茶调研',sub:'历史线索，2026-09已截止',icon:'document',kind:'服务需求线索',sources:['T12'],detail:'转载任务含茶饮茶点研发、出品培训、视觉和影像资料，属于咨询研发成果。',unknown:'原公告、后续是否立项或成交；不包含设备采购或线上系统运营。',limited:true},
    {id:'t-buyer',name:'实际采购方与验收要求',short:'实际采购方',sub:'关键空白',icon:'store',kind:'待核角色',sources:['T01','T09'],detail:'公开方向指向B端供给和湾区渠道，但本次检索未找到可核验的买方合同与验收清单。',unknown:'先找到产品规格、样品反馈与交期要求，再判断瓶颈。',gap:true},
    {id:'t-school',name:'参与实训与陪跑的院校团队',short:'院校实训团队',sub:'可建设的桥，未确认',icon:'school',kind:'待核角色',sources:['T03','T09'],detail:'科研培训与营销课程资源可作为寻找实训任务的线索；尚无已确认参与学校。',unknown:'学校、老师、任务负责人、验收和付费主体均待落实。',gap:true}
  ];
  const relations = [
    {id:'tr01',from:'t-town',to:'t-institute',label:'参加产业座谈',status:'observed',date:'2026-06',sources:['T03'],scope:'座谈与拟分工；不等于全部技术任务已交付。'},
    {id:'tr02',from:'t-town',to:'t-park',label:'推进产业项目',status:'reported',date:'2026-02',sources:['T13'],scope:'报道的项目进展；各经营主体与权属需另查。'},
    {id:'tr03',from:'t-institute',to:'t-fubo',label:'同列育苗规程起草单位',status:'catalog',date:'2022',sources:['T08'],scope:'仅编目协作记录；未取得标准全文，不代表交易关系。'},
    {id:'tr04',from:'t-institute',to:'t-sankesong',label:'同列育苗规程起草单位',status:'catalog',date:'2022',sources:['T08'],scope:'仅编目协作记录；不能扩展为当前供货。'},
    {id:'tr05',from:'t-standard',to:'t-tea',label:'对应地理标志产品标准',status:'observed',date:'2019／当前查询',sources:['T04','T05'],scope:'标准目录状态，非具体批次达标背书。'},
    ...['t-fubo','t-sankesong','t-guanghua','t-shanchawang'].map((id,i)=>({id:'tr'+(6+i).toString().padStart(2,'0'),from:id,to:'t-tea',label:'2022标志核准名单',status:'observed',date:'2022-08',sources:['T07'],scope:'历史核准记录；当前状态需核对。'})),
    {id:'tr10',from:'t-park',to:'t-tea',label:'标准化加工方向',status:'reported',date:'2026-04',sources:['T01'],scope:'发展与生产组织方向；非已知实际采购批次。'},
    {id:'tr11',from:'t-park',to:'t-buyer',label:'寻找真实采购与验收',status:'hypothesis',date:null,sources:['T01','T09'],scope:'由B端方向推导的待核桥；未确认买方。'},
    {id:'tr12',from:'t-association',to:'t-union',label:'已报道战略签约',status:'observed',date:'2026-08-06',sources:['T09'],scope:'签约事件；不代表已形成订单。'},
    {id:'tr13',from:'t-union',to:'t-buyer',label:'拟拓展湾区供应链',status:'hypothesis',date:null,sources:['T09'],scope:'协议方向，实际买方与成果待核。'},
    {id:'tr14',from:'t-course',to:'t-school',label:'可转成实训资源',status:'hypothesis',date:null,sources:['T09'],scope:'本版建议；课程捐赠与学校参加不是一回事。'},
    {id:'tr15',from:'t-school',to:'t-buyer',label:'围绕交付组织陪跑',status:'hypothesis',date:null,sources:['T03','T09'],scope:'本版提出的任务桥，未建立合作。'},
    {id:'tr16',from:'t-yishanhai',to:'t-cafe',label:'品牌项目布局',status:'reported',date:'2026-03',sources:['T02'],scope:'报道中的品牌关联，不指认法人股权。'},
    {id:'tr17',from:'t-yishanhai',to:'t-manxiang',label:'品牌项目布局',status:'reported',date:'2026-03',sources:['T02'],scope:'报道中的品牌关联，不推断结算与采购。'},
    {id:'tr18',from:'t-yishanhai',to:'t-xiaoguang',label:'品牌项目布局',status:'reported',date:'2026-03',sources:['T02'],scope:'报道中的品牌关联。'},
    {id:'tr19',from:'t-cafe',to:'t-tea',label:'当地山茶用于饮品',status:'reported',date:'2025-05',sources:['T11'],scope:'报道提及冷萃；具体供茶方与采购量未知。'},
    {id:'tr20',from:'t-baixing',to:'t-productbrief',label:'转载列为调研发布方',status:'lead',date:'2026-09-15',sources:['T12'],scope:'原文待核，正文截止日期已过；非当前招募。'},
    {id:'tr21',from:'t-productbrief',to:'t-school',label:'可拆解成实践任务',status:'hypothesis',date:null,sources:['T12'],scope:'历史任务仅用于识别能力组合，不代表学校可直接承接。'},
    {id:'tr22',from:'t-productbrief',to:'t-tea',label:'茶饮与零售联动意图',status:'lead',date:'2026-09',sources:['T12'],scope:'转载中的产品意图，尚未核实运营成果。'}
  ];
  const graphs = {
    quality:{label:'品质与供货',nodes:[['t-institute',170,95],['t-standard',505,85],['t-town',850,95],['t-fubo',120,290],['t-tea',430,300],['t-park',760,300],['t-buyer',1030,460],['t-sankesong',170,475]],relations:['tr01','tr02','tr03','tr04','tr05','tr06','tr07','tr10','tr11']},
    market:{label:'渠道与人才',nodes:[['t-association',160,105],['t-union',520,105],['t-buyer',930,105],['t-course',130,355],['t-school',520,355],['t-baixing',950,365],['t-productbrief',785,490]],relations:['tr12','tr13','tr14','tr15','tr20','tr21']},
    travel:{label:'茶旅与复购',nodes:[['t-cafe',200,105],['t-yishanhai',535,105],['t-manxiang',885,105],['t-xiaoguang',535,330],['t-tea',170,360],['t-baixing',1020,420],['t-productbrief',775,480]],relations:['tr16','tr17','tr18','tr19','tr20','tr22']}
  };
  const hypotheses = [
    {id:'quality',title:'湾区渠道打开后，先卡在品质与稳定供货吗？',short:'先跑通一批能被验收的茶',tag:'优先追问',node:'t-buyer',summary:'加工和渠道正在连接。现在最值得找到的，可能是买方的一张验收单。',basis:[{text:'产业园公开方向包括标准化加工和B端原料供给。',sources:['T01']},{text:'茶叶所把技术落地、标准与地方保障列为协作事项。',sources:['T03']},{text:'深圳侧已有茶行业组织签约线索。',sources:['T09']}],inference:'如果目标转向持续供给B端，批次稳定、交期和验收可能比单纯增加曝光更早制约订单。尚不能据此判定哪家企业质量不足。',alternatives:['也可能样品与供货都已稳定，真正问题是价格、采购意愿或渠道成本。','新厂可能承担示范、研发与标准组织功能，不必加工全镇所有茶。'],falsifier:'若已有买方连续验收合格、按期收货和复购记录，应降低“品质供货先卡住”的判断，转查价格与渠道。',checks:['取得一份真实买方规格与拒收原因','记录同一规格的连续批次与交期','确认谁收货、谁验收、谁负责异常'],bridge:{title:'科研资源 → 合作社 → 买方样品',entities:['t-institute','t-fubo','t-sankesong','t-buyer'],why:'技术座谈与标准起草记录提供了寻找协作人的入口；供货、检测和买方适配需另核。',task:'选一款产品、一位买方，完成规格表、批次记录、样品反馈与一次交付复盘。',deliverable:'验收规格 + 样品记录 + 批次与交期台账',payer:'先确认真实需求方与任务负责人；是否付费、由谁采购服务均待约定。'}},
    {id:'market',title:'课程和签约已有了，缺的是把它们变成订单的人吗？',short:'把陪跑围着真实任务来做',tag:'真实连接',node:'t-association',summary:'这里已出现AI课程与跨地合作。可检验的下一步，是谁能把一个经营任务独立做完。',basis:[{text:'2026年8月报道战略签约，并记录AI营销课程捐赠。',sources:['T09']},{text:'2025年莲花街道曾组织旅游企业开发柏塘线路。',sources:['T10']},{text:'茶叶所提出基层人才培育，但需当地资源和组织落实。',sources:['T03']}],inference:'可能的缺口是持续执行与验收：从一款产品、一次上架、一批交付，到下一次复购。不能仅凭“有课程”推断已培养出人才，也不能倒推“肯定缺主播”。',alternatives:['组织已具备执行能力，只是公开资料未披露结果。','没有订单也可能来自需求、产品、价格或渠道成本，培训不能包办。'],falsifier:'若已有团队能独立交付、持续复盘且产生复购，继续增加同类课程的优先性应下降。',checks:['核实合作协议后有哪些具体任务','找一位企业任务负责人及验收人','用作品、过程记录与经营反馈核对能力'],bridge:{title:'协会与深圳侧资源 → 院校任务 → 3至6个月陪跑',entities:['t-association','t-union','t-course','t-school'],why:'签约和课程是已出现的资源，院校团队是待建设的桥；不把未具名捐赠企业编成供应商。',task:'建议从产品资料、内容制作、上架校对、客户反馈四类任务中选一项；按月验收，逐步交给学员独立完成。',deliverable:'任务书 + 作品与修改记录 + 企业验收 + 月度复盘',payer:'先明确谁要结果，再讨论企业服务或院校实训采购。此处为方案，不声称已有经费或中标项目。'}},
    {id:'travel',title:'茶园有人来，能留下会再次买茶的客人吗？',short:'把喝一杯与买回家接起来',tag:'待验证转化',node:'t-cafe',summary:'咖啡、民宿和古榄园提供了不同停留场景。关键可能在体验之后，茶叶有没有被继续购买。',basis:[{text:'小茶园已用当地山茶制作茶饮；报道存在茶旅消费联动。',sources:['T11']},{text:'逸山海品牌布局咖啡、民宿与古榄园三个项目。',sources:['T02']},{text:'历史价格调研转载提出茶饮、茶点与零售联动任务，原公告尚待核验。',sources:['T12']}],inference:'可追“试饮—零售—复购”的断点。产品设计、出品稳定与客户反馈整理，可能是适合人才实训的具体工作。转载任务只作弱线索。',alternatives:['游客主要为景观与社交而来，未必愿意买茶。','部分茶叶购买可能在线下现金完成，线上观察会漏记。'],falsifier:'若茶叶购买与后续复购已稳定，或多数顾客明确只为景观而来，应重新评估追加转化投入的收益。',checks:['分开记录到店人数、试饮人数与买茶人数','自愿征得顾客同意后跟踪复购反馈','区分平日与节假日，不用峰值代表全年'],bridge:{title:'茶旅经营场景 → 产品与内容任务 → 人才作品',entities:['t-cafe','t-manxiang','t-tea','t-school'],why:'已有茶饮与茶旅场景可供寻找任务；没有证据证明上述主体已经接受实训或联合经营。',task:'小范围比较两种产品说明与试饮方式，记录顾客反馈、茶叶购买和后续复购；由经营者决定是否试行。',deliverable:'产品说明 + 出品检查表 + 经同意的顾客反馈 + 转化复盘',payer:'由确认愿意试行的经营者或实训组织讨论任务与费用；不以曝光数承诺收入。'}}
  ];
  const metrics = [
    {id:'m1',name:'2025年全镇茶叶产量',value:2449,unit:'吨',period:'2025',scope:'柏塘镇，报道未细分干鲜口径',nature:'reported_actual',source:'T01',conflict_group:'2025-town-output'},
    {id:'m2',name:'2025年全镇茶叶产量',value:2570,unit:'吨',period:'2025',scope:'柏塘镇，报道未细分干鲜口径',nature:'reported_actual',source:'T02',conflict_group:'2025-town-output'},
    {id:'m3',name:'2025年茶产业产值',value:12,unit:'亿元',period:'2025',scope:'柏塘镇，约数',nature:'reported_actual',source:'T01',conflict_group:'2025-town-value'},
    {id:'m4',name:'2025年茶产业产值',value:12.8,unit:'亿元',period:'2025',scope:'柏塘镇，报道按250元/斤测算',nature:'reported_estimate',source:'T02',conflict_group:'2025-town-value'},
    {id:'m5',name:'中央茶厂设计加工能力',value:300000,unit:'斤干茶/年',period:'设计满产',scope:'产业园中央茶厂，不是全镇',nature:'design',source:'T13',conflict_group:null},
    {id:'m6',name:'茶企业与合作社',value:58,unit:'家',period:'2026报道',scope:'生产经营主体',nature:'reported_actual',source:'T01',conflict_group:null},
    {id:'m7',name:'协会整合成员',value:65,unit:'家',period:'2024年6月组建时',scope:'包括茶企、酒店、文旅等不同主体',nature:'reported_actual',source:'T01',conflict_group:null}
  ];
  const conflicts = [
    {id:'c-output',title:'同一年度，有两组产量与产值',detail:'2449吨、约12亿元（T01）与2570吨、12.8亿元（T02）并存。后者含单价估算。先核范围、干鲜计量和计算方法，不取平均、不喂入产能试验。',sources:['T01','T02'],next:'取得镇级统计底表及口径说明。'},
    {id:'c-standard',title:'看到“废止”，还要继续往下查',detail:'历史省标DB44/T 2053-2017已废止；另有现行市标DB4413/T 6-2019，市级复审表也列继续有效。不能据旧标准状态说“当地没有标准”。',sources:['T04','T05','T06'],next:'业务验收须用适用标准与具体批次记录。'},
    {id:'c-scope',title:'58家、65家和30万斤，分别在说什么',detail:'58家是报道中的茶企与合作社；65家还包括酒店、文旅成员。30万斤是单一茶厂设计干茶量，不能当作全镇实际产量或当前余量。',sources:['T01','T13'],next:'分别记录成员范围、设计能力、实际产出与可用余量。'}
  ];
  const leads = [{id:'l-product',title:'茶饮茶点研发、出品培训与视觉内容的组合任务',source:'T12',published_at:'2026-09-15',deadline:'2026-09-18',status:'closed_historical',original_verified:false,issuer_entity:'t-baixing',meaning:'说明公开网络上曾出现这一组服务需求的线索，值得核原文和查后续；不能等同于当前招聘或已成交。',next:'核对原平台公告及后续结果，确认项目是否实际实施。'}];
  function graph(topic) {
    const g = graphs[topic] || graphs.quality;
    return {nodes:g.nodes.map(([id,x,y])=>({...entities.find(n=>n.id===id),x,y,registered:!entities.find(n=>n.id===id).gap})),edges:g.relations.map(id=>{const e=relations.find(r=>r.id===id);return {...e,recorded:['observed','reported','catalog'].includes(e.status),source_ids:e.sources};})};
  }
  function assess(o = {}) {
    const sample = o.sample || 'unknown', supply = o.supply || 'unknown', repeat = o.repeat || 'unknown';
    if (sample === 'rejected') return {title:'先追样品为什么未被接受',body:'规格、感官、批次一致性和目标客群都可能影响验收。先拿到拒收理由，再判断是加工、产品定位还是说明方式。',next:'索取一份可执行的验收清单，补测后再谈扩大营销。',level:'open'};
    if (supply === 'unstable') return {title:'先查交付中断在哪里',body:'已有供货不稳定的观察，应区分原料、排期、品质返工和发货；增课或加流量可能扩大等待。',next:'用真实批次和时间定位，再进入承接条件试验。',level:'open'};
    if (sample === 'accepted' && supply === 'steady' && repeat === 'no') return {title:'降低“先补品质供货”的优先性',body:'如果样品被接受、供货也稳定，却没有复购，应把价格、真实需求、渠道费用和客户反馈摆到前面。',next:'问清未复购理由，比较客户需求与渠道成本，暂不据此认定人才不足。',level:'shift'};
    if (sample === 'accepted' && supply === 'steady' && repeat === 'yes') return {title:'这条小规模链路已有继续放大的依据',body:'按你记录的观察，验收、供货与复购已衔接。再核对样本、周期与费用，判断能否持续和复制。',next:'把任务与作品交给下一位执行者，检验是否能独立完成。',level:'shift'};
    return {title:'先找最能区分原因的一条信息',body:'优先拿到买方规格或样品反馈，再看供货与复购。没有公开结果不等于没有业务，也不等于一定缺人才。',next:'从一款产品、一位买方、一批货开始追。',level:'open'};
  }
  return {schema_version:1, snapshot_at:'2026-11-01', coverage:'本次公开网络检索快照，非全量工商、采购或经营数据库',sources,entities,relations,graphs,hypotheses,metrics,conflicts,leads,graph,assess};
});
