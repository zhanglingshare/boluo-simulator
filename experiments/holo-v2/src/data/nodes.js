/* ============================================================
 * nodes.js —— 27 个节点（真实主体）
 * 数据来源：原版 network.html 的 rawNodes（字段口径保持一致）。
 * 每个节点都是真实主体，故 evidenceStatus 均为 A；
 * 不确定性集中在"边（关系）"与未来的"流量"上。
 *   - cluster:true 表示这是一个"聚合节点"（一类主体的集合，非单一企业）。
 *   - state "yellow"（needsReview）：相关指标待核实，描边警示。
 *   - group：五大星群语义分组（见 meta.GROUPS）。
 * ============================================================ */

export const NODES = [
  /* —— 城镇生活（生态/水源底座）—— */
  { id: "dj",   name: "东江水系",       type: "eco", group: "living",  town: "罗阳/石湾/园洲", state: "green", cluster: false, layer: "生态底座",
    description: "母亲河·饮用水源Ⅱ类·沿江镇街排污上限约束", sources: ["network.html"] },
  { id: "bss",  name: "百岁山",         type: "agri", group: "living", town: "湖镇", state: "green", cluster: false, layer: "农业康养",
    description: "374万吨/年取水·罗浮山水源·饮用水供给", sources: ["network.html"] },

  /* —— 山水文旅康养 —— */
  { id: "lswh", name: "环两山引领区",   type: "eco", group: "tourism", town: "长宁/横河/福田", state: "green", cluster: false, layer: "生态底座",
    description: "环南昆山-罗浮山·218km 8字旅游公路·北部绿色屏障", sources: ["network.html"] },
  { id: "hh",   name: "横河户外小镇",   type: "capillary", group: "tourism", town: "横河", state: "green", cluster: true, layer: "农业康养",
    description: "华南户外水经济港·民宿集群", sources: ["network.html"] },
  { id: "lfsgy", name: "罗浮山国药",    type: "agri", group: "tourism", town: "长宁", state: "green", cluster: false, layer: "农业康养",
    description: "中华老字号·红脚艾·百草油·省中医院合作", sources: ["network.html"] },

  /* —— 产业制造：链主（独立企业）—— */
  { id: "xwd",  name: "欣旺达/锂威",    type: "anchor", group: "industry", town: "园洲", state: "green", cluster: false, layer: "链主",
    description: "锂电池·高用电·高外部订单依赖（深圳总部→园洲基地）", sources: ["network.html"] },
  { id: "htd",  name: "华通电脑",       type: "anchor", group: "industry", town: "园洲/石湾", state: "green", cluster: false, layer: "链主",
    description: "电子信息770亿基本盘代表", sources: ["network.html"] },
  { id: "zw",   name: "正威新材料",     type: "anchor", group: "industry", town: "罗阳", state: "green", cluster: false, layer: "链主",
    description: "25万吨铜杆/年·重资产原材料底座", sources: ["network.html"] },
  { id: "jq",   name: "嘉奇新能源",     type: "anchor", group: "industry", town: "园洲", state: "yellow", cluster: false, layer: "链主",
    description: "奇瑞系·深博福田产业园2026开园·华南首个梯次电池基地（指标待核实）", needsReview: true, sources: ["network.html"] },
  { id: "jf",   name: "江丰精密",       type: "anchor", group: "industry", town: "园洲", state: "green", cluster: false, layer: "链主",
    description: "溅射靶材全球第一·3纳米", sources: ["network.html"] },

  /* —— 产业制造：小巨人（聚合）—— */
  { id: "gj",   name: "11家国家级小巨人", type: "champ", group: "industry", town: "多镇", state: "green", cluster: true, layer: "小巨人",
    description: "嘉治电子/派沃/力王/凤凰/广麟/奥科/百时达/吉邦/鑫晖源/信立泰/TCL瑞智", sources: ["network.html"] },
  { id: "sj",   name: "74家省级专精特新", type: "champ", group: "industry", town: "多镇", state: "green", cluster: true, layer: "小巨人",
    description: "各细分赛道隐形市占率", sources: ["network.html"] },

  /* —— 产业制造：毛细血管群落（聚合）—— */
  { id: "bmc",  name: "表面处理群落",   type: "capillary", group: "industry", town: "福田", state: "yellow", cluster: true, layer: "毛细血管",
    description: "省级特色集群·电镀/喷涂·受东江环保约束（指标待核实）", needsReview: true, sources: ["network.html"] },
  { id: "mj",   name: "石湾模具群落",   type: "capillary", group: "industry", town: "石湾", state: "green", cluster: true, layer: "毛细血管",
    description: "全镇2461家工业企业·三市交界·特斯拉/比亚迪/拓竹", sources: ["network.html"] },
  { id: "ddc",  name: "电动车配套群落", type: "capillary", group: "industry", town: "石湾", state: "green", cluster: true, layer: "毛细血管",
    description: "台铃/小刀/新日/绿佳·产值超150亿", sources: ["network.html"] },

  /* —— 产业制造：老厂基盘（聚合）—— */
  { id: "lq",   name: "镇村老厂群落",   type: "legacy", group: "industry", town: "龙溪/园洲/罗阳", state: "yellow", cluster: true, layer: "老厂基盘",
    description: "数千家五金/塑料/建材·用电+11.5%大头·亩均达标压力（指标待核实）", needsReview: true, sources: ["network.html"] },

  /* —— 农业乡村：地理标志与农品 —— */
  { id: "sc",    name: "柏塘山茶",     type: "gi", group: "agri", town: "柏塘", state: "green", cluster: false, layer: "国家地理标志",
    description: "国家地理标志·省十大茶乡", sources: ["network.html"] },
  { id: "xc",    name: "福田菜心",     type: "gi", group: "agri", town: "福田", state: "yellow", cluster: false, layer: "国家地理标志",
    description: "国家地理标志·太空育种（指标待核实）", needsReview: true, sources: ["network.html"] },
  { id: "gyg",   name: "观音阁花生",   type: "gi", group: "agri", town: "观音阁", state: "green", cluster: false, layer: "国家地理标志",
    description: "国家地理标志", sources: ["network.html"] },
  { id: "gyght", name: "观音阁黑糖",   type: "gi", group: "agri", town: "观音阁", state: "green", cluster: false, layer: "国家地理标志",
    description: "国家地理标志", sources: ["network.html"] },
  { id: "lsmd",  name: "罗浮山大米",   type: "gi", group: "agri", town: "长宁/横河", state: "green", cluster: false, layer: "国家地理标志",
    description: "国家地理标志·太空育种", sources: ["network.html"] },
  { id: "lsz",   name: "罗浮山荔枝",   type: "gi", group: "agri", town: "罗浮山周边", state: "green", cluster: false, layer: "国家地理标志",
    description: "国家地理标志·10万亩", sources: ["network.html"] },
  { id: "sb",    name: "石坝胡须鸡",   type: "agri", group: "agri", town: "石坝", state: "green", cluster: false, layer: "农业康养",
    description: "全国名特优新", sources: ["network.html"] },

  /* —— 外部联系 —— */
  { id: "gz", name: "广州", type: "ext", group: "external", town: "外部", state: "green", cluster: false, layer: "外部",
    description: "增城接石湾·省中医院医药合作", sources: ["network.html"] },
  { id: "dg", name: "东莞", type: "ext", group: "external", town: "外部", state: "green", cluster: false, layer: "外部",
    description: "紧邻石湾/园洲·模具电子外溢源头", sources: ["network.html"] },
  { id: "sz", name: "深圳", type: "ext", group: "external", town: "外部", state: "green", cluster: false, layer: "外部",
    description: "欣旺达·嘉奇新能源项目来源", sources: ["network.html"] },
  { id: "hz", name: "惠城", type: "ext", group: "external", town: "外部", state: "green", cluster: false, layer: "外部",
    description: "惠州主城·行政与文旅客流", sources: ["network.html"] }
];

/* 园洲产业子群（M1 样板：镇级聚焦）—— 坐落于园洲的链主节点 */
export const YUANZHOU_FOCUS = ["xwd", "jq", "jf", "htd"];
