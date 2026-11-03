# Skills 如何与「变化现场」联动（SKILLS INTEGRATION）

> 面向**接手审计与修改的 AI（及人类协作者）**。讲清三件事：页面、数据、Skills 各自负责什么；
> 数据更新后如何让页面跟着变；改完如何验证。仓库公开、无保密，可直接引用本文件。
> 版本：skills-integration/1（2026-11-03）。配套《DATA-DICTIONARY.md》《DATA-GOVERNANCE.md》。

---

## 一、分工与一句话原则

- **ChatGPT（可玩世界）**：负责视觉与交互的创意表达。
- **豆包 / Skills（真实世界）**：负责产出真实、分级标注的数据与后台计算，是数据/能力提供方。
- **本仓库页面**：只**读取并呈现**数据，不在浏览器里编造现实权重或把假设渲染成事实。

一句话原则：**事实、推断、假设三者不混淆；任何数字要么有来源，要么明确标注为预计/假设；无真实来源不进数据。**

---

## 二、关键文件地图

| 角色 | 文件 | 说明 |
|---|---|---|
| 主页面 | `holo-home-v9.html` | 变化现场：3D/2D 关系网络、变化列表、变化档案、C004 三状态、项目进度链 |
| 收敛页 | `holo-home-v10.html` | 跳转/导航收敛 |
| 变化数据 | `data/relationship-changes-v1.json` | 12 起变化；含 `structure_score`、顶层 `score_meta`、C004 `lifecycle_stage` |
| 证据网络 | `data/relationship-evidence-v1.json` | 36 节点 / 45 边；边带 `evidence_grade`（A/B/C）、`confidence`、`counter_evidence` |
| 来源登记 | `data/relationship-sources-v1.json` | 54 条来源，所有事实可回溯 |
| 后台算分 | `scripts/compute-structure-score.js` | 后台统一计算结构分，前端只读 |
| 验证脚本 | `experiments/holo-single/*.cjs` | Playwright 双端验证（CommonJS） |

---

## 三、数据文件职责（页面只消费，不反向改写事实）

1. **evidence（节点/边）**：定义"有哪些主体、它们之间有什么关系"。
   - 边的 `evidence_grade`：A/B 为有证据的关系，**C 级为待验证假设**，页面用虚线、不强化、不打发光管。
2. **changes（变化事件）**：定义"发生了哪 12 件事"，每件通过 `involved_node_ids` / `involved_edge_ids` 引用证据网，不重复定义主体。
3. **sources（来源）**：每条变化/关系的事实都应能在来源里找到对应条目。

JSON 统一 2 空格缩进；字段细节见《DATA-DICTIONARY.md》。

---

## 四、结构分：后台算，前端只呈现

页面列表的排序条**不是**浏览器里的固定权重，而是后台脚本算好后写入数据的 `structure_score`。

```bash
# 预览（只打印，不写文件）
node scripts/compute-structure-score.js

# 写回 data/relationship-changes-v1.json（幂等：重复跑结果一致）
node scripts/compute-structure-score.js --write
```

- 算分构成：影响范围（主体数×2 + 联系数×2 + 节点度之和×0.35）+ 节点类型权重 + 事件结构方向 + 近 30 天新近度 +1。
- 权重与口径同时写入数据顶层 `score_meta`（含 `disclaimer`、生成脚本、生成时间）。
- 前端 `impactOf()` 直接读 `c.structure_score`，标签为**「结构重要性」**，并附侧注：结构排序 ≠ 现实经济影响。
- **修改权重/口径只能改脚本，再 `--write` 重算**；不要在前端页面里另写一套算法，否则两个口径会打架。

---

## 五、两套"状态"不要混淆（审计重点）

C004 同时存在两个维度的状态，含义不同，修改时务必区分：

### 5.1 数据层 `lifecycle_stage`（现实阶段，事实）

表示项目在现实中走到哪一步，存在变化数据里。当前值为 `"signed"`。约定状态机：

| 阶段 | 取值 | 推进所需的真实证据（缺一不可，注明日期与来源） |
|---|---|---|
| 签约 | `signed` | 已发生：2026-08-03 集中签约，计划投资 80 亿 |
| 建设落地 | `construction` | 用地批复 / 施工许可 / 开工或在建现场报道（A/B 级） |
| 投产达产 | `production` | 竣工、投产、达产的实际报道或产值；**203 亿在证实前始终是"达产预计"** |
| 形成产业网络 | `networked` | 本地采购/供货/关联企业合作的**实际合同或报道**，不能仅凭签约或规划推定 |

### 5.2 视图层 `c004View`（用户查看视角，交互）

页面上三状态切换按钮，控制"怎么看"，不是现实判断：

- `before`：签约之前——待落地节点仅淡虚位、边与标签隐藏。
- `after`：当前现实（默认）——待落地节点为空心线框、边保持 C 级虚线不强化。
- `future`：**模拟假设·非现实**——节点变实心、边变琥珀色，徽章明确标注"模拟假设"。

> 关系：`lifecycle_stage` 决定 `after` 视图该如何呈现现实；`future` 永远只是假设，不得回写成事实。

### 5.3 项目进度链（`renderProjectChain`）

- 位置：`holo-home-v9.html` 内 `renderProjectChain(change)`，仅 C004 显示，4 步：签约 → 建设落地 → 投产达产 → 形成产业网络。
- **当前为硬编码：第 1 步 done、后 3 步 todo。** 未来用真实证据推进 `lifecycle_stage` 时，需同步把该函数对应步骤改为 done（并更新 `#pcState` 文案），不要只改数据不改函数。
- 后 3 步的文案已内置保守口径（203 亿为达产预计、本地供货不能仅凭签约推定），改文案时不得弱化这些限定。

---

## 六、关键口径红线（审计时逐条核对）

1. **80 亿 = 签约总投资（计划），不是已完成投资，也不等于实际到账。**
2. **203 亿 = 全部达产后的预计年产值（未来目标），不是当前产值，未证实前不得当事实。**
3. 四宗项目（高端精密制造/机器人零部件 25 亿、绿色冷轧钢 25 亿、空压机 15 亿、液冷散热 15 亿）**均待落地**。
4. E019/E020/E021 为 **C 级待验证边**，呈现为虚线、不强化；不得渲染成已形成的供应链。
5. 结构分只表示网络结构层面的重要性与待观察价值，**不等于现实经济影响**。
6. 概念图里无来源的数字（如 91 万人次、各类百分比、水泥退出传导链）**不得写入页面**；以数据文件为准（游客为片区口径 52.97 万人次）。

---

## 七、标准更新流程（SOP）

```
1. Skills 采集公开信息（政务/媒体/平台），登记来源
        ↓
2. 对照证据等级，区分 事实 / 推断 / 假设；无来源不进数据
        ↓
3. 改 data/ 下 JSON（节点/边/变化/source），必要时推进 lifecycle_stage
        ↓
4. node scripts/compute-structure-score.js --write   # 重算结构分
        ↓
5. 本地起服务，跑 Playwright 双端验证（见第八节）
        ↓
6. git commit / push，等待 GitHub Pages 构建并做线上核验
```

---

## 八、本地验证方式

```bash
# 1. 仓库根目录起静态服务（file:// 下 fetch 会被 CORS 拦截，必须用 http）
python3 -m http.server 8899

# 2. 跑双端验证（CommonJS；桌面 1440×900、手机 390×844）
node experiments/holo-single/c004-audit-verify.cjs
```

- 浏览器固定路径：`/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome`。
- `c004-audit-verify.cjs` 覆盖：三状态节点/边/徽章、进度链 4 步、结构重要性口径与侧注、切其他事件清理、手机端 order、无 JS 错误。
- 历史结构验证脚本 `v9-struct-verify.cjs` 可复用。**改完必须双端全 PASS 才能提交。**

---

## 九、给审计 AI 的检查清单

- [ ] 页面是否把"签约/计划/预计"与"已投产/已完成"做了视觉区分（待落地=空心，非实心）？
- [ ] C 级边是否保持虚线、无发光强化、无"已形成供应链"措辞？
- [ ] 结构分是否来自后台脚本与 `score_meta`，前端有无另写权重？
- [ ] 80 亿/203 亿是否带正确限定，有无被写成当前事实？
- [ ] `lifecycle_stage` 与进度链 done 步骤是否一致、是否有对应真实来源？
- [ ] 手机端 3D 画布是否排在列表之前（deck order=1）？
- [ ] 双端 Playwright 是否全 PASS、有无 JS 错误？
- [ ] 新增数字是否都能在 `relationship-sources-v1.json` 回溯？

---

## 十、Git 与部署

- 远程：`github.com/zhanglingshare/boluo-simulator`（**公开仓库，当前不设保密**）。
- 线上：`https://zhanglingshare.github.io/boluo-simulator/holo-home-v9.html`。
- 深链：`#change=CXXX`、`#range=month|year`。
- Pages 构建有 1–3 分钟缓存延迟，偶发 503/超时重试即可；`.nojekyll` 已存在，静态资源按原路径发布。
