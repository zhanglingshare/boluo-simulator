# 数据字典（M2）

三类数据源：仓库根 `hot.json`（每日话题）、`life.json`（16 镇街生活/农品/广播）、本目录 `data/atlas.json`（M2 全息底座）。兼容层字段见 `boluo-intel` skill 的 `references/schema.md`，本文件只定义 M2 新增的 atlas 与前端模型。

## atlas.json（schema_version = `holo-m2-atlas/1`）

```
schema_version, region, name, generated_at, updated
evidence_legend   A/B/C/D 四级定义
hard_rules[]      硬规则文本（同镇≠供应链 等）
admin             行政区划（2街道14镇=16）
county            县级宏观指标（A 级）
towns[]           16 镇街锚点
crossTransit[]    跨界交通（A 级）
industrialFlying[]  飞地园区（A 级）
flows[]           B 级流场区间（3 条）
dataGaps[]        D 级缺口（5 条）
sources           url_短码 → 真实 URL 映射（31 条）
```

### county 指标（均 A 级，含 value/unit/period/level/source）

| 键 | 含义 |
|---|---|
| `gdp` | 2025 GDP 1005.45 亿、+5.5%（含三次产业 `gdp_industry`） |
| `population_resident` | 2025 末常住 123.94 万、城镇化率 60.19% |
| `population_household` | 户籍人口 |
| `population_served` | 实际服务管理人口 130.69 万（**口径≠常住≠通勤**，带 note） |
| `industrial_output` | 规上工业总产值约 2000 亿 |
| `industrial_enterprises` | 规上工业企业约 1400 家、2026 目标 1700 |
| `electronic_info` | 新一代电子信息 317 家规上、产值 773.8 亿、+17.1% |
| `employment_23rdcensus` | 五经普二三产法人单位 31535、从业 516416 |
| `employment_manufacturing` | 电子设备/电气机械制造业从业 |
| `industrial_park` | 博罗产业园区规上企业 210 家 |

### towns[]（镇街锚点）

| 字段 | 说明 |
|---|---|
| `name` | 16 标准名；`type` 街道/镇 |
| `area_km2` | 面积（缺失则不写） |
| `population` | `{value, household, migrant, level, label}`；无人口时整个对象省略，前端记为 D |
| `pop_level` | 人口证据 A/B/D |
| `role` | 一句话定位 |
| `industries[]` | 已收录产业/特色 |
| `metrics{}` | 该镇具体指标（如园洲项目数、达产产值） |
| `tags[]` | 语义标签 |
| `source` | 一个或多个 url_短码，多个用逗号分隔 |

### crossTransit[]（跨界交通，A 级）

`id, kind, route, hours, stops, connects[], level, period, source`。例：莞惠通 2 路（园洲—东莞石龙）、东莞石龙 2 路、博罗 128 路、广汕高铁罗浮山站、赣深高铁博罗站。

### industrialFlying[]（飞地，A 级）

`id, name, location, land_mu, phase1_mu, buildings, opened, tenants[], model, projects, investment, output_at_capacity, unit, level, source`。深博（福田）产业园在**园洲**，深圳福田区 ≠ 博罗长宁原福田。

### flows[]（B 级流场，核心红线）

| 字段 | 说明 |
|---|---|
| `id` | 形如 `flow_yuanzhou_shiwan_dongguan_commute` |
| `flowType` | commute / business / overnight_rate |
| `origin` / `destination` | 来源/去向（可含多个镇名） |
| `evidenceLevel` | `B` 或 `A_holiday_B_year`（旺季 A、全年 B） |
| `value` | **恒为 null**；只有区间，不给单点真值 |
| `range{low,mid,high,unit,period}` | 区间三值 + 单位 + 适用时期 |
| `directEvidence` | 直接观测到的锚点（如黄金周 25% 过夜率） |
| `method` | 结构系数法 / 就业密度法 / 锚点外推的完整文字 |
| `formula` | 可复算的公式（如 `就业基数24万 × 跨界通勤系数2%/4%/7%`） |
| `scenarios` | 低/中/高情景参数 |
| `caveats` | 口径纪律（车辆≠人数、跨界≠工作、假日≠全年等） |
| `toTighten` | 要收紧区间还需什么数据 |
| `sources[]` | **≥2 个独立来源** url_短码（转载不算独立） |

三条流场：
1. 园洲+石湾 → 东莞 跨界通勤：4500/10000/17000 人次·工作日（双向合计）。
2. 深圳福田 → 园洲 飞地商务技术流：50/250/500 人次/日。
3. 罗浮山全年过夜率：10%/15%/20%（黄金周 25% 为 A 级旺季峰值）。

### dataGaps[]（D 级，5 条）

`{id, missing, level:'D', need, blocks}`：缺什么、需要什么数据才能收紧、卡住哪条流场。涵盖跨界 OD、飞地实际用工、罗浮山分月数据、9 镇人口面积、物流/资金 OD（后者在取得前不画流量线）。

## 前端模型（buildModel 产物）

### Node（节点）

数据层 `D.nodes` 字段：`id, name, type, cluster, town, desc, major`。
- `type`：eco 生态水系 / anchor 链主 / champ 冠军 / capillary 配套 / legacy 镇村老厂 / agri 农业 / gi 地理标志 / ext 外部城市。
- `cluster`：industry/life/tourism/agriculture/external。
- `town`：可能是 `"园洲"`、`"园洲/石湾"`、`"福田"`（引擎归一）等，渲染前必须经 `nodeTowns()`。
- 锚点（`buildAnchors` 产物）额外含 `area, population, popLevel, popLabel, role, industries, metrics, foods, plays, hot, rich`。

### Edge（关系）

`D.edges`：`{id, source, target, level(A/B/C), kind, detail, directed, flowValue, sourceRef}`。
- `flowValue` 恒为空（关系不携带流量）。
- 同源目标 + 关系唯一；`source/target` 必须命中节点（测试强制）。

### CrossLayerLink（跨层关联）

`{fromId, toId, linkType, evidenceLevel, sourceRefs, timeScope}`，linkType 见 ARCHITECTURE 表。

### Observation（观测）

`{metric, value, unit, period, geography, source, verificationStatus}`，对应 county 与各 town metrics。

### Flow（流量）

即 atlas `flows`，只有区间无定值；情景选择不修改 `value`。

### Scenario（情景）

`{variable, assumptionRange, assumptionSource, dependencies, version}`；前端 C 级假设只写在用户会话，不回写 JSON，不覆盖 A 级事实。

## 证据与来源

- `sources` 是 `url_短码 → URL` 映射；atlas 中任何 `source` 字段都引用短码，不直接散落 URL。
- `check_atlas()`（`boluo-intel/scripts/validate_json.py`）校验：16 镇街、flow 的 low≤mid≤high 且 value=null、方法公式齐全、≥2 来源、等级合法。
