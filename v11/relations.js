(() => {
  'use strict';
  const C = window.BoluoRelations, M = window.RiskMotion, $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const params = new URLSearchParams(location.search);
  let state = C.state(params), selectedEdge = state.edge, playing = false, playTimer = 0, toastTimer = 0, replayStep = 0, traceVersion = 0;
  let saved = [], notes = [], storageAvailable = true, dialogTrigger = null;
  let mobile = $('graphField').clientWidth < 600;
  try { saved = C.parseSaved(localStorage.getItem(C.savedKey)); notes = C.parseNotes(localStorage.getItem(C.notesKey)); } catch { storageAvailable = false; }
  // A previous public question may accompany this sample; it does not relabel its town or evidence.
  let carry = null;
  if (params.get('from') === 'discovery' && window.BoluoDiscovery) {
    carry = window.BoluoDiscovery.context(params);
    if (!params.has('case') && carry.event === 'jiangfeng') state.case = 'jiangfeng';
    $('carryContext').hidden = false;
    $('carryText').textContent = window.BoluoDiscovery.question(carry);
  } else if (params.get('from') === 'industry') {
    const names = { electronic: '电子信息', projects: '工业接续', tea: '柏塘春茶', ring: '环“两山”', innovation: '创新主体' };
    const id = params.get('industryCase');
    if (Object.hasOwn(names, id)) {
      if (!params.has('case')) state.case = id === 'electronic' ? 'jiangfeng' : 'hande';
      $('carryContext').hidden = false;
      $('carryText').textContent = '从“' + names[id] + '”条件实验，继续核实实际联系。园洲样本不代表该专题完整网络。';
    }
  }
  $('sharedNote').hidden = params.get('share') !== '1';
  function writeRecords() {
    try { localStorage.setItem(C.savedKey, JSON.stringify(saved)); localStorage.setItem(C.notesKey, JSON.stringify(notes)); storageAvailable = true; return true; }
    catch { storageAvailable = false; return false; }
  }
  function toast(message) {
    clearTimeout(toastTimer); $('relationsToast').textContent = message; $('relationsToast').classList.add('visible');
    toastTimer = setTimeout(() => $('relationsToast').classList.remove('visible'), 3300);
  }
  function updateURL() {
    const p = new URLSearchParams(C.query(state));
    if (carry) for (const [key, value] of new URLSearchParams(window.BoluoDiscovery.query(carry))) p.set(key, value);
    else if (params.get('from') === 'industry') {
      p.set('from', 'industry');
      if (['electronic', 'projects', 'tea', 'ring', 'innovation'].includes(params.get('industryCase'))) p.set('industryCase', params.get('industryCase'));
    }
    if (params.get('share') === '1') p.set('share', '1');
    history.replaceState(null, '', location.pathname + '?' + p);
  }
  function stopPlayback() {
    clearTimeout(playTimer); playing = false;
    traceVersion++; $('relationshipStage').classList.remove('trace');
    $('playHistory').setAttribute('aria-pressed', 'false');
    $('playHistory').setAttribute('aria-label', '回放已报道的前后变化');
    $('playHistory').innerHTML = '<span aria-hidden="true">▶</span>';
    $('snapshotNote').textContent = state.phase === 'before' ? C.data.cases[state.case].beforeNote : '报道时的关系快照 · 连线不代表因果，线宽不代表交易量。';
  }
  function change(patch) {
    stopPlayback();
    state = C.state(new URLSearchParams({ ...state, ...patch, edge: patch.edge || '' })); selectedEdge = state.edge;
    render();
  }
  function trace() {
    const version = ++traceVersion;
    $('relationshipStage').classList.remove('trace');
    if (M.reduced.matches) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (version === traceVersion) $('relationshipStage').classList.add('trace'); }));
  }
  function showDialog(kicker, title, body) {
    stopPlayback();
    if (!$('detailDialog').open) dialogTrigger = document.activeElement;
    $('dialogKicker').textContent = kicker;
    $('dialogBody').innerHTML = '<h2 id="dialogTitle">' + esc(title) + '</h2>' + body;
    if (!$('detailDialog').open) $('detailDialog').showModal();
    $('closeDialog').focus();
  }
  function closeDialog() { $('detailDialog').close(); }
  $('closeDialog').onclick = closeDialog;
  $('detailDialog').addEventListener('close', () => { if (dialogTrigger?.isConnected) dialogTrigger.focus(); });
  $('detailDialog').addEventListener('click', event => { if (event.target === $('detailDialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  const block = (label, text) => '<div class="detail-block"><span>' + esc(label) + '</span><p>' + esc(text) + '</p></div>';
  function sourceHTML() {
    const s = C.data.source || {};
    const name = s.publisher || '公开报道';
    return '<div class="detail-block"><span>' + esc(name + ' · 公开报道线索') + '</span><p>这条联系来自公开报道；完整来源清单（含日期与版本）可向作者索取。</p></div>';
  }
  function openBoundary() {
    showDialog('公开资料 / 来源与边界', '连线说了什么？',
      '<p>本页从同一篇报道中的两份企业样本出发。已有报道和待核实问题分别显示，不代表全县完整供应链。</p>' +
      block('已有报道 · 实线', '报道可支持企业、订单、采购或道路记录的对应。线宽不代表交易量，关联不等于已识别经济因果。') +
      block('待核实 · 虚线', '连接的是需要查清的条件，不表示已形成交易或实际影响。未查到记录不等于没有合作。') +
      block('两个约40%', '一个分母是汉德配套采购，另一个是密特斯业务。不能相加、相减，也不能作为同一份资金的分配。') +
      block('前后回放', '只切换报道明确披露的离散快照。早期未披露的联系用“当时未披露”表示，不当成零，也不补成连续经营曲线。') +
      block('工作与通勤', '现有资料不足以计算新增岗位、个人收入或实际通勤收益。未知条件以问题呈现，不用计划投资自动推算。') + sourceHTML());
  }
  function itemDetail(item, status) {
    if (status === 'unreported') return '该联系在早期快照中未披露。不能据此判断当时不存在；可切回“报道时”查看后来公开的记录。';
    return item.detail;
  }
  function showItemEvidence() {
    const snap = C.snapshot(state), item = selectedEdge ? snap.edges.find(e => e.id === selectedEdge) : snap.nodes.find(n => n.id === state.item);
    if (!item) return openBoundary();
    showDialog(item.status === 'record' ? '已有报道 / 核实边界' : '未知条件 / 下一条证据', item.label,
      '<p>' + esc(itemDetail(item, item.status)) + '</p>' +
      block('当前快照', snap.record.snapshots[state.phase]) +
      block('不能据此认定', item.boundary || '关系记录不等于经济因果，也不代表掌握完整交易量。') +
      block('下一步核实', item.next || snap.insight.question) +
      (item.source && item.status !== 'unreported' ? sourceHTML() : '<p><small>这里是待核实问题，没有给它附加一个虚构的实测来源。</small></p>'));
  }
  function openQuestion(id) {
    const q = C.question(state, id); if (!q) return;
    showDialog('还差哪条证据', q.label, '<p>' + esc(q.ask) + '</p>' + block('值得查找', q.evidence) +
      '<div class="dialog-actions"><button class="button primary" id="recordQuestion" type="button">记下这条待核实问题</button></div><small>保存在本机，不会自动发布或发送给他人。</small>');
    $('recordQuestion').onclick = () => openEvidence(q.ask);
  }
  function positions() {
    return mobile ? {
      width: 360, height: 430, w: 136, h: 66,
      points: [[83, 65], [270, 65], [270, 210], [83, 210], [83, 355], [270, 355]],
      labels: [[177, 65], [270, 139], [177, 139], [83, 281], [270, 282]]
    } : {
      width: 960, height: 340, w: 228, h: 80,
      points: [[148, 103], [480, 103], [812, 103], [205, 264], [480, 264], [790, 264]],
      labels: [[315, 103], [647, 103], [340, 185], [340, 264], [665, 190]]
    };
  }
  function curve(a, b, p) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (!mobile && Math.abs(dy) < 10 && Math.abs(dx) > 400) {
      const bottom = p.height - 14;
      return 'M' + a[0] + ',' + (a[1] + (a[2] || p.h) / 2) + ' C' + a[0] + ',' + bottom + ' ' + a[0] + ',' + bottom + ' ' + ((a[0] + b[0]) / 2) + ',' + bottom + ' S' + b[0] + ',' + bottom + ' ' + b[0] + ',' + (b[1] + (b[2] || p.h) / 2);
    }
    if (mobile && Math.abs(dx) < 10 && Math.abs(dy) > 200) {
      const side = a[0] > p.width / 2 ? p.width - 9 : 9;
      const x1 = a[0] + (side > a[0] ? 1 : -1) * (a[3] || p.w) / 2, x2 = b[0] + (side > b[0] ? 1 : -1) * (b[3] || p.w) / 2;
      return 'M' + x1 + ',' + a[1] + ' C' + side + ',' + a[1] + ' ' + side + ',' + (a[1] + 30) + ' ' + side + ',' + (a[1] + 55) + ' L' + side + ',' + (b[1] - 40) + ' Q' + side + ',' + b[1] + ' ' + x2 + ',' + b[1];
    }
    if (Math.abs(dx) > Math.abs(dy) * 1.15) {
      const direction = Math.sign(dx), x1 = a[0] + direction * (a[3] || p.w) / 2, x2 = b[0] - direction * (b[3] || p.w) / 2;
      return 'M' + x1 + ',' + a[1] + ' C' + (x1 + x2) / 2 + ',' + a[1] + ' ' + (x1 + x2) / 2 + ',' + b[1] + ' ' + x2 + ',' + b[1];
    }
    const direction = Math.sign(dy) || 1, y1 = a[1] + direction * (a[2] || p.h) / 2, y2 = b[1] - direction * (b[2] || p.h) / 2;
    return 'M' + a[0] + ',' + y1 + ' C' + a[0] + ',' + (y1 + y2) / 2 + ' ' + b[0] + ',' + (y1 + y2) / 2 + ' ' + b[0] + ',' + y2;
  }
  function renderGraph(snap) {
    $('graphField').classList.toggle('is-narrow', mobile);
    const p = positions(), points = new Map(snap.nodes.map((node, i) => [node.id, [...p.points[i], node.id === 'company' ? (mobile ? 84 : 104) : p.h, node.kind === 'question' && !mobile ? 190 : p.w]]));
    const nodeHTML = snap.nodes.map((node, i) => {
      const [x, y] = p.points[i], selected = node.id === state.item;
      const sub = node.status === 'unreported' ? '当时未披露' : node.sub;
      return '<button type="button" data-node="' + node.id + '" class="graph-node status-' + node.status + (node.id === 'company' ? ' is-company' : '') + (node.id === 'supplier' ? ' is-supplier' : '') + '" style="--node-left:' + 100 * x / p.width + '%;--node-top:' + 100 * y / p.height + '%;--node-width:' + 100 * points.get(node.id)[3] / p.width + '%" aria-pressed="' + selected + '" aria-label="' + esc(node.label + '，' + sub + '，点击查看') + '"><svg aria-hidden="true"><use href="#i-' + node.icon + '"/></svg><span class="graph-node-copy"><strong>' + esc(node.label) + '</strong><small>' + esc(sub) + '</small></span></button>';
    }).join('');
    M.html('graphNodes', nodeHTML);
    const edgeHTML = snap.edges.map((edge, i) => {
      const a = points.get(edge.a), b = points.get(edge.b), d = curve(a, b, p);
      const label = edge.status === 'unreported' ? '当时未披露' : edge.label;
      const labelWidth = mobile ? Math.max(42, label.length * 8 + 8) : Math.max(64, label.length * 11 + 16);
      // Place labels from the actual endpoints, not from an unrelated case's edge order.
      let lx = (a[0] + b[0]) / 2, ly = (a[1] + b[1]) / 2;
      if (!mobile && Math.abs(a[1] - b[1]) < 10 && Math.abs(a[0] - b[0]) > 400) ly = p.height - 14;
      if (mobile && Math.abs(a[0] - b[0]) < 10 && Math.abs(a[1] - b[1]) > 200) { lx = a[0] > p.width / 2 ? 289 : 71; ly = 285; }
      const focused = selectedEdge === edge.id || (state.item && [edge.a, edge.b].includes(state.item));
      return '<g class="edge status-' + edge.status + (focused ? ' focused' : '') + '" data-edge="' + edge.id + '" role="button" tabindex="0" aria-label="' + esc(label + '，' + (edge.status === 'record' ? '已有报道' : edge.status === 'unreported' ? '早期未披露' : '待核实问题')) + '"><path class="edge-base" d="' + d + '"/><path class="edge-trace" pathLength="1" d="' + d + '"/><path class="edge-hit" d="' + d + '"/><rect class="edge-label-bg" x="' + (lx - labelWidth / 2) + '" y="' + (ly - (mobile ? 9 : 12)) + '" width="' + labelWidth + '" height="' + (mobile ? 18 : 24) + '" rx="' + (mobile ? 8 : 11) + '"/><text class="edge-label" x="' + lx + '" y="' + ly + '">' + esc(label) + '</text></g>';
    }).join('');
    M.html('graphEdges', '<svg viewBox="0 0 ' + p.width + ' ' + p.height + '" role="group" aria-label="已有报道和待核实问题的关系示意">' + edgeHTML + '</svg>', false);
  }
  function renderSelection(snap) {
    const selected = selectedEdge ? snap.edges.find(e => e.id === selectedEdge) : snap.nodes.find(n => n.id === state.item);
    $('selectedDetail').hidden = !selected;
    if (!selected) return;
    $('selectedStatus').textContent = selected.status === 'record' ? '已有报道 · B级线索' : selected.status === 'unreported' ? '这个早期快照未披露' : '待核实 · 不是实测影响';
    $('selectedTitle').textContent = selected.label;
    $('selectedText').textContent = itemDetail(selected, selected.status);
  }
  function renderSavedCount() {
    $('savedCount').textContent = String(saved.length);
    const already = saved.some(v => C.key(v) === C.key(state));
    $('saveFinding').classList.toggle('is-saved', already);
    $('saveLabel').textContent = already ? '已收下 · 查看我的发现' : '带走这条发现';
    $('localNote').textContent = storageAvailable ? '发现与补充记录保存在本机。' : '本次可暂存；浏览器未允许持久保存，请导出。';
  }
  function render() {
    state.edge = selectedEdge;
    const snap = C.snapshot(state), v = snap.view, record = snap.record;
    $('pageTitle').textContent = record.title; $('pageSubtitle').textContent = record.subtitle;
    $('caseSelect').value = state.case; $('stageHeading').textContent = v.heading;
    document.title = record.title + '｜关系世界 · 博罗决策风洞';
    document.querySelectorAll('[data-view]').forEach(b => { const active = b.dataset.view === state.view; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
    $('relationshipStage').setAttribute('aria-labelledby', 'view-' + state.view);
    document.querySelectorAll('[data-lens]').forEach(b => { const active = b.dataset.lens === state.lens; b.setAttribute('aria-pressed', String(active)); b.classList.toggle('selected', active); });
    document.querySelectorAll('[data-phase]').forEach(b => { const active = b.dataset.phase === state.phase; b.setAttribute('aria-pressed', String(active)); b.classList.toggle('selected', active); });
    $('phaseBefore').textContent = state.case === 'hande' ? '最初' : '初次量产';
    $('stagePeriod').textContent = record.period;
    M.html('stageMetrics', snap.metrics.map((metric, index) => '<button type="button" data-metric="' + index + '" class="stage-metric tone-' + metric.tone + '" aria-label="' + esc(metric.label + '：' + metric.text + '，点击看口径') + '"><span class="metric-label">' + esc(metric.label) + '</span><strong class="metric-value' + (!/[0-9]/.test(metric.text) ? ' textual' : '') + '">' + esc(metric.text) + '</strong><span class="metric-note">' + esc(state.phase === 'before' ? (metric.before === '未披露' ? '当时未披露，不等于零' : record.beforeLabel) : metric.note) + '</span></button>').join(''));
    $('insightTitle').innerHTML = (state.phase === 'before' ? ['早期记录，', '只展开已披露。'] : snap.insight.title).map(esc).join('<br>');
    $('insightText').textContent = state.phase === 'before' ? record.beforeNote : snap.insight.copy;
    $('bridgeTitle').textContent = state.view === 'orders' ? '这座桥，还差什么？' : state.view === 'jobs' ? '这份工作，还差什么？' : '这一程，还差什么？';
    M.html('questionChips', v.questions.map(q => '<button data-question="' + q.id + '" type="button">' + esc(q.label) + '<span aria-hidden="true"> ⓘ</span></button>').join(''));
    $('bridgeQuestion').textContent = snap.insight.question;
    $('nextQuestion').textContent = snap.insight.question; $('takeaway').textContent = record.takeaway;
    $('snapshotNote').textContent = state.phase === 'before' ? record.beforeNote : '报道时的关系快照 · 连线不代表因果，线宽不代表交易量。';
    if (playing) $('snapshotNote').textContent = replayStep === 0 ? '正在回放：' + record.beforeNote : replayStep === 1 ? '正在展开报道时的已有联系；缺少的早期记录不补为零。' : '继续看不同人的处境：机会、依赖和待核实条件分别看。';
    const back = new URLSearchParams(carry ? window.BoluoDiscovery.query(carry) : 'from=relations');
    back.set('relationCase', state.case);
    back.set('industryCase', ['electronic', 'projects', 'tea', 'ring', 'innovation'].includes(params.get('industryCase')) ? params.get('industryCase') : state.case === 'jiangfeng' ? 'electronic' : 'projects');
    $('backIndustry').href = './industry-base.html?' + back;
    $('industryNav').href = $('backIndustry').getAttribute('href');
    renderGraph(snap); renderSelection(snap); renderSavedCount(); updateURL(); trace();
  }
  function pickNode(id) {
    const snap = C.snapshot(state), node = snap.nodes.find(n => n.id === id); if (!node) return;
    stopPlayback();
    if (state.view === 'orders' && node.kind === 'question' && ['jobs', 'access'].includes(id)) return change({ view: id === 'jobs' ? 'jobs' : 'commute', item: '' });
    if (state.view === 'jobs' && id === 'access') return change({ view: 'commute', item: '' });
    state.item = state.item === id && !selectedEdge ? '' : id; selectedEdge = ''; render();
    if (mobile && state.item) {
      $('selectedDetail').setAttribute('role', 'status');
      toast(node.label + '：' + (node.status === 'record' ? '已有报道，详情已在下方展开' : '待核实条件，详情已在下方展开'));
    }
  }
  function pickEdge(id) {
    if (!C.snapshot(state).edges.some(e => e.id === id)) return;
    stopPlayback(); selectedEdge = selectedEdge === id ? '' : id; state.item = ''; render();
    if (mobile && selectedEdge) toast('这条联系的依据与边界，已在下方展开');
  }
  $('graphNodes').addEventListener('click', event => { const b = event.target.closest('[data-node]'); if (b) pickNode(b.dataset.node); });
  $('graphEdges').addEventListener('click', event => { const b = event.target.closest('[data-edge]'); if (b) pickEdge(b.dataset.edge); });
  $('graphEdges').addEventListener('keydown', event => { const b = event.target.closest('[data-edge]'); if (b && ['Enter', ' '].includes(event.key)) { event.preventDefault(); pickEdge(b.dataset.edge); } });
  $('stageMetrics').addEventListener('click', event => {
    const b = event.target.closest('[data-metric]'); if (!b) return;
    const snap = C.snapshot(state), m = snap.metrics[Number(b.dataset.metric)];
    showDialog('数字与口径 / ' + snap.record.snapshots[state.phase], m.label + '：' + m.text,
      block('这项记录', state.phase === 'before' ? snap.record.beforeNote : m.note) +
      block('统计对象', m.denominator || '现有公开报道没有足够资料作定量判断；未披露不当成零。') +
      (m.source ? sourceHTML() : block('下一步核实', snap.insight.question)));
  });
  $('questionChips').addEventListener('click', event => { const b = event.target.closest('[data-question]'); if (b) openQuestion(b.dataset.question); });
  $('caseSelect').onchange = () => change({ case: $('caseSelect').value, phase: 'current', item: '' });
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => change({ view: b.dataset.view, item: '' }));
  document.querySelectorAll('[data-lens]').forEach(b => b.onclick = () => change({ lens: b.dataset.lens }));
  document.querySelectorAll('[data-phase]').forEach(b => b.onclick = () => change({ phase: b.dataset.phase }));
  $('clearSelection').onclick = () => { state.item = ''; selectedEdge = ''; render(); };
  $('openSelectedEvidence').onclick = showItemEvidence;
  $('openBoundary').onclick = $('openSources').onclick = openBoundary;
  $('resetGraph').onclick = () => { change({ view: 'orders', lens: 'company', phase: 'current', item: '' }); toast('已回到该案例的报道时订单视角'); };
  document.querySelector('.view-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const list = C.data.views, at = list.indexOf(state.view);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (at + (event.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
    change({ view: list[next], item: '' }); $('view-' + list[next]).focus();
  });
  function playHistory() {
    if (playing) return stopPlayback();
    if (M.reduced.matches) { toast('已启用减少动态；可点“最初”和“报道时”逐步查看。'); return; }
    playing = true; replayStep = 0; selectedEdge = ''; state.phase = 'before'; state.item = '';
    $('playHistory').setAttribute('aria-pressed', 'true'); $('playHistory').setAttribute('aria-label', '暂停关系回放'); $('playHistory').innerHTML = '<span aria-hidden="true">Ⅱ</span>'; render();
    playTimer = setTimeout(() => {
      if (!playing) return;
      replayStep = 1; state.phase = 'current'; state.item = 'company'; render();
      playTimer = setTimeout(() => {
        if (!playing) return;
        replayStep = 2; state.lens = 'company'; state.item = C.snapshot(state).nodes.some(n => n.id === 'supplier') ? 'supplier' : '';
        render();
        playTimer = setTimeout(() => { stopPlayback(); render(); toast('回放结束。只展示已披露的快照，不补造中间数据。'); }, 2300);
      }, 2400);
    }, 2400);
  }
  $('playHistory').onclick = playHistory;
  function openEvidence(prefill = '') {
    showDialog('补充记录 / 本机保存', '把下一条证据记下来',
      '<p>写下你发现的公开资料，或仍需核实的问题。这里保存草稿，不自动发布。</p><form id="evidenceForm" class="evidence-form"><label for="evidenceBody">内容或待核实问题</label><textarea id="evidenceBody" minlength="4" maxlength="600" required placeholder="例如：找到一份带日期的岗位说明，仍需核实工作地点。">' + esc(prefill) + '</textarea><label for="evidenceURL">公开来源链接（可选）</label><input id="evidenceURL" type="url" maxlength="1000" placeholder="https://…"><p class="form-error" id="formError" role="alert"></p><small>不要记录个人隐私或商业敏感信息。补充记录标为待核验，不会改变画布上的已报道联系。</small><div class="dialog-actions"><button class="button primary" type="submit">保存到本机</button></div></form>');
    $('evidenceForm').onsubmit = event => {
      event.preventDefault();
      const record = C.evidence({ ...state, body: $('evidenceBody').value, url: $('evidenceURL').value, date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) });
      if (!record) { $('formError').textContent = '请填写至少4个字，链接需为不带账号密码的 http 或 https 地址。'; return; }
      notes = [record, ...notes].slice(0, 50); const stored = writeRecords(); closeDialog(); renderSavedCount(); toast(stored ? '已保存待核实记录；未发布到公共页面' : '已暂存本次记录，请在“我的发现”中导出');
    };
    $('evidenceBody').focus();
  }
  $('addEvidence').onclick = () => openEvidence();
  function exportRecords() {
    const blob = new Blob([JSON.stringify({ schema: 'boluo-relations/v1', dataVersion: C.data.version, findings: saved, unreviewedEvidence: notes }, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'boluo-relations-findings.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); toast('已导出发现与待核实记录');
  }
  function openSaved() {
    const findings = saved.map((v, i) => {
      const snap = C.snapshot(v), n = snap.nodes.find(node => node.id === v.item) || snap.edges.find(edge => edge.id === v.edge);
      return '<article class="saved-item"><strong>' + esc(snap.record.label + ' · ' + snap.view.label) + '</strong><p>' + esc(snap.insight.question) + '</p><small>' + esc(snap.record.snapshots[v.phase] + (n ? ' · ' + n.label : '')) + '</small><div class="saved-item-actions"><button type="button" data-open-finding="' + i + '">打开这段关系 →</button><button type="button" data-remove-finding="' + i + '">移除</button></div></article>';
    }).join('');
    const evidence = notes.map((n, i) => '<article class="saved-item"><strong>待核实记录 · ' + esc(C.data.cases[n.case].label) + '</strong><p>' + esc(n.body) + '</p>' + (n.url ? '<p><a href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer">公开来源 ↗</a></p>' : '') + '<small>本机草稿 · 尚未核验 ' + esc(n.date) + '</small><div class="saved-item-actions"><button type="button" data-remove-note="' + i + '">移除记录</button></div></article>').join('');
    showDialog('我的发现 / 当前设备', '收下的发现与问题', '<p>这里有 ' + saved.length + ' 条发现、' + notes.length + ' 条待核实记录。可导出自行保留。</p>' + (findings || '<p class="empty-records">还没有收下发现。看到值得继续核实的联系时，点“带走这条发现”。</p>') + (evidence ? '<h3>补充记录</h3>' + evidence : '') + '<div class="dialog-actions"><button class="button" id="exportRecords" type="button">导出记录 JSON ↓</button></div>');
    $('exportRecords').onclick = exportRecords;
    $('dialogBody').querySelectorAll('[data-open-finding]').forEach(b => b.onclick = () => { const v = saved[Number(b.dataset.openFinding)]; closeDialog(); change(v); $('relationshipStage').focus(); });
    $('dialogBody').querySelectorAll('[data-remove-finding]').forEach(b => b.onclick = () => { saved.splice(Number(b.dataset.removeFinding), 1); writeRecords(); renderSavedCount(); openSaved(); });
    $('dialogBody').querySelectorAll('[data-remove-note]').forEach(b => b.onclick = () => { notes.splice(Number(b.dataset.removeNote), 1); writeRecords(); renderSavedCount(); openSaved(); });
  }
  $('openSaved').onclick = openSaved;
  $('saveFinding').onclick = () => {
    if (saved.some(v => C.key(v) === C.key(state))) return openSaved();
    saved = [{ ...state }, ...saved].slice(0, 50); const stored = writeRecords(); renderSavedCount(); toast(stored ? '已收下这段关系，可在“我的发现”中继续查看' : '本次已暂存，浏览器未允许持久保存，请导出');
  };
  function showCopyFallback(url) {
    showDialog('分享 / 只携带公开场景', '把这段关系交给朋友看', '<p>朋友可切换视角独立核实。链接不携带本机补充内容或个人记录。</p><label class="sr-only" for="shareURL">分享链接</label><input class="copy-input" id="shareURL" readonly value="' + esc(url) + '"><p><small>复制上面的完整链接即可分享。</small></p>'); $('shareURL').focus(); $('shareURL').select();
  }
  $('shareFinding').onclick = async () => {
    const url = new URL(location.pathname, location.origin); url.search = C.query(state, true);
    try { if (!navigator.clipboard?.writeText) throw new Error('manual-copy'); await navigator.clipboard.writeText(url.href); toast('公开关系链接已复制；不含本机补充记录'); }
    catch { showCopyFallback(url.href); }
  };
  let manualReduced = false;
  $('reduceMotion').onclick = () => { manualReduced = !manualReduced; M.setReduced(manualReduced); };
  M.reduced.addEventListener('change', () => {
    stopPlayback(); $('reduceMotion').setAttribute('aria-pressed', String(M.reduced.matches));
    $('reduceMotion').textContent = M.systemMotion.matches ? '已随系统减少动态' : manualReduced ? '恢复动态' : '减少动态';
    $('relationshipStage').classList.remove('trace');
  });
  $('reduceMotion').setAttribute('aria-pressed', String(M.reduced.matches));
  if (M.systemMotion.matches) $('reduceMotion').textContent = '已随系统减少动态';
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
  window.addEventListener('pagehide', stopPlayback);
  new ResizeObserver(() => { const next = $('graphField').clientWidth < 600; if (next !== mobile) { mobile = next; renderGraph(C.snapshot(state)); } }).observe($('graphField'));
  window.addEventListener('popstate', () => { state = C.state(location.search); selectedEdge = state.edge; stopPlayback(); render(); });
  window.BoluoRelationsUI = { getState: () => ({ ...state, playing, selectedEdge, mobile }), snapshot: () => C.snapshot(state) };
  render();
})();
