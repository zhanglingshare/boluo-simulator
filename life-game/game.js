(function () {
  "use strict";
  var STORE_KEY = "boluo-life-game-season-01";
  var data = null;
  var state = null;
  var selectedPlace = "all";
  var activeNpc = null;
  var toastTimer = null;
  var soundOn = false;
  var audioContext = null;
  var chatRotation = 0;

  var STAT_META = {
    budget: {label:"预算",icon:"💰",bar:"budgetBar",value:"budgetValue",hint:"budgetHint",max:100},
    trust: {label:"信任",icon:"🤝",bar:"trustBar",value:"trustValue",hint:"trustHint",max:100},
    buzz: {label:"热度",icon:"✨",bar:"buzzBar",value:"buzzValue",hint:"buzzHint",max:100},
    energy: {label:"精力",icon:"⚡",bar:"energyBar",value:"energyValue",hint:"energyHint",max:100},
    evidence: {label:"线索",icon:"🔎",bar:"evidenceBar",value:"evidenceValue",hint:"evidenceHint",max:24}
  };
  var HINTS = {
    budget:["现金余量偏紧，先别把摊子铺太大。","还有周转空间，但要留意新增支出。","预算比较宽松，可以考虑下一步投入。"],
    trust:["街坊的耐心正在下降，先把规则讲清楚。","大家愿意参与，但还需要看见公平和兑现。","信任基础不错，合作更容易持续。"],
    buzz:["知道这件事的人还不多。","已经有人注意到，但热闹不等于成交。","关注度很高，现场承接能力要跟上。"],
    energy:["团队已经很疲惫，继续加码有风险。","大家还能推进，但需要轮班和休息。","团队状态不错，仍要避免把精力当成无限资源。"],
    evidence:["你还没翻开多少线索。","你已经找到一些关键条件。","线索比较充分，结局复盘会更有依据。"]
  };

  function freshState() {
    return {
      version: 1, day: 0, role: null,
      stats: {budget:55, trust:42, buzz:24, energy:76, evidence:0},
      cluesByDay: {}, history: [], resolved: false, finished: false,
      talkedDays: {}, selectedPlace: "all"
    };
  }
  function safeLoad() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return freshState();
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.stats || !Array.isArray(parsed.history)) return freshState();
      var base = freshState();
      return Object.assign(base, parsed, {
        stats: Object.assign(base.stats, parsed.stats),
        cluesByDay: parsed.cluesByDay || {},
        talkedDays: parsed.talkedDays || {}
      });
    } catch (err) { return freshState(); }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      var el = document.getElementById("saveStatus");
      if (el) el.textContent = "进度已保存在本机";
    } catch (err) {
      var el2 = document.getElementById("saveStatus");
      if (el2) el2.textContent = "本机保存不可用";
    }
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function getRole() {
    return data.roles.find(function (r) { return r.id === state.role; }) || null;
  }
  function getNpc(id) {
    return data.npcs.find(function (n) { return n.id === id; }) || null;
  }
  function getDay() { return data.days[state.day]; }
  function showToast(message) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2300);
  }
  function playTone(freq) {
    if (!soundOn) return;
    try {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioContext) audioContext = new AudioCtor();
      if (audioContext.state === "suspended") audioContext.resume();
      var osc = audioContext.createOscillator();
      var gain = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.value = freq || 660;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.start(); osc.stop(audioContext.currentTime + 0.13);
    } catch (err) {}
  }
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) { el.hidden = false; document.body.classList.add("modal-open"); }
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) document.body.classList.remove("modal-open");
  }
  function applyRole(roleId) {
    var role = data.roles.find(function (r) { return r.id === roleId; });
    if (!role) return;
    state.role = roleId;
    Object.keys(role.bonus).forEach(function (key) {
      if (typeof state.stats[key] === "number") state.stats[key] = clamp(state.stats[key] + role.bonus[key], 0, key === "evidence" ? 24 : 100);
    });
    save();
    closeModal("roleModal");
    render();
    showToast("视角已确定。接下来，轮到你做选择。");
    playTone(660);
  }
  function renderRoleOptions() {
    var wrap = document.getElementById("roleOptions");
    wrap.innerHTML = data.roles.map(function (role) {
      return '<button class="role-card" type="button" data-role="' + esc(role.id) + '">' +
        '<span class="role-emoji">' + esc(role.emoji) + '</span><b>' + esc(role.name) + '</b>' +
        '<small>' + esc(role.description) + '</small><em>' + esc(role.tag) + ' →</em></button>';
    }).join("");
  }
  function renderStats() {
    Object.keys(STAT_META).forEach(function (key) {
      var meta = STAT_META[key];
      var value = state.stats[key] || 0;
      var pct = clamp(value / meta.max * 100, 0, 100);
      var bar = document.getElementById(meta.bar);
      var valueEl = document.getElementById(meta.value);
      var hintEl = document.getElementById(meta.hint);
      if (bar) bar.style.width = pct + "%";
      if (valueEl) valueEl.textContent = key === "evidence" ? value : Math.round(value);
      if (hintEl) {
        var group = HINTS[key];
        var index = value < 30 ? 0 : (value < 68 ? 1 : 2);
        hintEl.textContent = group[index];
      }
    });
  }
  function renderProgress() {
    var completed = state.history.length;
    var percent = Math.round(completed / 7 * 100);
    document.getElementById("progressText").textContent = "已完成 " + completed + " / 7 天";
    document.getElementById("progressPercent").textContent = percent + "%";
    document.getElementById("progressBar").style.width = percent + "%";
    var role = getRole();
    document.getElementById("playerAvatar").textContent = role ? role.emoji : "🎒";
    document.getElementById("playerRole").textContent = role ? role.name : "尚未选择";
  }
  function renderDayRail() {
    var wrap = document.getElementById("dayRail");
    wrap.innerHTML = data.days.map(function (day, index) {
      var cls = index < state.day || (index === state.day && state.resolved) ? "done" : (index === state.day ? "current" : "locked");
      var label = index < state.day || (index === state.day && state.resolved) ? "✓" : String(index + 1).padStart(2, "0");
      var disabled = index >= state.day ? " disabled" : "";
      return '<button class="day-step ' + cls + '" type="button" data-review-day="' + index + '"' + disabled + '><b>' + label + '</b><span>' + esc(day.label.replace("第","").replace("天","")) + '</span></button>';
    }).join("");
    document.getElementById("dayBadge").textContent = "DAY " + String(state.day + 1).padStart(2, "0");
  }
  function renderPlace() {
    var place = data.locations.find(function (p) { return p.id === selectedPlace; });
    var detail = document.getElementById("placeDetail");
    document.querySelectorAll(".map-pin").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-place") === selectedPlace);
    });
    if (!place) {
      detail.innerHTML = '<span class="place-emoji">🗺️</span><div><b>整个街区</b><small>正在看全部人物与今天的消息。</small></div><button class="text-button" id="showAllPeople" type="button">看全部人物 →</button>';
    } else {
      detail.innerHTML = '<span class="place-emoji">' + esc(place.emoji) + '</span><div><b>' + esc(place.name) + ' · ' + esc(place.tag) + '</b><small>' + esc(place.description) + '</small></div><button class="text-button" id="showAllPeople" type="button">看全部人物 →</button>';
    }
    renderNpcGrid();
  }
  function renderNpcGrid() {
    var wrap = document.getElementById("npcGrid");
    var list = data.npcs.filter(function (npc) { return selectedPlace === "all" || npc.place === selectedPlace; });
    document.getElementById("npcCount").textContent = list.length + " 位角色";
    if (!list.length) {
      wrap.innerHTML = '<div class="empty-state">这个地点暂时没有角色。</div>';
      return;
    }
    var colors = ["#f8e9d9","#e7f0e4","#e9edf5","#f4e8ee","#e8f1ef","#f5efdc","#e9e7f5","#f7e9df"];
    wrap.innerHTML = list.map(function (npc, index) {
      return '<button class="npc-card" type="button" data-npc="' + esc(npc.id) + '" style="--avatar-bg:' + colors[data.npcs.indexOf(npc) % colors.length] + '">' +
        '<span class="npc-avatar">' + esc(npc.avatar) + '</span><span class="npc-name">' + esc(npc.name) + '</span>' +
        '<span class="npc-job">' + esc(npc.job) + '</span><span class="npc-tag">' + esc(npc.tag) + '</span></button>';
    }).join("");
  }
  function renderEvent() {
    var day = getDay();
    document.getElementById("eventLabel").textContent = day.label + " · " + (state.day === 0 ? "起点" : "故事推进");
    document.getElementById("eventHook").textContent = day.hook;
    document.getElementById("eventTitle").textContent = day.title;
    document.getElementById("eventStory").textContent = day.story;
    var role = getRole();
    document.getElementById("eventFocus").textContent = day.focus + (role ? " 你的视角：" + role.voice : "");

  }
  function renderClues() {
    var day = getDay();
    var chosenId = state.cluesByDay[state.day];
    var wrap = document.getElementById("clueGrid");
    var reveal = document.getElementById("clueReveal");
    document.getElementById("clueLimit").textContent = chosenId ? "今日已翻开" : (state.resolved ? "今日已封存" : "每天 1 次");
    wrap.innerHTML = day.clues.map(function (clue, index) {
      var used = !!chosenId || state.resolved;
      return '<button class="clue-card" type="button" data-clue="' + esc(clue.id) + '"' + (used ? " disabled" : "") + '>' +
        '<span class="clue-icon">' + (index === 0 ? "🗂️" : index === 1 ? "🧾" : "🔍") + '</span>' +
        '<b>' + esc(clue.title) + '</b><small>' + esc(clue.kind) + ' · ' + (used && clue.id === chosenId ? "已翻开" : "点击调查") + '</small></button>';
    }).join("");
    if (chosenId) {
      var chosen = day.clues.find(function (c) { return c.id === chosenId; });
      reveal.hidden = false;
      reveal.innerHTML = '<b>🔎 ' + esc(chosen.title) + ' · 线索已记录</b>' + esc(chosen.reveal) + '<div class="delta-chips"><span class="delta-chip">线索进度 +' + chosen.evidence + '</span><span class="delta-chip">本日不再翻第二张</span></div>';
    } else {
      reveal.hidden = true;
      reveal.textContent = "";
    }
  }
  function deltaLabel(key, value) {
    var labels = {budget:"预算",trust:"信任",buzz:"热度",energy:"精力",evidence:"线索"};
    return labels[key] + (value > 0 ? " +" : " ") + value;
  }
  function renderChoices() {
    var day = getDay();
    var list = document.getElementById("choiceList");
    var outcome = document.getElementById("choiceOutcome");
    var next = document.getElementById("nextDay");
    if (state.resolved) {
      list.hidden = true;
      var last = state.history[state.history.length - 1];
      outcome.hidden = false;
      outcome.innerHTML = '<strong>你的决定：' + esc(last.choiceTitle) + '</strong>' + esc(last.outcome) +
        '<div class="delta-chips">' + Object.keys(last.delta).filter(function (k) { return last.delta[k] !== 0; }).map(function (k) {
          return '<span class="delta-chip">' + esc(deltaLabel(k,last.delta[k])) + '</span>';
        }).join("") + '</div>';
      next.hidden = false;
      next.innerHTML = state.day === 6 ? '查看七日结局 <span>✦</span>' : '进入下一天 <span>→</span>';
    } else {
      list.hidden = false;
      outcome.hidden = true;
      next.hidden = true;
      list.innerHTML = day.choices.map(function (choice, index) {
        return '<button class="choice-card" type="button" data-choice="' + esc(choice.id) + '">' +
          '<span class="choice-no">0' + (index + 1) + '</span><b>' + esc(choice.title) + '</b><span class="choice-arrow">↗</span>' +
          '<small>' + esc(choice.desc) + '</small><span class="choice-tradeoff">代价 / 取舍：' + esc(choice.tradeoff) + '</span></button>';
      }).join("");
    }
  }
  function renderChat() {
    var day = getDay();
    var wrap = document.getElementById("chatFeed");
    var messages = day.chat.slice();
    if (messages.length) {
      var shift = chatRotation % messages.length;
      messages = messages.slice(shift).concat(messages.slice(0, shift));
    }
    wrap.innerHTML = messages.map(function (msg) {
      var npc = getNpc(msg.npc);
      if (!npc) return "";
      var place = data.locations.find(function (p) { return p.id === msg.place; });
      return '<div class="chat-message"><span class="chat-avatar">' + esc(npc.avatar) + '</span><div class="chat-bubble">' +
        '<div class="chat-meta"><b>' + esc(npc.name) + '</b><small>' + esc(msg.time) + ' · ' + esc(place ? place.name : "") + '</small></div>' +
        '<p>' + esc(msg.text) + '</p></div></div>';
    }).join("");
  }
  function render() {
    if (!data || !state) return;
    renderStats();
    renderProgress();
    renderDayRail();
    renderPlace();
    renderEvent();
    renderClues();
    renderChoices();
    renderChat();
    if (state.finished) showEnding();
  }
  function applyDelta(delta) {
    Object.keys(delta).forEach(function (key) {
      if (typeof state.stats[key] === "number") {
        var max = key === "evidence" ? 24 : 100;
        state.stats[key] = clamp(state.stats[key] + delta[key], 0, max);
      }
    });
  }
  function chooseOption(choiceId) {
    if (state.resolved || state.finished) return;
    var day = getDay();
    var choice = day.choices.find(function (c) { return c.id === choiceId; });
    if (!choice) return;
    applyDelta(choice.delta);
    state.history.push({
      day: state.day + 1, choiceId: choice.id, choiceTitle: choice.title,
      outcome: choice.outcome, delta: choice.delta
    });
    state.resolved = true;
    save();
    render();
    playTone(520);
    showToast("选择已写入故事。下一天会带着它继续。");
  }
  function revealClue(clueId) {
    if (state.cluesByDay[state.day]) { showToast("今天已经翻过一张线索牌。"); return; }
    var clue = getDay().clues.find(function (c) { return c.id === clueId; });
    if (!clue) return;
    state.cluesByDay[state.day] = clue.id;
    state.stats.evidence = clamp(state.stats.evidence + clue.evidence, 0, 24);
    save();
    render();
    playTone(760);
    showToast("线索已加入你的调查记录。");
  }
  function nextDay() {
    if (!state.resolved) return;
    if (state.day >= 6) {
      state.finished = true;
      save();
      showEnding();
      return;
    }
    state.day += 1;
    state.resolved = false;
    selectedPlace = "all";
    chatRotation = 0;
    save();
    render();
    window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
    playTone(660);
  }
  function openNpc(npcId) {
    var npc = getNpc(npcId);
    if (!npc) return;
    activeNpc = npcId;
    renderNpcProfile(npc);
    openModal("npcModal");
  }
  function renderNpcProfile(npc, replyText) {
    var relations = npc.relations.map(function (id) {
      var other = getNpc(id);
      return other ? '<span class="relation-chip">' + esc(other.avatar) + ' ' + esc(other.name) + '</span>' : "";
    }).join("");
    var talked = !!state.talkedDays[String(state.day)];
    var place = data.locations.find(function (p) { return p.id === npc.place; });
    var reply = replyText ? '<div class="profile-reply">' + esc(replyText) + '</div>' : "";
    var actions = [
      {id:"support",label:"🤝 表示理解"},
      {id:"question",label:"🔎 继续追问"},
      {id:"challenge",label:"⚡ 提出反对"}
    ];
    document.getElementById("npcProfile").innerHTML =
      '<div class="profile-top"><span class="profile-avatar">' + esc(npc.avatar) + '</span><div><h2 id="npcName">' + esc(npc.name) + '</h2><p>' + esc(npc.age) + ' · ' + esc(npc.job) + ' · ' + esc(place ? place.name : "") + '</p><span class="profile-tag">' + esc(npc.tag) + '</span></div></div>' +
      '<div class="profile-block"><h3>他 / 她想要什么</h3><p>' + esc(npc.goal) + '</p></div>' +
      '<div class="profile-block"><h3>人物简介</h3><p>' + esc(npc.intro) + '</p></div>' +
      '<div class="profile-block"><h3>性格</h3><p>' + esc(npc.personality) + '</p></div>' +
      '<div class="profile-block"><h3>关系网</h3><div class="relation-list">' + relations + '</div></div>' +
      '<div class="profile-block"><h3>今天可以怎么聊</h3><div class="profile-actions">' + actions.map(function (a) {
        return '<button type="button" data-talk="' + a.id + '"' + (talked ? " disabled" : "") + '>' + a.label + '</button>';
      }).join("") + '</div>' + (talked ? '<p class="micro-copy">今天已经和这位街坊聊过。明天可以继续。</p>' : '<p class="micro-copy">每天可以认真聊一位角色；你的回应会轻微影响关系与线索。</p>') + reply + '</div>';
  }
  function talkToNpc(action) {
    if (!activeNpc) return;
    var npc = getNpc(activeNpc);
    if (state.resolved) { showToast("今天的决定已经落下，下一天再继续互动。"); return; }
    if (!npc || state.talkedDays[String(state.day)]) {
      showToast("今天已经和这位街坊聊过了。");
      return;
    }
    var reply = npc.replies[action] || npc.lines[0];
    state.talkedDays[String(state.day)] = npc.id;
    if (action === "support") { applyDelta({trust:2,energy:-1}); }
    if (action === "question") { applyDelta({evidence:1,trust:1}); }
    if (action === "challenge") { applyDelta({trust:-1,evidence:1}); }
    save();
    renderStats();
    renderNpcProfile(npc, reply);
    playTone(action === "challenge" ? 390 : 620);
    showToast("你和" + npc.name + "聊了一次。");
  }
  function getEnding() {
    var s = state.stats;
    if (s.energy < 24) return {
      title:"人先累垮了",subtitle:"场面可以撑起来，团队却不是无限资源。",
      body:"你把事情推到了一个阶段，但团队精力已经明显吃紧。下一次最该改的不是宣传，而是分工、轮班和收尾机制。"
    };
    if (s.budget < 27 && s.buzz >= 65) return {
      title:"热闹有了，账本吃紧",subtitle:"人气很亮眼，现金流却在提醒你。",
      body:"这次小集吸引了不少注意，但预算余量不足。热度不能直接当收入，下一轮要先弄清实际成交、成本和回款。"
    };
    if (s.trust >= 64 && s.budget >= 34 && s.energy >= 34) return {
      title:"小集稳稳落地",subtitle:"没有追求最大场面，而是把合作做成了。",
      body:"预算、信任和团队精力保持在相对平衡的位置。它不意味着一定成功，而是说明这套安排有机会进入下一轮小规模验证。"
    };
    if (s.evidence >= 15 && s.trust >= 52) return {
      title:"先把机制跑通",subtitle:"你带走的不是一个漂亮数字，而是一份更清楚的清单。",
      body:"你投入了时间去找线索，也让更多人参与讨论。下一步最值得做的是补齐真实成本、参与者工时、到场和成交记录，再决定是否扩大。"
    };
    return {
      title:"小步试跑，留下问题",subtitle:"这不是失败，也不是通关答案。",
      body:"你完成了第一轮尝试，但几个目标之间仍有取舍。真正有价值的是知道哪些地方已经跑通，哪些条件还需要补证据。"
    };
  }
  function showEnding() {
    if (!data || !state || state.history.length < 7) return;
    var ending = getEnding();
    var role = getRole();
    var decisions = state.history.map(function (item) { return "第" + item.day + "天：" + item.choiceTitle; }).join("；");
    var stats = state.stats;
    document.getElementById("endingContent").innerHTML =
      '<div class="ending-hero"><span>SEASON 01 · YOUR ENDING</span><h2 id="endingTitle">' + esc(ending.title) + '</h2><p>' + esc(ending.subtitle) + '</p></div>' +
      '<div class="profile-block"><h3>这次旅程的复盘</h3><p>' + esc(ending.body) + '</p></div>' +
      '<div class="ending-stats">' +
      '<div class="ending-stat"><b>' + stats.budget + '</b><small>预算余量</small></div>' +
      '<div class="ending-stat"><b>' + stats.trust + '</b><small>街坊信任</small></div>' +
      '<div class="ending-stat"><b>' + stats.buzz + '</b><small>现场热度</small></div>' +
      '<div class="ending-stat"><b>' + stats.energy + '</b><small>团队精力</small></div></div>' +
      '<div class="profile-block"><h3>你的视角</h3><p>' + esc(role ? role.name + " · " + role.tag : "未选择") + '</p></div>' +
      '<div class="profile-block"><h3>七天里，你做过的选择</h3><p>' + esc(decisions) + '</p></div>' +
      '<div class="profile-block"><h3>下一轮最该补什么</h3><p>真实到场、成交、成本、人员工时、损耗和回款周期。游戏剧情不能替代现实调查。</p></div>' +
      '<div class="ending-actions"><button class="primary-button" id="shareEnding" type="button">分享我的结局 ↗</button><button class="quiet-button" id="restartFromEnding" type="button">换个身份再玩</button></div>' +
      '<p class="micro-copy">本季为虚构情景模拟。所有数值仅用于游戏机制，不是博罗真实统计或经营数据。</p>';
    openModal("endingModal");
  }
  function shareText() {
    var ending = getEnding();
    var role = getRole();
    return "我在《今天，博罗有戏！》完成了七天挑战。\n我的视角：" + (role ? role.name : "街坊观察者") +
      "\n我的结局：" + ending.title + "\n预算 " + state.stats.budget + " · 信任 " + state.stats.trust +
      " · 热度 " + state.stats.buzz + " · 精力 " + state.stats.energy +
      "\n你会怎么选？来试试：" + window.location.href +
      "\n（虚构剧情游戏，数值不代表博罗真实经营数据）";
  }
  function shareEnding() {
    var text = shareText();
    if (navigator.share) {
      navigator.share({title:"我的博罗七日结局",text:text,url:window.location.href}).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast("结局卡文案已复制，可以发给朋友。"); }).catch(function () { window.prompt("复制你的结局卡：",text); });
    } else {
      window.prompt("复制你的结局卡：",text);
    }
  }
  function resetGame() {
    if (!window.confirm("要重新开始吗？当前七日进度会清空。")) return;
    try { localStorage.removeItem(STORE_KEY); } catch (err) {}
    state = freshState();
    selectedPlace = "all";
    chatRotation = 0;
    closeModal("endingModal");
    closeModal("npcModal");
    render();
    openModal("roleModal");
  }
  function handleClick(event) {
    var target = event.target;
    if (target.closest("#showAllPeople")) { selectedPlace = "all"; renderPlace(); return; }
    var roleButton = target.closest("[data-role]");
    if (roleButton) { applyRole(roleButton.getAttribute("data-role")); return; }
    var pin = target.closest("[data-place]");
    if (pin) { selectedPlace = pin.getAttribute("data-place"); renderPlace(); playTone(470); return; }
    var npcButton = target.closest("[data-npc]");
    if (npcButton) { openNpc(npcButton.getAttribute("data-npc")); return; }
    var clueButton = target.closest("[data-clue]");
    if (clueButton) { revealClue(clueButton.getAttribute("data-clue")); return; }
    var choiceButton = target.closest("[data-choice]");
    if (choiceButton) { chooseOption(choiceButton.getAttribute("data-choice")); return; }
    var talkButton = target.closest("[data-talk]");
    if (talkButton) { talkToNpc(talkButton.getAttribute("data-talk")); return; }
    var closeButton = target.closest("[data-close]");
    if (closeButton) {
      var which = closeButton.getAttribute("data-close");
      if (which === "role" && !state.role) return;
      closeModal(which === "role" ? "roleModal" : which === "npc" ? "npcModal" : "endingModal");
      return;
    }
    var reviewButton = target.closest("[data-review-day]");
    if (reviewButton) {
      var reviewIndex = Number(reviewButton.getAttribute("data-review-day"));
      if (reviewIndex < state.day) {
        var record = state.history.find(function (h) { return h.day === reviewIndex + 1; });
        if (record) showToast("第" + record.day + "天：你选择了「" + record.choiceTitle + "」。");
      }
    }
  }
  function init() {
    fetch("./data/season-01.json").then(function (response) {
      if (!response.ok) throw new Error("剧情数据加载失败");
      return response.json();
    }).then(function (payload) {
      data = payload;
      state = safeLoad();
      selectedPlace = state.selectedPlace || "all";
      renderRoleOptions();
      render();
      if (!state.role) openModal("roleModal");
      if (state.finished) showEnding();
    }).catch(function () {
      document.body.innerHTML = '<main style="max-width:680px;margin:12vh auto;padding:28px;font-family:system-ui;color:#172a36"><h1>剧情暂时没有加载出来</h1><p>请刷新页面重试。如果你是直接双击本地文件打开，请使用静态 HTTP 服务运行这个目录。</p><a href="./index.html">重新加载</a></main>';
    });
    document.addEventListener("click", handleClick);
    document.getElementById("refreshChat").addEventListener("click", function () { chatRotation += 1; renderChat(); showToast("换个顺序，再听听街坊怎么说。"); });
    document.getElementById("nextDay").addEventListener("click", nextDay);
    document.getElementById("resetGame").addEventListener("click", resetGame);
    document.getElementById("soundToggle").addEventListener("click", function () {
      soundOn = !soundOn;
      this.setAttribute("aria-pressed", String(soundOn));
      this.textContent = soundOn ? "♫" : "♪";
      showToast(soundOn ? "轻提示音已开启。" : "轻提示音已关闭。");
      if (soundOn) playTone(720);
    });
    document.getElementById("npcModal").addEventListener("click", function (event) {
      if (event.target.classList.contains("modal-backdrop")) closeModal("npcModal");
    });
    document.getElementById("endingModal").addEventListener("click", function (event) {
      if (event.target.classList.contains("modal-backdrop")) closeModal("endingModal");
      if (event.target.closest("#shareEnding")) shareEnding();
      if (event.target.closest("#restartFromEnding")) resetGame();
    });
    document.getElementById("roleModal").addEventListener("click", function (event) {
      if (event.target.classList.contains("modal-backdrop") && state && state.role) closeModal("roleModal");
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();