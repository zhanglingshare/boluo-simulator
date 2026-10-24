/* ============================================================
 * 博罗 · 我的发现桌面 —— 全局工作区浮层组件（ws-layer）
 * 用法：在任意页面 </body> 前引入
 *   <script src="workspace/ws-layer.js" defer></script>
 * 对外 API：window.WS
 *   WS.add(id,{open})  WS.remove(id)  WS.open()  WS.close()  WS.toggle()
 *   WS.has(id)  WS.count()  WS.cards()  WS.card(id)  WS.ready(Promise)
 *   WS.on('change', fn)   // ids/active 变化
 * 数据：workspace/*.json（与脚本同目录，自动推断）；状态存 localStorage 跨页共享。
 * Shadow DOM 样式隔离，不污染宿主页面。
 * ============================================================ */
(function () {
  'use strict';
  if (window.WS && window.WS.__installed) return;

  /* ---------- 路径推断（脚本所在目录） ---------- */
  let DATA_DIR = 'workspace/';
  try {
    const cs = document.currentScript;
    if (cs && cs.src) DATA_DIR = new URL('.', cs.src).href;
  } catch (e) { /* 用相对路径兜底 */ }
  const url = (f) => DATA_DIR + f + '?ts=' + (window.__WS_TS__ || Date.now());
  // 静态资源（图片）用绝对 URL，不挂时间戳以便缓存
  const assetUrl = (p) => !p ? '' : (/^https?:\/\//.test(p) ? p : new URL(p, DATA_DIR).href);
  // 某张卡应显示的主视觉（优先富模块 hero，其次卡 thumb），无则返回 null（用渐变占位）
  function mediaOf(id) {
    const m = moduleOf(id);
    if (m && m.hero) return assetUrl(m.hero);
    const c = byId[id];
    if (c && c.thumb) return assetUrl(c.thumb);
    return null;
  }

  /* ---------- 常量与状态 ---------- */
  const LS_KEY = 'boluo-ws-v3';
  const DB = { pool: null, modules: [], towns: [], links: [] };
  const byId = {};
  const state = { ids: [], active: null, filter: 'all', q: '', view: 'ws' };
  let lastRemoved = null;
  const listeners = { change: [] };

  const CAT_NAME = { industry: '产业经济', livelihood: '民生', city: '城市', tourism: '文旅', food: '美食', agri: '农产' };
  const CAT_EMOJI = { industry: '🏭', livelihood: '🧸', city: '🏙️', tourism: '⛰️', food: '🍲', agri: '🌾' };
  const TYPE_EMOJI = { news: '📰', town: '🏘️', module: '✨', indicator: '📉', veg: '🥬', event: '📅' };
  const GRAD = {
    tourism: 'linear-gradient(135deg,#0d9488,#14b8a6)',
    food: 'linear-gradient(135deg,#d97706,#f59e0b)',
    agri: 'linear-gradient(135deg,#65a30d,#84cc16)',
    industry: 'linear-gradient(135deg,#334155,#475569)',
    livelihood: 'linear-gradient(135deg,#e11d48,#f472b6)',
    city: 'linear-gradient(135deg,#4f46e5,#818cf8)'
  };
  const FILTERS = [
    { k: 'all', n: '全部' }, { k: 'news', n: '今日新闻' }, { k: 'tourism', n: '风景文旅' },
    { k: 'food', n: '美食农品' }, { k: 'industry', n: '产业经济' }, { k: 'livelihood', n: '民生城市' }
  ];

  /* ---------- 样式（Shadow 内） ---------- */
  const CSS = `
:host{position:fixed;inset:0;z-index:2147483000;margin:0;padding:0;display:block;
  pointer-events:none;color:#0f172a;font-size:14px;line-height:1.6;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:transparent;box-sizing:border-box}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
button{font-family:inherit;cursor:pointer}
a{color:#0d9488}
::-webkit-scrollbar{width:7px;height:7px}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
::-webkit-scrollbar-track{background:transparent}

/* 底部浮条 */
.dock{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;display:flex;align-items:center;gap:11px;
  background:#334155;color:#fff;border-radius:18px;padding:11px 18px;box-shadow:0 12px 34px rgba(15,23,42,.32);
  pointer-events:auto;cursor:pointer;transition:.25s;max-width:calc(100vw - 32px);opacity:0;transform:translate(-50%,18px);pointer-events:none}
.dock.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.dock.pulse{animation:dpulse .5s ease}
@keyframes dpulse{0%{transform:translate(-50%,0) scale(1)}40%{transform:translate(-50%,0) scale(1.06)}100%{transform:translate(-50%,0) scale(1)}}
.dock .dico{width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:18px;flex:none}
.dock .dtxt{min-width:0}
.dock .dn{font-size:14px;font-weight:800;white-space:nowrap}
.dock .ds{font-size:10.5px;opacity:.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}
.dock .dgo{font-size:18px;opacity:.85;flex:none}
@media(max-width:860px){
  .dock{left:12px;right:12px;transform:none;bottom:12px;max-width:none;border-radius:16px;padding:12px 16px}
  .dock.show{transform:none}
  .dock .ds{max-width:none}
}
/* 抽屉打开时浮条淡出（抽屉本身就是工作区视图） */
:host([data-open="true"]) .dock{opacity:0!important;pointer-events:none!important}
/* 空工作区时从宿主页面拖卡，浮条浮现为投放热区 */
.dock.drop-ready{opacity:1;pointer-events:auto;transform:translate(-50%,0);background:var(--teal)}
@media(max-width:860px){.dock.drop-ready{transform:none}}

/* 遮罩 */
.scrim{position:fixed;inset:0;background:rgba(15,23,42,.34);opacity:0;pointer-events:none;transition:opacity .3s}
:host([data-open="true"]) .scrim{opacity:1;pointer-events:auto}
@media(max-width:860px){:host([data-open="true"]) .scrim{background:rgba(15,23,42,.42)}}

/* 抽屉 */
.drawer{position:fixed;top:0;right:0;height:100dvh;width:470px;max-width:94vw;background:#f6f8f9;
  box-shadow:-16px 0 48px rgba(15,23,42,.22);transform:translateX(105%);transition:transform .34s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;pointer-events:none}
:host([data-open="true"]) .drawer{transform:none;pointer-events:auto}
@media(max-width:860px){.drawer{width:100%;max-width:100%}}

.dr-head{flex:none;display:flex;align-items:center;gap:10px;padding:13px 16px 11px;background:#fff;border-bottom:1px solid #e5e9ee;flex-wrap:wrap}
.dr-title{flex:1;min-width:0}
.dr-title h2{margin:0;font-size:16px;font-weight:800;display:flex;align-items:center;gap:7px}
.dr-title .cnt{font-size:10.5px;color:#94a3b8;margin-top:2px}
.dr-x{width:36px;height:34px;border-radius:10px;border:1px solid #e5e9ee;background:#fff;font-size:19px;line-height:1;color:#475569;flex:none}
.dr-tools{display:flex;gap:8px;flex:1 1 100%;order:3}
.dr-btn{flex:1;border:1px solid #e5e9ee;background:#fff;color:#475569;border-radius:9px;padding:8px 6px;font-size:12.5px;font-weight:600}
.dr-btn.primary{background:#0d9488;border-color:#0d9488;color:#fff}
.dr-btn:active{transform:scale(.97)}

/* chips */
.chips{flex:none;display:flex;gap:8px;padding:11px 14px;overflow-x:auto;background:#fff;border-bottom:1px solid #eef2f5;scrollbar-width:thin}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;display:flex;align-items:center;gap:7px;border:1.5px solid #e5e9ee;background:#fbfcfd;border-radius:11px;padding:6px 8px 6px 10px;max-width:200px}
.chip.on{border-color:#0d9488;background:#f0faf9}
.chip .cico{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none}
.chip .ctxt{min-width:0}
.chip .cn{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
.chip .ct{font-size:9px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
.chip .cx{border:0;background:none;color:#94a3b8;font-size:14px;padding:0 2px;flex:none}
.chip-add{flex:none;border:1.5px dashed #cbd5e1;background:transparent;color:#94a3b8;border-radius:11px;padding:6px 13px;font-size:12px;white-space:nowrap}
.chip-add:hover{border-color:#0d9488;color:#0d9488}

/* 视图容器 */
.view{flex:1;min-height:0;overflow-y:auto;display:none}
.view.on{display:block}
.view-inner{padding:15px}

/* 空态 */
.empty{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 22px;color:#475569}
.ebox{width:104px;height:104px;border-radius:26px;background:#f0faf9;border:2px dashed #0d9488;display:flex;align-items:center;justify-content:center;font-size:42px;margin-bottom:18px;animation:fl 3s ease-in-out infinite}
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.empty h3{font-size:18px;margin:0 0 8px;color:#0f172a}
.empty p{font-size:12.5px;color:#94a3b8;margin:0 0 18px;max-width:340px;line-height:1.8}
.earrows{display:flex;gap:9px;flex-wrap:wrap;justify:center}
.epill{background:#fff;border:1px solid #e5e9ee;border-radius:18px;padding:8px 14px;font-size:12px;color:#475569}
.epill:hover{border-color:#0d9488;color:#0d9488}

/* 主卡 */
.mcard{background:#fff;border:1px solid #e5e9ee;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.06);animation:fd .32s ease}
@keyframes fd{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
.mhero{height:200px;position:relative;display:flex;align-items:flex-end;padding:17px;overflow:hidden}
.mhero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 15%,rgba(255,255,255,.28),transparent 55%)}
.mhero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0) 35%,rgba(15,23,42,.55))}
.mhero .mhero-emoji{position:absolute;top:18px;right:20px;font-size:52px;opacity:.92}
.mhero .mhero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mhero.has-img::before{background:radial-gradient(circle at 80% 15%,rgba(255,255,255,.18),transparent 55%)}
.mhero .mhero-txt{position:relative;z-index:1;color:#fff}
.mkicker{font-size:10px;font-weight:700;letter-spacing:.8px;opacity:.85;text-transform:uppercase}
.mhero h1{font-size:21px;margin:3px 0 2px;color:#fff;font-weight:800;text-shadow:0 2px 12px rgba(0,0,0,.25)}
.msub{font-size:12px;opacity:.95}
.img-note{position:absolute;top:11px;left:13px;font-size:9px;background:rgba(15,23,42,.4);color:#fff;padding:2px 8px;border-radius:9px;z-index:1}
.mbody{padding:16px 17px}
.mtags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.mtag{font-size:10.5px;padding:4px 10px;border-radius:14px;background:#f0faf9;color:#0d9488;font-weight:600;border:1px solid rgba(13,148,136,.18)}
.msection{margin-bottom:17px}
.msection h4{font-size:12.5px;font-weight:800;margin:0 0 8px;color:#0f172a}
.mstory{font-size:13px;line-height:1.9;color:#475569}
.mquote{margin:13px 0 0;border-left:3px solid #0d9488;background:#f0faf9;padding:10px 14px;border-radius:0 10px 10px 0;font-size:12.5px;color:#334155;font-weight:600;line-height:1.7}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.fact{display:flex;gap:9px;align-items:flex-start;background:#fbfcfd;border:1px solid #eef2f5;border-radius:11px;padding:10px}
.fact .fico{width:30px;height:30px;border-radius:9px;background:#f0faf9;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none}
.fl{font-size:10px;color:#94a3b8;margin-bottom:1px}.fv{font-size:11.5px;font-weight:600;line-height:1.4}
.mgrid{display:grid;grid-template-columns:1fr;gap:16px}
.sidecard{background:#fbfcfd;border:1px solid #eef2f5;border-radius:12px;padding:13px;margin-bottom:13px}
.sidecard h5{margin:0 0 9px;font-size:12px;font-weight:800}
.minimap{height:135px;border-radius:10px;background:linear-gradient(135deg,#e8f4f3,#dcebe9);overflow:hidden;margin-bottom:8px}
.mapbtn{width:100%;border:1px solid #0d9488;background:#fff;color:#0d9488;border-radius:8px;padding:7px;font-size:11.5px;font-weight:600}
.nearby{display:grid;grid-template-columns:1fr;gap:8px}
.near{display:flex;align-items:center;gap:9px;background:#fbfcfd;border:1px solid #eef2f5;border-radius:10px;padding:9px 11px}
.near .nico{width:32px;height:32px;border-radius:9px;background:#fff;border:1px solid #e5e9ee;display:flex;align-items:center;justify-content:center;font-size:15px;flex:none}
.near .ninfo{flex:1;min-width:0}.nn{font-size:12px;font-weight:600}.nd{font-size:10px;color:#94a3b8}
.near .nadd{border:1px solid #0d9488;color:#0d9488;background:#fff;border-radius:8px;width:25px;height:25px;font-size:14px;flex:none}

/* 指标 */
.ind-hero{padding:22px 20px}
.ind-badges{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
.badge{font-size:10.5px;font-weight:700;padding:3px 11px;border-radius:14px}
.badge.stock{background:rgba(51,65,85,.1);color:#334155}
.badge.flow{background:rgba(79,70,229,.1);color:#4f46e5}
.badge.off{background:rgba(225,29,72,.1);color:#e11d48}
.badge.src{background:rgba(13,148,136,.1);color:#0d9488}
.ind-name{font-size:15px;font-weight:700}
.ind-big{margin:10px 0}
.ind-val{font-size:44px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1;letter-spacing:-1px}
.ind-val.down{color:#e11d48}.ind-val.up{color:#0d9488}.ind-val.flat{color:#334155}
.ind-break{display:flex;gap:7px;flex-wrap:wrap;margin:13px 0}
.ind-pill{background:#fbfcfd;border:1px solid #eef2f5;border-radius:10px;padding:7px 11px;font-size:11.5px}
.news-hero{padding:19px 20px}.news-hero h1{font-size:19px;line-height:1.45;margin:9px 0 11px}
.fate{background:#fbfcfd;border:1px solid #eef2f5;border-radius:12px;padding:13px 15px;margin-top:14px}
.fate .frow{font-size:12px;line-height:1.9;color:#475569}.fate .frow b{color:#0f172a}
.sources{margin-top:16px;padding-top:13px;border-top:1px dashed #e5e9ee;font-size:10.5px;color:#94a3b8;line-height:1.8}
.sources a{word-break:break-all;text-decoration:none}

/* 关联 */
.insight{border-top:1px solid #eef2f5;background:linear-gradient(180deg,#f0faf9,#fff);padding:0 15px 16px}
.insight-toggle{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;padding:13px 0 9px;text-align:left}
.insight-orb{width:34px;height:34px;border-radius:50%;background:#0d9488;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex:none;animation:orb 2.4s ease-in-out infinite}
@keyframes orb{0%,100%{box-shadow:0 4px 14px rgba(13,148,136,.35)}50%{box-shadow:0 4px 22px rgba(13,148,136,.6)}}
.insight-toggle .itxt{flex:1}.it{font-size:13px;font-weight:800}.is{font-size:11px;color:#475569}
.chev{color:#94a3b8;transition:.25s}.insight.open .chev{transform:rotate(180deg)}
.insight-body{display:none}.insight.open .insight-body{display:block;animation:fd .3s ease}
.link-card{background:#fff;border:1px solid #e5e9ee;border-left:4px solid #0d9488;border-radius:12px;padding:14px 15px;margin-bottom:11px}
.lc-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
.lc-kind{font-size:9.5px;font-weight:800;padding:3px 9px;border-radius:11px;background:#0d9488;color:#fff}
.lc-title{font-size:14px;font-weight:800}.lc-q{font-size:12.5px;color:#334155;font-weight:700;margin:4px 0 11px}
.lc-explain{font-size:12.3px;line-height:1.9;color:#475569}
.cmp{display:grid;grid-template-columns:96px 1fr 1fr;gap:1px;background:#e5e9ee;border-radius:10px;overflow:hidden;margin:11px 0;border:1px solid #e5e9ee}
.cmp>div{background:#fff;padding:9px 10px;font-size:11.5px;line-height:1.5}
.cmp .ch{background:#f0faf9;font-weight:800;color:#0d9488}.cmp .cd{background:#fbfcfd;color:#94a3b8;font-weight:600;font-size:11px}
.chain{margin:11px 0;padding-left:24px;position:relative}
.chain::before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:2px;background:linear-gradient(#0d9488,#14b8a6)}
.cstep{position:relative;margin-bottom:13px}.cstep .cdot{position:absolute;left:-21px;top:2px;width:15px;height:15px;border-radius:50%;background:#fff;border:3px solid #0d9488}
.cstep .cst{font-size:11.5px;font-weight:800;color:#0d9488}.cstep .ctx{font-size:12px;color:#475569;line-height:1.7}
.route{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:11px 0;background:#fbfcfd;border:1px solid #eef2f5;border-radius:11px;padding:12px}
.rnode{background:#fff;border:1px solid #0d9488;color:#0d9488;border-radius:9px;padding:6px 11px;font-size:11.5px;font-weight:600}.rarrow{color:#0d9488;font-weight:800}
.flow{background:linear-gradient(135deg,#f8fafc,#f0faf9);border:1px solid #eef2f5;border-radius:12px;padding:14px;margin:11px 0}
.flow-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.fnode{background:#fff;border:1.5px solid #0d9488;color:#334155;border-radius:10px;padding:7px 11px;font-size:11px;font-weight:600;line-height:1.4}
.fnode.stock{border-color:#334155;background:#334155;color:#fff}.fnode.flow{border-color:#4f46e5;color:#4f46e5}.fnode.shock{border-color:#e11d48;color:#e11d48}
.farrow{color:#94a3b8;font-weight:800}
.fnode.lag{border-style:dashed;border-color:#d97706;color:#d97706;background:rgba(217,119,6,.06)}.fnode.lag .ltag{display:block;font-size:9px;font-weight:800}
.loopback{margin-top:10px;display:flex;align-items:center;gap:7px;font-size:10.5px;color:#4f46e5;border-top:1px dashed #c7d2fe;padding-top:9px;flex-wrap:wrap}
.stages{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:11px 0}
.stage-item{background:#fff;border:1px solid #eef2f5;border-top:3px solid #0d9488;border-radius:10px;padding:10px 11px}
.stage-item .ss{font-size:10.5px;font-weight:800;color:#0d9488;margin-bottom:4px}.stage-item .sx{font-size:11px;color:#475569;line-height:1.6}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:11px 0}
.duo .dbox{border-radius:11px;padding:13px;text-align:center}
.duo .neg{background:rgba(225,29,72,.07);border:1px solid rgba(225,29,72,.25)}
.duo .pos{background:rgba(13,148,136,.08);border:1px solid rgba(13,148,136,.28)}
.duo .dl{font-size:10px;color:#94a3b8;margin-bottom:4px}.duo .dv{font-size:21px;font-weight:900}
.duo .neg .dv{color:#e11d48}.duo .pos .dv{color:#0d9488}.duo .dd{font-size:10.5px;color:#475569;margin-top:3px}
.caveat{display:flex;gap:8px;background:rgba(217,119,6,.07);border:1px solid rgba(217,119,6,.25);border-radius:10px;padding:10px 12px;margin-top:11px;font-size:11px;color:#92400e;line-height:1.7}
.lc-src{margin-top:9px;font-size:10px;color:#94a3b8}

/* picker 内容选择器 */
.picker-head{display:flex;align-items:center;gap:9px;padding:12px 15px 8px}
.picker-head h3{margin:0;font-size:14px;font-weight:800;flex:1}
.pback{border:1px solid #e5e9ee;background:#fff;border-radius:9px;padding:7px 13px;font-size:12px;font-weight:600;color:#475569}
.psearch{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #e5e9ee;border-radius:10px;padding:8px 11px;margin:0 15px 9px}
.psearch input{border:0;outline:0;flex:1;font-size:13px;background:transparent}
.pfilters{display:flex;gap:6px;padding:0 15px 10px;overflow-x:auto}
.pfilters::-webkit-scrollbar{display:none}
.fchip{flex:none;background:#fff;border:1px solid #e5e9ee;color:#475569;border-radius:16px;padding:5px 12px;font-size:11.5px}
.fchip.on{background:#0d9488;border-color:#0d9488;color:#fff;font-weight:600}
.plist{padding:0 15px 24px}
.pcard{display:flex;gap:11px;background:#fff;border:1px solid #e5e9ee;border-radius:13px;overflow:hidden;margin-bottom:10px;transition:.16s}
.pcard:hover{border-color:#0d9488;box-shadow:0 6px 20px rgba(15,23,42,.07)}
.pcard.inws{opacity:.5}
.pthumb{width:78px;min-height:74px;flex:none;display:flex;align-items:center;justify-content:center;font-size:30px;position:relative;overflow:hidden;border-radius:10px}
.pthumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pthumb .ptag{position:absolute;left:5px;top:5px;z-index:2}
.pthumb .ptag{position:absolute;left:5px;top:5px;font-size:8.5px;font-weight:700;padding:1px 6px;border-radius:8px;background:rgba(255,255,255,.9);color:#475569}
.pbody{flex:1;min-width:0;padding:9px 10px 9px 2px;display:flex;flex-direction:column;justify-content:center}
.pbody .pt{font-size:13px;font-weight:700;line-height:1.4;margin-bottom:3px}
.pbody .pm{font-size:10.5px;color:#94a3b8}
.padd{flex:none;align-self:center;margin-right:11px;width:32px;height:32px;border-radius:50%;border:0;background:#0d9488;color:#fff;font-size:19px;font-weight:700}
.padd:disabled{background:#cbd5e1}
.pempty{text-align:center;color:#94a3b8;font-size:12.5px;padding:46px 20px;line-height:1.8}

/* toast */
.toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateY(16px);background:#334155;color:#fff;
  padding:11px 17px;border-radius:12px;font-size:13px;z-index:1;opacity:0;pointer-events:none;transition:.25s;
  display:flex;align-items:center;gap:13px;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:calc(100vw - 30px)}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
.toast .undo{background:rgba(255,255,255,.18);border:0;color:#fff;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700}
.toast .go{background:var(--teal,#0d9488);border:0;color:#fff;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700}
`;

  /* ---------- 工具 ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  function moduleOf(id) { return DB.modules.find(m => m.id === id); }
  function townOf(id) { return DB.towns.find(t => t.id === id); }
  function activeLinks() { const set = new Set(state.ids); return DB.links.filter(l => l.status === 'online' && l.card_ids.every(id => set.has(id))); }

  function cardVisual(c) {
    const cat = (c.tags && c.tags.category) || 'city';
    if (c.type === 'town') return { grad: GRAD.tourism, tag: '🏘️ 镇街' };
    if (c.type === 'indicator') return { grad: GRAD.industry, tag: '📊 指标' };
    if (c.type === 'veg') return { grad: GRAD.agri, tag: '🥬 当季农品' };
    if (c.type === 'module') return { grad: GRAD[cat] || GRAD.tourism, tag: (TYPE_EMOJI.module || '✨') + ' ' + (CAT_NAME[cat] || '富模块') };
    return { grad: GRAD[cat] || GRAD.city, tag: (CAT_EMOJI[cat] || '📌') + ' ' + (CAT_NAME[cat] || '资讯') };
  }
  function gradientOf(c) { return cardVisual(c).grad; }
  function chipSub(c) {
    const loc = (c.tags && c.tags.locations || [])[0];
    if (c.type === 'module') return ((c.tags && c.tags.entities) || [])[0] || CAT_NAME[(c.tags && c.tags.category)] || '';
    return loc || CAT_NAME[(c.tags && c.tags.category)] || c.type;
  }
  function metricMeta(m) {
    return {
      fai: { name: '流量 · 固定资产投资', cls: 'flow' },
      gdp: { name: '存量 · 地区生产总值', cls: 'stock' },
      'gdp-growth': { name: '流量 · GDP增速', cls: 'flow' },
      visitors: { name: '流量 · 当期客流', cls: 'flow' }
    }[m] || null;
  }
  function fateKind(k) { return { sim: '需要推演（含假设）', info: '信息播报', life: '生活烟火' }[k] || '信息'; }
  function kindName(k) { return { puzzle: '系统动力学 · 时滞之谜', contrast: '对比', season: '时令', geo: '邻近路线', causal: '长周期因果', theme: '主题' }[k] || '关联'; }
  function factIcon(k) { return { calendar: '📅', ticket: '🎫', clock: '⏱️', people: '👥', star: '⭐', target: '🎯', route: '🛣️', coffee: '☕', food: '🍲', sport: '🥾', show: '🎭' }[k] || '📌'; }
  function srcLinks(arr) {
    if (!arr || !arr.length) return '';
    return `<div class="sources">🔗 来源：${arr.map(u => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '').slice(0, 40)}…</a>`).join('')}</div>`;
  }
  function miniMap(loc) {
    return `<svg viewBox="0 0 280 150" style="width:100%;height:100%">
      <rect width="280" height="150" fill="transparent"/>
      <path d="M0 70 Q60 40 120 60 T280 55" fill="none" stroke="#9bd0cb" stroke-width="3" opacity=".7"/>
      <path d="M20 120 Q90 95 160 110 T280 100" fill="none" stroke="#c7e6e2" stroke-width="2"/>
      <text x="150" y="30" text-anchor="middle" font-size="9" fill="#7a9b97">罗浮山（西北山系）</text>
      <path d="M60 42 l8 -14 l8 14 z" fill="#9bd0cb"/>
      <circle cx="150" cy="78" r="5" fill="#0d9488"/><circle cx="150" cy="78" r="11" fill="none" stroke="#0d9488" stroke-width="1.4" opacity=".5"/>
      <text x="165" y="81" font-size="10" font-weight="700" fill="#0d9488">${esc(loc || '博罗')}</text>
      <text x="120" y="138" font-size="8" fill="#94a3b8">东江 · 博罗示意（非精确地图）</text></svg>`;
  }

  /* ---------- 主卡视图 ---------- */
  function viewModule(c) {
    const m = moduleOf(c.id) || {};
    const facts = (m.facts || []).map(f => `<div class="fact"><div class="fico">${factIcon(f.icon)}</div><div><div class="fl">${esc(f.label)}</div><div class="fv">${esc(f.value)}</div></div></div>`).join('');
    const nearby = (m.nearby || []).map(n => `<div class="near">
      <div class="nico">${factIcon(n.type === 'cafe' ? 'coffee' : n.type === 'food' ? 'food' : n.type === 'sport' ? 'sport' : 'star')}</div>
      <div class="ninfo"><div class="nn">${esc(n.name)}</div><div class="nd">${esc(n.distance)}</div></div>
      <button class="nadd" data-add="${esc(n.add || '')}" title="加入（若内容库有）">＋</button></div>`).join('');
    const loc = ((c.tags && c.tags.locations) || [])[0] || m.town || '';
    const tabs = (m.tabs || []).map(t => `<span class="mtag">${esc(t)}</span>`).join('');
    const heroSrc = mediaOf(c.id);
    const heroBg = heroSrc ? '' : ` style="background:${gradientOf(c)}"`;
    const heroInner = heroSrc
      ? `<img class="mhero-img" src="${heroSrc}" alt="${esc(m.title || c.title)}">`
      : `<span class="mhero-emoji">✨</span>`;
    const heroNote = heroSrc ? '🎨 AI 概念插画' : '🎨 主题示意 · 实拍图待授权';
    return `<div class="mcard">
      <div class="mhero${heroSrc ? ' has-img' : ''}"${heroBg}>
        <span class="img-note">${heroNote}</span>${heroInner}
        <div class="mhero-txt"><div class="mkicker">${esc(m.town || loc)} · 富模块</div>
          <h1>${esc(m.title || c.title)}</h1><div class="msub">${esc(m.subtitle || c.subtitle || '')}</div></div></div>
      <div class="mbody">
        <div class="mtags">${tabs}</div>
        <div class="mgrid">
          <div>
            <div class="msection"><h4>🍃 这里是什么</h4><div class="mstory">${esc(m.story || c.summary || '')}</div></div>
            <div class="msection"><h4>📋 实用信息</h4><div class="facts">${facts || '<div class="mstory" style="font-size:12px">以现场实际为准。</div>'}</div></div>
          </div>
          <div>
            <div class="sidecard"><h5>📍 在博罗的位置</h5><div class="minimap">${miniMap(loc)}</div><button class="mapbtn" data-map="${esc(loc)}">查看地图（外部）</button></div>
            <div class="sidecard"><h5>🧭 附近推荐</h5><div class="nearby">${nearby || '<div class="mstory" style="font-size:12px">暂无</div>'}</div></div>
          </div>
        </div>${srcLinks(m.sources || (c.url ? [c.url] : []))}
      </div></div>`;
  }
  function viewTown(c) {
    const t = townOf(c.id) || {};
    const modRefs = (t.module_refs || []).map(moduleOf).filter(Boolean);
    const hot = t.baseline_hot ? `<span class="badge src">常驻人气 ${t.baseline_hot}</span>` : '';
    return `<div class="mcard">
      <div class="mhero" style="background:${gradientOf(c)};height:160px"><span class="mhero-emoji">🏘️</span>
        <div class="mhero-txt"><div class="mkicker">${esc(t.position || '博罗')} · ${esc(t.kind || '镇街')}${(t.merged_from || []).length ? '（' + t.merged_from.map(esc).join('、') + '已并入）' : ''}</div>
          <h1>${esc(t.name || c.title)}</h1><div class="msub">${esc(t.tag || '')}</div></div></div>
      <div class="mbody">
        <div class="ind-badges"><span class="badge stock">${esc(t.kind || '镇街')}</span>${hot}</div>
        <div class="mgrid" style="margin-top:14px">
          <div>
            <div class="msection"><h4>💼 硬核饭碗</h4><div class="mstory">${esc(t.industry || '（产业资料待补）')}</div></div>
            <div class="msection"><h4>🎆 烟火气</h4><div class="mstory"><b>🍜 吃：</b>${esc((t.foods || []).join('、') || '—')}<br><b>🏔️ 玩：</b>${esc((t.plays || []).join('、') || '—')}</div></div>
          </div>
          <div>
            ${modRefs.length ? `<div class="sidecard"><h5>✨ 展开明星模块</h5>${modRefs.map(m => `<button class="dr-btn" data-goto="${m.id}" style="margin-bottom:8px">✨ ${esc(m.title)}</button>`).join('')}</div>` : ''}
            <div class="sidecard"><h5>📍 区位</h5><div class="minimap" style="height:115px">${miniMap(t.name)}</div><button class="mapbtn" data-map="${esc(t.name + ' 博罗')}">查看地图（外部）</button></div>
          </div>
        </div>${srcLinks(t.sources || (c.url ? [c.url] : []))}
      </div></div>`;
  }
  function viewIndicator(c) {
    const val = (c.subtitle || '').replace(/^最新（[^）]*）：?/, '');
    const num = val.match(/-?\d+(\.\d+)?/);
    const n = num ? parseFloat(num[0]) : null;
    const cls = n === null ? 'flat' : (n < 0 ? 'down' : 'up');
    const sf = ((c.tags && c.tags.metrics) || []).map(metricMeta).find(Boolean);
    const dir = (c.tags && c.tags.direction) || '';
    const dirBadge = dir === '利空' ? '<span class="badge off">当期承压</span>' : dir === '利好' ? '<span class="badge src">当期向好</span>' : '';
    let br = '';
    if (c.id === 'ind-fai') {
      br = `<div class="ind-break">
        <div class="ind-pill">工业投资 <b style="color:#e11d48">-12.7%</b></div>
        <div class="ind-pill">房地产开发 <b style="color:#e11d48">-47.6%</b></div>
        <div class="ind-pill">基础设施 <b style="color:#334155">-0.3%</b></div>
        <div class="ind-pill">一产 <b style="color:#e11d48">-64.7%</b></div>
        <div class="ind-pill">三产 <b style="color:#e11d48">-25.9%</b></div></div>`;
    }
    return `<div class="mcard"><div class="ind-hero">
      <div class="ind-badges">${sf ? `<span class="badge ${sf.cls}">${sf.name}</span>` : ''}${dirBadge}<span class="badge src">${esc(c.verified_status || '')} · ${esc(c.srcLevel || '')}</span></div>
      <div class="ind-name">${esc(c.title)}</div><div class="ind-big"><span class="ind-val ${cls}">${esc(val || '—')}</span></div>
      ${br}
      <div class="mstory" style="margin-top:14px">${esc(c.summary || '')}</div>
      <div class="mquote">💡 这是${sf && sf.name.includes('流量') ? '当期「流量」，变化先反映当下的投入与意愿' : '「存量」与「流量」共同作用的结果'}；把它和具体事件卡放在一起，工作区会揭示它们之间的时滞与反馈。</div>
      ${srcLinks(c.url ? [c.url] : [])}</div></div>`;
  }
  function viewNews(c) {
    const tier = c.tier ? `<span class="badge" style="background:${c.tier === '高' ? 'rgba(225,29,72,.1)' : 'rgba(217,119,6,.1)'};color:${c.tier === '高' ? '#e11d48' : '#d97706'}">关注 · ${esc(c.tier)}</span>` : '';
    const fate = c.fate ? `<div class="fate">
        <div class="frow"><b>性质：</b>${fateKind(c.fate.kind)}</div>
        <div class="frow"><b>关联：</b>${esc(c.fate.objects || '—')}</div>
        <div class="frow"><b>方向：</b>${esc(c.fate.direction || '中性')}</div>
        <div class="frow" style="color:#94a3b8;font-size:10.5px;margin-top:4px">前提：${esc(c.fate.assumption || '以官方发布为准')}</div></div>` : '';
    return `<div class="mcard"><div class="news-hero">
      <div class="ind-badges"><span class="badge src">${esc(c.srcLevel || '')} · ${esc(c.verified_status || '')}</span>${tier}</div>
      <h1>${esc(c.title)}</h1><div class="mstory">${esc(c.summary || '')}</div>${fate}
      <div style="margin-top:14px"><a class="dr-btn primary" href="${esc(c.url)}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">阅读原文 ↗</a></div>
      ${srcLinks(c.url ? [c.url] : [])}</div></div>`;
  }
  function viewVeg(c) {
    return `<div class="mcard">
      <div class="mhero veg-hero" style="background:${GRAD.agri};height:160px"><span class="mhero-emoji">🥬</span>
        <div class="mhero-txt"><div class="mkicker">当季农品 · 时令</div><h1>${esc(c.title)}</h1><div class="msub">${esc(c.subtitle || '')}</div></div></div>
      <div class="mbody"><div class="mstory">${esc(c.summary || '')}</div>
        <div class="mquote">🌱 农品按真实时令呈现，已过季或未上市会明确标注，不反季推荐。</div>
        ${srcLinks(c.url ? [c.url] : [])}</div></div>`;
  }
  function viewGeneric(c) {
    return `<div class="mcard"><div class="news-hero"><h1>${esc(c.title)}</h1><div class="mstory">${esc(c.summary || '')}</div>${srcLinks(c.url ? [c.url] : [])}</div></div>`;
  }

  /* ---------- 关联 frame ---------- */
  function renderFrame(l) {
    const f = l.frame || {};
    if (f.type === 'compare') {
      const [aId, bId] = l.card_ids; const a = byId[aId], b = byId[bId];
      const rows = (f.dimensions || []).map(d => `<div class="cd">${esc(d.dim)}</div><div>${esc(d.a)}</div><div>${esc(d.b)}</div>`).join('');
      return `<div class="lc-explain">${esc(f.explain || '')}</div>
        <div class="cmp"><div class="cd">维度</div><div class="ch">${esc(a ? a.title : '方案 A')}</div><div class="ch">${esc(b ? b.title : '方案 B')}</div>${rows}</div>`;
    }
    if (f.type === 'season') return `<div class="chain">${(f.chain || []).map(s => `<div class="cstep"><span class="cdot"></span><div class="cst">${esc(s.step)}</div><div class="ctx">${esc(s.text)}</div></div>`).join('')}</div>`;
    if (f.type === 'nearby') {
      const parts = String(f.route || '').split('→');
      return `<div class="route">${parts.map((p, i) => `<span class="rnode">${esc(p.trim())}</span>${i < parts.length - 1 ? '<span class="rarrow">→</span>' : ''}`).join('')}</div><div class="lc-explain">${esc(f.explain || '')}</div>`;
    }
    if (f.type === 'long-cycle') {
      const stages = (f.stages || []).map(s => `<div class="stage-item"><div class="ss">${esc(s.stage)}</div><div class="sx">${esc(s.text)}</div></div>`).join('');
      return `<div class="lc-explain">${esc(f.explain || '')}</div><div class="stages">${stages}</div>
        ${f.loop ? `<div class="flow"><div class="flow-row" style="font-size:10.5px;font-weight:800;color:#4f46e5;margin-bottom:7px">🔁 反馈回路（多年时滞）</div><div class="flow-row">${loopNodes(f.loop)}</div></div>` : ''}`;
    }
    if (f.type === 'stock-flow-lag') {
      return `<div class="duo">
          <div class="dbox neg"><div class="dl">当期流量 · 2025 固定资产投资</div><div class="dv">-18.8%</div><div class="dd">新开工引擎减速（工业 -12.7%、房地产 -47.6%）</div></div>
          <div class="dbox pos"><div class="dl">存量产能 · 2026 新点火</div><div class="dv">🔥 铜来顺</div><div class="dd">2-3 年前投资高峰开工的项目到了投产节点</div></div></div>
        <div class="lc-explain">${esc(f.explain || '')}</div>
        <div class="flow"><div class="flow-row" style="font-size:10.5px;font-weight:800;color:#334155;margin-bottom:7px">⏳ 流量 → 建设时滞 → 存量（系统动力学）</div><div class="flow-row">${loopNodes(f.loop)}</div></div>`;
    }
    return `<div class="lc-explain">${esc(f.explain || '')}</div>`;
  }
  function loopNodes(loop) {
    const parts = String(loop).split('→').map(s => s.trim()).filter(Boolean);
    return parts.map((p, i) => {
      const isLag = /〔|〕/.test(p);
      const isStock = /存量/.test(p) && !/流量/.test(p);
      const isFlow = /流量/.test(p) && !/存量/.test(p);
      const isShock = /病害/.test(p) && /冲击|↓/.test(p);
      let cls = 'fnode';
      if (isLag) cls += ' lag'; else if (isStock) cls += ' stock'; else if (isFlow) cls += ' flow'; else if (isShock) cls += ' shock';
      const txt = p.replace(/〔|〕/g, '');
      return `<span class="${cls}">${isLag ? '<span class="ltag">⏳ 时滞</span>' : ''}${esc(txt)}</span>${i < parts.length - 1 ? '<span class="farrow">→</span>' : ''}`;
    }).join('') + `<span class="loopback" style="width:100%">↩ 再投资形成正反馈；存量与流量不在同一时间刻度，因此会同时出现"当期走弱"与"项目投产"。</span>`;
  }

  /* ---------- DOM 构建 ---------- */
  let host, root, $, dock, drawer, toastEl, chipsEl, stageEl, insightEl, pickerEl, pListEl, pSearchEl;
  function buildDOM() {
    host = document.createElement('div');
    host.id = 'ws-layer';
    host.setAttribute('data-open', 'false');
    root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    const style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    root.innerHTML += `
      <div class="dock" id="dock" part="dock">
        <div class="dico">🧭</div>
        <div class="dtxt"><div class="dn">我的博罗 <span id="dockN">0</span></div><div class="ds" id="dockS">点击查看你选的内容与发现</div></div>
        <div class="dgo">⌃</div>
      </div>
      <div class="scrim" id="scrim"></div>
      <div class="drawer" id="drawer" role="dialog" aria-label="我的博罗工作区">
        <div class="dr-head">
          <div class="dr-title"><h2>🧭 我的博罗</h2><div class="cnt" id="wsCnt">已选 0 项 · 自动保存</div></div>
          <button class="dr-x" id="drClose" aria-label="收起">⌄</button>
          <div class="dr-tools">
            <button class="dr-btn" id="btnShare">⤴ 分享</button>
            <button class="dr-btn" id="btnClear">清空</button>
            <button class="dr-btn primary" id="btnAdd">＋ 添加内容</button>
          </div>
        </div>
        <div class="chips" id="chips"></div>

        <!-- 工作区视图 -->
        <div class="view on" id="viewWs">
          <div class="view-inner" id="stageInner"></div>
          <div class="insight" id="insight" style="display:none"></div>
        </div>

        <!-- 内容选择器视图 -->
        <div class="view" id="viewPicker">
          <div class="picker-head"><h3>把感兴趣的内容加进来</h3><button class="pback" id="pBack">‹ 返回</button></div>
          <div class="psearch"><span style="color:#94a3b8">🔍</span><input id="pSearch" placeholder="搜镇街、茶、产业、民生…"></div>
          <div class="pfilters" id="pFilters"></div>
          <div class="plist" id="pList"></div>
        </div>
      </div>
      <div class="toast" id="toast"></div>`;
    document.documentElement.appendChild(host);
    $ = (sel) => root.querySelector(sel);
    dock = $('#dock'); drawer = $('#drawer'); toastEl = $('#toast');
    chipsEl = $('#chips'); stageEl = $('#stageInner'); insightEl = $('#insight');
    pListEl = $('#pList'); pSearchEl = $('#pSearch');
    bindEvents();
  }

  /* ---------- 渲染 ---------- */
  function renderChips() {
    let html = state.ids.map(id => {
      const c = byId[id]; if (!c) return '';
      return `<div class="chip ${state.active === id ? 'on' : ''}" data-chip="${id}" draggable="true">
        <div class="cico" style="background:${cardVisual(c).grad};color:#fff">${c.emoji || TYPE_EMOJI[c.type] || '📌'}</div>
        <div class="ctxt"><div class="cn">${esc(c.title)}</div><div class="ct">${esc(chipSub(c))}</div></div>
        <button class="cx" data-remove="${id}" title="移出（可撤销）">✕</button></div>`;
    }).join('');
    html += `<button class="chip-add" data-picker>＋ 添加</button>`;
    chipsEl.innerHTML = html;
    $('#wsCnt').textContent = `已选 ${state.ids.length} 项 · 点选切换 · 自动保存`;
    $('#dockN').textContent = state.ids.length;
    $('#dockS').textContent = state.ids.length ? '点击查看你选的内容与发现' : '从内容里加入感兴趣的博罗';
    dock.classList.toggle('show', state.ids.length > 0);
  }

  function renderStage() {
    if (!state.active) {
      stageEl.innerHTML = `<div class="empty">
        <div class="ebox">🧭</div>
        <h3>把你感兴趣的博罗，放进这里</h3>
        <p>在页面里点内容上的 ＋，或用上面的「添加内容」。不同内容会自动展开成完整模块；当你选的内容之间存在联系，这里会主动发现一个值得一看的问题。</p>
        <div class="earrows">
          <button class="epill" data-quick="mod-baitang-tea">🍃 试试柏塘茶园</button>
          <button class="epill" data-quick="ind-fai">📉 看看投资与投产的时滞</button>
          <button class="epill" data-quick="mod-yangqiao-citrus">🍊 杨侨柑桔长周期</button>
        </div></div>`;
      return;
    }
    const c = byId[state.active];
    if (!c) { stageEl.innerHTML = ''; return; }
    stageEl.innerHTML = ({
      module: viewModule, town: viewTown, indicator: viewIndicator, news: viewNews, veg: viewVeg
    }[c.type] || viewGeneric)(c);
  }

  function renderInsight() {
    const links = activeLinks();
    if (!state.ids.length) { insightEl.style.display = 'none'; return; }
    insightEl.style.display = 'block';
    if (!links.length) {
      insightEl.classList.remove('open');
      insightEl.innerHTML = `<div class="insight-toggle"><div class="insight-orb" style="background:#94a3b8;box-shadow:none">🔗</div>
        <div class="itxt"><div class="it">还没有发现关联</div><div class="is">再加入 1—2 张内容：一个指标 + 一条新闻，或两个相邻去处。</div></div></div>`;
      return;
    }
    insightEl.classList.remove('open');
    const body = links.map(l => `<div class="link-card">
      <div class="lc-head"><span class="lc-kind">${kindName(l.kind)}</span><span class="lc-title">${esc(l.title)}</span></div>
      ${l.question ? `<div class="lc-q">❓ ${esc(l.question)}</div>` : ''}
      ${renderFrame(l)}
      ${l.caveat ? `<div class="caveat"><span>⚠️</span><span>${esc(l.caveat)}</span></div>` : ''}
      ${l.sources && l.sources.length ? `<div class="lc-src">🔗 来源：${l.sources.map(u => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '').slice(0, 38)}…</a>`).join('')}</div>` : ''}
    </div>`).join('');
    insightEl.innerHTML = `<button class="insight-toggle" id="insightToggle">
        <div class="insight-orb">🔗</div>
        <div class="itxt"><div class="it">为你发现了 ${links.length} 个值得一看的联系</div><div class="is">${esc(links[0].question || links[0].title)}</div></div>
        <span class="chev">▾</span></button><div class="insight-body">${body}</div>`;
  }

  function matchFilter(c) {
    const cat = (c.tags && c.tags.category) || '';
    if (state.filter === 'news') return c.type === 'news';
    if (state.filter === 'tourism') return cat === 'tourism' || (c.type === 'module' && cat === 'tourism');
    if (state.filter === 'food') return cat === 'food' || cat === 'agri';
    if (state.filter === 'industry') return cat === 'industry';
    if (state.filter === 'livelihood') return cat === 'livelihood' || cat === 'city';
    return true;
  }
  function renderPicker() {
    $('#pFilters').innerHTML = FILTERS.map(f => `<button class="fchip ${state.filter === f.k ? 'on' : ''}" data-f="${f.k}">${f.n}</button>`).join('');
    const q = state.q.trim().toLowerCase();
    const list = (DB.pool.cards || []).filter(c => {
      if (!matchFilter(c)) return false;
      if (q) {
        const hay = [c.title, c.subtitle, (c.tags && c.tags.entities || []).join(''), (c.tags && c.tags.locations || []).join('')].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (!list.length) { pListEl.innerHTML = '<div class="pempty">没有匹配的内容，换个关键词或分类试试。</div>'; return; }
    pListEl.innerHTML = list.map(c => {
      const v = cardVisual(c);
      const loc = ((c.tags && c.tags.locations) || [])[0] || '';
      const inWs = state.ids.includes(c.id);
      const pImg = mediaOf(c.id);
      return `<div class="pcard ${inWs ? 'inws' : ''}" data-draggable="${c.id}" draggable="true">
        <div class="pthumb"${pImg ? '' : ` style="background:${v.grad}"`}><span class="ptag">${v.tag}</span>${pImg ? `<img class="pthumb-img" src="${pImg}" alt="">` : `<span>${c.emoji || TYPE_EMOJI[c.type] || '📌'}</span>`}</div>
        <div class="pbody"><div class="pt">${esc(c.title)}</div><div class="pm">${loc ? '📍' + esc(loc) + ' · ' : ''}${esc(c.subtitle || '')}</div></div>
        <button class="padd" data-add="${c.id}" ${inWs ? 'disabled' : ''}>${inWs ? '✓' : '＋'}</button>
      </div>`;
    }).join('');
  }

  function renderAll() { renderChips(); renderStage(); renderInsight(); if (state.view === 'picker') renderPicker(); emitChange(); }

  /* ---------- 状态操作 ---------- */
  function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify({ ids: state.ids, active: state.active, v: 3 })); } catch (e) {} }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (s && Array.isArray(s.ids)) { state.ids = s.ids.filter(id => byId[id]); state.active = s.active; }
    } catch (e) {}
  }
  function toast(msg, undoFn, goFn) {
    toastEl.innerHTML = esc(msg) +
      (goFn ? '<button class="go" data-toast-go">查看</button>' : '') +
      (undoFn ? '<button class="undo" data-toast-undo>撤销</button>' : '');
    toastEl._undo = undoFn || null;
    toastEl._go = goFn || null;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }
  function add(id, opts) {
    opts = opts || {};
    if (!byId[id]) return;
    const existed = state.ids.includes(id);
    if (!existed) state.ids.push(id);
    state.active = id; persist(); renderAll();
    if (opts.open) { open(); }
    else {
      toast(existed ? '已在工作区' : '已加入「我的博罗」', null, () => open());
      dock.classList.remove('pulse'); void dock.offsetWidth; dock.classList.add('pulse');
    }
  }
  function remove(id) {
    const i = state.ids.indexOf(id); if (i < 0) return;
    const removed = state.ids.splice(i, 1)[0];
    if (state.active === removed) state.active = state.ids[Math.min(i, state.ids.length - 1)] || null;
    persist(); renderAll(); lastRemoved = { id: removed, index: i };
    toast('已移出（内容仍在内容库）', () => {
      state.ids.splice(Math.min(i, state.ids.length), 0, removed); state.active = removed; persist(); renderAll();
    });
  }
  function clearAll() {
    if (!state.ids.length) return;
    const old = [...state.ids];
    state.ids = []; state.active = null; persist(); renderAll();
    toast('已清空，可撤销', () => { state.ids = old; state.active = old[0] || null; persist(); renderAll(); });
  }
  function share() {
    const hash = '#ws=' + state.ids.join(',');
    try { history.replaceState(null, '', hash); } catch (e) {}
    const link = location.origin + location.pathname + hash;
    if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    toast('分享链接已生成并复制，也可从地址栏复制');
  }
  function open() { host.setAttribute('data-open', 'true'); toastEl.classList.remove('show'); }
  function close() { host.setAttribute('data-open', 'false'); state.view = 'ws'; switchView(); }
  function toggle() { host.getAttribute('data-open') === 'true' ? close() : open(); }
  function switchView() {
    $('#viewWs').classList.toggle('on', state.view === 'ws');
    $('#viewPicker').classList.toggle('on', state.view === 'picker');
    if (state.view === 'picker') renderPicker();
  }
  function emitChange() { listeners.change.forEach(fn => { try { fn(state.ids.slice(), state.active); } catch (e) {} }); }

  /* ---------- 事件（统一委托） ---------- */
  function bindEvents() {
    // 浮条 / 遮罩 / 关闭
    dock.addEventListener('click', open);
    $('#scrim').addEventListener('click', close);
    $('#drClose').addEventListener('click', close);
    $('#btnShare').addEventListener('click', share);
    $('#btnClear').addEventListener('click', clearAll);
    $('#btnAdd').addEventListener('click', () => { state.view = 'picker'; switchView(); });
    $('#pBack').addEventListener('click', () => { state.view = 'ws'; switchView(); });
    $('#pFilters').addEventListener('click', e => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      state.filter = b.dataset.f; renderPicker();
    });
    pSearchEl.addEventListener('input', e => { state.q = e.target.value; renderPicker(); });

    // 全局点击委托（含 toast 撤销/查看）
    root.addEventListener('click', e => {
      const tu = e.target.closest('[data-toast-undo]');
      const tg = e.target.closest('[data-toast-go]');
      if (tu) { if (toastEl._undo) toastEl._undo(); toastEl.classList.remove('show'); return; }
      if (tg) { if (toastEl._go) toastEl._go(); toastEl.classList.remove('show'); return; }

      const addB = e.target.closest('[data-add]');
      if (addB) { e.stopPropagation(); add(addB.dataset.add); return; }
      const rmB = e.target.closest('[data-remove]');
      if (rmB) { e.stopPropagation(); remove(rmB.dataset.remove); return; }
      const quick = e.target.closest('[data-quick]');
      if (quick) { add(quick.dataset.quick); return; }
      const goto = e.target.closest('[data-goto]');
      if (goto) { add(goto.dataset.goto); return; }
      const picker = e.target.closest('[data-picker]');
      if (picker) { state.view = 'picker'; switchView(); return; }
      const chip = e.target.closest('[data-chip]');
      if (chip && !e.target.closest('[data-remove]')) { state.active = chip.dataset.chip; persist(); renderChips(); renderStage(); renderInsight(); return; }
      const mapB = e.target.closest('[data-map]');
      if (mapB) { window.open('https://uri.amap.com/search?keyword=' + encodeURIComponent('博罗县 ' + mapB.dataset.map), '_blank'); return; }
      const it = e.target.closest('#insightToggle');
      if (it) { insightEl.classList.toggle('open'); return; }
    });

    // chips 拖入排序 + 宿主页面拖卡入抽屉
    root.addEventListener('dragover', e => {
      const types = Array.from(e.dataTransfer ? e.dataTransfer.types : []);
      if (types.includes('text/ws-id') || types.includes('text/ws-chip')) {
        e.preventDefault();
        const chip = e.target.closest('[data-chip]');
        if (chip) chip.classList.add('drag-over');
      }
    });
    root.addEventListener('dragleave', e => { const c = e.target.closest('[data-chip]'); if (c) c.classList.remove('drag-over'); });
    root.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/ws-id') || e.dataTransfer.getData('text/ws-chip');
      const targetChip = e.target.closest('[data-chip]');
      if (targetChip && e.dataTransfer.getData('text/ws-chip')) {
        reorder(e.dataTransfer.getData('text/ws-chip'), targetChip.dataset.chip);
      } else if (id && byId[id]) {
        add(id);
      }
    });
    chipsEl.addEventListener('dragstart', e => {
      const chip = e.target.closest('[data-chip]');
      if (chip) { e.dataTransfer.setData('text/ws-chip', chip.dataset.chip); e.dataTransfer.effectAllowed = 'move'; }
    });
    pListEl.addEventListener('dragstart', e => {
      const card = e.target.closest('[data-draggable]');
      if (card) { e.dataTransfer.setData('text/ws-id', card.dataset.draggable); e.dataTransfer.effectAllowed = 'copy'; }
    });

    // 桌面端：从宿主页面拖卡时，即使工作区为空也让底部浮条浮现为投放热区
    const isWsDrag = e => !!(e.dataTransfer && Array.from(e.dataTransfer.types).includes('text/ws-id'));
    document.addEventListener('dragover', e => { if (isWsDrag(e) && state.ids.length === 0) dock.classList.add('drop-ready'); });
    const endDrop = () => dock.classList.remove('drop-ready');
    document.addEventListener('dragend', endDrop);
    document.addEventListener('drop', endDrop);
  }
  function reorder(src, target) {
    const si = state.ids.indexOf(src), ti = state.ids.indexOf(target);
    if (si < 0 || ti < 0 || si === ti) return;
    state.ids.splice(si, 1); state.ids.splice(ti, 0, src); persist(); renderChips();
  }

  /* ---------- 加载数据 ---------- */
  async function load() {
    buildDOM();
    try {
      const [pl, mo, to, li] = await Promise.all([
        fetch(url('pool.json')).then(r => r.json()),
        fetch(url('modules.json')).then(r => r.json()),
        fetch(url('towns.json')).then(r => r.json()),
        fetch(url('links.json')).then(r => r.json())
      ]);
      DB.pool = pl; DB.modules = mo.modules || []; DB.towns = to.districts || []; DB.links = li.links || [];
      (pl.cards || []).forEach(c => byId[c.id] = c);
    } catch (e) {
      console.warn('[WS] 内容库加载失败', e);
      if (stageEl) stageEl.innerHTML = '<div class="empty"><h3>内容库加载失败</h3><p>请检查网络后刷新。</p></div>';
      return;
    }
    // 分享链接
    const h = location.hash.match(/ws=([\w,\-]+)/);
    if (h) {
      const ids = h[1].split(',').filter(id => byId[id]);
      if (ids.length) { state.ids = ids; state.active = ids[0]; persist(); open(); }
      else restore();
    } else {
      restore();
    }
    if (!state.active || !byId[state.active]) state.active = state.ids[0] || null;
    renderAll();
  }

  /* ---------- 对外 API ---------- */
  const api = {
    __installed: true,
    ready: null,
    add, remove, open, close, toggle,
    has: (id) => state.ids.includes(id),
    count: () => state.ids.length,
    cards: () => (DB.pool && DB.pool.cards || []).slice(),
    card: (id) => byId[id] || null,
    media: (id) => mediaOf(id),
    on: (ev, fn) => { if (listeners[ev]) listeners[ev].push(fn); }
  };
  window.WS = api;
  api.ready = new Promise(res => { api.__ready = res; });

  function boot() {
    load().then(() => { api.__ready && api.__ready(true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
