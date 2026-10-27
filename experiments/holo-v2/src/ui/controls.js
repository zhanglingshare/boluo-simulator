/* controls.js —— 顶栏（品牌/搜索）、底部控制条（返回/观察层/证据等级/画质/标签）、图例 */
import {
  NODES, GROUPS, KIND_META, LEVEL_META, TYPE_META
} from "../data/index.js";

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}
const clear = el => { el.innerHTML = ""; };
const hex = c => "#" + c.toString(16).padStart(6, "0");

export function createControls(store, hooks) {
  /* ---- 顶栏 ---- */
  const topbar = h("div", "holo-topbar");
  const brand = h("div", "holo-brand");
  brand.innerHTML = '<span class="brand-dot"></span><span class="brand-name">看见博罗</span><span class="brand-v2">V2 · 全息图谱</span>';
  const search = h("div", "holo-search");
  const input = h("input", "holo-search-input");
  input.type = "text"; input.placeholder = "搜索主体 / 镇街（如 欣旺达、东莞、罗浮山）";
  input.setAttribute("aria-label", "搜索主体");
  const results = h("div", "holo-search-results");
  search.appendChild(input); search.appendChild(results);
  topbar.appendChild(brand); topbar.appendChild(search);

  function doSearch() {
    const q = input.value.trim();
    clear(results);
    if (!q) { results.style.display = "none"; return; }
    const list = NODES.filter(n => n.name.includes(q) || (n.town && n.town.includes(q))).slice(0, 9);
    if (!list.length) {
      results.style.display = "block";
      results.appendChild(h("div", "search-empty", "未找到匹配主体"));
      return;
    }
    results.style.display = "block";
    list.forEach(n => {
      const g = GROUPS.find(x => x.id === n.group);
      const row = h("div", "search-row");
      const dot = h("span", "search-dot"); dot.style.background = hex(TYPE_META[n.type].color);
      row.appendChild(dot);
      row.appendChild(h("span", "search-name", n.name));
      row.appendChild(h("span", "search-meta", (n.town ? n.town + " · " : "") + g.label));
      row.addEventListener("click", () => {
        hooks.onSelectNode(n.id);
        results.style.display = "none"; input.value = "";
      });
      results.appendChild(row);
    });
  }
  input.addEventListener("input", doSearch);
  input.addEventListener("focus", doSearch);
  document.addEventListener("click", e => {
    if (!search.contains(e.target)) results.style.display = "none";
  });

  /* ---- 底部控制条 ---- */
  const bar = h("div", "holo-bottombar");
  const backBtn = h("button", "holo-btn back-btn", "◧ 返回全景");
  backBtn.addEventListener("click", hooks.onBack);

  const layers = [
    { id: "all", label: "全景" },
    { id: "industry", label: "产业" },
    { id: "living", label: "生活" },
    { id: "external", label: "外部" }
  ];
  const layerGroup = h("div", "seg");
  layers.forEach((l, i) => {
    const b = h("button", "seg-btn", l.label);
    b.dataset.layer = l.id;
    if (i === 0) b.classList.add("on");
    b.addEventListener("click", () => {
      store.set({ layer: l.id });
      [...layerGroup.children].forEach(c => c.classList.toggle("on", c.dataset.layer === l.id));
    });
    layerGroup.appendChild(b);
  });

  const levelGroup = h("div", "seg");
  const levels = [
    { id: "A", label: "仅A" },
    { id: "B", label: "A+B" },
    { id: "C", label: "全部" }
  ];
  levels.forEach((l, i) => {
    const b = h("button", "seg-btn", l.label);
    b.dataset.level = l.id;
    if (i === 2) b.classList.add("on");
    b.addEventListener("click", () => {
      store.set({ levelFilter: l.id });
      [...levelGroup.children].forEach(c => c.classList.toggle("on", c.dataset.level === l.id));
    });
    levelGroup.appendChild(b);
  });

  const qualityBtn = h("button", "holo-btn", "◈ 高画质");
  qualityBtn.addEventListener("click", () => {
    const q = store.get().quality === "high" ? "low" : "high";
    store.set({ quality: q });
    qualityBtn.textContent = q === "high" ? "◈ 高画质" : "◇ 低画质";
    hooks.onQuality(q);
  });

  const labelBtn = h("button", "holo-btn on", "标签");
  labelBtn.addEventListener("click", () => {
    const v = !store.get().labels;
    store.set({ labels: v });
    labelBtn.classList.toggle("on", v);
  });

  bar.appendChild(backBtn);
  bar.appendChild(h("span", "sep"));
  bar.appendChild(layerGroup);
  bar.appendChild(h("span", "sep"));
  bar.appendChild(levelGroup);
  bar.appendChild(h("span", "sep"));
  bar.appendChild(qualityBtn);
  bar.appendChild(labelBtn);

  /* ---- 图例 ---- */
  const legend = h("div", "holo-legend");
  legend.appendChild(h("div", "legend-title", "图例"));
  const lgGroups = h("div", "legend-group");
  GROUPS.forEach(g => {
    const row = h("div", "legend-row");
    const dot = h("span", "legend-dot"); dot.style.background = hex(g.color);
    row.appendChild(dot); row.appendChild(h("span", "legend-text", g.label));
    lgGroups.appendChild(row);
  });
  legend.appendChild(lgGroups);
  const lgKinds = h("div", "legend-group");
  Object.values(KIND_META).forEach(k => {
    const row = h("div", "legend-row");
    const line = h("span", "legend-line");
    line.style.background = hex(k.color);
    row.appendChild(line); row.appendChild(h("span", "legend-text", k.label));
    lgKinds.appendChild(row);
  });
  legend.appendChild(lgKinds);
  const lgLevels = h("div", "legend-group");
  [["A", "实线 · 直接观测"], ["B", "半透 · 交叉推断"], ["C", "虚点 · 待核实"]].forEach(([lv, txt]) => {
    const row = h("div", "legend-row");
    const line = h("span", "legend-line");
    line.style.background = hex(KIND_META["供应链"].color);
    if (lv === "C") line.style.borderTop = "2px dotted " + hex(KIND_META["供应链"].color);
    if (lv === "B") line.style.opacity = "0.35";
    if (lv === "C") line.style.background = "transparent";
    row.appendChild(line); row.appendChild(h("span", "legend-text", txt));
    lgLevels.appendChild(row);
  });
  legend.appendChild(lgLevels);
  const legToggle = h("button", "legend-toggle", "图例");
  legToggle.addEventListener("click", () => legend.classList.toggle("open"));

  return { topbar, bar, legend, legToggle,
    setBackVisible(v) { backBtn.style.display = v ? "" : "none"; } };
}
