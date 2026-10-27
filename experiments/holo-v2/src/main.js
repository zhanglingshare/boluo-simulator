/* ============================================================
 * main.js —— 装配：数据自检 → 场景/状态/UI/交互；WebGL 失败走 2D fallback
 * ============================================================ */
import { validateDataset } from "./data/index.js";
import { NODES } from "./data/nodes.js";
import { createStore } from "./state/store.js";
import { createPanel } from "./ui/panel.js";
import { createControls } from "./ui/controls.js";
import { createInteraction } from "./ui/interaction.js";
import { mountFallback } from "./ui/fallback.js";

/* 启动数据自检（同时打印到控制台，方便审计） */
const audit = validateDataset();
if (!audit.ok) {
  console.error("[看见博罗V2] 数据自检失败：", audit.errors);
} else {
  console.log("[看见博罗V2] 数据自检通过：", audit.stats);
}
if (audit.warnings.length) console.warn("[看见博罗V2] 数据提示：", audit.warnings);

const nodeById = new Map(NODES.map(n => [n.id, n]));

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) { return false; }
}

function detectQuality() {
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || window.innerWidth < 760;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  return (isMobile || mem <= 3 || cores <= 4) ? "low" : "high";
}

function boot3D() {
  const store = createStore();
  store.set({ quality: detectQuality() });
  const quality = store.get().quality;

  const container = document.getElementById("app");
  const panel = document.getElementById("panel");
  createPanel(panel, store);

  // 动态加载 atlas（three 已由 vendor UMD 注入全局）
  import("./scene/atlas.js").then(({ Atlas }) => {
    const atlas = new Atlas(container, store, quality);

    function enterIndustry() {
      store.enterIndustry();
      atlas.setView("industry");
      ui.setBackVisible(true);
    }
    function back() {
      store.backToOverview();
      atlas.setView("overview");
      ui.setBackVisible(false);
    }

    const ui = createControls(store, {
      onBack: back,
      onQuality: q => atlas.setQuality(q),
      onSelectNode: (id) => {
        const n = nodeById.get(id);
        if (!n) return;
        if (n.group === "industry" || n.group === "external") {
          if (store.get().view === "overview") {
            store.enterIndustry();
            ui.setBackVisible(true);
          }
          store.selectNode(id);
          atlas.focusNode(id);
        } else {
          if (store.get().view === "industry") {
            store.backToOverview();
            atlas.setView("overview");
            ui.setBackVisible(false);
          }
          store.selectNode(id);
        }
      }
    });

    document.getElementById("topbar-slot").appendChild(ui.topbar);
    document.getElementById("bottombar-slot").appendChild(ui.bar);
    document.getElementById("legend-slot").appendChild(ui.legend);
    document.getElementById("legend-toggle-slot").appendChild(ui.legToggle);
    ui.setBackVisible(false);

    createInteraction(atlas, {
      onNode: (id) => {
        const n = nodeById.get(id);
        const s = store.get();
        if (s.view === "overview" && n.group === "industry") {
          enterIndustry();           // 第一次点产业星群：进入 + 展开
        } else {
          store.selectNode(id);
          if (s.view === "industry") atlas.focusNode(id);
        }
      },
      onEdge: (key) => {
        if (store.get().view === "industry") store.selectEdge(key);
      },
      onEmpty: () => store.clearSelection()
    });

    document.getElementById("loading").style.display = "none";
    window.__atlas = atlas; // 便于调试，不参与生产逻辑
  }).catch(err => {
    console.error(err);
    boot2D();
  });
}

function boot2D() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("app").style.display = "none";
  const wrap = document.getElementById("fallback-wrap");
  wrap.style.display = "block";
  const canvas = document.getElementById("fallback2d");
  const store = createStore();
  createPanel(document.getElementById("panel"), store);
  const ui = createControls(store, {
    onBack: () => { store.backToOverview(); ui.setBackVisible(false); },
    onQuality: () => {},
    onSelectNode: (id) => store.selectNode(id)
  });
  ui.setBackVisible(false);
  document.getElementById("topbar-slot").appendChild(ui.topbar);
  document.getElementById("bottombar-slot").appendChild(ui.bar);
  document.getElementById("legend-slot").appendChild(ui.legend);
  document.getElementById("legend-toggle-slot").appendChild(ui.legToggle);
  mountFallback(canvas, store);
}

if (webglAvailable()) boot3D();
else boot2D();
