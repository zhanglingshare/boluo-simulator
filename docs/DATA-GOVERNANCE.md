# 博罗数据资产 · 分层更新与版本规范（DATA GOVERNANCE）

> 配套《统一数据字典》（DATA-DICTIONARY.md）。本文件规定数据如何分层、按什么节奏更新、
> 如何标识版本，以及"模型参数审核门"。目标：**事实、推断、假设三者不混淆，更新可追溯、可回滚。**
> 版本：data-gov/1（2026-10-28）。

---

## 一、数据分层（五类，更新节奏不同）

| 层 | 数据 | 证据等级 | 更新方式 | 存放 |
|---|---|---|---|---|
| **L1 事件层** | 今日话题、新闻 | A/B | 每日采集，标采集时间，滚动 | `hot.json` |
| **L2 生活层** | 镇街吃喝玩乐、农品、人气 | A/B（社交为 B） | 每日采集，人气 ±3，无事件不动 | `life.json` |
| **L3 关系/底座层** | 节点、关系、镇街锚点、流场区间 | A/B | **有新证据才更新**，保留历史版本 | `atlas.json`、network 边 |
| **L4 官方指标层** | GDP、工业、投资、人口 | A | 按**统计发布周期**更新（月度/年度公报） | `model.js` 注释、data.html |
| **L5 模型参数层** | 路径 μ/sd、情景映射 | C.calibrated | **人工审核校准才发版**（审核门） | `model.js`、`params.json` |
| —（私有） | 用户情景、保存的双世界 | C.user | 保存在用户本地，**不覆盖事实** | localStorage / 保存文件 |

**核心纪律**：
- 不能因为 L1 今天抓到一条新闻，就自动改 L5 的模型参数（L1→L5 必须过审核门）。
- L3 关系不因每日刷新而重算布局；L4 指标只在官方发布后更新。
- L5 是"慢变量"，L1/L2 是"快变量"，二者不互相污染。

---

## 二、模型参数审核门（L5 Gate）

已落地的机制（见 `evidence/` 与 `params.json`）：

```
雷达采集事件（evidence/events/*.json，status=pending, parameter_change=null）
        ↓ 人工审核（对照 source_url，区分事实/推断）
   approved：填 parameter_change + review（reviewer 签字）
        ↓
   node tests/release_params.js → 生成 params.json（版本化 + change 记录）
        ↓
   页面读取 params.json（未接入前先人工核对 diff）
```

**门规则**：
1. 事件不自动改参数："签约 XX 亿" ≠ XX 亿年度产值。
2. 只有 `status=approved` 且 `parameter_change` 非空、`reviewer` 签字的事件，才能进 params.json。
3. 多数事件只纳入定性证据（不改 μ）；投产节奏等关键变量保留为 C 级情景。
4. 每个参数版本记录生成时间、事件 ID、原因；可对比、可回滚。
5. 未经审核（pending/rejected）永远不进模型。

---

## 三、数据版本标识（dv）

每个数据文件带可机读的版本字段，深链接（DEEPLINK）用 `dv` 传递数据版本：

| 文件 | 版本字段 | 现值 |
|---|---|---|
| hot.json / life.json | `schema_version` + `updated` | 2 / 2026-10-21 |
| atlas.json | `schema_version` | holo-m2-atlas/1 |
| params.json | `version` | params-2026-10-27-4ev |
| 数据字典 / 治理 | data-dict/1、data-gov/1 | 2026-10-28 |

**版本号规则**：
- 结构（字段）变化 → 升 schema 主版本（/1 → /2）。
- 仅数值刷新 → 只更新 `updated` 时间戳，不升 schema。
- 三版本通过 `dv` 确认彼此基于同一数据快照；不一致时页面提示"数据版本不同"。

---

## 四、数据清单（Manifest）

统一数据资产底座（静态，GitHub Pages 兼容，无付费后端）：

| 资产 | 内容 | 消费者 |
|---|---|---|
| 节点 | 27 个产业/生态/外部节点（id 三版本对齐） | 全息、风洞、沙盘 |
| 镇街锚点 | 16 个（2 街道 14 镇） | 全息 |
| 关系 | A/B 级（实线/虚线/点线） | 全息、风洞 |
| 流场 | B 级区间（通勤等，value=null） | 全息 M3 |
| 事件 | 今日动态（归属不确定保持未定位） | 全息、首页 |
| 情景 | 沙盘 5 情景、M3 双世界（C 级） | 沙盘、全息 |
| 证据台账 | evidence/events、atlas.sources | 风洞、核验 |

**数据缺口（D 级，不编造）**：见 atlas.json `dataGaps`（5 项）与各 `toTighten` 字段；
包括多变量 OD、真实物流/资金流、部分镇街人口与游客口径等。

---

## 五、更新与发布流程

1. **每日**（boluo-intel skill）：只更新 L1/L2（hot.json、life.json），校验后 push，不动 HTML/model.js。
2. **证据驱动**：新核实的关系/流场更新 L3（atlas.json），保留历史，过 validate_json。
3. **官方发布**：新公报更新 L4，标注口径与时期。
4. **审核发版**：L5 参数经审核门 + release_params.js 生成 params.json。
5. **发布/合并**：任何覆盖原版、合并 main、对外发布的操作，必须先取得张凌博士授权。
6. **核验**：上线后用真实浏览器双端验证，截图与数据版本留痕。

---

## 六、红线

- 不杜撰数字/链接；B 级给区间不冒充置信区间；D 级不编造。
- 同镇≠供应链、共现≠因果、事件新增≠活跃度、车辆≠人数、过境≠通勤。
- 模型参数不被每日新闻自动改动；用户假设不覆盖事实。
- 三版本不各自维护事实库，统一围绕本数据资产底座。
