# 架构说明（M2）

单文件、零依赖、原生 WebGL2。所有逻辑在 `index.html` 的三个 `<script>` 中，分层清晰、数据/计算/渲染分离。

## 分层

```
┌────────────────────────────────────────────────────────┐
│ script #0  数据层 BOLUO_DATA（内联兜底）                 │
│  27 产业节点 + 30 关系边（A/B/C）、5 簇、出厂 life/hot、  │
│  snapshot 时间戳。仅作 fetch 失败时的兜底，不充当最新数据。│
├────────────────────────────────────────────────────────┤
│ script #1  引擎层 BOLUO_ENGINE（纯函数，可在 node 测试）  │
│  16 镇街归一 / 事件归属 / buildAnchors / buildModel /     │
│  townView / compute / diffSnapshots / 区间计算。不碰 DOM。│
├────────────────────────────────────────────────────────┤
│ script #2  渲染 + 交互层（app）                          │
│  WebGL2 星群、标签 DOM、相机、左栏 / 右栏 inspector /     │
│  手机抽屉、fetch 数据、状态机、四模式切换。                │
└────────────────────────────────────────────────────────┘
          ▲ 运行时权威数据（fetch，失败回退内联）
  hot.json（仓库根） · life.json（仓库根） · data/atlas.json
```

## 动态数据装配

```
loadData():
  Promise.allSettled([ fetch('../../hot.json'),
                       fetch('../../life.json'),
                       fetch('data/atlas.json') ])
   → 成功则归一化（normalizeHot / normalizeLife），失败用内联
   → buildModel(life, hot, atlas) 重建模型
   → navigationUI() 重渲染；右上角 dataSource = live / 出厂快照
```

- 数据更新后**只需重新加载页面**，不重新随机布局；布局由确定性 `rand(id, layer)` 生成，同 id 同位。
- 首屏用内联快照立即渲染（避免白屏），fetch 回来后无缝替换。

## 16 镇街与归一

`TOWN_16`（罗阳、龙溪、石坝、麻陂、观音阁、公庄、杨村、杨侨、柏塘、湖镇、长宁、石湾、园洲、龙华、泰美、横河）。

- `TOWN_NORMALIZE`：原"福田" → "长宁"（2025-02 合并）。
- `TOWN_ALIASES`：长宁含"福田菜心/福田镇"；龙华只认"龙华镇/旭日古村"，避开深圳龙华；园洲含"深博福田产业园"（深圳福田区的飞地，地名在园洲，不并入长宁）。
- `nodeTowns()` / `classifyEvent()` 归一化后再归属，保证"飞地不被误归长宁""深圳龙华不算博罗"。

## 模型对象

`buildModel(life, hot, atlas)` 返回：

```
anchors[16]          镇街锚点（人口/面积/产业/角色/等级，含 life 美食玩法与事件）
anchorMap / nodeMap  id → 实体索引
dataNodes[]          27 产业节点 + 16 锚点（渲染节点全集）
crossLinks[]         跨层关联（located_in / has_feature / mentioned_in / industry / external）
events[] / eventsByTown / landmarkEvents / unlocated
industriesByTown
flows[]              B 级流场（来自 atlas）
crossTransit[]/flying[]/dataGaps[]/county
```

### 跨层关联 linkType

| 类型 | 含义 | 线型 |
|---|---|---|
| `located_in` | 产业主体属于某镇 | 青色实线 |
| `has_feature` | 镇拥有美食/玩法/特色 | 橙色点线 |
| `mentioned_in` | 事件提及某镇 | 黄色点线 |
| `industry_relation` | 产业关系，沿用原版 A/B/C | 按 A/B/C 配色 |
| `external_relation` | 有依据的对外联系 | 紫色 |

"同镇"与"同一条新闻提到"只产生 located_in / mentioned_in，**不升级**为产业交易或人员流动。

## 镇视图与相机

`townView(town, layer, model)` 产出该锚点为中心的局部布局（确定性）：

- 产业主体在上半环，生活特色在右环，事件在上部，外部城市在右远端。
- 相机 `aim=[x,y,z,distance]`，每帧 lerp 平滑过渡；进镇、跨镇、选外部都改 aim，不重新随机。
- 层切换（产业/生活/事件）只改各层透明度与标签，不黑场、不跳页。
- 面包屑 `S.path[]` 记录探索路径，支持逐级回溯；返回时相机连续。

## 计算与不确定性

- `compute(u, grade, model)`：边权 = A 级恒为 1，B 级 `0.12+u*0.85`，C 级 `0.035+u*0.22`；u 为假设强度（0–1）。输出总权重、加权路径、边数等。**同 u 同结果，改 u 必变**（测试覆盖）。
- 流场为 B 级区间（low/mid/high），value 恒为 null；情景选择只改展示与无量纲实验，不产生"每天 X 万人"的伪精确结论。
- 关系边无 `flowValue`；真实/区间流量只存在于 `flows`，且在"流动观察"模式单独呈现。

## 探索状态机

```
S = { mode, focusCluster, focusTown, layer, selected, grade,
      uncertainty, path[], activeFlow, flowScenario,
      snapshotDiff, dataSource, aim, mobileOpen }
```

四模式：`universe`（全景星群）/ `relations`（关系追踪）/ `flows`（流动观察）/ `scenario`（未知实验）。所有导航操作改 S → `navigationUI()` → 左栏 + 右栏 + 3D 同步。

## 渲染

- 主 Canvas 用自写 WebGL2（点、线、辉光），标签用 DOM 层；WebGL2 不可用时回退 2D 关系图。
- 移动端：左栏压成顶部紧凑层切换，详情收进底部抽屉（`mobile-open`），单指旋转/选择、双指缩放，提供低画质。
- 粒子/呼吸仅用于已表达的视觉层级；不使用与数据无关的粒子雨。

## 可扩展性

新增镇街事实 → 改 `atlas.json` / `life.json`；新增产业主体 → 数据层节点 + 边（带 level/sourceRef）；新增流场 → atlas `flows`（需方法/公式/≥2 来源/区间）。M3 双世界、拓扑重组的参数位已在 `flows` 与 `compute` 预留，但本阶段不实现。
