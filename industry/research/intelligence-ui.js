(function (root) {
  'use strict';
  root.createTeaResearchUI = function (getContext) {
    const ctx = () => getContext();
    const current = () => ctx().I.hypotheses.find(h => h.id === ctx().state.inquiry) || ctx().I.hypotheses[0];
    function sources(ids) {
      const {I,esc,safeURL} = ctx();
      return `<ul class="source-list research-sources">${I.sources.filter(s=>ids.includes(s.id)).map(s=>`<li><a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.publisher)} · ${esc(s.published_at || '目录未核发布时间')} · ${esc(s.access)}</small><p>${esc(s.limits)}</p>${s.original_url ? `<a class="original-source" href="${esc(safeURL(s.original_url))}" target="_blank" rel="noopener noreferrer">核对原公告 ↗</a>`:''}</li>`).join('')}</ul>`;
    }
    function tabs(view) {
      const {I,state,esc} = ctx();
      return `<div class="inquiry-tabs" aria-label="选择研判问题">${I.hypotheses.map(h=>`<button data-inquiry="${h.id}" data-inquiry-view="${view}" class="${state.inquiry===h.id?'active':''}" aria-pressed="${state.inquiry===h.id}"><small>${esc(h.tag)}</small><strong>${esc(I.graphs[h.id].label)}</strong></button>`).join('')}</div>`;
    }
    function sourceButtons(ids) { return ids.map(id=>`<button class="source-ref" data-research-source="${id}" aria-label="查看资料${id}">${id}</button>`).join(''); }
    function graphTools() {
      const {state}=ctx();
      return `<div class="research-graph-tools"><div class="segmented"><button data-graph-layer="public" class="${state.graphLayer==='public'?'active':''}" aria-pressed="${state.graphLayer==='public'}">公开主体与线索</button><button data-graph-layer="mechanism" class="${state.graphLayer==='mechanism'?'active':''}" aria-pressed="${state.graphLayer==='mechanism'}">承接机制示意</button></div>${state.graphLayer==='public'?tabs('graph'):''}</div>`;
    }
    function inspector(data) {
      const {state,I,esc,icon}=ctx(), n=data.nodes.find(n=>n.id===state.node)||data.nodes[0];
      if(!n)return '';
      const links=data.edges.filter(e=>e.from===n.id||e.to===n.id);
      return `<aside class="panel inspector research-inspector"><span class="pill ${n.gap||n.limited?'amber':''}">${n.gap?'待核角色':n.limited?'待核原文线索':esc(n.kind)}</span><h2>${esc(n.name)}</h2><div class="info-block"><h3>公开资料说了什么</h3><p>${esc(n.detail)}</p></div><div class="info-block"><h3>还不能下什么结论</h3><p>${esc(n.unknown)}</p></div><div class="research-links">${links.map(e=>{const id=e.from===n.id?e.to:e.from;const target=I.entities.find(x=>x.id===id);return `<div><button data-public-node="${id}">${esc(target.short)} ↗</button><small class="${e.recorded?'known':'possible'}">${e.recorded?'资料记录':'待验证的桥'} · ${esc(e.label)}</small><p>${esc(e.scope)}</p>${sourceButtons(e.sources)}</div>`;}).join('')}</div><button class="primary wide" data-view="changes">${icon('search')}沿证据找关键</button><button class="secondary wide" data-view="bridges">拆成可做的任务</button><details class="source-disclosure"><summary>查看原始依据</summary>${sources(n.sources)}</details></aside>`;
    }
    function preview() {
      const {esc,icon}=ctx(),h=current();
      return `<section class="panel research-preview"><div><span class="small-label">从这几条碎片提出的问题</span><h2>${esc(h.short)}</h2><p>${esc(h.summary)}</p></div><button class="secondary" data-view="changes">看推断与其他解释 ${icon('arrow')}</button></section>`;
    }
    function renderFindings() {
      const {I,state,esc,heading,context,icon}=ctx(),h=current();
      const ids=[...new Set(h.basis.flatMap(b=>b.sources))];
      return `${heading('03','碎片接起来，哪一步最值得先做？','从公开连接提出假设，再找能区分原因的证据。',true)}${context()}${tabs('changes')}<div class="research-layout"><article class="panel hypothesis-panel"><div class="eyebrow">研判问题 · 尚待验证</div><h2>${esc(h.title)}</h2><p class="hypothesis-lead">${esc(h.inference)}</p><div class="attention"><strong>什么信息会改变这个判断？</strong><p>${esc(h.falsifier)}</p></div><details class="research-alternatives"><summary>还有哪些可能的解释？</summary><ul>${h.alternatives.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></details><div class="inline-actions"><button class="primary" data-trial-mode="evidence" data-view="trial">查到以后，怎样改判断 ${icon('arrow')}</button><button class="secondary" data-view="bridges">拆成可执行的任务</button></div></article><section class="panel evidence-panel"><span class="small-label">公开信息 → 为什么想到这里</span><h2>支撑这次追问的碎片</h2><ol class="evidence-sequence">${h.basis.map((b,i)=>`<li><span>${i+1}</span><div><p>${esc(b.text)}</p>${sourceButtons(b.sources)}</div></li>`).join('')}</ol><p class="research-stamp">检索快照 ${I.snapshot_at}；同文转载不重复算独立证据。</p><button class="text-button" data-inquiry="${h.id}" data-inquiry-view="graph">放回主体关系图 ↗</button><details class="source-disclosure"><summary>原文、可访问程度与局限</summary>${sources(ids)}</details></section></div><section class="research-audit"><header><div><span class="small-label">口径核对也是寻找关键的一部分</span><h2>有三处，不能顺手拼在一起</h2></div><button class="secondary" data-action="research-download">下载证据快照 ${icon('document')}</button></header><div class="audit-grid">${I.conflicts.map(c=>`<details class="panel audit-card"><summary>${esc(c.title)}</summary><p>${esc(c.detail)}</p><small>下一步：${esc(c.next)}</small>${sourceButtons(c.sources)}</details>`).join('')}</div></section><div class="panel research-footer"><p>实际采购合同、连续批次和培训成效，本次检索尚未取得可核验材料。空白只表示尚未查到。</p><div class="inline-actions"><button class="text-button" data-action="all-research-sources">查看全部${I.sources.length}份资料 ↗</button><button class="text-button" data-action="legacy-changes">原项目的事件记录 ↗</button><button class="secondary" data-action="save">保存这次研判</button></div></div>`;
    }
    function trialSwitch() {
      const {state}=ctx();
      return `<div class="trial-mode-switch segmented"><button data-trial-mode="evidence" class="${state.trialMode==='evidence'?'active':''}" aria-pressed="${state.trialMode==='evidence'}">信息变了，判断怎样变</button><button data-trial-mode="capacity" class="${state.trialMode==='capacity'?'active':''}" aria-pressed="${state.trialMode==='capacity'}">订单承接假设试验</button></div>`;
    }
    function assessment() {
      const {state,I,esc}=ctx(),a=I.assess(state.observations);
      return `<div class="assessment-result ${a.level}"><span class="pill">根据你填写的情况 · 待核实</span><h2>${esc(a.title)}</h2><p>${esc(a.body)}</p><div class="attention"><strong>下一步</strong><p>${esc(a.next)}</p></div></div>`;
    }
    function renderDecision() {
      const {state,I,esc,heading,context,icon}=ctx();
      const controls=[['sample','样品被买方接受了吗？',[['unknown','还不知道'],['accepted','已接受'],['rejected','未接受']]],['supply','连续供货稳不稳定？',[['unknown','还不知道'],['steady','能稳定交付'],['unstable','有中断或延期']]],['repeat','客户之后有没有再买？',[['unknown','还不知道'],['yes','有复购'],['no','观察期内未复购']]]];
      return `${heading('04','查到一条关键信息，判断就该跟着变','选同一产品、买方和观察周期，比较不同证据会把注意力引向哪里。',true)}${context()}${trialSwitch()}<div class="decision-layout"><section class="panel observation-panel"><span class="small-label">你的现场记录 · 不自动升级为公开事实</span><h2>先把三件事分开问</h2>${controls.map(([key,label,opts])=>`<label class="observation-control">${label}<select aria-label="${esc(label)}" data-observation="${key}">${opts.map(([v,l])=>`<option value="${v}" ${state.observations[key]===v?'selected':''}>${l}</option>`).join('')}</select></label>`).join('')}<label class="observation-control">是哪款产品、哪位买方、哪个周期？<textarea id="observationNote" maxlength="1000" placeholder="可记录公开来源、时间、样本和反馈。请勿填写私人联系方式。">${esc(state.observationNote)}</textarea></label><p class="research-stamp">没有对应记录时保留“还不知道”。保存与分享会携带这些内容。</p></section><section class="panel decision-panel"><div id="assessmentResult">${assessment()}</div><div class="decision-routes"><div><strong>样品没被接受</strong><span>先查拒收原因</span></div><div><strong>供货不稳</strong><span>先定位实际断点</span></div><div><strong>供货稳定却未复购</strong><span>转查需求、价格与渠道</span></div></div><details class="source-disclosure"><summary>为什么这样问？</summary><p>产业园B端方向、技术协作与渠道签约，把“验收—供货—复购”变成值得追的三类证据。这是检验思路，不是已拟合的经营预测；不同买方、产品和周期不能混填。实际原因仍需访谈和记录区分。</p>${sources(['T01','T03','T09'])}</details><div class="inline-actions"><button class="primary" data-view="bridges">沿判断找可做的事 ${icon('arrow')}</button><button class="secondary" data-action="save">保存这次判断</button><button class="secondary" data-action="share">分享</button></div></section></div>`;
    }
    function renderBridges() {
      const {state,I,esc,heading,context,icon}=ctx(),h=current(),b=h.bridge;
      return `${heading('05','把可能的关键，拆成一次能验收的工作','先找到任务与负责人，再决定要不要走这座桥。',true)}${context()}${tabs('bridges')}<div class="research-bridge-layout"><section class="panel bridge-proposal"><span class="pill amber">可选择的建议 · 未建立合作</span><h2>${esc(b.title)}</h2><p>${esc(b.why)}</p><div class="entity-chips">${b.entities.map(id=>{const n=I.entities.find(e=>e.id===id);return `<button data-public-node="${id}" class="${n.gap?'gap':''}"><strong>${esc(n.short)}</strong><small>${n.gap?'待核角色':esc(n.sub)}</small></button>`;}).join('')}</div><div class="task-deliverable"><span class="small-label">建议先做这一件事</span><h3>${esc(b.task)}</h3><p><strong>留下什么：</strong>${esc(b.deliverable)}</p></div><div class="attention"><strong>谁需要结果，谁来验收与付费？</strong><p>${esc(b.payer)}</p></div>${h.id==='travel'?`<details class="source-disclosure"><summary>关于“万亩礼茶”服务线索的边界</summary><p>2026年9月的价格调研转载已超过正文截止日期；原文未完成核验。本页借此识别任务组合，不当成正在招聘或可报名的项目。</p>${sources(['T12'])}</details>`:''}</section><section class="panel task-checks"><span class="small-label">把待核实的问题留下</span><h2>接下来确认这几件事</h2><div class="check-list">${h.checks.map((q,i)=>`<label><input type="checkbox" data-check="${h.id}-${i}" ${state.checks[h.id+'-'+i]?'checked':''}><span>${esc(q)}</span></label>`).join('')}</div><p>勾选只记录你的核实进度，不代表系统确认了合作。</p><div class="inline-actions"><button class="primary" data-action="save">保存任务与进度 ${icon('save')}</button><button class="secondary" data-action="share">分享这个问题</button></div><button class="text-button" data-view="changes">回到推断，检查其他解释 ↗</button><details class="source-disclosure"><summary>这座桥从哪些资料延伸而来？</summary>${sources([...new Set(h.basis.flatMap(x=>x.sources))])}</details></section></div><div class="panel research-footer"><p>具体主体可沿公开记录继续核实。培训、课程、采购意向和真实用工分开记录。</p><button class="text-button" data-action="capacity-bridges">另看承接量试验中的支持假设 ↗</button></div>`;
    }
    return {sources,tabs,sourceButtons,graphTools,inspector,preview,renderFindings,trialSwitch,assessment,renderDecision,renderBridges,current};
  };
})(window);
