const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the real controller against the IDs from the real document. In particular,
// removing mainPlotNote must fail initialization, rather than pass syntax checks.
function controller() {
  const html = fs.readFileSync(path.join(__dirname, '../v11/industry-base.html'), 'utf8');
  const elements = new Map();
  function element(id) {
    const attributes = new Map();
    return { id, value: '', textContent: '', innerHTML: '', inert: false,
      style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute(k, v) { attributes.set(k, v); }, getAttribute(k) { return attributes.get(k); },
      querySelectorAll() { return []; }, focus() {}, dataset: {} };
  }
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) elements.set(match[1], element(match[1]));
  const frames = new Map(); let frameID = 0;
  const main = element('main'), header = element('header');
  const document = {
    activeElement: null, hidden: false,
    getElementById(id) { return elements.get(id) || null; },
    querySelectorAll() { return []; },
    querySelector(selector) { return selector === 'main' ? main : selector === 'header' ? header : null; },
    addEventListener() {}, dispatchEvent() {}
  };
  const motion = { reduced: { matches: false, addEventListener() {} }, systemMotion: { matches: false },
    html(id, value) { assert.ok(elements.has(id), 'Missing HTML target ' + id); elements.get(id).innerHTML = value; },
    number(node, value, digits) { node.textContent = value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }); },
    setReduced() {} };
  const context = { document, window: { RiskMotion: motion }, Set, Map, console,
    requestAnimationFrame(fn) { const id = ++frameID; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }, performance: { now: () => 0 },
    setTimeout() { return 1; }, clearTimeout() {},
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../v11/risk-lab.js'), 'utf8'), context);
  return { api: context.window.RiskLab, elements,
    flush() { for (const [id, fn] of [...frames]) { frames.delete(id); fn(300); } } };
}

test('V11 initializes all result, evidence, question and town containers', () => {
  const { elements } = controller();
  assert.equal(elements.get('primaryOutput').textContent, '987.6');
  assert.equal(elements.get('liveOutput').textContent, '987.6');
  assert.match(elements.get('mainPlotNote').textContent, /1000亿/);
  assert.match(elements.get('questionList').innerHTML, /data-question="2"/);
  assert.equal((elements.get('spatialNodes').innerHTML.match(/data-spatial-town=/g) || []).length, 16);
});

test('all five topics compute finite bounded scenarios and reset their controls', () => {
  const { api, elements, flush } = controller();
  for (const id of ['electronic', 'projects', 'tea', 'ring', 'innovation']) {
    api.selectCase(id);
    const state = api.getState(), result = api.metric(id, state.values);
    assert.ok(Number.isFinite(result.value), id + ' has a finite result');
    assert.ok(elements.get('primaryOutput').textContent !== '—', id + ' initializes detailed result');
  }
  api.selectCase('tea'); api.setValues([100, 100]); flush();
  assert.equal(elements.get('liveOutput').textContent, '80.0');
  api.selectCase('ring'); api.setValues([70, 100]); flush();
  assert.equal(elements.get('liveOutput').textContent, '44,700');
  api.selectCase('projects'); api.setValues([100]); flush();
  assert.equal(api.getState().values[0], 35, 'out-of-range inputs remain bounded');
});

test('sampling confidence changes precision; topic values and keyboard-sized steps persist', () => {
  const { api, elements, flush } = controller();
  api.selectCase('innovation');
  const initial = api.metric('innovation', api.getState().values).value;
  api.setValues([undefined, 5]); flush();
  const wider = api.metric('innovation', api.getState().values).value;
  assert.ok(wider > initial, '99.5% interval is wider than 95% for the same sample');
  assert.equal(elements.get('sliderValue2').textContent, '99.5%');
  api.setValues([240, 3]); flush();
  assert.ok(api.metric('innovation', api.getState().values).value < initial, 'larger sample narrows error');
  api.selectCase('electronic'); api.setValues([5.5]); flush();
  api.selectCase('tea'); api.selectCase('electronic');
  assert.equal(api.getState().values[0], 5.5);
});
