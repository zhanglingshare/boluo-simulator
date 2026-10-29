# 博罗关系数据候选更新区（给豆包 Skills 的交接规范）

## 目的
豆包 Skills 每日采集公开信息后，只把候选变化写到 \`data/inbox/relationship-update-proposal.json\`。不要直接覆盖正式文件：
- \`data/relationship-evidence-v1.json\`
- \`data/relationship-sources-v1.json\`
- \`data/relationship-changes-v1.json\`

推送候选包后，GitHub Actions 会自动审计数据结构与引用，并更新 \`data/daily-audit.md\` / \`data/daily-audit.json\`。候选内容不会自动进入正式关系网络；只有人工核验通过后才合并到正式底座。

## 每日采集要求
1. 只采集合法公开信息；优先政府部门、统计公报、政府公告、企业官方公告、环评/交通/项目公示及权威媒体。
2. 优先识别会改变网络结构的事件：新主体进入、关系形成、关系增强/减弱、连接断裂、主体退出、替代路径。没有结构变化时写清“未发现可确认变化”，不要为了每日更新而制造事件。
3. 每个候选都要有原始 URL、发布机构、发布时间、抓取时间、数据所属时期、摘要和可复核依据。
4. 严格区分签约、开工、在建、试产、投产、达产。签约金额不是实际投资，目标产值不是当前产值。
5. A=官方/主体直接证实；B=多源交叉推断，说明推断依据与不确定性；C=待验证假设。不得把 B/C 写成已证实事实。
6. 不根据单篇新闻推断精确关系强度；没有公开量化依据时，不填写虚构 metric。
7. 不把无法证实的断裂/退出写成事实；停产整改不等于永久退出。
8. 不采集个人敏感信息、个人轨迹或非公开数据。

## 候选包字段
使用 \`relationship-update-proposal.example.json\` 作为格式参考。JSON 必须是 UTF-8、严格合法 JSON。

顶层字段：\`schema_version\`（固定 \`relationship-update-proposal-v1\`）、\`region\`（固定 \`boluo\`）、\`generated_at\`（ISO 8601 时间）、\`collector\`、\`summary\`、\`sources\`、\`nodes\`、\`edges\`、\`changes\`、\`open_questions\`。

### 节点提案
每项包含 \`action\`、\`rationale\`、\`source_ids\`。
- 新增：\`action: "add"\`，提供完整 \`node\` 对象，字段与正式节点一致。
- 更新：\`action: "update"\`，提供已有 \`node_id\` 与非空 \`patch\`。
- 退出：\`action: "exit"\`，提供已有 \`node_id\`、非空 \`patch\` 与能证明退出的来源。

### 关系提案
每项包含 \`action\`、\`rationale\`、\`source_ids\`。
- 新增：\`action: "add"\`，提供完整 \`edge\` 对象，字段与正式关系一致。
- 更新：\`action: "update"\`，提供已有 \`edge_id\` 与非空 \`patch\`。
- 变化动作：\`strengthen\`、\`weaken\`、\`break\`、\`exit\`，均指向已有 \`edge_id\`，提供非空 \`patch\`。
- 新增关系的两个端点必须是现有节点或同一候选包内新增的节点。

### 变化事件
每项字段与正式 \`relationship-changes-v1.json\` 的事件一致。\`change_id\` 必须新建且不重复；\`involved_node_ids\`、\`involved_edge_ids\`、\`source_ids\` 必须能对应正式底座或同一候选包的新增项。

## 不要做的事
- 不要修改 HTML/CSS/JS、模拟算法或 UI。
- 不要自动发布或覆盖正式关系底座。
- 不要把“没有搜到”写成“没有变化”。
- 不要猜测关系强度、因果关系、企业实际产值或未公开通勤流量。
- 不要删除历史事件；更正时说明依据并保留可追溯记录。

## 给豆包 Skills 的执行指令（可直接复制）
你是“博罗全息关系世界”的每日公开证据采集员。先读取正式关系底座与来源登记，采集近 24 小时的新公开信息，并与现有节点、关系、变化事件对比。只把有潜在结构影响的变化写入 \`data/inbox/relationship-update-proposal.json\`，不修改正式底座、不改任何页面和算法。每项提案必须引用来源，注明 A/B/C 证据等级、事件发生时间、抓取时间和不确定性。若证据不足，放入 \`open_questions\` 或不提交候选；不得为了凑数制造变化。完成后检查 JSON 格式与所有 ID 引用，再提交候选文件。提交后等待 GitHub Actions 审计，不要把候选包说成已上线。
