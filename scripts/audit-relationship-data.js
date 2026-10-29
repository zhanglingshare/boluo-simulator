'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const dataDir = path.join(root, 'data');
const inboxPath = path.join(dataDir, 'inbox', 'relationship-update-proposal.json');
const errors = [];
const warnings = [];
const notes = [];
const auditedAt = new Date().toISOString();
const required = (obj, fields, label) => fields.forEach(k => {
  if (!obj || obj[k] === undefined || obj[k] === null || obj[k] === '') errors.push(label + ' 缺少字段 ' + k);
});
const readJson = (file, label) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { errors.push(label + ' JSON 读取/解析失败：' + e.message); return null; }
};
const uniqueMap = (items, key, label) => {
  const map = new Map();
  (items || []).forEach(item => {
    const id = item && item[key];
    if (!id) errors.push(label + ' 存在空 ' + key);
    else if (map.has(id)) errors.push(label + ' ID 重复：' + id);
    else map.set(id, item);
  });
  return map;
};
const validUrl = value => {
  try { const u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch (_) { return false; }
};
const validDate = value => !!value && !Number.isNaN(Date.parse(value));
const refs = (ids, known, label) => (ids || []).forEach(id => { if (!known.has(id)) errors.push(label + ' 引用了不存在的 ID：' + id); });
const gradeType = { A: '已证实事实', B: '证据推断', C: '待验证假设' };

const ed = readJson(path.join(dataDir, 'relationship-evidence-v1.json'), '关系底座');
const sd = readJson(path.join(dataDir, 'relationship-sources-v1.json'), '来源登记');
const cd = readJson(path.join(dataDir, 'relationship-changes-v1.json'), '关系变化');
let nodeMap = new Map(), edgeMap = new Map(), sourceMap = new Map(), changeMap = new Map();
let sourceResults = [];
let candidateSummary = { present: false, valid: null, source_count: 0, node_proposals: 0, edge_proposals: 0, change_count: 0, open_questions: 0, message: '未收到候选包；这不代表现实中没有发生变化。' };

if (ed && sd && cd) {
  if (ed.schema_version !== 'relationship-evidence-v1') errors.push('关系底座 schema_version 不符合预期');
  if (sd.schema_version !== 'relationship-sources-v1') errors.push('来源登记 schema_version 不符合预期');
  if (cd.schema_version !== 'relationship-changes-v1') errors.push('关系变化 schema_version 不符合预期');
  if ([ed.region, sd.region, cd.region].some(x => x !== 'boluo')) errors.push('三份基线数据 region 必须均为 boluo');
  const nodes = Array.isArray(ed.nodes) ? ed.nodes : [];
  const edges = Array.isArray(ed.edges) ? ed.edges : [];
  const sources = Array.isArray(sd.sources) ? sd.sources : [];
  const changes = Array.isArray(cd.changes) ? cd.changes : [];
  if (!Array.isArray(ed.nodes) || !Array.isArray(ed.edges)) errors.push('关系底座缺少 nodes/edges 数组');
  if (!Array.isArray(sd.sources)) errors.push('来源登记缺少 sources 数组');
  if (!Array.isArray(cd.changes)) errors.push('关系变化缺少 changes 数组');
  nodeMap = uniqueMap(nodes, 'node_id', '节点');
  edgeMap = uniqueMap(edges, 'edge_id', '关系');
  sourceMap = uniqueMap(sources, 'source_id', '来源');
  changeMap = uniqueMap(changes, 'change_id', '变化事件');
  if (ed.node_count !== nodes.length) errors.push('node_count 不匹配：声明 ' + ed.node_count + '，实际 ' + nodes.length);
  if (ed.edge_count !== edges.length) errors.push('edge_count 不匹配：声明 ' + ed.edge_count + '，实际 ' + edges.length);
  if (sd.count !== sources.length) errors.push('sources count 不匹配：声明 ' + sd.count + '，实际 ' + sources.length);
  if (cd.count !== changes.length) errors.push('changes count 不匹配：声明 ' + cd.count + '，实际 ' + changes.length);

  nodes.forEach(n => {
    required(n, ['node_id','name','node_type','layer','description','node_status','change_status','evidence_grade','source_ids'], '节点 ' + (n.node_id || '?'));
    if (n.evidence_grade && !['A','B','C'].includes(n.evidence_grade)) errors.push('节点 ' + n.node_id + ' 证据等级非法');
    if (n.source_ids && !Array.isArray(n.source_ids)) errors.push('节点 ' + n.node_id + ' 的 source_ids 必须为数组');
    refs(n.source_ids, sourceMap, '节点 ' + n.node_id);
  });
  const relationTypes = new Set(Object.keys(ed.relation_type_legend || {}));
  edges.forEach(e => {
    required(e, ['edge_id','source_node_id','target_node_id','relation_type','relation_description','direction','evidence_type','evidence_grade','confidence','source_ids','last_verified_at','change_status'], '关系 ' + (e.edge_id || '?'));
    if (!nodeMap.has(e.source_node_id)) errors.push('关系 ' + e.edge_id + ' source_node_id 不存在：' + e.source_node_id);
    if (!nodeMap.has(e.target_node_id)) errors.push('关系 ' + e.edge_id + ' target_node_id 不存在：' + e.target_node_id);
    if (e.relation_type && relationTypes.size && !relationTypes.has(e.relation_type)) errors.push('关系 ' + e.edge_id + ' relation_type 未登记：' + e.relation_type);
    if (e.evidence_grade && !gradeType[e.evidence_grade]) errors.push('关系 ' + e.edge_id + ' evidence_grade 非法');
    if (gradeType[e.evidence_grade] && e.evidence_type !== gradeType[e.evidence_grade]) errors.push('关系 ' + e.edge_id + ' 证据等级与 evidence_type 不一致');
    if (e.source_ids && !Array.isArray(e.source_ids)) errors.push('关系 ' + e.edge_id + ' 的 source_ids 必须为数组');
    refs(e.source_ids, sourceMap, '关系 ' + e.edge_id);
    if (e.metric && e.metric.metric_value != null && (typeof e.metric.metric_value !== 'number' || !Number.isFinite(e.metric.metric_value))) errors.push('关系 ' + e.edge_id + ' metric_value 必须是数字或 null');
    if (e.last_verified_at && !validDate(e.last_verified_at)) errors.push('关系 ' + e.edge_id + ' last_verified_at 日期无效');
  });
  sources.forEach(s => {
    required(s, ['source_id','title','publisher','source_type','url','fetched_at','summary'], '来源 ' + (s.source_id || '?'));
    if (s.url && !validUrl(s.url)) errors.push('来源 ' + s.source_id + ' URL 不是合法 HTTP(S) 地址');
    if (s.fetched_at && !validDate(s.fetched_at)) errors.push('来源 ' + s.source_id + ' fetched_at 日期无效');
  });
  const changeTypes = new Set(Object.keys(cd.change_type_legend || {}));
  changes.forEach(c => {
    required(c, ['change_id','change_type','title','event_date','involved_node_ids','involved_edge_ids','source_ids','uncertainty','last_verified_at'], '变化事件 ' + (c.change_id || '?'));
    if (c.change_type && changeTypes.size && !changeTypes.has(c.change_type)) errors.push('变化事件 ' + c.change_id + ' change_type 未登记：' + c.change_type);
    refs(c.involved_node_ids, nodeMap, '变化事件 ' + c.change_id);
    refs(c.involved_edge_ids, edgeMap, '变化事件 ' + c.change_id);
    refs(c.source_ids, sourceMap, '变化事件 ' + c.change_id);
    if (c.last_verified_at && !validDate(c.last_verified_at)) errors.push('变化事件 ' + c.change_id + ' last_verified_at 日期无效');
  });
  const verified = edges.map(e => Date.parse(e.last_verified_at)).filter(Number.isFinite);
  if (verified.length) {
    const age = Math.floor((Date.now() - Math.min(...verified)) / 86400000);
    if (age > 30) warnings.push('至少一条关系超过 30 天未核验；最早核验距今约 ' + age + ' 天');
  }
  notes.push('正式底座：节点 ' + nodes.length + '、关系 ' + edges.length + '、来源 ' + sources.length + '、变化事件 ' + changes.length);
}

const candidateNodes = new Map();
const candidateEdges = new Map();
if (fs.existsSync(inboxPath)) {
  candidateSummary.present = true;
  const candidate = readJson(inboxPath, '候选更新包');
  if (candidate) {
    const errorsBefore = errors.length;
    required(candidate, ['schema_version','region','generated_at','collector','summary','sources','nodes','edges','changes','open_questions'], '候选更新包');
    if (candidate.schema_version !== 'relationship-update-proposal-v1') errors.push('候选包 schema_version 必须为 relationship-update-proposal-v1');
    if (candidate.region !== 'boluo') errors.push('候选包 region 必须为 boluo');
    if (candidate.generated_at && !validDate(candidate.generated_at)) errors.push('候选包 generated_at 日期无效');
    if (candidate.generated_at && validDate(candidate.generated_at)) {
      const ageHours = (Date.now() - Date.parse(candidate.generated_at)) / 3600000;
      if (ageHours > 36) warnings.push('候选包已超过 36 小时，需确认是否为最新采集结果');
      if (ageHours < -1) errors.push('候选包 generated_at 位于未来，请核对时区与时间');
    }
    ['sources','nodes','edges','changes','open_questions'].forEach(k => { if (candidate[k] !== undefined && !Array.isArray(candidate[k])) errors.push('候选包 ' + k + ' 必须为数组'); });
    const ps = Array.isArray(candidate.sources) ? candidate.sources : [];
    const knownRelationTypes = new Set(Object.keys(ed && ed.relation_type_legend || {}));
    const knownChangeTypes = new Set(Object.keys(cd && cd.change_type_legend || {}));
    const pn = Array.isArray(candidate.nodes) ? candidate.nodes : [];
    const pe = Array.isArray(candidate.edges) ? candidate.edges : [];
    const pc = Array.isArray(candidate.changes) ? candidate.changes : [];
    const allSources = new Set(sourceMap.keys());
    ps.forEach(s => {
      required(s, ['source_id','title','publisher','source_type','url','fetched_at','summary'], '候选来源 ' + (s.source_id || '?'));
      if (sourceMap.has(s.source_id)) errors.push('候选来源 ID 已存在，不能覆盖旧记录：' + s.source_id);
      else if (allSources.has(s.source_id)) errors.push('候选来源 ID 重复：' + s.source_id);
      if (s.source_id) allSources.add(s.source_id);
      if (s.url && !validUrl(s.url)) errors.push('候选来源 ' + s.source_id + ' URL 不是合法 HTTP(S) 地址');
    });
    const allNodes = new Set(nodeMap.keys());
    pn.forEach(p => {
      required(p, ['action','rationale','source_ids'], '候选节点提案');
      if (!Array.isArray(p.source_ids) || !p.source_ids.length) errors.push('候选节点提案必须至少引用一个来源');
      refs(p.source_ids, allSources, '候选节点提案');
      if (p.action === 'add') {
        if (!p.node || typeof p.node !== 'object') { errors.push('新增节点提案缺少 node 对象'); return; }
        required(p.node, ['node_id','name','node_type','layer','description','node_status','change_status','evidence_grade','source_ids'], '新增节点');
        if (allNodes.has(p.node.node_id)) errors.push('新增节点 ID 已存在：' + p.node.node_id);
        if (p.node.node_id) { allNodes.add(p.node.node_id); candidateNodes.set(p.node.node_id, p.node); }
        if (!gradeType[p.node.evidence_grade]) errors.push('新增节点 ' + p.node.node_id + ' 证据等级非法');
        refs(p.node.source_ids, allSources, '新增节点 ' + p.node.node_id);
      } else if (['update','exit'].includes(p.action)) {
        if (!nodeMap.has(p.node_id)) errors.push('节点提案引用不存在的 node_id：' + p.node_id);
        if (!p.patch || typeof p.patch !== 'object' || !Object.keys(p.patch).length) errors.push('节点提案必须提供非空 patch');
        if (p.patch && p.patch.node_id !== undefined) errors.push('patch 不允许修改 node_id');
        if (p.patch && p.patch.source_ids) refs(p.patch.source_ids, allSources, '节点 patch ' + p.node_id);
      } else errors.push('节点提案 action 仅允许 add/update/exit，收到：' + p.action);
    });
    const allEdges = new Set(edgeMap.keys());
    pe.forEach(p => {
      required(p, ['action','rationale','source_ids'], '候选关系提案');
      if (!Array.isArray(p.source_ids) || !p.source_ids.length) errors.push('候选关系提案必须至少引用一个来源');
      refs(p.source_ids, allSources, '候选关系提案');
      if (p.action === 'add') {
        if (!p.edge || typeof p.edge !== 'object') { errors.push('新增关系提案缺少 edge 对象'); return; }
        required(p.edge, ['edge_id','source_node_id','target_node_id','relation_type','relation_description','direction','evidence_type','evidence_grade','confidence','source_ids','last_verified_at','change_status'], '新增关系');
        if (allEdges.has(p.edge.edge_id)) errors.push('新增关系 ID 已存在：' + p.edge.edge_id);
        if (p.edge.edge_id) { allEdges.add(p.edge.edge_id); candidateEdges.set(p.edge.edge_id, p.edge); }
        if (gradeType[p.edge.evidence_grade] !== p.edge.evidence_type) errors.push('新增关系 ' + p.edge.edge_id + ' 证据等级与 evidence_type 不一致');
        if (p.edge.relation_type && knownRelationTypes.size && !knownRelationTypes.has(p.edge.relation_type)) errors.push('新增关系 ' + p.edge.edge_id + ' relation_type 未登记：' + p.edge.relation_type);
        refs(p.edge.source_ids, allSources, '新增关系 ' + p.edge.edge_id);
      } else if (['update','strengthen','weaken','break','exit'].includes(p.action)) {
        if (!edgeMap.has(p.edge_id)) errors.push('关系提案引用不存在的 edge_id：' + p.edge_id);
        if (!p.patch || typeof p.patch !== 'object' || !Object.keys(p.patch).length) errors.push('关系提案必须提供非空 patch');
        if (p.patch && p.patch.edge_id !== undefined) errors.push('patch 不允许修改 edge_id');
        if (p.patch && p.patch.source_ids) refs(p.patch.source_ids, allSources, '关系 patch ' + p.edge_id);
        if (p.patch) {
          const oldEdge = edgeMap.get(p.edge_id) || {};
          const nextGrade = p.patch.evidence_grade || oldEdge.evidence_grade;
          const nextType = p.patch.evidence_type || oldEdge.evidence_type;
          if (gradeType[nextGrade] !== nextType) errors.push('关系 patch ' + p.edge_id + ' 证据等级与 evidence_type 不一致');
          if (p.patch.relation_type && knownRelationTypes.size && !knownRelationTypes.has(p.patch.relation_type)) errors.push('关系 patch ' + p.edge_id + ' relation_type 未登记：' + p.patch.relation_type);
        }
      } else errors.push('关系提案 action 不受支持：' + p.action);
    });
    allNodes.forEach(id => {});
    candidateEdges.forEach(e => {
      if (!allNodes.has(e.source_node_id)) errors.push('新增关系 ' + e.edge_id + ' source_node_id 不存在：' + e.source_node_id);
      if (!allNodes.has(e.target_node_id)) errors.push('新增关系 ' + e.edge_id + ' target_node_id 不存在：' + e.target_node_id);
    });
    const allChangeIds = new Set(changeMap.keys());
    pc.forEach(c => {
      required(c, ['change_id','change_type','title','event_date','involved_node_ids','involved_edge_ids','source_ids','uncertainty','last_verified_at'], '候选变化事件 ' + (c.change_id || '?'));
      if (c.change_type && knownChangeTypes.size && !knownChangeTypes.has(c.change_type)) errors.push('候选变化事件 ' + c.change_id + ' change_type 未登记：' + c.change_type);
      if (allChangeIds.has(c.change_id)) errors.push('候选变化事件 ID 已存在：' + c.change_id);
      if (c.change_id) allChangeIds.add(c.change_id);
      refs(c.involved_node_ids, allNodes, '候选变化事件 ' + c.change_id);
      refs(c.involved_edge_ids, allEdges, '候选变化事件 ' + c.change_id);
      refs(c.source_ids, allSources, '候选变化事件 ' + c.change_id);
      if (c.last_verified_at && !validDate(c.last_verified_at)) errors.push('候选变化事件 ' + c.change_id + ' last_verified_at 日期无效');
    });
    candidateSummary = {
      present: true, valid: errors.length === errorsBefore,
      source_count: ps.length, node_proposals: pn.length, edge_proposals: pe.length,
      change_count: pc.length, open_questions: Array.isArray(candidate.open_questions) ? candidate.open_questions.length : 0,
      message: errors.length === errorsBefore ? '结构校验通过；等待人工审查，不会自动发布。' : '校验未通过；禁止发布。'
    };
    if (candidateSummary.valid && !ps.length && !pn.length && !pe.length && !pc.length) warnings.push('候选包没有待审变更；不能据此宣称现实没有变化');
    notes.push('候选包：新来源 ' + ps.length + '、节点提案 ' + pn.length + '、关系提案 ' + pe.length + '、变化事件 ' + pc.length);
  }
} else {
  notes.push('未收到候选包；这不代表现实中没有发生变化');
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) { const i = cursor++; if (i >= items.length) return; out[i] = await fn(items[i]); }
  }));
  return out;
}
async function checkSource(s) {
  const out = { source_id: s.source_id, title: s.title, url: s.url, status: 'unknown', http_status: null, final_url: null, note: '' };
  try {
    let r = await fetch(s.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'BoluoRelationshipEvidenceAudit/1.0', 'accept': '*/*' } });
    let status = r.status, finalUrl = r.url;
    if (r.body) await r.body.cancel().catch(() => {});
    if ([403,405,501].includes(status)) {
      r = await fetch(s.url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'BoluoRelationshipEvidenceAudit/1.0', 'accept': '*/*', 'range': 'bytes=0-0' } });
      status = r.status; finalUrl = r.url;
      if (r.body) await r.body.cancel().catch(() => {});
    }
    out.http_status = status; out.final_url = finalUrl;
    if (status >= 200 && status < 400) out.status = 'reachable';
    else if ([404,410].includes(status)) { out.status = 'not_found'; out.note = '地址可能失效，需人工复核'; }
    else if ([401,403].includes(status)) { out.status = 'blocked'; out.note = '站点限制自动访问，不等于来源无效'; }
    else { out.status = 'http_error'; out.note = 'HTTP 状态异常，需人工复核'; }
  } catch (e) {
    out.status = 'unreachable';
    out.note = (e && e.name === 'TimeoutError') ? '访问超时，需人工复核' : ('访问失败：' + String(e.message || e).slice(0, 140));
  }
  return out;
}

(async () => {
  const sources = sd && Array.isArray(sd.sources) ? sd.sources : [];
  const checkUrls = process.env.CHECK_SOURCE_URLS === 'true' ||
    (process.env.GITHUB_EVENT_NAME === 'schedule' && new Date().getUTCDay() === 0);
  if (checkUrls && sources.length) {
    sourceResults = await mapLimit(sources, 5, checkSource);
    const failed = sourceResults.filter(x => x.status !== 'reachable');
    if (failed.length) warnings.push('来源链接巡检有 ' + failed.length + ' 条需人工复核；403/超时不等于来源无效');
    notes.push('来源链接巡检：' + (sources.length - failed.length) + '/' + sources.length + ' 可访问');
  } else notes.push('本次未巡检来源链接；每周日自动巡检，也可手动触发完整巡检');

  const report = {
    audit_version: 1, audited_at: auditedAt, region: 'boluo',
    baseline: { valid: errors.length === 0, nodes: ed && Array.isArray(ed.nodes) ? ed.nodes.length : 0, edges: ed && Array.isArray(ed.edges) ? ed.edges.length : 0, sources: sd && Array.isArray(sd.sources) ? sd.sources.length : 0, changes: cd && Array.isArray(cd.changes) ? cd.changes.length : 0 },
    candidate: candidateSummary,
    source_url_audit: { performed: checkUrls, checked: sourceResults.length, reachable: sourceResults.filter(x => x.status === 'reachable').length, results: sourceResults },
    validation: { ok: errors.length === 0, errors, warnings, notes },
    publication_policy: { automatic_publish: false, rule: '候选更新只做结构校验与审计，不自动覆盖正式关系底座；人工核验后才能合并。' }
  };
  fs.writeFileSync(path.join(dataDir, 'daily-audit.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  const md = [
    '# 博罗全息关系数据每日审计', '',
    '- 审计时间（UTC）：' + auditedAt,
    '- 结构校验：' + (errors.length ? '**未通过：存在阻断错误**' : '**通过**'),
    '- 自动发布：**关闭**；候选内容不会自动覆盖正式关系底座。', '',
    '## 正式数据底座', '',
    '| 项目 | 数量 |', '|---|---:|',
    '| 节点 | ' + report.baseline.nodes + ' |', '| 关系 | ' + report.baseline.edges + ' |',
    '| 来源 | ' + report.baseline.sources + ' |', '| 变化事件 | ' + report.baseline.changes + ' |', '',
    '## 候选更新包', '',
    candidateSummary.present ? '- 状态：' + (candidateSummary.valid ? '结构校验通过，等待人工审查' : '校验未通过，禁止发布') : '- 状态：未收到候选包；这不代表现实中没有发生变化。',
    '- 新来源：' + candidateSummary.source_count, '- 节点提案：' + candidateSummary.node_proposals,
    '- 关系提案：' + candidateSummary.edge_proposals, '- 变化事件：' + candidateSummary.change_count,
    '- 待核问题：' + candidateSummary.open_questions, '',
    '## 来源链接巡检', '',
    checkUrls ? ('- 可访问：' + report.source_url_audit.reachable + '/' + report.source_url_audit.checked) : '- 本次未执行；每周日自动巡检，或手动触发。',
    ...(sourceResults.some(x => x.status !== 'reachable') ? ['', '| 来源 ID | 状态 | HTTP | 备注 |', '|---|---|---:|---|', ...sourceResults.filter(x => x.status !== 'reachable').map(x => '| ' + x.source_id + ' | ' + x.status + ' | ' + (x.http_status || '—') + ' | ' + x.note.replace(/\|/g, '/') + ' |')] : []),
    '', '## 阻断错误', '', ...(errors.length ? errors.map(x => '- ❌ ' + x) : ['- 无']),
    '', '## 警告与待复核', '', ...(warnings.length ? warnings.map(x => '- ⚠️ ' + x) : ['- 无']),
    '', '## 审计规则', '',
    '- A/B/C 必须分别对应“已证实事实/证据推断/待验证假设”。',
    '- 新关系、节点、事件必须引用存在的来源；事件必须引用存在的节点与关系。',
    '- 签约、在建、规划不自动视为投产；断裂或退出必须有直接证据。',
    '- 链接无法自动访问不等于来源无效；403、超时、死链只生成复核提示。',
    '- 本报告是质量门，不是“现实没有变化”的证明。'
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(dataDir, 'daily-audit.md'), md, 'utf8');
  console.log('Relationship data audit: ' + (errors.length ? 'FAILED' : 'PASSED'));
  console.log('Baseline nodes=' + report.baseline.nodes + ', edges=' + report.baseline.edges + ', sources=' + report.baseline.sources + ', changes=' + report.baseline.changes);
  console.log('Candidate: ' + candidateSummary.message);
  console.log('Errors=' + errors.length + ', warnings=' + warnings.length + ', source URLs checked=' + sourceResults.length);
  if (errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
