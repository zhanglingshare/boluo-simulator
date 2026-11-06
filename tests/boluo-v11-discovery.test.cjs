const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../v11/discovery-core.js');
const D = C.data;

test('discovery data keeps source, period, scope and unmeasured stages explicit', () => {
  assert.equal(D.towns.length, 16);
  assert.equal(new Set(D.towns).size, 16);
  assert.equal(D.events.length, 8);
  assert.equal(new Set(D.events.map(item => item.id)).size, D.events.length);
  for (const item of D.events) {
    assert.ok(D.topics[item.topic], item.id);
    assert.ok(D.sources[item.source], item.id);
    assert.ok(item.town === null || D.towns.includes(item.town));
    assert.match(item.date, /^2026-\d{2}-\d{2}$/);
    assert.ok(item.boundary && item.next);
    assert.ok(D.topics[item.topic].inquiries.some(q => q.id === item.inquiry));
  }
  for (const source of Object.values(D.sources)) assert.equal(new URL(source.url).protocol, 'https:');
  assert.equal(D.topics.factory.metrics[1].value, -44.7);
  assert.equal(D.topics.factory.metrics[0].value, 8.9);
  assert.equal(D.topics.food.metrics[0].value, 9.8);
  assert.equal(D.topics.food.metrics[1].value, 1.6);
  assert.match(C.eventById('hande').detail, /施工/);
  assert.match(C.eventById('hande').boundary, /不足以认定投产/);
  assert.match(C.eventById('cement').boundary, /仅限这一条/);
});

test('town and topic filtering never assigns county totals to an arbitrary town', () => {
  assert.deepEqual(C.filter({ town: '柏塘镇' }).map(item => item.id), ['tea']);
  assert.equal(C.filter({ town: '柏塘镇', topic: 'food' }).length, 0);
  assert.equal(C.filter({ town: '罗阳街道' }).length, 0);
  assert.deepEqual(C.filter({ town: '公庄镇', topic: 'factory' }).map(item => item.id), ['cement']);
  assert.ok(C.filter({ topic: 'projects' }).every(item => item.topic === 'projects'));
  assert.equal(C.filter({ topic: 'all' }).length, D.events.length);
  assert.equal(C.context('topic=projects&town=柏塘镇&event=hande').event, '', '园洲项目不能被携带成柏塘项目');
  assert.equal(C.context('topic=food&town=柏塘镇&event=food').event, '', '县域消费数据不能被归到柏塘');
});

test('handoff links round trip only allowed public scene and choice identifiers', () => {
  const value = { topic: 'agriculture', inquiry: 'tea', event: 'tea', town: '柏塘镇' };
  const url = C.link('reality.html', value);
  assert.deepEqual(C.context(url.split('?')[1]), value);
  assert.match(C.link('index.html', value, true), /share=1/);
  assert.throws(() => C.link('https://example.com', value), /Unsupported/);
  const invalid = C.context('topic=__proto__&inquiry=<script>&town=虚构镇&event=unknown');
  assert.deepEqual(invalid, { topic: 'factory', inquiry: '', town: '', event: '' });
  assert.equal(C.caseFor(value), 'tea');
  assert.equal(C.caseFor({ topic: 'factory', event: 'jiangfeng' }), 'electronic');
  assert.equal(C.caseFor({ topic: 'factory', event: 'hande' }), 'projects');
});

test('saved inquiries are bounded, deduplicated and never invented for an empty selection', () => {
  const item = { topic: 'projects', inquiry: 'progress', town: '', event: 'hande' };
  assert.deepEqual(C.parseSaved('bad json'), []);
  assert.deepEqual(C.parseSaved('{"length":100}'), []);
  assert.equal(C.parseSaved(JSON.stringify([item, item, null, { topic: 'food' }])).length, 1);
  assert.match(C.question(item), /最新/);
  assert.equal(C.question({ topic: 'food', inquiry: '' }), D.topics.food.defaultQuestion);
});

function bridge(search, industry) {
  const created = [], inserted = [], selected = [];
  const element = tag => ({ tag, children: [], append(...nodes) { this.children.push(...nodes); }, setAttribute() {}, remove() {} });
  const main = { prepend(node) { inserted.push(node); } };
  const document = {
    head: { appendChild(node) { created.push(node); } },
    createElement: element, querySelector(selector) { return selector === 'main' ? main : null; }, querySelectorAll() { return []; }
  };
  const context = { URLSearchParams, URL, document, history: { replaceState() {} },
    location: { search, pathname: '/v11/' + (industry ? 'industry-base.html' : 'reality.html') },
    window: { BoluoDiscovery: C, RiskLab: { selectCase(id) { selected.push(id); } } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../v11/discovery-bridge.js'), 'utf8'), context);
  return { created, inserted, selected };
}

test('the bridge is inert for ordinary visitors and uses the existing public model API only for a handoff', () => {
  const ordinary = bridge('', true);
  assert.equal(ordinary.inserted.length, 0);
  assert.equal(ordinary.selected.length, 0);
  const carried = bridge('?from=discovery&topic=agriculture&inquiry=tea&town=柏塘镇&event=tea', true);
  assert.equal(carried.inserted.length, 1);
  assert.deepEqual(carried.selected, ['tea']);
  const reality = bridge('?from=discovery&topic=food&inquiry=overnight&event=food', false);
  assert.equal(reality.inserted.length, 1);
  assert.equal(reality.selected.length, 0);
});

test('all controller IDs exist in the real discovery document', () => {
  const html = fs.readFileSync(path.join(__dirname, '../v11/index.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '../v11/discovery.js'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of script.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(match[1]), 'Missing #' + match[1]);
});
