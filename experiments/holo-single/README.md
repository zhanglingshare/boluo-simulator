# 看见博罗 V2 · 县域全息关系与流动图谱（holo-single）

一个**零依赖、单文件、双击即开**的 WebGL2 全息数据空间。把博罗的产业、城镇生活、文旅农业、外部联系组织成可探索的节点、关系、流动与状态；支持从一家企业沿真实数据联系跨层、跨镇、跨城市探索，并对缺失数据给出可追溯的 B 级区间或诚实标注 D 级缺口。

- 线上（M1 基线）：<https://zhanglingshare.github.io/boluo-simulator/experiments/holo-single/index.html>
- M2 目前在分支 `experiment/holo-v2-m2`，**未经明确"发布"指令不合并 main、不部署**。
- 原版站点与 `/v2/` 完全不动，本原型独立于 `experiments/holo-single/`。

## 它解决什么

不是漂亮的 3D 驾驶舱，而是一条可自由操作的探索路径：

```
全景五群 → 产业星群 → 园洲企业（欣旺达）→ 进入园洲镇
        → 产业 / 生活 / 事件三层穿透 → 外部深圳/东莞
        → 未知区间实验（B 级流场）→ 沿路径返回
```

## 四级数据体系（硬规则）

| 级别 | 含义 | 视觉 |
|---|---|---|
| A 直接观测 | 官方统计、政府文件、可核验主体，带 URL 与时期 | 清晰实体 / 实线 |
| B 交叉推断 | 多源间接证据 + 结构系数法约束出的**区间**，非统计值、不冒充置信区间 | 半透明带状 / 区间卡 |
| C 假设探索 | 用户选择的情景，只驱动无量纲权重实验，观察结构变化，不代表现实 | 紫色假设层 |
| D 未知 | 证据不足，不编造，列入 `dataGaps` 并注明"还缺什么才能收紧" | 空心 / 不展示 |

三种线严格区分：**关系线**（产业/归属/提及，有 A/B/C 证据级）、**流向线**（探索方向，不代表物流方向）、**流量线**（仅有真实/区间流量时才画）。关系 ≠ 流量；同镇 ≠ 供应链；事件新增 ≠ 活跃度；车辆流量 ≠ 人数；跨界出行 ≠ 工作通勤。

## 本地运行

```bash
# 必须经 http server（fetch 要读 hot.json / life.json / atlas.json）
cd <仓库根>
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765/experiments/holo-single/index.html
```

直接 `file://` 双击也能打开，但读不到外部 JSON，会回退到内联出厂快照（右上角标注"出厂快照"）。

## 测试

```bash
# 1) 引擎与数据底座（node:test，14 项，纯函数、无浏览器）
node --test experiments/holo-single/tests/m2.engine.test.mjs

# 2) 端到端跨层闭环（Playwright，桌面 1440 + 移动 390，截图 + 收集控制台错误）
node experiments/holo-single/shot-m2.mjs   # 截图输出到 shots/
```

## 文件结构

```
experiments/holo-single/
├── index.html                 # 单文件：数据层 + 引擎层 + 渲染交互层（3 个 <script>）
├── data/atlas.json            # M2 权威底座：16 镇街/跨界交通/飞地/B 级流场/D 级缺口/31 来源
├── tests/m2.engine.test.mjs   # 引擎与数据自动化测试
├── shot-m2.mjs                # Playwright 跨层闭环脚本（可复现，代替录屏）
├── shots/                     # 桌面 + 手机真实截图
├── ARCHITECTURE.md
├── DATA_DICTIONARY.md
├── EVIDENCE_LEDGER.md
└── AUDIT_REPORT.md
```

数据来自仓库根 `hot.json`、`life.json` 与本目录 `data/atlas.json`，每日由 `boluo-intel` skill 刷新；前端不做任何在线 AI 调用。

## 里程碑

- **M1 星群能展开**（已上线 main 80575c7）：五群、力导向、基础关系、未知实验抽象权重。
- **M2 世界能连通**（本分支）：16 镇街锚点、产业/生活/事件三层穿透、跨镇与外部连续探索、动态数据接入、B 级流场区间。
- **M3 未知能推演**（未开始，禁止提前）：多参数贝叶斯、双世界 A/B 对照、拓扑重组。

## 科学底线

先证据后估计；区间不冒认置信区间；用户选择不覆盖官方事实；不确定性沿模型传播；保留反证与更新版本。任何随变量变化的视觉对象，都能追溯到计算规则——没有装饰动画冒充计算。
