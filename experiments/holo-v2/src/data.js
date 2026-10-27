/* Snapshot manually transcribed from public source: zhanglingshare/boluo-simulator network.html rawNodes/rawEdges, hot.json, life.json.
   Source snapshot (hot/life): 2026-10-21 07:27. Not live feeds or geocoded locations.
   The design clusters below are editorial groupings, not physical coordinates. */
window.BOLUO_DATA = (()=>{
 const nodes=[
 ['dj','东江水系','eco','罗阳/石湾/园洲','东江水系与饮用水环境约束'],
 ['lswh','环两山引领区','eco','长宁/横河/福田','环南昆山—罗浮山，文旅和生态发展区域'],
 ['xwd','欣旺达 / 锂威','anchor','园洲','深圳总部与博罗生产基地关联'],
 ['htd','华通电脑','anchor','园洲/石湾','电子信息产业主体'],
 ['zw','正威新材料','anchor','罗阳','铜材料生产相关主体'],
 ['jq','嘉奇新能源','anchor','园洲','新能源项目，原版标注黄色状态'],
 ['jf','江丰精密','anchor','园洲','精密材料产业主体'],
 ['gj','11家国家级小巨人','champ','多镇','专精特新企业集合节点'],
 ['sj','74家省级专精特新','champ','多镇','省级专精特新企业集合节点'],
 ['bmc','表面处理群落','capillary','福田','电镀、喷涂等配套产业'],
 ['mj','石湾模具群落','capillary','石湾','模具及精密加工相关企业群'],
 ['ddc','电动车配套群落','capillary','石湾','电动车及零部件相关产业'],
 ['lq','镇村老厂群落','legacy','龙溪/园洲/罗阳','五金、塑料、建材等存量企业群'],
 ['bss','百岁山','agri','湖镇','饮用水相关生产主体'],
 ['lfsgy','罗浮山国药','agri','长宁','中医药产业主体'],
 ['sc','柏塘山茶','gi','柏塘','地方特色茶产业'],
 ['xc','福田菜心','gi','福田','地方特色农产品'],
 ['gyg','观音阁花生','gi','观音阁','地方特色农产品'],
 ['gyght','观音阁黑糖','gi','观音阁','地方特色农产品'],
 ['sb','石坝胡须鸡','agri','石坝','地方特色养殖'],
 ['lsmd','罗浮山大米','gi','长宁/横河','地方特色农产品'],
 ['lsz','罗浮山荔枝','gi','罗浮山周边','地方特色水果'],
 ['hh','横河户外小镇','capillary','横河','户外活动和乡村旅游相关节点'],
 ['gz','广州','ext','外部','博罗外部关联城市'],
 ['dg','东莞','ext','外部','博罗外部关联城市'],
 ['sz','深圳','ext','外部','博罗外部关联城市'],
 ['hz','惠州主城','ext','外部','博罗外部关联城市']
 ].map(([id,name,type,town,desc])=>({id,name,type,town,desc,cluster:(type==='ext'?'external':type==='eco'||id==='hh'?'tourism':type==='agri'||type==='gi'?'agriculture':type==='legacy'?'life':'industry')}));
 // A/B/C are the source project's original relationship evidence labels, not independently recertified by this prototype.
 const edges=[
 ['dg','mj','A','供应链','隔东江与东莞石龙相望；模具企业跨界发展'],
 ['dg','ddc','A','供应链','台铃、小刀等电动车产业关联'],
 ['dg','htd','A','供应链','园洲／石湾承接东莞电子产业外溢'],
 ['dg','lq','B','供应链','五金塑料小厂沿边界扩散的推算'],
 ['sz','xwd','A','供应链','欣旺达深圳总部与园洲基地关联'],
 ['sz','jq','A','供应链','深博福田产业园项目关联'],
 ['gz','mj','B','供应链','石湾与增城区位和产业外溢推算'],
 ['mj','ddc','A','供应链','模具零部件产业联系'],
 ['bmc','ddc','B','供应链','喷涂及表面处理配套推断'],
 ['jf','htd','B','供应链','靶材供应联系待进一步核实'],
 ['gj','htd','B','供应链','精密配套关系推算'],
 ['sj','lq','B','供应链','产业技术升级联系推算'],
 ['xwd','mj','B','供应链','电池结构件产业联系推算'],
 ['jq','ddc','B','供应链','新能源与零部件产业关联推算'],
 ['lq','htd','B','供应链','五金配套联系推算'],
 ['dj','bmc','A','环保约束','东江水环境与表面处理行业约束'],
 ['dj','bss','A','环保约束','饮用水水源联系'],
 ['dj','lq','B','环保约束','沿江工业环境约束推断'],
 ['xwd','lq','B','资源竞争','用电／用地等资源竞争推断'],
 ['htd','lq','B','资源竞争','产业升级与厂房腾挪相关联系'],
 ['lswh','lfsgy','A','生态与文旅','文旅与医药产业联系'],
 ['lswh','hh','A','生态与文旅','户外活动联系'],
 ['lswh','sc','B','生态与文旅','茶旅结合推断'],
 ['lswh','lsz','B','生态与文旅','荔枝采摘与文旅联系推断'],
 ['gz','lfsgy','C','生态与文旅','与省级医疗机构合作，待核实'],
 ['hz','lswh','B','生态与文旅','主城文旅客流与行政关联推断'],
 ['dj','lsmd','B','供应链','水系和农业灌溉关联推断'],
 ['gyght','gyg','A','同镇关联','观音阁两种特色产品同镇关系；不代表供应链'],
 ['gyg','dj','B','生态与文旅','东江水系与河滩农业联系推断'],
 ['zw','xwd','A','供应链','铜材料及电池产业关联；原版A级，直接供货未另行核实']
 ].map(([source,target,level,kind,detail],i)=>({id:'e'+i,source,target,level,kind,detail,directed:false,flowValue:null,sourceRef:'network.html#rawEdges'}));
 const towns=[
 ['长宁','罗浮山大门','罗浮山窑鸡 / 酥醪菜','罗浮山、冲虚观、飞云顶','高'],
 ['横河','民宿示范镇','山水豆腐花','显岗水库驿站、花园村','高'],
 ['罗阳','县城中心','客家菜 / 糯米鸡','县城商圈、东江散步','较高'],
 ['园洲','融深产业镇','东江河鲜','深博福田产业园、东江绿道','较高'],
 ['石湾','工业重镇','山坑螺 / 河鲜','东江岸线','较高'],
 ['泰美','生态门户','农家菜','象头山、博罗站','较高'],
 ['柏塘','茶乡','柏塘山茶','茶山徒步、古榄园','较高'],
 ['福田','特色农业','福田菜心','产业园相关内容','中'],
 ['龙华','古村','客家农家菜','旭日古村','中'],
 ['公庄','东部农镇','沙地秋花生','秋季田园','中'],
 ['杨村','水果之乡','皇帝柑','柑橘园','较高'],
 ['观音阁','东江沿岸','花生油','东江画廊','中']
 ].map(([name,tag,food,play,level])=>({name,tag,food,play,level,verification:'pending'}));
 const hot=[
 ['重阳夜罗浮山迎约2万登高游客','文旅','博罗县人民政府','已核验','https://www.boluo.gov.cn/?p=1428'],
 ['博罗2026年国庆文化旅游综述','文旅','博罗县人民政府','已核验','https://www.boluo.gov.cn/bmzb/xwhgdlytyj/zwgk/bmwj/bmwj/content/post_5871691.html'],
 ['柏塘交通道路建设动态','城市','博罗县人民政府','已核验','https://www.boluo.gov.cn/xzgwh/btzrmzf/zwgk/qt/ghjh/content/post_5869554.html'],
 ['园洲精密锌压铸工厂开建报道','产业','新浪财经','待核实','https://finance.sina.com.cn/stock/estate/integration/2026-09-24/doc-inisxhnx5267604.shtml.md']
 ].map(([title,category,source,status,url])=>({title,category,source,status,url}));
 const clusters=[
 {id:'industry',name:'产业制造',en:'INDUSTRY',desc:'企业、配套与产业关系',color:'#48c8ef',pos:[-1.25,0.55,0.05]},
 {id:'life',name:'城镇生活',en:'LIFE',desc:'生产与日常生活交错',color:'#ffbc70',pos:[0.80,-0.05,0.15]},
 {id:'tourism',name:'山水文旅',en:'TOURISM',desc:'生态与文旅联系',color:'#55e3b3',pos:[1.65,0.99,-0.65]},
 {id:'agriculture',name:'农业乡村',en:'AGRICULTURE',desc:'特色农品与乡村底座',color:'#c9e875',pos:[1.35,-1.20,-0.4]},
 {id:'external',name:'外部联系',en:'EXTERNAL',desc:'东莞、深圳、广州等连接',color:'#aa8eff',pos:[-1.70,-1.05,-0.80]}
 ];
 return {nodes,edges,towns,hot,clusters,snapshot:'2026-10-21 07:27',sourceRepo:'https://github.com/zhanglingshare/boluo-simulator',sourceFiles:['network.html','hot.json','life.json','who.html'],stats:{gdp2025:1005.45,industryGrowth2026_1_8:8.9,industrialInvestmentGrowth2026_1_8:-46.7}};
})();
