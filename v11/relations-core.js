(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./relations-data.js'));
  else root.BoluoRelations = factory(root.BoluoRelationsData);
})(typeof window !== 'undefined' ? window : this, function (data) {
  'use strict';
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const savedKey = 'boluo-v11/relations-findings/v1';
  const notesKey = 'boluo-v11/relations-evidence/v1';
  function state(input) {
    const p = input instanceof URLSearchParams ? input : new URLSearchParams(input || '');
    const caseId = own(data.cases, p.get('case')) ? p.get('case') : 'hande';
    const view = data.views.includes(p.get('view')) ? p.get('view') : 'orders';
    const lens = data.lenses.includes(p.get('lens')) ? p.get('lens') : 'company';
    const phase = data.phases.includes(p.get('phase')) ? p.get('phase') : 'current';
    const scene = data.cases[caseId].views[view];
    const item = scene.nodes.some(n => n.id === p.get('item')) ? p.get('item') : '';
    const edge = scene.edges.some(e => e.id === p.get('edge')) ? p.get('edge') : '';
    return { case: caseId, view, lens, phase, item: edge ? '' : item, edge };
  }
  function snapshot(value) {
    const clean = state(new URLSearchParams(value)), record = data.cases[clean.case], view = record.views[clean.view];
    const available = item => clean.phase === 'current' || item.at === 'both';
    return {
      state: clean, record, view,
      metrics: view.metrics.map(m => ({ ...m, text: m[clean.phase] })),
      nodes: view.nodes.map(n => ({ ...n, status: n.kind === 'question' ? 'question' : available(n) ? 'record' : 'unreported' })),
      edges: view.edges.map(e => ({ ...e, status: e.kind === 'question' ? 'question' : available(e) ? 'record' : 'unreported' })),
      insight: view.insights[clean.lens]
    };
  }
  function query(value, shared = false) {
    const clean = state(new URLSearchParams(value));
    const p = new URLSearchParams({ case: clean.case, view: clean.view, lens: clean.lens, phase: clean.phase });
    if (clean.item) p.set('item', clean.item);
    if (clean.edge) p.set('edge', clean.edge);
    if (shared) p.set('share', '1');
    return p.toString();
  }
  const key = value => query(value);
  function parseSaved(raw) {
    try {
      const values = JSON.parse(raw || '[]');
      if (!Array.isArray(values)) return [];
      return [...new Map(values.filter(v => v && typeof v === 'object' && own(data.cases, v.case)).map(v => {
        const clean = state(new URLSearchParams(v)); return [key(clean), clean];
      })).values()].slice(0, 50);
    } catch { return []; }
  }
  function evidence(input) {
    const body = typeof input.body === 'string' ? input.body.trim().slice(0, 600) : '';
    const raw = typeof input.url === 'string' ? input.url.trim().slice(0, 1000) : '';
    let url = '';
    if (raw) {
      try { const parsed = new URL(raw); if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return null; url = parsed.href; } catch { return null; }
    }
    if (body.length < 4) return null;
    return { ...state(new URLSearchParams(input)), body, url, status: 'unreviewed', date: /^\d{4}-\d{2}-\d{2}$/.test(input.date || '') ? input.date : '' };
  }
  function parseNotes(raw) {
    try { const values = JSON.parse(raw || '[]'); return Array.isArray(values) ? values.filter(v => v && typeof v === 'object').map(evidence).filter(Boolean).slice(0, 50) : []; } catch { return []; }
  }
  function question(value, id) {
    const clean = state(new URLSearchParams(value));
    return data.cases[clean.case].views[clean.view].questions.find(q => q.id === id) || null;
  }
  return { data, state, snapshot, query, key, parseSaved, evidence, parseNotes, question, savedKey, notesKey };
});
