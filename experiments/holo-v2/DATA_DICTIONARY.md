# DATA_DICTIONARY · 博罗 V2 数据字典

> 五类核心模型：**Node（节点）/ Edge（关系）/ Observation（观测值）/ Flow（流量）/ Scenario（探索情景）**。
> 所有渲染与计算都从这五类模型派生；新增数据必须符合字段规范并通过 `validateDataset()`。

## 一、Node 节点（`src/data/nodes.js`，共 27）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string，唯一 | 节点标识，如 `xwd` |
| `name` | string | 显示名，如「欣旺达/锂威」 |
| `type` | enum | 主体类型（见 TYPE_META，8 类），决定颜色与基础半径 |
| `group` | enum | 所属星群：`industry` / `living` / `tourism` / `agri` / `external` |
| `town` | string | 关联镇街或「外部」/「多镇」 |
| `state` | enum | `green`（正常）/ `yellow`（待核实，配合 `needsReview`） |
| `cluster` | boolean | 是否为聚合节点（一类主体集合，非单一企业），渲染虚线外环 |
| `layer` | string | 产业链层级标签（链主 / 小巨人 / 毛细血管 / 老厂基盘 / 生态底座 / 国家地理标志 / 外部 …） |
| `description` | string | 一句话描述（口径沿用 network.html） |
| `needsReview` | boolean? | 为 true 时描警示环、信息卡标注「指标待核实」 |
| `sources` | string[] | 来源（M1 均为 `network.html`） |

### type 枚举（`TYPE_META`）

| type | 标签 | 颜色 | 基础半径 |
|---|---|---|---|
| eco | 生态底座 | 天蓝 0x38bdf8 | 1.75 |
| anchor | 链主企业 | 绿 0x34d399 | 1.45 |
| champ | 小巨人（聚合） | 青 0x22d3ee | 1.28 |
| capillary | 产业群落（聚合） | 蓝灰 0x8aa0bd | 1.08 |
| legacy | 老厂基盘（聚合） | 橙 0xfbb247 | 1.32 |
| agri | 农业康养 | 黄绿 0xa3e635 | 0.92 |
| gi | 国家地理标志 | 黄 0xfbbf24 | 0.82 |
| ext | 外部城市 | 淡紫 0xc4b5fd | 1.18 |

> 节点渲染半径 = `TYPE_META.r × 0.72 × (1 + min(度,8) × 0.05)`，连接越多略大；这是**可查看的映射规则**，不是随意大小。
> 聚合节点（`cluster:true`）：`champ / capillary / legacy`。

## 二、Edge 关系（`src/data/edges.js`，共 30）

| 字段 | 类型 | 说明 |
|---|---|---|
| `source` / `target` | string | 端点节点 id（必须存在） |
| `relationType` | enum | `供应链` / `环保约束` / `资源竞争` / `生态补偿` |
| `direction` | enum | M1 恒为 `undirected`（无已验证流向） |
| `evidenceLevel` | enum | `A` / `B` / `C`（见下） |
| `weight` | number 1..5 | **结构权重 / 证据强度**，`weightType` 已标明，非流量 |
| `weightType` | enum | M1 恒为 `structural` |
| `description` | string | 关系内容 |
| `sourceRefs` | string[] | 来源 |
| `timeScope` | string | 资料时期（如「2026年公开资料」） |

判重规则：同一对端点允许存在**不同** `relationType`（如 `htd–lq` 同时有「供应链」与「资源竞争」），仅当关系类型也相同才判重。判重 key = `排序端点对 # relationType`。

### 证据等级（`LEVEL_META`，四级数据体系）

| 等级 | 含义 | 线型 | 不透明度 |
|---|---|---|---|
| A | 直接观测 · 公开硬数据（统计公报/工商/政府公开材料） | solid | 0.92 |
| B | 交叉推断 · 合理假设（行业代码、投入产出、公开资料推断） | solid | 0.32 |
| C | 待核实 · 弱证据（仅方向线索） | dashed | 0.55 |
| D | 未知 · 暂无数据 | none | 0（空心/未完成，不以光效补齐） |

### 三种线语义（`LINE_SEMANTICS`，严禁混用）

- `relation` 关系线：仅表达存在联系，无方向、无数量 —— **M1 的 30 条全部是它**。
- `flowDir` 流向线：有方向证据（静态方向标识）—— M2 起。
- `flowVol` 流量线：有数量口径（线宽 / 脉冲映射规模）—— M3 起。

## 三、Observation 观测值（`src/data/observations.js`，共 11 条，全部 A 级）

| 字段 | 类型 | 说明 |
|---|---|---|
| `metric` | string | 指标名 |
| `value` | number/string/null | 总量值；同比类指标为 `null`，用 `yoy` |
| `yoy` | number/null | 同比增速（%） |
| `unit` | string | 单位（亿元 / 万人 / 同比% …） |
| `period` | string | 统计期（如「2025年」「2026年1-8月」） |
| `geography` | string | 空间口径（M1 均为「博罗县」） |
| `verificationStatus` | enum | 核验等级（`A`） |
| `source` | string | 来源名称 |
| `url` | string/null | 可追溯链接（月度简析暂无公开 URL 时为 null） |
| `note` | string? | 口径提示（如「县级口径，禁止下分到镇」） |

关键口径：**工业投资 2026 年 1-8 月同比 −46.7% 为县级指标**，无镇级数据时禁止下分到园洲/石湾等镇（有测试拦截）。

## 四、Flow 流量（`src/data/flows.js`，**当前为空数组**）

| 字段 | 类型 | 说明 |
|---|---|---|
| `origin` / `destination` | string | 端点节点 id |
| `flowType` | enum | `people` / `tourist` / `freight` / `capital` / `info` |
| `value` | number | 数值（与 `range` 二选一） |
| `range` | `{low, high}` | 带约束的估计区间 |
| `unit` | string | 单位（人/日、吨/年、亿元/年…） |
| `timeWindow` | string | 统计时段 |
| `method` | string | 推断方法与约束（区间分析 / 网络流约束 / 贝叶斯） |
| `evidenceLevel` | enum | A/B/C |
| `sourceRefs` | string[] | 来源 |
| `isHypothesis` | boolean | true=用户探索假设，非事实 |

> `FLOWS=[]` 是有意为之：没有可核验的镇际/跨界人员、货物、资金矩阵时，不生成默认的"真实"流向，不用关系权重 w 换算人数。

## 五、Scenario 探索情景（`src/data/scenarios.js`，M1 仅元数据桩）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 变量 id（如 `yuanzhou_dongguan_crossflow`） |
| `label` | string | 变量名 |
| `unit` | string | 单位（M1 为「无量纲强度指数（演示）」） |
| `nodePair` | [id, id] | 相关主体对 |
| `groupsAffected` | string[] | 受影响星群 |
| `dimension` | string | `dimensionless`（M1 演示）/ 未来真实维度 |
| `range` | `{low,mid,high}` | **M1 全为 null**，不预设数值 |
| `assumptionSource` | string | 区间依据（待 M2 取证） |
| `dependencies` | string[] | 依赖变量 |
| `version` / `status` | string | 版本与状态（`v0.1-stub` / `stub`） |
| `note` | string | 说明 |

## 六、场景状态与节点显示态（`src/state/store.js`）

状态字段：`view`(overview/industry)、`selectedNode`、`selectedEdge`、`townFocus`、`layer`、`levelFilter`(A/B/C)、`quality`、`search`、`labels`。

`computeDisplay()` 把每个节点/边派生为：`active` / `focus` / `normal` / `dim` / `hidden`（定义见 ARCHITECTURE.md 第五节）。

观察层与星群映射 `LAYER_GROUPS`：

| layer | 包含星群 |
|---|---|
| all | 全部五群 |
| industry | industry + external |
| living | living + tourism + agri |
| external | external + industry |

## 七、数据自检（`validateDataset()`）

启动与测试时运行，校验：节点 id 唯一、type/group 合法、边端点存在、等级/关系类型合法、weight 1..5、**weightType 必须 structural、direction 必须 undirected**、Flow 端点与数值方法齐全、孤立节点作为 warning 如实列出。当前结果：`ok:true`，0 error，仅 warning「孤立节点 xc、sb」。
