/* 独立行业试验。假设输入不代表真实销量或产能；不读取、不改写全县 GDP 内核。 */
(function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({ demand: 100, processing: 125, packing: 115, shipping: 130, uncertainty: 10, periods: 4, seed: 42 });
  const BRIDGES = Object.freeze({ none: { label: '暂不增补', processing: 0, packing: 0, shipping: 0 }, packaging: { label: '增补包装支持', processing: 0, packing: 30, shipping: 0 }, coordination: { label: '加强交付协调', processing: 0, packing: 0, shipping: 30 }, process: { label: '补加工承接', processing: 30, packing: 0, shipping: 0 } });
  function bound(value, low, high, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.min(high, Math.max(low, n)) : fallback; }
  function clean(input) { const p = input || {}; return { demand: bound(p.demand, 1, 100000, 100), processing: bound(p.processing, 1, 100000, 125), packing: bound(p.packing, 1, 100000, 115), shipping: bound(p.shipping, 1, 100000, 130), uncertainty: bound(p.uncertainty, 0, 30, 10), periods: Math.round(bound(p.periods, 1, 12, 4)), seed: Math.round(bound(p.seed, 1, 2147483647, 42)) }; }
  function random(seed) { let a = seed | 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function quantile(values, q) { const sorted = values.slice().sort((a, b) => a - b); const x = (sorted.length - 1) * q; const lo = Math.floor(x), hi = Math.ceil(x); return sorted[lo] + (sorted[hi] - sorted[lo]) * (x - lo); }
  function trajectory(input, bridge, rng) {
    const p = clean(input), b = BRIDGES[bridge] || BRIDGES.none; const wiggle = n => rng ? n * (1 + (rng() * 2 - 1) * p.uncertainty / 100) : n;
    let waitingProcess = 0, waitingPack = 0, waitingShip = 0, incoming = 0, delivered = 0; const rows = [];
    for (let t = 1; t <= p.periods; t++) {
      const arrived = wiggle(p.demand); incoming += arrived;
      const processed = Math.min(waitingProcess + arrived, wiggle(p.processing + b.processing)); waitingProcess += arrived - processed;
      const packed = Math.min(waitingPack + processed, wiggle(p.packing + b.packing)); waitingPack += processed - packed;
      const shipped = Math.min(waitingShip + packed, wiggle(p.shipping + b.shipping)); waitingShip += packed - shipped; delivered += shipped;
      rows.push({ period: t, arrived, processed, packed, shipped, waitingProcess, waitingPack, waitingShip, incoming, delivered });
    }
    return { rows, incoming, delivered, backlog: waitingProcess + waitingPack + waitingShip, share: delivered / incoming * 100, queues: { processing: waitingProcess, packing: waitingPack, shipping: waitingShip } };
  }
  function run(input, bridge = 'none', count = 400) {
    const p = clean(input), chosen = BRIDGES[bridge] ? bridge : 'none', b = BRIDGES[chosen], rng = random(p.seed); const samples = [], queues = [], n = Math.round(bound(count, 20, 2000, 400));
    for (let i = 0; i < n; i++) { const s = trajectory(p, chosen, rng); samples.push(s.share); queues.push(s.backlog); }
    const nominal = trajectory(p, chosen), caps = { processing: p.processing + b.processing, packing: p.packing + b.packing, shipping: p.shipping + b.shipping }; const sorted = Object.keys(caps).sort((a, z) => caps[a] - caps[z]);
    const minimum = caps[sorted[0]], ties = sorted.filter(k => Math.abs(caps[k] - minimum) < 0.00001); const labels = { processing: '加工承接', packing: '包装交付', shipping: '发货承接' };
    return { params: p, bridge: chosen, count: n, nominal, capacities: caps, pressure: Object.fromEntries(Object.entries(caps).map(([k, v]) => [k, p.demand / v])), bottleneck: p.demand > minimum ? sorted[0] : null, bottleneckLabel: p.demand > minimum ? ties.map(k => labels[k]).join('、') : '当前假设下均可承接', delivery: { low: quantile(samples, .1), middle: quantile(samples, .5), high: quantile(samples, .9) }, backlog: { low: quantile(queues, .1), middle: quantile(queues, .5), high: quantile(queues, .9) } };
  }
  function compare(input, bridge) { return { base: run(DEFAULTS, 'none'), current: run(input, 'none'), connected: run(input, bridge) }; }
  const api = Object.freeze({ DEFAULTS, BRIDGES, clean, run, compare, trajectory });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IndustryEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
