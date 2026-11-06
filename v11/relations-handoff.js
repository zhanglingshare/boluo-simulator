/* Navigation context only; the existing industry model owns its calculations. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const valid = ['electronic', 'projects', 'tea', 'ring', 'innovation'];
  if (window.RiskLab && params.has('relationCase') && valid.includes(params.get('industryCase'))) window.RiskLab.selectCase(params.get('industryCase'));
  const prepare = link => {
    const isIndustry = Boolean(window.RiskLab), carry = params.get('from') === 'discovery' && window.BoluoDiscovery;
    const p = new URLSearchParams(carry ? window.BoluoDiscovery.query(window.BoluoDiscovery.context(params)) : '');
    if (isIndustry) {
      const id = window.RiskLab.getState().case;
      p.set('industryCase', id);
      p.set('case', id === 'electronic' ? 'jiangfeng' : id === 'tea' ? 'tea' : id === 'ring' ? 'mobility' : 'hande');
      if (!carry) p.set('from', 'industry');
    }
    link.href = './relations.html' + (p.size ? '?' + p : '');
  };
  document.querySelectorAll('[data-next-relations]').forEach(link => {
    prepare(link);
    for (const event of ['pointerdown', 'focus', 'click']) link.addEventListener(event, () => prepare(link));
  });
})();
