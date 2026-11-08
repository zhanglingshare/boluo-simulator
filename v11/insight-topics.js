/* Public question set only. No private statistical computation or path calculation. */
(()=>{"use strict";
  const targets = {
    growth:{
      title:"产业接续", question:"工业继续增长，下一棒究竟卡在哪里？", key:"project",
      insight:"工业产出增长与工业投资收缩并存。需要区分现有产能支撑和未来项目接续，不能把同步变动当作因果关系。",
      factors:[
        {id:"project",name:"项目接续",importance:84,performance:32,kind:"投资与项目",link:"delay",missing:"项目级开工、设备安装、投产和达产时间",why:"进度落后的项目是否集中在未来产能形成的关键节点？"},
        {id:"capacity",name:"产能兑现",importance:91,performance:56,kind:"项目进度",link:"delay",missing:"存量产能利用率、实际开机率与新增产线投产日期",why:"即使投资回升，产能兑现是否存在跨年度滞后？"},
        {id:"network",name:"本地配套",importance:74,performance:42,kind:"产业连接",link:"orders",missing:"供应商采购结构、客户集中度、替代订单周期",why:"哪类配套企业最难被替代，订单却最容易外流？"},
        {id:"people",name:"人才通勤",importance:51,performance:61,kind:"服务约束",link:"traffic",missing:"岗位招聘周期、关键工种流动与通勤样本",why:"人才可达性是否放大了某些项目的投产时滞？"},
        {id:"agri",name:"农业加工",importance:37,performance:48,kind:"特色产业",link:"orders",missing:"本地加工比例、渠道合同、增加值留存",why:"农业有没有被总量增长的关注度掩盖？"}
      ]
    },
    retention:{
      title:"本地留存",question:"规模涨了，价值真的留在博罗了吗？",key:"network",
      insight:"总产出、本地增加值、企业利润、工资与消费不是同一个统计口径。价值链上的连接方式可能改变本地留存。",
      factors:[
        {id:"network",name:"本地采购",importance:90,performance:36,kind:"本地价值链",link:"orders",missing:"采购合同的真实归属地、采购金额与增加值口径",why:"大企业扩产时，本地企业拿到了多少配套订单？"},
        {id:"agri",name:"农产加工",importance:73,performance:42,kind:"一产延链",link:"orders",missing:"加工损耗、工厂毛利、渠道回款与外地加工占比",why:"农产品卖得多，不等于加工和品牌价值留在本地。"},
        {id:"services",name:"生产性服务",importance:81,performance:45,kind:"服务环节",link:"traffic",missing:"研发、物流、维修、工业服务供应商所在地",why:"产业升级过程中，专业服务利润流向了哪里？"},
        {id:"capacity",name:"工业产出",importance:67,performance:69,kind:"产出",link:"delay",missing:"各行业真实增加值与工业总产值的可比口径",why:"产值大幅增长是否被误当作当地实际所得？"},
        {id:"people",name:"就业收入",importance:61,performance:59,kind:"居民获得",link:"traffic",missing:"工资总额、就业净增量、居民收入及通勤成本",why:"有没有产出增长但岗位与收入增长不明显的情形？"}
      ]
    },
    resilience:{
      title:"产业韧性",question:"一条订单断了，谁最难找到替代？",key:"network",
      insight:"规模最大的主体，不一定是风险传播最重要的主体。客户集中度、替代时间与网络连接可能比单点产值更值得追问。",
      factors:[
        {id:"network",name:"替代订单",importance:93,performance:39,kind:"缓冲能力",link:"orders",missing:"企业实际客户清单、客户集中度和替代时长",why:"关键配套企业能否及时找到第二个客户？"},
        {id:"project",name:"项目缓冲",importance:78,performance:49,kind:"投资接续",link:"delay",missing:"备用项目、产能互补和交付周期",why:"一条新产线延期后是否存在可接棒主体？"},
        {id:"people",name:"关键工种",importance:69,performance:47,kind:"人员连接",link:"traffic",missing:"关键工种人数、替补周期与跨区通勤",why:"技术人员短缺是否产生连锁停工风险？"},
        {id:"capacity",name:"产能弹性",importance:81,performance:62,kind:"制造能力",link:"invest",missing:"设备利用率、换线时间及库存缓冲",why:"已有产线能否吸收订单或项目冲击？"},
        {id:"agri",name:"农业资金链",importance:56,performance:40,kind:"季节性供应链",link:"orders",missing:"采收周期、加工垫资、账期与回款率",why:"旺季供给增长是否反而加重短期现金压力？"}
      ]
    }
  };
window.BoluoPublicTopics = Object.freeze({targets});
})();
