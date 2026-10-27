/* ============================================================
 * store.js —— 场景状态（纯数据，无 three）+ 显示派生
 * 视图：overview（五群）→ industry（产业展开）
 * 选择：selectedNode / selectedEdge；镇聚焦：townFocus
 * 观察层：layer；证据等级：levelFilter；画质：quality
 * ============================================================ */

import { NODES, EDGES, YUANZHOU_FOCUS } from "../data/index.js";
import { buildAdjacency } from "../core/graph.js";

export const LAYER_GROUPS = {
  all: ["industry", "living", "tourism", "agri", "external"],
  industry: ["industry", "external"],
  living: ["living", "tourism", "agri"],
  external: ["external", "industry"]
};

export function createStore() {
  const state = {
    view: "overview",        // overview | industry
    selectedNode: null,
    selectedEdge: null,
    townFocus: null,
    layer: "all",
    levelFilter: "C",        // 显示 A..C（默认全部）
    quality: "high",
    search: "",
    labels: true
  };
  const listeners = new Set();
  const adj = buildAdjacency();
  const nodeById = new Map(NODES.map(n => [n.id, n]));

  function get() { return state; }
  function set(patch) { Object.assign(state, patch); emit(); }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function emit() { listeners.forEach(fn => fn(state)); }

  /* ---- 动作 ---- */
  function enterIndustry() {
    set({ view: "industry", selectedNode: null, selectedEdge: null, townFocus: "园洲", layer: "all" });
  }
  function backToOverview() {
    set({ view: "overview", selectedNode: null, selectedEdge: null, townFocus: null, layer: "all" });
  }
  function selectNode(id) {
    set({ selectedNode: id, selectedEdge: null });
  }
  function selectEdge(key) {
    set({ selectedEdge: key, selectedNode: null });
  }
  function clearSelection() {
    set({ selectedNode: null, selectedEdge: null });
  }
  function toggleLayer(layer) {
    set({ layer: state.layer === layer ? "all" : layer });
  }

  /* ---- 显示派生：每个节点/边的 focus / active / dim / normal / hidden ---- */
  function computeDisplay() {
    const rank = { A: 1, B: 2, C: 3 };
    const maxRank = rank[state.levelFilter] ?? 3;
    const visibleGroups = new Set(LAYER_GROUPS[state.layer] || LAYER_GROUPS.all);
    const focusSet = new Set(YUANZHOU_FOCUS);

    const activeNodes = new Set();
    const activeEdges = new Set();
    const keyOf = e => [e.source, e.target].sort().join("|");

    // 选中具体节点/边：计算一度邻居焦点
    if (state.selectedNode) {
      const id = state.selectedNode;
      activeNodes.add(id);
      for (const { other, edge } of adj.get(id) || []) {
        if (rank[edge.evidenceLevel] <= maxRank) { activeNodes.add(other); activeEdges.add(keyOf(edge)); }
      }
    } else if (state.selectedEdge) {
      const e = EDGES.find(x => keyOf(x) === state.selectedEdge);
      if (e) { activeNodes.add(e.source); activeNodes.add(e.target); activeEdges.add(keyOf(e)); }
    }
    const hasSelection = !!(state.selectedNode || state.selectedEdge);
    // 引导态：进入产业但尚未选具体节点——完整产业簇展开，园洲链主轻高亮
    const guiding = state.view === "industry" && state.townFocus && !hasSelection;

    const nodeState = new Map();
    for (const n of NODES) {
      const inLayer = visibleGroups.has(n.group);
      if (hasSelection) {
        if (state.selectedNode && (n.id === state.selectedNode ||
            (activeNodes.has(n.id) && (n.group === nodeById.get(state.selectedNode)?.group || inLayer)))) {
          nodeState.set(n.id, "active");
        } else if (state.selectedEdge && activeNodes.has(n.id)) {
          nodeState.set(n.id, "active");
        } else if (!inLayer) {
          nodeState.set(n.id, "hidden");
        } else {
          nodeState.set(n.id, "dim");
        }
      } else if (guiding) {
        if (!inLayer) nodeState.set(n.id, "hidden");
        else if (n.group === "industry") nodeState.set(n.id, focusSet.has(n.id) ? "focus" : "normal");
        else if (n.group === "external") nodeState.set(n.id, "normal");
        else nodeState.set(n.id, "dim"); // 生活/文旅/农业退为背景
      } else {
        nodeState.set(n.id, inLayer ? "normal" : "hidden");
      }
    }
    // 选中节点跨层也要保持可见（操作5：切层不丢选择）
    if (state.selectedNode) {
      nodeState.set(state.selectedNode, "active");
      for (const id of activeNodes) {
        if (nodeState.get(id) === "hidden") nodeState.set(id, "dim");
      }
    }

    const edgeState = new Map();
    for (const e of EDGES) {
      const key = keyOf(e);
      const sGroup = nodeById.get(e.source).group;
      const tGroup = nodeById.get(e.target).group;
      const sIn = visibleGroups.has(sGroup);
      const tIn = visibleGroups.has(tGroup);
      if (rank[e.evidenceLevel] > maxRank) { edgeState.set(key, "hidden"); continue; }
      if (!sIn && !tIn) { edgeState.set(key, "hidden"); continue; }
      if (hasSelection) {
        edgeState.set(key, activeEdges.has(key) ? "active" : "dim");
      } else if (guiding) {
        // 仅产业内部、产业—外部关系清晰；产业与背景群的连线退暗，选中节点后再按一度邻居高亮
        const core = g => g === "industry" || g === "external";
        edgeState.set(key, (core(sGroup) && core(tGroup)) ? "normal" : "dim");
      } else {
        edgeState.set(key, "normal");
      }
    }

    return { nodeState, edgeState, activeNodes, activeEdges, hasFocus: hasSelection || guiding };
  }

  return {
    get, set, subscribe, adj,
    enterIndustry, backToOverview, selectNode, selectEdge, clearSelection, toggleLayer,
    computeDisplay,
    yuanzhouFocus: new Set(YUANZHOU_FOCUS)
  };
}
