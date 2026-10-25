/* 自动生成，请勿手改。数据源：同目录 topics/evidence/viewpoints/watchlist.json；
   改完 JSON 后运行 build_intel_data.py 重新生成。 */
window.BOLUO_INTEL = {
  "topics": {
    "schema_version": 1,
    "engine": "观点情报引擎",
    "region": "boluo",
    "updated": "2026-10-25",
    "note": "议题库。议题可沿用多天，只有重要事实变化、话题失效或人工替换时才更换；不制造为新而新的伪争议。",
    "topics": [
      {
        "topic_id": "boluo-investment-decline-2025",
        "title": "博罗GDP破千亿了，投资却下降18.8%。未来增长靠什么接续？",
        "core_question": "增长动能在良性换挡，还是新产能接续存在隐忧？",
        "summary": "2025年博罗成为广东首个千亿县，GDP增长5.5%、规上工业增加值增长8.7%，但全社会固定资产投资下降18.8%。投资是领先指标、当期产值是滞后指标，两者相差2-3年时滞。真正的判断点是：2027-2028年的新产能能否接得上。",
        "category": "industry",
        "baseline_facts": {
          "gdp": 1005.45,
          "gdp_growth": 5.5,
          "fixed_asset_investment_growth": -18.8,
          "real_estate_investment_growth": -47.6,
          "industrial_value_added_growth": 8.7,
          "lag_mechanism": "投资为流量，经2-3年时滞传导为产能"
        },
        "evidence_ids": [
          "ev-gdp-2025",
          "ev-secondary-2025",
          "ev-tertiary-2025",
          "ev-primary-2025",
          "ev-ind-value-2025",
          "ev-ind-output-2025",
          "ev-electronics-2025",
          "ev-electrical-2025",
          "ev-fai-2025",
          "ev-realestate-2025",
          "ev-industrial-invest-scale",
          "ev-secondary-invest-2025",
          "ev-tertiary-invest-2025",
          "ev-primary-invest-2025",
          "ev-tonglaishun-2025"
        ],
        "model_mappable": true,
        "model_note": "可映射到 model.js 五路径的投资/产能假设；新投产项目节奏对应p1双引擎。",
        "started_at": "2026-10-25",
        "updated_at": "2026-10-25",
        "status": "active",
        "verification": {
          "next_check": "2026年一季度经济数据",
          "next_release_window": "2026-04",
          "verifiable": true
        }
      },
      {
        "topic_id": "boluo-tertiary-tourism-2025",
        "title": "三产增速只有2.7%，罗浮山的人气能变成第二增长引擎吗？",
        "core_question": "文旅的热闹是生活补充，还是足以接棒工业的结构性增长极？",
        "summary": "博罗第二产业增加值549亿、增速6.9%，第三产业349亿、增速仅2.7%，文旅与工业不在一个量级。国庆乡村旅游点人气不错，但'游客来了'与'形成增加值、税收、就业'之间隔着消费转化、停留时长和产业乘数。本议题数据尚不充分，只给出可被现有证据支撑的立场，不凑齐四个。",
        "category": "livelihood",
        "baseline_facts": {
          "tertiary_value": 349.0,
          "tertiary_growth": 2.7,
          "secondary_value": 549.01,
          "secondary_growth": 6.9
        },
        "evidence_ids": [
          "ev-tertiary-2025",
          "ev-secondary-2025"
        ],
        "evidence_sufficiency": "insufficient",
        "model_mappable": true,
        "model_note": "对应 model.js 路径p3三产/文旅破局（mu=50，五路径中第三），敏感性显著低于p1双引擎。",
        "started_at": "2026-10-25",
        "updated_at": "2026-10-25",
        "status": "active",
        "verification": {
          "next_check": "全年游客接待量、旅游总收入、停留时长",
          "next_release_window": "待文旅部门年度数据",
          "verifiable": true
        }
      }
    ]
  },
  "evidence": {
    "schema_version": 1,
    "engine": "观点情报引擎",
    "region": "boluo",
    "updated": "2026-10-25",
    "fetched_at": "2026-10-25 07:00",
    "reliability_legend": {
      "A": "统计公报/政府工作报告等权威发布",
      "B": "县级部门工作总结/专题简报",
      "C": "权威媒体报道",
      "D": "模型经验设定/分析推测（非实测）"
    },
    "note": "证据库。每条证据可被多个议题、多个观点引用；同一下跌事件多媒体转载只计一条，不重复计数。",
    "evidence": [
      {
        "evidence_id": "ev-gdp-2025",
        "statement": "2025年博罗GDP达1005.45亿元，增长5.5%，成为广东首个千亿县",
        "value": "1005.45亿元 / +5.5%",
        "metric": "GDP",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年国民经济和社会发展统计公报",
        "url": "https://www.boluo.gov.cn/blgk/qjmb/content/post_5719003.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-secondary-2025",
        "statement": "第二产业增加值549.01亿元，增长6.9%",
        "value": "549.01亿元 / +6.9%",
        "metric": "第二产业增加值",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-tertiary-2025",
        "statement": "第三产业增加值349.00亿元，增长2.7%",
        "value": "349.00亿元 / +2.7%",
        "metric": "第三产业增加值",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025",
          "boluo-tertiary-tourism-2025"
        ]
      },
      {
        "evidence_id": "ev-primary-2025",
        "statement": "第一产业增加值107.44亿元，增长7.8%",
        "value": "107.44亿元 / +7.8%",
        "metric": "第一产业增加值",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-ind-value-2025",
        "statement": "规模以上工业增加值增长8.7%，高于GDP增速",
        "value": "+8.7%",
        "metric": "规上工业增加值增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-ind-output-2025",
        "statement": "规模以上工业总产值突破2000亿元，增长8.3%",
        "value": "突破2000亿元 / +8.3%",
        "metric": "规上工业总产值",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "B",
        "verified": true,
        "source": "博罗县科技工业和信息化局2025年工作总结",
        "url": "https://www.boluo.gov.cn/bmzb/xkjgyhxxhj/zwgk/qt/ghjh/content/post_5731937.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-electronics-2025",
        "statement": "电子信息产业产值增长17.2%",
        "value": "+17.2%",
        "metric": "电子信息产业产值增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "2025年1-12月全县经济运行情况简析",
        "url": "https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5715830.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-electrical-2025",
        "statement": "电气机械产业产值增长16.9%",
        "value": "+16.9%",
        "metric": "电气机械产业产值增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "2025年1-12月全县经济运行情况简析",
        "url": "https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5715830.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-fai-2025",
        "statement": "2025年全社会固定资产投资下降18.8%",
        "value": "-18.8%",
        "metric": "固定资产投资增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-realestate-2025",
        "statement": "房地产开发投资下降47.6%",
        "value": "-47.6%",
        "metric": "房地产投资增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-industrial-invest-scale",
        "statement": "工业投资超230亿元，占固定资产投资比重近60%，连续四年规模超200亿元",
        "value": "超230亿元 / 占比约60%",
        "metric": "工业投资规模与占比",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "B",
        "verified": true,
        "source": "博罗县科技工业和信息化局2025年工作总结",
        "url": "https://www.boluo.gov.cn/bmzb/xkjgyhxxhj/zwgk/qt/ghjh/content/post_5731937.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-secondary-invest-2025",
        "statement": "第二产业投资下降12.7%",
        "value": "-12.7%",
        "metric": "第二产业投资增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-tertiary-invest-2025",
        "statement": "第三产业投资下降25.9%",
        "value": "-25.9%",
        "metric": "第三产业投资增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-primary-invest-2025",
        "statement": "第一产业投资下降64.7%",
        "value": "-64.7%",
        "metric": "第一产业投资增速",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "A",
        "verified": true,
        "source": "博罗县2025年统计公报",
        "url": "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      },
      {
        "evidence_id": "ev-tonglaishun-2025",
        "statement": "博罗铜来顺新材料生产线点火，规划2027年冲刺百亿产值",
        "value": "在建，2027年目标百亿",
        "metric": "重大在建产业项目",
        "period": "2025",
        "source_type": "官方发布",
        "reliability": "B",
        "verified": true,
        "source": "博罗县人民政府",
        "url": "https://www.boluo.gov.cn/zwgk/zwdt/tpxw/content/post_5872750.html",
        "topic_ids": [
          "boluo-investment-decline-2025"
        ]
      }
    ]
  },
  "viewpoints": {
    "schema_version": 1,
    "engine": "观点情报引擎",
    "region": "boluo",
    "updated": "2026-10-25",
    "generated_at": "2026-10-25 07:00",
    "method": "竞争性假设分析（ACH）+ 利益相关方结构定位：从公开证据识别实质不同的解释，再映射到由结构位置决定的立场原型",
    "display_label": "典型立场研判 · 基于公开情报推演",
    "disclaimer": "以下立场为基于公开统计与情报的结构化分析估计（analytic estimate），代表由结构位置与信息环境推导的'立场原型'，非任何真人发言、非民意调查、不代表公众意见分布。无支持率、无头像、无互动数据。",
    "viewpoints": [
      {
        "viewpoint_id": "vp-prod-current",
        "origin": "ai_synthesized",
        "population_representativeness": "not_established",
        "topic_id": "boluo-investment-decline-2025",
        "color": "#3b82f6",
        "position_archetype": "当期生产视角",
        "archetype_headline": "数据明明很好，别自己吓自己",
        "structural_position": "对当期产值负责的人：高新区与企业生产运营、口径落在'出货与产能利用'的位置。",
        "information_environment": "日常看到订单、产能利用率、产值报表，眼前是工业增加值+8.7%、产值破2000亿、电子信息+17.2%。",
        "claim": "投资下降不等于当前工业衰退；过去几年投下去的产能正在释放，当下增长有支撑。",
        "support_evidence_ids": [
          "ev-ind-value-2025",
          "ev-ind-output-2025",
          "ev-electronics-2025",
          "ev-electrical-2025",
          "ev-secondary-2025"
        ],
        "contradict_evidence_ids": [
          "ev-fai-2025",
          "ev-secondary-invest-2025"
        ],
        "blind_spot": "看到的是滞后指标（当期产值）；投资是领先指标，收缩要2-3年后才传导到生产端。",
        "uncertainties": [
          "现有产能能否持续满负荷",
          "新订单与外需是否延续"
        ],
        "discriminating_tests": [
          "wl-q1-2026-ind-value"
        ],
        "confidence": "中",
        "confidence_basis": "对'当下仍在增长'判断可信度高（A级证据）；对'未来无忧'判断弱。",
        "generated_at": "2026-10-25",
        "review_status": "pending",
        "source_refs": [
          "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html",
          "https://www.boluo.gov.cn/bmzb/xkjgyhxxhj/zwgk/qt/ghjh/content/post_5731937.html"
        ],
        "version": "1.0"
      },
      {
        "viewpoint_id": "vp-pipeline-ahead",
        "origin": "ai_synthesized",
        "population_representativeness": "not_established",
        "topic_id": "boluo-investment-decline-2025",
        "color": "#ef4444",
        "position_archetype": "前瞻接续视角",
        "archetype_headline": "投得越来越少，2027拿什么接？",
        "structural_position": "对未来项目储备负责的人：发改、招商、产业研究，口径落在'新签约、新开工、在建'。",
        "information_environment": "盯投资领先指标：全社会固投-18.8%，一产投资-64.7%、三产投资-25.9%、二产投资-12.7%。",
        "claim": "投资是领先指标，现在收缩意味着两三年后新增产能可能断档，应警惕增长接续风险。",
        "support_evidence_ids": [
          "ev-fai-2025",
          "ev-primary-invest-2025",
          "ev-tertiary-invest-2025",
          "ev-secondary-invest-2025"
        ],
        "contradict_evidence_ids": [
          "ev-industrial-invest-scale",
          "ev-tonglaishun-2025",
          "ev-ind-value-2025"
        ],
        "blind_spot": "容易把房地产塌方误算成工业失速，并低估存量产能与在建大项目的释放节奏。",
        "uncertainties": [
          "在建项目的实际投产时间表",
          "工业投资（剔除地产）的真实趋势"
        ],
        "discriminating_tests": [
          "wl-q1-2026-industrial-invest",
          "wl-new-projects"
        ],
        "confidence": "中",
        "confidence_basis": "领先指标方向明确（A级），但向生产端传导的强度与时滞不确定。",
        "generated_at": "2026-10-25",
        "review_status": "pending",
        "source_refs": [
          "https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html"
        ],
        "version": "1.0"
      },
      {
        "viewpoint_id": "vp-structure-split",
        "origin": "ai_synthesized",
        "population_representativeness": "not_established",
        "topic_id": "boluo-investment-decline-2025",
        "color": "#f59e0b",
        "position_archetype": "结构分析视角",
        "archetype_headline": "别被总数吓到，要看是谁在跌",
        "structural_position": "做统计与经济结构分析的人，习惯把总量拆开看分项，而非对单一总数下结论。",
        "information_environment": "手握分项：房地产投资-47.6%是主跌项，工业投资仅-12.7%、仍超230亿、占固投近60%、连续四年超200亿，铜来顺等项目仍在点火。",
        "claim": "这是房地产周期出清叠加产业结构升级，工业底盘没有塌；是'换挡'而非'熄火'，要按分项分别判断。",
        "support_evidence_ids": [
          "ev-industrial-invest-scale",
          "ev-realestate-2025",
          "ev-electronics-2025",
          "ev-electrical-2025",
          "ev-tonglaishun-2025"
        ],
        "contradict_evidence_ids": [
          "ev-secondary-invest-2025",
          "ev-tertiary-invest-2025",
          "ev-fai-2025"
        ],
        "blind_spot": "二产、三产投资同时为负，'全面收缩'也是事实；结构分化叙事可能过度乐观、掩盖工业投资本身的小幅走弱。",
        "uncertainties": [
          "工业投资与房地产投资的增速差是否持续扩大",
          "工业投资230亿的内部结构（新建vs技改）"
        ],
        "discriminating_tests": [
          "wl-q1-2026-industrial-invest",
          "wl-tonglaishun"
        ],
        "confidence": "中高",
        "confidence_basis": "与分项数据最吻合；'换挡'成立的关键是工业投资增速稳住，尚需一季度验证。",
        "generated_at": "2026-10-25",
        "review_status": "pending",
        "source_refs": [
          "https://www.boluo.gov.cn/bmzb/xkjgyhxxhj/zwgk/qt/ghjh/content/post_5731937.html",
          "https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html"
        ],
        "version": "1.0"
      },
      {
        "viewpoint_id": "vp-evidence-thin",
        "origin": "ai_synthesized",
        "population_representativeness": "not_established",
        "topic_id": "boluo-investment-decline-2025",
        "color": "#6b7280",
        "position_archetype": "审慎证据视角",
        "archetype_headline": "公开数据还不够，现在下结论为时过早",
        "structural_position": "外部学者、只掌握公开数据、拿不到内部项目台账与企业投资意愿调查的观察者。",
        "information_environment": "只有增速，缺分项绝对金额、在建项目投产时间表、企业投资意愿的微观调查。",
        "claim": "缺少诊断性证据，既不能喊空也不能唱多；应先补齐能区分上述解释的关键数据。",
        "support_evidence_ids": [],
        "contradict_evidence_ids": [],
        "blind_spot": "等待完美数据本身就是一种判断——它意味着'现在不需要行动'。",
        "uncertainties": [
          "各投资分项的绝对金额与多年趋势",
          "在建项目投产时间表",
          "企业投资意愿的直接调查（市场/融资/政策）"
        ],
        "discriminating_tests": [
          "wl-q1-2026-ind-value",
          "wl-q1-2026-industrial-invest",
          "wl-new-projects"
        ],
        "confidence": "高",
        "confidence_basis": "'证据不足'这一元判断本身成立；对四种解释的最终取舍则悬置。",
        "generated_at": "2026-10-25",
        "review_status": "pending",
        "source_refs": [
          "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html"
        ],
        "version": "1.0"
      },
      {
        "viewpoint_id": "vp-tourism-cultivate",
        "origin": "ai_synthesized",
        "population_representativeness": "not_established",
        "topic_id": "boluo-tertiary-tourism-2025",
        "color": "#fbbf24",
        "position_archetype": "文旅培育视角",
        "archetype_headline": "罗浮山是慢变量，值得长期养",
        "structural_position": "文旅、农业与地方生活的从业者和推动者，看重人气、口碑与长期品牌。",
        "information_environment": "看到节假日乡村旅游点人气旺、生态与文化资源独特，但缺少全年游客量、旅游收入与消费转化的权威数值。",
        "claim": "文旅是需要长期培育的第二曲线，即使短期体量小，也应在工业换挡期坚持投入做消费转化。",
        "support_evidence_ids": [
          "ev-tertiary-2025"
        ],
        "contradict_evidence_ids": [
          "ev-secondary-2025"
        ],
        "blind_spot": "人气不等于增加值；在拿到旅游总收入、停留时长、人均消费等数据前，难以判断其乘数效应。",
        "uncertainties": [
          "全年游客接待量与旅游总收入",
          "游客停留时长与人均消费",
          "国庆等节点人气能否常态化"
        ],
        "discriminating_tests": [
          "wl-tourism-annual"
        ],
        "confidence": "低",
        "confidence_basis": "仅1条三产总量证据支撑方向，缺乏文旅专项量化证据，属待验证立场。",
        "generated_at": "2026-10-25",
        "review_status": "pending",
        "source_refs": [
          "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html"
        ],
        "version": "1.0"
      },
      {
        "viewpoint_id": "vp-tourism-scale",
        "origin": "ai_synthesized",
        "population_representativeness": "not_established",
        "topic_id": "boluo-tertiary-tourism-2025",
        "color": "#06b6d4",
        "position_archetype": "量级清醒视角",
        "archetype_headline": "349亿对549亿，文旅短期接不了工业的棒",
        "structural_position": "以总量与结构口径看经济基本盘的人，习惯用产业规模和增速做量级比较。",
        "information_environment": "二产549亿、增6.9%，三产349亿、仅增2.7%，两者不在一个量级和增速档位。",
        "claim": "文旅可以富民、改善生活品质，但短期不足以成为接棒工业的增长极；它是补充与韧性，不是主引擎。",
        "support_evidence_ids": [
          "ev-secondary-2025",
          "ev-tertiary-2025"
        ],
        "contradict_evidence_ids": [],
        "blind_spot": "可能低估文旅的就业带动与长期生态价值，只看了GDP口径。",
        "uncertainties": [
          "若旅游收入高增长，量级判断是否需要修正",
          "三产内部的生产性服务业占比"
        ],
        "discriminating_tests": [
          "wl-tourism-annual"
        ],
        "confidence": "中",
        "confidence_basis": "二产/三产规模与增速为A级事实，'短期难接棒'有据；长期判断仍取决于文旅数据。",
        "generated_at": "2026-10-25",
        "review_status": "pending",
        "source_refs": [
          "https://www.boluo.gov.cn/hzbltjj/gkmlpt/content/5/5801/mpost_5801532.html"
        ],
        "version": "1.0"
      }
    ]
  },
  "watchlist": {
    "schema_version": 1,
    "engine": "观点情报引擎",
    "region": "boluo",
    "updated": "2026-10-25",
    "note": "鉴别清单：等待更新的统计指标/事件，以及不同结果分别支持哪个立场。验证日期取决于真实数据发布节奏，不做机械30天开奖。",
    "watchlist": [
      {
        "watch_id": "wl-q1-2026-ind-value",
        "topic_id": "boluo-investment-decline-2025",
        "metric": "2026年一季度规上工业增加值增速",
        "current": "8.7%（2025全年）",
        "distinguishes": {
          "keep_above_8": "支持 vp-prod-current（当期生产仍有支撑）",
          "below_5": "支持 vp-pipeline-ahead（投资收缩开始传导）",
          "between_5_8": "维持分歧，需结合投资项"
        },
        "next_release": "2026-04"
      },
      {
        "watch_id": "wl-q1-2026-industrial-invest",
        "topic_id": "boluo-investment-decline-2025",
        "metric": "2026年一季度工业投资（二产）增速",
        "current": "-12.7%（2025全年二产投资）",
        "distinguishes": {
          "turn_positive": "支持 vp-structure-split（换挡成立，工业底盘稳住）",
          "continue_double_digit_decline": "支持 vp-pipeline-ahead（接续风险兑现）",
          "slight_negative": "vp-structure-split 与 vp-pipeline-ahead 之间，继续观察"
        },
        "next_release": "2026-04"
      },
      {
        "watch_id": "wl-new-projects",
        "topic_id": "boluo-investment-decline-2025",
        "metric": "2026年新开工/投产项目数",
        "current": "待公布",
        "distinguishes": {
          "more_projects": "支持 vp-structure-split / vp-prod-current（投资周期触底）",
          "fewer_projects": "支持 vp-pipeline-ahead（企业信心未恢复）"
        },
        "next_release": "持续监测"
      },
      {
        "watch_id": "wl-tonglaishun",
        "topic_id": "boluo-investment-decline-2025",
        "metric": "铜来顺等百亿级项目投产进度",
        "current": "生产线点火，2027年冲刺百亿",
        "distinguishes": {
          "on_schedule": "支持 vp-structure-split（大项目仍在落地）",
          "delay_or_shrink": "支持 vp-pipeline-ahead（企业投资意愿下降）"
        },
        "next_release": "2026年持续监测"
      },
      {
        "watch_id": "wl-tourism-annual",
        "topic_id": "boluo-tertiary-tourism-2025",
        "metric": "全年游客接待量、旅游总收入、人均消费",
        "current": "公开全年文旅专项数据未取得",
        "distinguishes": {
          "high_revenue_growth": "支持 vp-tourism-cultivate（第二曲线值得加码）",
          "traffic_without_revenue": "支持 vp-tourism-scale（有人气无转化，短期难接棒）",
          "data_absent": "两立场均维持低置信度，不展开更多对立观点"
        },
        "next_release": "待文旅部门年度数据"
      }
    ]
  }
};
