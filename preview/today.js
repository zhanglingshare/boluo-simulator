/* ============================================================
 * 博罗 3.0 · 今天页（today）
 * 数据驱动的今日精选 + 横向发现带 + 内联主舞台工作区
 * 前台只读静态内容库，不调用在线 AI；工作区能力复用 ws-layer（inline 模式）。
 * ============================================================ */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  const browse = $('#browse'), stageWrap = $('#stageWrap');
  const feature = $('#feature'), rail = $('#rail');
  const wsEntry = $('#wsEntry'), wsCount = $('#wsCount');

  const CAT_NAME = { industry: '产业经济', livelihood: '民生', city: '城市', tourism: '文旅', food: '美食', agri: '农产' };
  const CAT_ICON = { industry: 'factory', livelihood: 'heart', city: 'city', tourism: 'mountain', food: 'bowl', agri: 'wheat' };
  const catOf = c => (c && c.tags && c.tags.category) || '';

  /* 今日精选 + 发现带 */
  let FEATURE = null;
  const BUCKETS = [['industry', '产业脉动'], ['tourism', '山水去处'], ['agri', '时令味道'], ['data', '数据洞察']];
  const RAIL_OFFSET = { industry: 0, tourism: 0, agri: 0, data: 0 };
  const DATA_ORDER = ['ind-gdp', 'ind-fai', 'ind-gdp-growth', 'ind-visitors'];

  function now() { return new Date(); }
  function parseEvent(c) {
    const s = c && c.tags && c.tags.event_date;
    if (!s) return null;
    const m = String(s).match(/(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1);
  }
  function fmtDate(c) {
    const s = c && c.tags && c.tags.event_date;
    const d = parseEvent(c);
    if (!d) return '';
    if (s && /-\d{2}$/.test(s)) return `${d.getMonth() + 1}月${d.getDate()}日`;
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }
  function daysAgo(d, n) {
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const b = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((b - a) / 86400000);
  }
  function isExpired(c, n) {
    if (c.status && c.status !== 'active') return true;
    if (c.valid_to && new Date(c.valid_to) < n) return true;
    return false;
  }

  /* 可复现的今日精选评分：时效 / 来源可靠 / 本地价值 / 过期 / 多样性 / 视觉素材 */
  const VALUE_RULES = [
    { re: /托位|学位|医院|就业|补贴|报名|通车|开通|普惠|医育|养老|托育|新增|开放|公益/, w: 2.6 },
    { re: /投产|点火|百亿|产值|落地|签约|开工|增长|组团|出海|广交会|参展|创新高/, w: 2.0 },
    { re: /茶园|康养|登高|美食|攻略|游客|接待|旅居|古村|乡村游|秋游|生态|山水/, w: 1.5 },
    { re: /宣传活动|专题宣传|座谈会|工作会议|例会|走访|宣讲|部署/, w: -1.7 }
  ];
  const TIER = { 高: 3, 较高: 2, 中: 1 };
  function score(c, n) {
    let s = (TIER[c.tier] || 1) * 0.55;
    if (c.srcLevel === '官方发布' && c.verified_status === '已核验') s += 2;
    else if (c.verified_status === '已核验') s += 1;
    else s -= 0.6;
    const d = parseEvent(c);
    if (d) {
      const dd = daysAgo(d, n);
      s += dd <= 3 ? 2 : dd <= 7 ? 1 : dd <= 14 ? 0.3 : -0.6;
    }
    const t = (c.title || '') + ' ' + (c.summary || '');
    VALUE_RULES.forEach(r => { if (r.re.test(t)) s += r.w; });
    if (/\d/.test(c.title)) s += 0.4;
    if (WS.media(c.id)) s += 0.7; // 合法视觉素材仅小幅加权，不决定头条
    return s;
  }
  function railScore(c, n) {
    let s = score(c, n);
    if (WS.media(c.id)) s += 1.2; // 发现带更偏视觉吸引力
    if (c.type === 'module') s += 0.4;
    return s;
  }
  function pickFeature(cards, n) {
    const news = cards.filter(c => c.type === 'news' && !isExpired(c, n));
    news.sort((a, b) => score(b, n) - score(a, n));
    return news[0] || null;
  }
  function bucket(cards, key, n) {
    const inCat = (c, ...ks) => ks.includes(catOf(c));
    if (key === 'industry') return cards.filter(c => !isExpired(c, n) && (inCat(c, 'industry') || c.type === 'module' && catOf(c) === 'industry'));
    if (key === 'tourism') return cards.filter(c => !isExpired(c, n) && (inCat(c, 'tourism') || c.type === 'town'));
    if (key === 'agri') return cards.filter(c => !isExpired(c, n) && (c.type === 'veg' || inCat(c, 'food')));
    if (key === 'data') return cards.filter(c => c.type === 'indicator');
    return [];
  }
  // 桶内产品偏好：山水桶优先有图富模块，时令桶优先当季农品
  function bucketBoost(c, key) {
    if (key === 'tourism' && c.type === 'module') return 1.8;
    if (key === 'agri' && c.type === 'veg') return 1.5;
    return 0;
  }
  function railFor(key) {
    const n = now();
    let arr = bucket(WS.cards(), key, n).filter(c => !FEATURE || c.id !== FEATURE.id);
    if (key === 'data') arr.sort((a, b) => DATA_ORDER.indexOf(a.id) - DATA_ORDER.indexOf(b.id));
    else arr.sort((a, b) => (railScore(b, n) + bucketBoost(b, key)) - (railScore(a, n) + bucketBoost(a, key)));
    if (!arr.length) return null;
    return arr;
  }

  /* 大数字提取（无图头条用强排版，绝不配无关照片） */
  function bigNum(c) {
    const m = (c.title || '').match(/([\d]+(?:\.\d+)?)\s*(万人次|万人|亿元|亿|万元|个|位|家|%)/);
    if (!m) return null;
    const after = (c.title || '').slice(m.index + m[0].length);
    const cap = (after.match(/^([\u4e00-\u9fa5]{2,6})/) || [])[1] || '';
    return { num: m[1], unit: m[2], cap };
  }

  function srcLine(c, date, light) {
    const loc = (c.tags && c.tags.locations || [])[0];
    const parts = [loc, date, c.source].filter(Boolean);
    return `<a class="hero-src ${light ? 'light' : ''}" href="${esc(c.url || '#')}" target="_blank" rel="noopener">
      ${WS.icon('pin', 13)}<span>${parts.map(esc).join(' · ')}</span></a>`;
  }

  /* 头条：无图 → 强数字排版；有图 → 大图主视觉 */
  function typeHero(c) {
    const bn = bigNum(c);
    const ic = CAT_ICON[catOf(c)] || 'news';
    const date = fmtDate(c);
    return `<article class="hero type-hero" data-id="${c.id}" draggable="true">
      <div class="th-main">
        <div class="hero-kicker">
          <span class="cat-pill">${CAT_NAME[catOf(c)] || '今日'}</span>
          <span class="v-pill">${esc(c.srcLevel || '')} · ${esc(c.verified_status || '')}</span>
        </div>
        ${bn ? `<div class="big-num"><span class="bn">${bn.num}</span><span class="bu">${bn.unit}</span>${bn.cap ? `<span class="bc">${bn.cap}</span>` : ''}</div>` : ''}
        <h1 class="th-title">${esc(c.title)}</h1>
        <p class="th-sum">${esc(c.summary || '')}</p>
        <div class="hero-actions">
          <button class="cta" data-add="${c.id}">${WS.icon('plus', 17)}<span>加入我的博罗</span></button>
          ${srcLine(c, date, false)}
        </div>
      </div>
      <div class="th-art" aria-hidden="true">
        <div class="th-watermark">${WS.icon(ic, 150)}</div>
        ${date ? `<div class="th-date">${WS.icon('calendar', 14)}<span>真实事件 · ${date}</span></div>` : ''}
      </div>
    </article>`;
  }
  function imgHero(c, media) {
    const date = fmtDate(c);
    const isAI = /assets\/modules/.test(media);
    return `<article class="hero img-hero" data-id="${c.id}" draggable="true">
      <img class="ih-img" src="${media}" alt="">
      <div class="ih-overlay">
        <div class="ih-top">
          <span class="cat-pill light">${CAT_NAME[catOf(c)] || '今日'}</span>
          ${isAI ? '<span class="ai-note">AI 概念插画 · 非实拍</span>' : ''}
        </div>
        <div class="ih-text">
          <h1 class="ih-title">${esc(c.title)}</h1>
          <p class="ih-sum">${esc(c.summary || '')}</p>
          <div class="hero-actions">
            <button class="cta" data-add="${c.id}">${WS.icon('plus', 17)}<span>加入我的博罗</span></button>
            ${srcLine(c, date, true)}
          </div>
        </div>
      </div>
    </article>`;
  }

  function addBtn(id) {
    return `<button class="rc-add" data-add="${id}" aria-label="加入我的博罗">${WS.icon('plus', 17)}</button>`;
  }
  function latestVal(c) { return (c.subtitle || '').replace(/^[^：:]*[：:]\s*/, '').trim(); }

  /* 发现带三种卡：图片 / 数据 / 文字排版 */
  function photoCard(c, media) {
    const loc = (c.tags && c.tags.locations || [])[0];
    const isAI = /assets\/modules/.test(media);
    return `<article class="rc rc-photo" data-id="${c.id}" draggable="true">
      <div class="rc-media">
        <img src="${media}" alt="" loading="lazy">
        <span class="rc-tag">${CAT_NAME[catOf(c)] || '内容'}</span>
        ${isAI ? '<span class="ai-note">AI 概念</span>' : ''}
      </div>
      <div class="rc-body">
        <h3 class="rc-title">${esc(c.title)}</h3>
        <p class="rc-sub">${[loc, fmtDate(c)].filter(Boolean).map(esc).join(' · ')}</p>
        ${addBtn(c.id)}
      </div>
    </article>`;
  }
  function statCard(c) {
    const v = latestVal(c);
    const num = (v.match(/[-−]?\d+(?:\.\d+)?(?:亿|万元|万人|万人次|%)?/) || [v])[0];
    const down = /[-−]/.test(num);
    const neutral = !down && !/%/.test(num);
    const dirTxt = down ? '当期承压' : neutral ? '关键总量' : '当期向好';
    const dirIco = down ? 'trendingDown' : neutral ? '' : 'trendingUp';
    return `<article class="rc rc-stat" data-id="${c.id}" draggable="true">
      <div class="rc-st">
        <span class="rc-tag">关键指标</span>
        <span class="rc-dir ${down ? 'down' : neutral ? 'flat' : 'up'}">${dirIco ? WS.icon(dirIco, 13) : ''}<span>${dirTxt}</span></span>
      </div>
      <div class="rc-num ${down ? 'down' : neutral ? 'flat' : 'up'}">${esc(num)}</div>
      <h3 class="rc-title">${esc(c.title)}</h3>
      <p class="rc-sub">${esc(c.source || '')}</p>
      ${addBtn(c.id)}
    </article>`;
  }
  function textCard(c) {
    const tag = c.type === 'veg' ? '当季农品' : (CAT_NAME[catOf(c)] || '内容');
    const ic = WS.cardIcon(c) || 'leaf';
    return `<article class="rc rc-text" data-id="${c.id}" draggable="true">
      <div class="rc-ico">${WS.icon(ic, 24)}</div>
      <span class="rc-tag plain">${tag}</span>
      <h3 class="rc-title">${esc(c.title)}</h3>
      <p class="rc-sub">${esc(c.subtitle || '')}</p>
      ${addBtn(c.id)}
    </article>`;
  }
  function railCard(c) {
    if (c.type === 'indicator') return statCard(c);
    const media = WS.media(c.id);
    return media ? photoCard(c, media) : textCard(c);
  }

  function renderFeature() {
    if (!FEATURE) { feature.innerHTML = ''; return; }
    feature.innerHTML = WS.media(FEATURE.id) ? imgHero(FEATURE, WS.media(FEATURE.id)) : typeHero(FEATURE);
  }
  function renderRail() {
    const used = new Set([FEATURE && FEATURE.id]);
    let html = '';
    BUCKETS.forEach(([key]) => {
      const arr = railFor(key);
      if (!arr) return;
      let pick = null;
      for (let k = 0; k < arr.length; k++) {
        const cand = arr[(RAIL_OFFSET[key] + k) % arr.length];
        if (!used.has(cand.id)) { pick = cand; break; }
      }
      if (pick) { used.add(pick.id); html += railCard(pick); }
    });
    rail.innerHTML = html;
    markAdded();
  }

  function markAdded() {
    if (!window.WS) return;
    // 发现带：圆形按钮仅含图标
    $$('#rail [data-id]').forEach(el => {
      const has = WS.has(el.dataset.id);
      el.classList.toggle('in-ws', has);
      const btn = el.querySelector('[data-add]');
      if (btn) {
        btn.disabled = has;
        btn.classList.toggle('added', has);
        btn.innerHTML = WS.icon(has ? 'check' : 'plus', 17);
      }
    });
    // 头条大按钮：保留“加入我的博罗”文字
    const fbtn = feature.querySelector('.cta');
    if (fbtn) {
      const has = WS.has(fbtn.dataset.add);
      fbtn.disabled = has;
      fbtn.classList.toggle('added', has);
      fbtn.innerHTML = WS.icon(has ? 'check' : 'plus', 17) + '<span>' + (has ? '已加入我的博罗' : '加入我的博罗') + '</span>';
    }
  }

  /* 浏览态 / 舞台态 */
  function showStage() {
    stageWrap.hidden = false;
    browse.hidden = true;
    stageWrap.setAttribute('aria-hidden', 'false');
    window.scrollTo(0, 0);
  }
  function showBrowse() {
    stageWrap.hidden = true;
    browse.hidden = false;
    stageWrap.setAttribute('aria-hidden', 'true');
    window.scrollTo(0, 0);
  }
  function onChange(ids) {
    const n = Array.isArray(ids) ? ids.length : WS.count();
    wsCount.textContent = n;
    wsEntry.hidden = n === 0;
    if (n === 0 && !stageWrap.hidden) showBrowse();
    markAdded();
  }

  function renderUpdated() {
    const c = WS.cards().find(x => x.fetched_at) || {};
    $('#updatedLine').textContent = c.fetched_at
      ? `内容库每日由后台核验更新 · 最近更新 ${c.fetched_at.slice(0, 16)} · 若更新失败将展示最近一次有效快照`
      : '静态内容库 · 每日核验更新';
  }

  function bind() {
    $('#shuffle').addEventListener('click', () => {
      BUCKETS.forEach(([k]) => { RAIL_OFFSET[k]++; });
      renderRail();
    });
    $('#browseAll').addEventListener('click', () => { showStage(); WS.openPicker(); });
    $('#stageBack').addEventListener('click', showBrowse);
    $('#stShare').addEventListener('click', () => WS.share());
    $('#stClear').addEventListener('click', () => WS.clear());
    wsEntry.addEventListener('click', showStage);

    browse.addEventListener('click', e => {
      const b = e.target.closest('[data-add]');
      if (b) { const id = b.dataset.add; if (id && !WS.has(id)) WS.add(id, { open: true }); }
    });
    browse.addEventListener('dragstart', e => {
      const el = e.target.closest('[data-id]');
      if (el && e.dataTransfer) { e.dataTransfer.setData('text/ws-id', el.dataset.id); e.dataTransfer.effectAllowed = 'copy'; }
    });
    // 拖到导航「我的博罗」即加入
    wsEntry.addEventListener('dragover', e => { e.preventDefault(); wsEntry.classList.add('drop-hot'); });
    wsEntry.addEventListener('dragleave', () => wsEntry.classList.remove('drop-hot'));
    wsEntry.addEventListener('drop', e => {
      e.preventDefault(); wsEntry.classList.remove('drop-hot');
      const id = e.dataTransfer && e.dataTransfer.getData('text/ws-id');
      if (id) WS.add(id);
    });
  }

  function whenWS(cb) { if (window.WS && window.WS.__installed) cb(); else setTimeout(() => whenWS(cb), 50); }
  whenWS(() => {
    WS.on('open', showStage);
    WS.on('change', onChange);
    WS.ready.then(() => {
      WS.mountInline('#wsStage');
      bind();
      const n = now();
      FEATURE = pickFeature(WS.cards(), n);
      renderFeature();
      renderRail();
      renderUpdated();
      onChange(WS.count());
      if (/ws=/.test(location.hash)) showStage();
    });
  });
})();
