const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../v11/relations-core.js');
const D = C.data;

test('all observed relationships have a dated source and known endpoints; questions are not observations', () => {
  assert.equal(D.source.publisher, '南方日报');
  assert.equal(D.source.date, '2026-09-22');
  assert.equal(new URL(D.source.url).protocol, 'https:');
  for (const record of Object.values(D.cases)) for (const view of Object.values(record.views)) {
    const ids = new Set(view.nodes.map(n => n.id));
    assert.equal(ids.size, view.nodes.length);
    assert.equal(ids.size, 6);
    for (const n of view.nodes) {
      assert.ok(n.detail && n.boundary && n.next);
      assert.equal(n.source, n.kind === 'record' ? D.source.id : null);
    }
    for (const edge of view.edges) {
      assert.ok(ids.has(edge.a), edge.id);
      assert.ok(ids.has(edge.b), edge.id);
      assert.equal(edge.source, edge.kind === 'record' ? D.source.id : null);
    }
    assert.equal(view.questions.length, 3);
  }
});

test('the two 40 percent observations keep different denominators and are never a computed total', () => {
  const snap = C.snapshot({ case: 'hande', view: 'orders' });
  assert.deepEqual(snap.metrics.map(m => m.text), ['约40%', '约40%']);
  assert.deepEqual(snap.metrics.map(m => m.denominator), ['汉德配套采购', '密特斯业务']);
  assert.notEqual(snap.metrics[0].denominator, snap.metrics[1].denominator);
  assert.equal(snap.metrics[0].before, '不足10%');
  assert.equal(snap.metrics[1].before, '未披露');
  assert.match(snap.nodes.find(n => n.id === 'supplier').boundary, /不据此认定经营困难/);
});

test('early snapshots represent unreported links as unknown, without deleting them or making them zero', () => {
  const early = C.snapshot({ case: 'hande', view: 'orders', phase: 'before' });
  const later = C.snapshot({ case: 'hande', view: 'orders', phase: 'current' });
  assert.deepEqual(early.nodes.map(n => n.id), later.nodes.map(n => n.id));
  assert.equal(early.edges.find(e => e.id === 'local-procurement').status, 'record');
  assert.equal(early.edges.find(e => e.id === 'supplier-orders').status, 'unreported');
  assert.equal(later.edges.find(e => e.id === 'supplier-orders').status, 'record');
  assert.equal(early.metrics[1].text, '未披露');
  for (const phase of D.phases) for (const view of ['jobs', 'commute']) {
    const snap = C.snapshot({ case: 'hande', view, phase });
    assert.ok(snap.metrics.every(m => !/\d/.test(m.text)));
    assert.ok(snap.edges.filter(e => e.kind === 'question').every(e => e.status === 'question'));
  }
});

test('Jiangfeng road and order records stay distinct from Hande and do not create causal impacts', () => {
  const orders = C.snapshot({ case: 'jiangfeng', view: 'orders' });
  assert.equal(orders.metrics[0].text, '约3倍');
  const commute = C.snapshot({ case: 'jiangfeng', view: 'commute' });
  assert.equal(commute.metrics[0].text, '2024.05');
  assert.equal(commute.metrics[1].text, '待核实');
  assert.equal(C.snapshot({ case: 'jiangfeng', view: 'commute', phase: 'before' }).metrics[0].text, '尚未通车');
  assert.ok(!C.snapshot({ case: 'hande', view: 'commute' }).nodes.some(n => n.kind === 'record' && n.id === 'road'));
  assert.match(commute.nodes.find(n => n.id === 'road').boundary, /不等于实测/);
});

test('public scene links round trip whitelist identifiers and drop arbitrary or private content', () => {
  const value = { case: 'hande', view: 'orders', lens: 'local', phase: 'current', item: 'supplier', edge: '' };
  assert.deepEqual(C.state(C.query(value)), value);
  assert.match(C.query(value, true), /share=1/);
  const clean = C.state('case=__proto__&view=toString&phase=future&item=<script>&body=private&url=javascript:alert(1)');
  assert.deepEqual(clean, { case: 'hande', view: 'orders', lens: 'company', phase: 'current', item: '', edge: '' });
  assert.equal(C.query({ ...value, body: 'private', url: 'private' }).includes('private'), false);
  assert.equal(C.state('case=jiangfeng&view=commute&item=supplier').item, '');
  const selected = C.state('case=hande&view=orders&edge=supplier-orders&item=company');
  assert.equal(selected.edge, 'supplier-orders');
  assert.equal(selected.item, '');
  assert.deepEqual(C.state(C.query(selected, true)), selected);
});

test('saved findings deduplicate while unreviewed notes reject unsafe URLs and malformed records', () => {
  const value = { case: 'hande', view: 'orders', lens: 'local', phase: 'current', item: 'supplier' };
  assert.equal(C.parseSaved(JSON.stringify([value, value, null, { case: '__proto__' }])).length, 1);
  assert.deepEqual(C.parseSaved('{'), []);
  assert.equal(C.evidence({ ...value, body: '待核实问题', url: 'javascript:alert(1)' }), null);
  assert.equal(C.evidence({ ...value, body: '待核实问题', url: 'https://user:pass@example.com/' }), null);
  const note = C.evidence({ ...value, body: '需要补充带日期的公开招聘资料', url: 'https://example.com/jobs', date: '2026-11-07' });
  assert.equal(note.status, 'unreviewed');
  assert.equal(note.url, 'https://example.com/jobs');
  assert.equal(C.parseNotes(JSON.stringify([note, null, {}, { body: 'hi' }])).length, 1);
  assert.deepEqual(C.parseNotes('{'), []);
});

test('controller destinations and every fixed DOM hook exist in the public page', () => {
  const html = fs.readFileSync(path.join(__dirname, '../v11/relations.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '../v11/relations.js'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const dynamic = new Set(['recordQuestion', 'evidenceForm', 'evidenceBody', 'evidenceURL', 'formError', 'exportRecords', 'shareURL']);
  for (const m of script.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(m[1]) || dynamic.has(m[1]), m[1]);
  for (const m of html.matchAll(/(?:href|src)="(\.\/[^"?]+)(?:\?[^\"]*)?"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, '../v11', m[1])), m[1]);
  assert.match(html, /aria-labelledby="dialogTitle"/);
  for (const file of ['index.html', 'reality.html', 'industry-base.html']) assert.match(fs.readFileSync(path.join(__dirname, '../v11', file), 'utf8'), /data-next-relations href="\.\/relations.html"/);
});

test('industry handoff captures the selected public case and restores it without changing parameters', () => {
  const script = fs.readFileSync(path.join(__dirname, '../v11/relations-handoff.js'), 'utf8');
  const callbacks = {}, selections = [];
  const link = { addEventListener(name, fn) { callbacks[name] = fn; } };
  let active = 'tea';
  const context = { URLSearchParams, Object, location: { search: '?from=relations&relationCase=hande&industryCase=tea' },
    document: { querySelectorAll() { return [link]; } },
    window: { RiskLab: { getState() { return { case: active }; }, selectCase(v) { selections.push(v); } } } };
  vm.runInNewContext(script, context);
  assert.deepEqual(selections, ['tea']);
  assert.match(link.href, /industryCase=tea/);
  active = 'electronic'; callbacks.click();
  const p = new URLSearchParams(link.href.split('?')[1]);
  assert.equal(p.get('case'), 'jiangfeng');
  assert.equal(p.get('industryCase'), 'electronic');
  assert.equal(p.get('from'), 'industry');
  assert.equal(selections.length, 1, 'navigating does not mutate model parameters');
});
