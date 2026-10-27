# ARCHITECTURE · 博罗 V2 全息数据宇宙（M1）

> 《看见博罗 V2｜县域全息关系与流动图谱》技术架构。
> 产品定位：把产业、城镇功能、生活活动、文旅农业与外部联系，组织成由**节点、关系、流动、状态、时间**构成的可探索全息数据空间。
> M1 只交付"园洲产业星群"样板，并为 M2（真实数据）、M3（区间实验 + 双世界）预留接口。

## 一、技术选型与理由

| 项 | 选择 | 理由 |
|---|---|---|
| 模块规范 | **原生 ES Modules**（浏览器原生 import） | 与原仓库"纯静态、无后端、GitHub Pages 直托管、离线可开"的形态一致；源码即所见，便于总架构师逐文件审计，无需读构建产物 |
| 3D 引擎 | **three.js r128 本地 UMD**（`vendor/three.min.js`，约 603 KB，全局 `THREE`） | 锁定版本、零网络依赖、无 CDN 失效风险；UMD 用 `<script>` 先行注入，业务代码仍走 ESM |
| 构建链 | **无**（不打包、不 npm install 三方可运行包） | 双击 / 任意静态服务器即可运行；不存在"装饰动画被编译进黑盒"的问题 |
| 布局 | 手写确定性 3D 力导向（固定种子） | 通用 d3-force 无法保证"跨群边不拉散星群、同主体位置跨次稳定"，故自研两阶段布局 |
| 单测 | Node 内置 `node:test` | 无需引入测试框架；数据层/计算层是纯 JS，可在 Node 直接断言 |
| 浏览器测试 | 预装 Playwright + Chromium（SwiftShader） | 双端真实加载、真实交互、截图与控制台错误采集（`scripts/screenshot.mjs`） |

**运行期不依赖任何网络资源**：three 已本地化，数据全部内联在 `src/data/`。

### 何时迁移到 Vite + TypeScript
当前刻意保持零构建。当 M2/M3 出现以下信号时再迁移，且**数据模型与计算层可原样搬移**（它们与渲染解耦）：
- 模块数量显著增长、需要依赖预打包与 tree-shaking；
- 需要类型约束多人协作；
- 需要路由 / 代码分割承载"沿联系进入外部城市"的更深层场景。
迁移路径：`src/data` 与 `src/core` 为纯逻辑、无 DOM/THREE 依赖（`scene` 层仅以全局 THREE 引用），可直接改为 `.ts` 并在 Vite 中 `import * as THREE`。

## 二、六层架构

```
数据层 src/data      Node / Edge / Observation / Flow / Scenario + 视觉语义元数据 + 自检
        ↓
证据与不确定性层      数据字段中的 evidenceLevel(A/B/C/D) + core/uncertainty.js（纯函数，M2/M3 内核）
        ↓
关系计算层 src/core   graph（邻接/路径/邻居）、layout（确定性两阶段布局）、prng（固定种子）
        ↓
场景状态层 src/state  store（视图/选择/层/等级/画质）+ computeDisplay（节点边四态派生）
        ↓
全息渲染层 src/scene  atlas（渲染器/雾/星点/插值/拾取）、nodes、edges、camera、textures
        ↓
用户交互层 src/ui     interaction（射线拾取/触控）、controls（搜索/控制条/图例）、panel（浮卡/抽屉）、fallback（2D）
```

数据、计算、渲染、状态严格分离：**没有把数据、公式、动画塞进一个巨型 HTML**。任何结构变化都由数据 + 场景状态驱动。

## 三、目录结构

```
experiments/holo-v2/
├─ index.html                 # 单页骨架：#app(3D)、#fallback-wrap(2D)、各 UI 插槽
├─ styles.css                 # 深色毛玻璃 UI；桌面右侧浮卡 / ≤760px 底部抽屉
├─ package.json               # ESM；test / serve 脚本
├─ vendor/three.min.js        # three r128 UMD（本地，全局 THREE）
├─ src/
│  ├─ main.js                 # 装配 + 数据自检 + WebGL 探测 + 高/低画质 + 3D/2D 启动
│  ├─ data/                   # 数据层（事实来源，数字只在这里）
│  │  ├─ meta.js              # 类型/星群/证据等级/关系类型/三种线语义
│  │  ├─ nodes.js             # 27 节点 + YUANZHOU_FOCUS
│  │  ├─ edges.js             # 30 关系（全部 structural/undirected）
│  │  ├─ observations.js      # 11 条 A 级县级观测（含统计期、口径、URL）
│  │  ├─ flows.js             # FLOWS=[]（有意为空，M2 起）
│  │  ├─ scenarios.js         # 未知变量元数据 + 演示参数域（range 全 null）
│  │  └─ index.js             # 门面 + validateDataset() + degrees()
│  ├─ core/                   # 计算层（纯 JS，无 DOM/THREE，可 Node 测试）
│  │  ├─ prng.js              # mulberry32 / randInBall
│  │  ├─ graph.js             # 邻接、度、等级过滤、最短路径、邻居、分群取点
│  │  ├─ layout.js            # 两阶段社区保持布局 + 位置插值
│  │  └─ uncertainty.js       # edgeStrength / runFlowExperiment / compareWorlds
│  ├─ scene/                  # 渲染层（依赖全局 THREE）
│  │  ├─ textures.js          # 辉光 / 节点标签 / 群标签贴图（canvas 生成）
│  │  ├─ nodes.js             # 节点（核心球+辉光+环+警示+标签），四态高亮
│  │  ├─ edges.js             # A/B 光带（圆柱）、C 虚线，跟随端点
│  │  ├─ camera.js            # 轨道相机：鼠标 + 触摸 + 平滑镜头 + 桌面/竖屏双 pose
│  │  └─ atlas.js             # 场景总管：渲染循环、morph、拾取、画质、resize、星点
│  ├─ state/store.js          # 状态 + 发布订阅 + computeDisplay 显示派生
│  └─ ui/
│     ├─ interaction.js       # tap 判定、射线拾取节点/边、桌面 hover
│     ├─ controls.js          # 顶栏搜索、底部控制条、图例
│     ├─ panel.js             # 节点/边/镇/引导四态浮卡（桌面）与抽屉（手机）
│     └─ fallback.js          # WebGL 失败时的 2D 俯视关系图（可点选/搜索）
├─ tests/holo.test.js         # node:test 23 项
├─ scripts/screenshot.mjs     # 双端 12 张真实截图 + 控制台错误
└─ screenshots/               # 12 张实测截图（非 AI 效果图）
```

## 四、两阶段社区保持布局（核心算法，已验证稳定）

单体力导向（所有节点 + 全部边一起求解）会让高连接群被**跨群边**拉散、小群（生活 2 节点、外部 4 节点）被高度连接节点（东江水系连 4 群、东莞连 4 产业）拖离锚点，且参数反直觉、不稳定。**该路线已弃用，勿回退。**

最终方案（`layout.js`）：

1. **簇内独立力导向 `clusterLayout(group, mode, seed)`**：每个星群只含本群节点 + 群内边，锁原点：
   - 节点斥力、群内弹簧、径向力（使簇充满目标半径）、硬碰撞（节点不重叠）；
   - 每群种子 = `LAYOUT_SEED + groupIndex*137`，产业展开态用独立 seed；
   - 固定 700 次迭代 → **结果确定性**。
2. **整体平移 `solve(mode, seed)`**：把各簇局部坐标整体搬到全局锚点；
   - **跨群边完全不参与节点布局**，只在渲染时连接两个已定好的位置。

由此得到：全景五群紧凑分离（产业居中、四群环绕，最小锚点间距 15）；产业展开时簇半径放大到约 9；同一主体在 overview / industry 两套坐标间由 `morph` 平滑插值，跨次进入位置稳定。

`morph`（0=全景团、1=产业展开）在渲染循环中缓动，节点位置、节点标签透明度、群标签透明度都由它驱动——**进入/展开是真实的布局插值，不是预制动画。**

## 五、场景状态与显示派生

状态（`store.js`）：`view(overview|industry)`、`selectedNode`、`selectedEdge`、`townFocus`、`layer`、`levelFilter(A|B|C)`、`quality`、`labels`。

每个节点/边在每帧被派生为五态之一：

| 态 | 触发 | 表现 |
|---|---|---|
| active | 选中节点本身 + 一度邻居 / 选中边两端 | 高亮、标签清晰 |
| focus | 引导态（进产业未选具体节点）的园洲链主 | 轻高亮、不呼吸、标签清晰 |
| normal | 常规可见 | 正常辉光，标签随 morph 淡入 |
| dim | 非当前关注的背景主体 | 降亮、标签近隐藏 |
| hidden | 不在当前观察层 / 被等级过滤 | 不显示 |

引导态：进入产业后先展示**完整产业簇**（园洲链主轻聚焦），而不是把非园洲节点全压黑；选中具体节点后才按一度邻居高亮。

## 六、相机（桌面 / 竖屏双 pose）

- 球坐标（target, radius, theta, phi）+ 平滑 `flyTo`（缓动，单位秒）；
- 桌面：鼠标左键旋转、右键平移、滚轮缩放；
- 手机：单指旋转、双指捏合缩放 + 平移；
- **按 `camera.aspect` 自动选 pose**：`aspect < 0.75` 判为竖屏，使用 `MOBILE_POSES`——全景拉远到 radius 94 完整容纳五群、产业 radius 55、聚焦节点 radius 27，且注视点下移让内容落在底部抽屉上方；桌面用 `DESKTOP_POSES`（全景 42、产业 28、聚焦 10）；
- 修复记录：曾存在"dt 按秒、duration 按毫秒"的单位错配，导致镜头动画几乎不动（靠布局 morph 掩盖），已统一为秒。

## 七、视觉语义（数据语法，严格遵守）

- **节点**：8 类主体各有颜色与基础半径（`TYPE_META`）；聚合节点（小巨人 / 群落 / 老厂）加虚线外环；待核实（needsReview）加警示环。
- **星群**：5 色语义分组，是导航聚类而非行政区。
- **证据等级**：A 实线高亮、B 实线低透明、C 虚线、D 不显示（空心 / 未知）。
- **三种线严禁混用**：关系线（M1 全部，无方向无数量）/ 流向线（M2）/ 流量线（M3）。
- 全景只醒目标群名（节点标签因子 0.12），展开后节点名才清晰（因子 1.0）——**全景看群、展开看节点**。
- 一屏只有一个视觉主角：全景是产业地貌（星群），选中后是该节点与一度联系。

## 八、M2 / M3 预留接口（M1 不实现 UI）

- `data/flows.js`：Flow 字段规范已定义，数组有意为空，杜绝把关系权重 w 当流量。
- `data/scenarios.js`：未知变量（园洲—东莞跨界活动强度）元数据已建，`range` 全为 `null`，不预设数值。
- `core/uncertainty.js`：已实现并通过测试的纯函数——
  - 无量纲联系强度 `edgeStrength`（证据地板 + 情景强度）；
  - 最大乘积路径 `runFlowExperiment`（输出总联系强度、可达节点、激活边）；
  - 双世界对照 `compareWorlds`（稳健节点 vs 依赖假设节点）。
  - 结果恒带 `isHypothesis:true`、`kind:"dimensionless-demo"`，**不输出真实人数 / 货量 / 资金**。
- M1 只验证"输入 → 重算 → 结果变 → 可复现"的链路；真实区间须 M2 取证后登记进 `EVIDENCE_LEDGER.md` 才允许填入。

## 九、质量与降级

- 启动先跑 `validateDataset()`，结构错误打印 error，仍可渲染但控制台明确报警。
- 画质探测 `detectQuality()`：移动 UA / 宽 <760 / 低内存 / 低核数 → low（减少星点、降低粒子负担）。
- WebGL 不可用 → `mountFallback()`：2D canvas 俯视 x-z 关系图，仍可点选节点、搜索、查看关系。
- 支持手动切换高 / 低画质、开关标签。
