/* panel.js —— 信息浮卡：节点 / 边 / 镇 / 引导 四种内容，点击对端可沿关系探索 */
import {
  NODES, EDGES, TYPE_META, GROUPS, KIND_META, LEVEL_META
} from "../data/index.js";
import { edgesOf } from "../core/graph.js";

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}
function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
function levelBadge(level) {
  const m = LEVEL_META[level];
  return h("span", "badge lvl-" + level, (m ? m.label : level));
}

export function createPanel(container, store) {
  const nodeById = new Map(NODES.map(n => [n.id, n]));
  const groupById = new Map(GROUPS.map(g => [g.id, g]));

  function relationRows(id) {
    const rows = edgesOf(EDGES, id);
    const wrap = h("div", "rel-list");
    rows.sort((a, b) => ({ A: 1, B: 2, C: 3 }[a.edge.evidenceLevel] - { A: 1, B: 2, C: 3 }[b.edge.evidenceLevel]));
    rows.forEach(({ other, edge }) => {
      const row = h("div", "rel-row");
      const head = h("div", "rel-head");
      const kind = h("span", "rel-kind", KIND_META[edge.relationType].label);
      kind.style.color = "#" + KIND_META[edge.relationType].color.toString(16).padStart(6, "0");
      const otherBtn = h("button", "rel-other", "→ " + nodeById.get(other).name);
      otherBtn.title = "沿这条关系跳到该主体";
      otherBtn.addEventListener("click", () => {
        store.selectNode(other);
        // 若对端不在当前产业层，自动纳入可见（切到 all 层最稳）
        if (store.get().layer !== "all") store.set({ layer: "all" });
      });
      head.appendChild(kind); head.appendChild(levelBadge(edge.evidenceLevel));
      row.appendChild(head);
      row.appendChild(h("div", "rel-desc", edge.description || ""));
      row.appendChild(otherBtn);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderNode(id) {
    const n = nodeById.get(id);
    if (!n) return;
    clear(container);
    const meta = TYPE_META[n.type];
    const g = groupById.get(n.group);

    const header = h("div", "p-header");
    const title = h("div", "p-title", n.name);
    const tags = h("div", "p-tags");
    const typeTag = h("span", "tag type-tag", meta.label);
    typeTag.style.color = "#" + meta.color.toString(16).padStart(6, "0");
    typeTag.style.borderColor = "#" + meta.color.toString(16).padStart(6, "0");
    tags.appendChild(typeTag);
    if (n.town) tags.appendChild(h("span", "tag", n.town + "镇"));
    if (n.needsReview) tags.appendChild(h("span", "tag warn-tag", "名录待核实"));
    if (n.cluster) tags.appendChild(h("span", "tag", "聚合群落"));
    header.appendChild(title); header.appendChild(tags);
    container.appendChild(header);

    container.appendChild(h("div", "p-desc", n.description));

    const relTitle = h("div", "p-sec-title", "已验证关系（" + edgesOf(EDGES, id).length + "）");
    container.appendChild(relTitle);
    container.appendChild(relationRows(id));

    const src = h("div", "p-src");
    src.appendChild(h("span", "p-src-label", "来源：" + n.sources.join("；")));
    container.appendChild(src);
  }

  function renderEdge(key) {
    const edge = EDGES.find(e => [e.source, e.target].sort().join("|") === key);
    if (!edge) return;
    clear(container);
    const a = nodeById.get(edge.source), b = nodeById.get(edge.target);
    const title = h("div", "p-title", a.name + " — " + b.name);
    const tags = h("div", "p-tags");
    const kind = h("span", "tag", KIND_META[edge.relationType].label);
    kind.style.color = "#" + KIND_META[edge.relationType].color.toString(16).padStart(6, "0");
    tags.appendChild(kind); tags.appendChild(levelBadge(edge.evidenceLevel));
    container.appendChild(title); container.appendChild(tags);
    container.appendChild(h("div", "p-desc", edge.description || ""));
    if (edge.direction === "undirected") {
      container.appendChild(h("div", "p-note", "关系线：仅证明存在该类联系，不代表已验证流向或流量。"));
    }
    const btns = h("div", "p-edgebtns");
    [a, b].forEach(x => {
      const btn = h("button", "rel-other", "查看 " + x.name);
      btn.addEventListener("click", () => store.selectNode(x.id));
      btns.appendChild(btn);
    });
    container.appendChild(btns);
  }

  function renderTown(town) {
    clear(container);
    const list = NODES.filter(n => n.town === town);
    container.appendChild(h("div", "p-title", town + " · 链主聚焦"));
    container.appendChild(h("div", "p-desc", "以下为公开资料中可定位到 " + town + " 的代表性产业主体（原 network.html 产业关系网）。点击任一主体，追踪它的已验证联系。"));
    const wrap = h("div", "rel-list");
    list.forEach(n => {
      const row = h("div", "rel-row");
      const b = h("button", "rel-other", n.name);
      b.style.fontSize = "15px";
      b.addEventListener("click", () => store.selectNode(n.id));
      row.appendChild(b);
      row.appendChild(h("div", "rel-desc", n.description));
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  }

  function renderIntro() {
    clear(container);
    container.appendChild(h("div", "p-intro-title", "看见博罗"));
    container.appendChild(h("div", "p-intro-sub", "县域全息关系与流动图谱 · M1 产业星群"));
    container.appendChild(h("div", "p-desc", "这不是地形图，而是把产业、城镇、文旅、农业与外部联系组织成可探索的关系宇宙。旋转、缩放、点选节点，沿已验证的关系走进另一层世界。"));
    const tip = h("div", "p-hint");
    tip.innerHTML = "第一步：点击画面中的 <b>产业星群</b> 进入；或使用下方搜索选择主体。";
    container.appendChild(tip);
  }

  function render() {
    const s = store.get();
    if (s.selectedNode) renderNode(s.selectedNode);
    else if (s.selectedEdge) renderEdge(s.selectedEdge);
    else if (s.view === "industry" && s.townFocus) renderTown(s.townFocus);
    else renderIntro();
  }
  store.subscribe(render);
  render();
  return { render };
}
