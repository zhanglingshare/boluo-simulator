# 证据台账（M2）

所有数字来自 `data/atlas.json`，每条带证据等级与来源短码；完整 URL 见文末（与 atlas `sources` 一一对应）。

## A 级 · 直接观测（官方/可核验）

### 县级宏观（2025 公报口径）

| 指标 | 值 | 时期 | 来源 |
|---|---|---|---|
| GDP | 1005.45 亿元，+5.5% | 2025 | url_2025bulletin |
| 三次产业 | 一产 107.44 / 二产 549.01 / 三产 349 亿 | 2025 | url_2025bulletin |
| 常住人口 | 123.94 万，城镇化率 60.19% | 2025 末 | url_2025bulletin |
| 户籍人口 | 99.19 万 | 2025 末 | url_2025bulletin |
| 实际服务管理人口 | 130.69 万（**口径≠常住≠通勤**） | 2024 | url_spatialreview |
| 规上工业总产值 | 约 2000 亿（十四五年均 +10.2%） | 2025 | url_govreport2026 |
| 规上工业企业 | 约 1400 家，2026 目标 1700 家/2200 亿 | 2025–2026 | url_qcmeeting |
| 新一代电子信息 | 317 家规上、产值 773.8 亿、+17.1% | 2025 | url_electronic |
| 五经普二三产法人单位 | 31535 个、从业 516416 人 | 2023 末 | url_census2 |
| 博罗产业园区规上企业 | 210 家 | 2024 | url_govreport2025 |

### 镇街（已取得，其余见 D 级缺口）

| 镇街 | 常住 | 面积 | 来源 |
|---|---|---|---|
| 园洲 | 20 万+（户籍 7 万+/外来 13 万+） | 112.71 km² | url_yuanzhou |
| 石湾 | 近 19 万 | 83 km² | url_shiwan / url_shiwan2026 |
| 龙溪 | 约 15 万 | 119 km² | url_longxi |
| 长宁（含原福田） | 约 10.8 万 | 323.74 km² | url_changning |
| 横河 | 1.8 万 | 240 km² | url_henghe |
| 泰美 | 4.14 万 | 163.4 km² | url_taimei |
| 柏塘 | 七普 4.86 万（B 级） | — | url_census_pop |

### 跨界交通（A 级）

- 莞惠通 2 路：园洲汽车站—东莞石龙客运中心，06:00–18:00，约 25 站（url_bus_guanhuizhi2）。
- 东莞石龙 2 路：到园洲换乘站，06:40–22:00（url_bus_shilong2）。
- 博罗 128 路：2024 年截短后不再进入东莞（url_bus_128，视频佐证，标 B 级旁证）。
- 广汕高铁罗浮山站（长宁，2023-09 通车，url_luofushanstation）；赣深高铁博罗站（泰美）。

### 飞地（A 级，注意地名）

深博（福田）产业园在**园洲**博罗智能装备产业园（深圳福田区 ≠ 博罗长宁原福田）：300 亩、首期 102 亩、22 栋 4 层厂房；2026 全面开园首批 5 家企业；累计落户 25 宗、约 54 亿、达产超 100 亿。来源 url_feidi / url_feidiopen / url_wutong。

### 文旅（A 级旺季锚点）

- 2025 国庆 8 天罗浮山引领区接待近 80 万人次、过夜 20.07 万（约 25.1%）。
- 2026 国庆约 91 万人次、过夜约 23 万（约 25.3%）。
- 注意：引领区跨龙门与博罗，**不能整体记到博罗**；黄金周 ≠ 全年（url_tourism2025 / url_tourism2026）。

## B 级 · 交叉推断（区间，非统计值）

三条流场，方法与公式固化在 atlas `flows` 与 `boluo-intel/references/flows.md`：

1. **园洲+石湾 → 东莞 跨界通勤**：4500 / 10000 / 17000 人次·工作日（双向合计）。
   - 结构系数法：两镇就业基数约 24 万（园洲 20 万、石湾 19 万 × 劳动参与/就业系数），本地属"承接产业外溢、外来务工就近住厂"而非睡城，跨界通勤系数取低 2% / 中 4% / 高 7%。
   - 纪律：车辆≠人数、过境≠通勤、跨界出行≠工作、工作日口径。
2. **深圳福田 → 园洲 飞地商务技术流**：50 / 250 / 500 人次/日。
   - 就业密度法：100 亿达产按电子/装备 8–15 人/亿 → 就业 8000–15000；总部派驻 3–8%（240–1200）；日通勤/班车占 20–40%。
3. **罗浮山全年过夜率**：10% / 15% / 20%（黄金周约 25% 为 A 级旺季峰值）。
   - 锚点外推：平日以一日游/周边游为主，全年显著低于黄金周。

每条区间均 `value=null`，标注适用时期与 caveats，且 ≥2 独立来源；**不冒充统计置信区间**。

## D 级 · 未知（dataGaps，不编造）

| 缺口 | 收紧需要 |
|---|---|
| g1 园洲/石湾—东莞工作日实际通勤人数与目的分布 | 桥/路断面客流、公交 OD、匿名聚合通勤 |
| g2 飞地实际在岗与深圳派驻人数 | 园区/企业用工、班车班次 |
| g3 罗浮山分月/全年游客与过夜量 | 景区与文旅部门口径 |
| g4 罗阳、石坝、麻陂、观音阁、公庄、杨村、杨侨、湖镇、龙华人口与面积 | 各镇概况页/七普分镇数据 |
| g5 真实物流量、资金流量 OD | 货运、海关、供应链或税务口径；取得前不画流量线 |

## 来源清单（31 条短码 → URL）

```
url_2025bulletin   http://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjfx/content/post_5801531.html
url_2024bulletin   https://www.boluo.gov.cn/bmzb/xtjj/tjyj/tjsj/content/post_5557633.html
url_spatialreview  https://www.boluo.gov.cn/attachment/0/340/340023/5732840.pdf
url_govreport2026  http://www.boluo.gov.cn/zwgk/zfgzbg/content/post_5717382.html
url_govreport2025  https://www.boluo.gov.cn/zwgk/zfgzbg/content/post_5473617.html
url_qcmeeting      https://www.boluo.gov.cn/bmzb/xkjgyhxxhj/zsyz/content/post_5722319.html
url_electronic     https://www.boluo.gov.cn/xzygdw/xgbdst/blxw/content/post_5768459.html
url_census2        https://www.boluo.gov.cn/hzbltjj/attachment/0/312/312365/5570151.pdf
url_census3        https://www.boluo.gov.cn/hzbltjj/attachment/0/312/312366/5570151.pdf
url_census_pop     http://www.boluo.gov.cn/bmzb/xtjj/zwgk/bmwj/tzgg/content/post_4303699.html
url_yuanzhou       https://www.boluo.gov.cn/xzgwh/yzzrmzf/yzgk/content/post_5828241.html
url_yuanzhou2026   https://www.boluo.gov.cn/xzgwh/yzzrmzf/zwgk/qt/ghjh/content/post_5737313.html
url_shiwan         https://www.boluo.gov.cn/xzgwh/swzrmzf/index.html
url_shiwanbig      https://epaper.nfnews.com/m/ipaper/nfrb/html/202512/16/content_10156733.html
url_shiwan2026     https://www.boluo.gov.cn/xzgwh/swzrmzf/zwgk/qt/ghjh/content/post_5832923.html
url_longxi         https://www.boluo.gov.cn/xzgwh/lxjdbsc/lxgk/content/post_5828173.html
url_longxisan      https://www.nfnews.com/content/voDDxbEOow.html
url_longxipark     https://www.huizhou.gov.cn/zwgk/hzsz/xqyw/content/mpost_5478797.html
url_changning      https://www.boluo.gov.cn/xzgwh/cnzrmzf/cngk/content/post_5722658.html
url_henghe         https://www.boluo.gov.cn/xzgwh/hhzrmzf/hhgk/content/post_5828474.html
url_taimei         https://www.boluo.gov.cn/xzgwh/tmzrmzf/tmgk/content/post_5647951.html
url_feidi          https://www.boluo.gov.cn/gkmlpt/content/5/5534/mpost_5534366.html
url_feidiopen      http://www.gd.gov.cn/gdywdt/dsdt/content/mpost_4917839.html
url_wutong         https://www.nfnews.com/content/J3WY1A1Doz.html
url_bus_guanhuizhi2 http://hzjtfw.com/pcweb/query_bus_stop.spg?szbid=712EFD5CCDA94C18B263644567C01E1C
url_bus_shilong2   http://gd.xumap.com/dgbus/gnfma/
url_bus_128        http://www.bilibili.com/video/BV1unHuzjETx
url_luofushanstation https://m.thepaper.cn/newsDetail_forward_24903776
url_bus_guide      http://www.boluo.gov.cn/zwfws/zdfw/ggsy/ggjt/content/post_5105733.html
url_tourism2025    https://www.huizhou.gov.cn/zjhz/yjcs/lysd/content/mpost_5622482.html
url_tourism2026    https://www.huizhou.gov.cn/zwgk/hzsz/zwyw/content/post_5865139.html
```

## 核验说明

- 多篇转载同一来源**不计**为独立交叉验证；流场的 ≥2 来源要求为不同机构/不同口径。
- 产业关系（27 节点/30 边）来自原版 `network.html` 的 A/B/C 标记，本原型**沿用**该标记，不等于已在 M2 重新独立核验；相关文案已在界面注明。
- 新公开资料出现后，由 `boluo-intel` 月度/季度更新慢本体与 atlas，保留版本记录，可收紧或推翻区间。
