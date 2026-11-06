/* An additive handoff: the existing reality page and model calculations stay in charge. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('from') !== 'discovery') return;
  const C = window.BoluoDiscovery, context = C.context(params);
  const isIndustry = location.pathname.endsWith('/industry-base.html');
  const selectedCase = C.caseFor(context);
  const caseNames = { electronic: '电子信息', projects: '工业接续', tea: '柏塘春茶', ring: '环“两山”' };
  const container = document.createElement('aside');
  container.className = 'discovery-carry';
  container.setAttribute('aria-label', '从发现页带来的追问');
  const style = document.createElement('style');
  style.textContent = '.discovery-carry{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;margin:0 0 15px;background:#f8fbff;border:1px solid #cddff4;border-radius:11px;color:#486b8e;font:12px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}.discovery-carry-copy{min-width:0}.discovery-carry small{display:block;font-size:9px;letter-spacing:.04em;color:#849ab0}.discovery-carry strong{display:block;margin:3px 0;font-size:12px;font-weight:700;color:#34618b}.discovery-carry p{margin:3px 0 0;font-size:10px;color:#7d94aa}.discovery-carry-actions{display:flex;align-items:center;gap:9px;flex:none}.discovery-carry-actions a{display:inline-block;border:1px solid #b8d3f0;padding:7px 10px;border-radius:7px;color:#2371b9;background:white;white-space:nowrap;font-size:10px;text-decoration:none}.discovery-carry button{border:0;background:none;color:#7c94ab;font-size:11px;cursor:pointer;padding:6px}.discovery-carry a:focus-visible,.discovery-carry button:focus-visible{outline:3px solid #79b5f4;outline-offset:3px}@media(max-width:600px){.discovery-carry{padding:11px 12px;gap:8px;flex-wrap:wrap}.discovery-carry-copy{width:100%}.discovery-carry strong{font-size:11px}.discovery-carry-actions{width:100%}.discovery-carry-actions button{margin-left:auto}}';
  document.head.appendChild(style);
  const copy = document.createElement('div'); copy.className = 'discovery-carry-copy';
  const kicker = document.createElement('small'); kicker.textContent = '从发现页带来的追问' + (context.town ? ' · 发现页筛选：' + context.town : '');
  const question = document.createElement('strong'); question.textContent = C.question(context);
  const note = document.createElement('p');
  note.textContent = isIndustry ? '下方打开“' + caseNames[selectedCase] + '”条件实验；现实线索与实验假设分别看。' : '先把这条追问放回预期与现实中，再继续查看相关条件。';
  if (context.town) note.textContent += ' 镇街筛选不改变下方资料的统计范围。';
  copy.append(kicker, question, note);
  const actions = document.createElement('div'); actions.className = 'discovery-carry-actions';
  const next = document.createElement('a'); next.href = C.link(isIndustry ? 'reality.html' : 'industry-base.html', context); next.textContent = isIndustry ? '返回现实校准' : '查看相关条件实验 →';
  const home = document.createElement('a'); home.href = C.link('index.html', context); home.textContent = '返回发现';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '收起 ×'; close.setAttribute('aria-label', '收起发现页追问');
  close.onclick = () => {
    container.remove();
    const url = new URL(location.href);
    ['from', 'topic', 'inquiry', 'town', 'event', 'share'].forEach(key => url.searchParams.delete(key));
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  };
  actions.append(next, home, close); container.append(copy, actions);
  const main = document.querySelector('main');
  if (main) main.prepend(container); else document.querySelector('header')?.after(container);
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href === './index.html') link.href = C.link('index.html', context);
    if (href === './industry-base.html') link.href = C.link('industry-base.html', context);
    if (href === './reality.html') link.href = C.link('reality.html', context);
    if (href === './relations.html') link.href = C.link('relations.html', context);
  });
  if (isIndustry && window.RiskLab) window.RiskLab.selectCase(selectedCase);
})();
