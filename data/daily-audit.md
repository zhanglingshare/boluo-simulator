# 博罗全息关系数据每日审计

- 审计时间（UTC）：2026-11-08T07:34:11.866Z
- 结构校验：**通过**
- 自动发布：**关闭**；候选内容不会自动覆盖正式关系底座。

## 正式数据底座

| 项目 | 数量 |
|---|---:|
| 节点 | 36 |
| 关系 | 45 |
| 来源 | 54 |
| 变化事件 | 12 |

## 候选更新包

- 状态：结构校验通过，等待人工审查
- 新来源：7
- 节点提案：4
- 关系提案：3
- 变化事件：3
- 待核问题：4

## 来源链接巡检

- 可访问：11/54

| 来源 ID | 状态 | HTTP | 备注 |
|---|---|---:|---|
| S001 | unreachable | — | 访问失败：fetch failed |
| S002 | unreachable | — | 访问失败：fetch failed |
| S003 | unreachable | — | 访问失败：fetch failed |
| S004 | unreachable | — | 访问失败：fetch failed |
| S005 | unreachable | — | 访问失败：fetch failed |
| S006 | unreachable | — | 访问失败：fetch failed |
| S007 | unreachable | — | 访问失败：fetch failed |
| S008 | unreachable | — | 访问失败：fetch failed |
| S009 | unreachable | — | 访问失败：fetch failed |
| S010 | unreachable | — | 访问失败：fetch failed |
| S011 | unreachable | — | 访问失败：fetch failed |
| S012 | unreachable | — | 访问失败：fetch failed |
| S013 | unreachable | — | 访问失败：fetch failed |
| S015 | unreachable | — | 访问失败：fetch failed |
| S016 | unreachable | — | 访问失败：fetch failed |
| S017 | blocked | 403 | 站点限制自动访问，不等于来源无效 |
| S018 | unreachable | — | 访问失败：fetch failed |
| S019 | unreachable | — | 访问失败：fetch failed |
| S020 | unreachable | — | 访问失败：fetch failed |
| S021 | unreachable | — | 访问失败：fetch failed |
| S022 | unreachable | — | 访问失败：fetch failed |
| S024 | blocked | 403 | 站点限制自动访问，不等于来源无效 |
| S028 | not_found | 404 | 地址可能失效，需人工复核 |
| S029 | unreachable | — | 访问失败：fetch failed |
| S030 | unreachable | — | 访问失败：fetch failed |
| S031 | unreachable | — | 访问失败：fetch failed |
| S032 | unreachable | — | 访问失败：fetch failed |
| S033 | unreachable | — | 访问失败：fetch failed |
| S036 | unreachable | — | 访问失败：fetch failed |
| S037 | unreachable | — | 访问失败：fetch failed |
| S038 | unreachable | — | 访问失败：fetch failed |
| S039 | unreachable | — | 访问失败：fetch failed |
| S040 | unreachable | — | 访问失败：fetch failed |
| S041 | unreachable | — | 访问失败：fetch failed |
| S042 | unreachable | — | 访问失败：fetch failed |
| S043 | unreachable | — | 访问失败：fetch failed |
| S044 | unreachable | — | 访问失败：fetch failed |
| S045 | unreachable | — | 访问失败：fetch failed |
| S046 | unreachable | — | 访问失败：fetch failed |
| S047 | unreachable | — | 访问失败：fetch failed |
| S049 | unreachable | — | 访问失败：fetch failed |
| S050 | unreachable | — | 访问失败：fetch failed |
| S053 | blocked | 403 | 站点限制自动访问，不等于来源无效 |

## 阻断错误

- 无

## 警告与待复核

- ⚠️ 候选包已超过 36 小时，需确认是否为最新采集结果
- ⚠️ 来源链接巡检有 43 条需人工复核；403/超时不等于来源无效

## 审计规则

- A/B/C 必须分别对应“已证实事实/证据推断/待验证假设”。
- 新关系、节点、事件必须引用存在的来源；事件必须引用存在的节点与关系。
- 签约、在建、规划不自动视为投产；断裂或退出必须有直接证据。
- 链接无法自动访问不等于来源无效；403、超时、死链只生成复核提示。
- 本报告是质量门，不是“现实没有变化”的证明。
