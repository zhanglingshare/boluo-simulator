/* ============================================================
 * atlas.js —— 全息数据宇宙场景装配与渲染循环
 *  - 节点/边位置在两套确定性布局间插值（进入/返回不重排）
 *  - 高亮、观察层、证据等级由 store 驱动
 *  - 射线拾取（只拾取核心球，不拾取辉光/标签）
 *  - 深黑虚空 + 克制远景星点 + 雾；无装饰性粒子雨
 * ============================================================ */
/* global THREE */
import { NODES, EDGES, TYPE_META, GROUPS, degrees } from "../data/index.js";
import { computeLayouts, lerpPoint } from "../core/layout.js";
import { mulberry32 } from "../core/prng.js";
import { createNode } from "./nodes.js";
import { createEdge } from "./edges.js";
import { makeGroupLabelTexture } from "./textures.js";
import { HoloCamera } from "./camera.js";

const BG = 0x04060a;

export class Atlas {
  constructor(container, store, quality = "high") {
    this.container = container;
    this.store = store;
    this.quality = quality;
    this.morph = 0;
    this.targetMorph = 0;
    this.clock = 0;

    const w = container.clientWidth, h = container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality === "high",
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "high" ? 2 : 1));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(BG, 1);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(BG, 0.0058);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 400);
    this.controls = new HoloCamera(this.camera, this.renderer.domElement);

    this.makeStars();

    /* 布局 + 位置容器 */
    this.layouts = computeLayouts();
    this.positions = new Map();
    for (const n of NODES) this.positions.set(n.id, new THREE.Vector3(this.layouts.overview.get(n.id).x, this.layouts.overview.get(n.id).y, this.layouts.overview.get(n.id).z));

    /* 节点 */
    this.nodesGroup = new THREE.Group();
    this.scene.add(this.nodesGroup);
    this.nodeViews = new Map();
    this.cores = [];
    const deg = degrees();
    for (const n of NODES) {
      const radius = TYPE_META[n.type].r * 0.72 * (1 + Math.min(deg[n.id], 8) * 0.05);
      const view = createNode(n, radius, quality);
      view.refs.core.userData.nodeId = n.id;
      view.refs.inner.userData.nodeId = n.id;
      const p = this.positions.get(n.id);
      view.object.position.copy(p);
      this.nodeViews.set(n.id, view);
      this.cores.push(view.refs.core, view.refs.inner);
      this.nodesGroup.add(view.object);
    }

    /* 边 */
    this.edgesGroup = new THREE.Group();
    this.scene.add(this.edgesGroup);
    this.edgeViews = new Map();
    for (const e of EDGES) {
      const view = createEdge(e);
      this.edgeViews.set(view.key, view);
      this.edgesGroup.add(view.object);
      view.update(this.positions.get(e.source), this.positions.get(e.target));
    }

    /* 星群标签 */
    this.groupLabels = new Map();
    this.makeGroupLabels();

    /* 拾取 */
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.applyDisplay();
    store.subscribe(() => this.applyDisplay());

    window.addEventListener("resize", () => this.resize());
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  makeStars() {
    const count = this.quality === "low" ? 420 : 1200;
    const rng = mulberry32(7);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 + rng() * 120;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x8fb4e6, size: this.quality === "low" ? 0.5 : 0.62,
      transparent: true, opacity: 0.5, sizeAttenuation: true, depthWrite: false
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  makeGroupLabels() {
    for (const g of GROUPS) {
      const { texture, aspect } = makeGroupLabelTexture(g.label, g.color);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false
      }));
      sprite.renderOrder = 30;
      const h = 2.6;
      sprite.scale.set(h * aspect, h, 1);
      this.scene.add(sprite);
      this.groupLabels.set(g.id, sprite);
    }
  }

  /* 高亮 / 可见性同步 */
  applyDisplay() {
    const s = this.store.get();
    const { nodeState, edgeState } = this.store.computeDisplay();
    for (const [id, view] of this.nodeViews) view.setHighlight(nodeState.get(id) || "normal");
    for (const [key, view] of this.edgeViews) {
      const st = edgeState.get(key) || "normal";
      view.object.visible = st !== "hidden";
      view.setHighlight(st === "hidden" ? "normal" : st);
    }
    const labels = s.labels;
    for (const [id, sprite] of this.groupLabels) {
      sprite.visible = labels;
    }
    this.viewForLabels = s.view;
  }

  /* 视图切换：驱动 morph 与镜头 */
  setView(view) {
    this.targetMorph = view === "industry" ? 1 : 0;
    this.controls.flyToView(view);
  }

  focusNode(id) {
    this.targetMorph = 1;
    const final = this.layouts.industry.get(id);
    if (final) this.controls.flyToNode(new THREE.Vector3(final.x, final.y, final.z));
  }

  /* 屏幕坐标拾取节点（客户端坐标） */
  pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.cores, false);
    if (hits.length) {
      let o = hits[0].object;
      return o.userData.nodeId || null;
    }
    return null;
  }

  /* 拾取边（射线到圆柱；虚线不参与，避免误触） */
  pickEdge(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objs = [];
    for (const [, v] of this.edgeViews) if (v.object.visible && v.edge.evidenceLevel !== "C") objs.push(v.object);
    const hits = this.raycaster.intersectObjects(objs, false);
    return hits.length ? hits[0].object.name : null;
  }

  setQuality(q) {
    this.quality = q;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q === "high" ? 2 : 1));
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  loop(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.clock += dt;

    // morph 缓动
    this.morph += (this.targetMorph - this.morph) * Math.min(1, dt * 4.2);
    if (Math.abs(this.targetMorph - this.morph) < 0.0005) this.morph = this.targetMorph;

    // 节点位置插值
    for (const n of NODES) {
      const a = this.layouts.overview.get(n.id), b = this.layouts.industry.get(n.id);
      const p = lerpPoint(a, b, this.morph);
      const v = this.positions.get(n.id);
      v.set(p.x, p.y, p.z);
      this.nodeViews.get(n.id).object.position.copy(v);
    }
    // 边跟随
    for (const e of EDGES) {
      const view = this.edgeViews.get([e.source, e.target].sort().join("|"));
      if (view) view.update(this.positions.get(e.source), this.positions.get(e.target));
    }

    // 群标签位置 + 显隐
    const s = this.store.get();
    for (const g of GROUPS) {
      const sprite = this.groupLabels.get(g.id);
      const a = this.layouts.labels[g.id], b = this.layouts.labelsIndustry[g.id];
      const p = lerpPoint(a, b, this.morph);
      sprite.position.set(p.x, p.y, p.z);
      let op = 0.85 * (1 - this.morph);
      if (g.id !== "industry") op = 0.28 + 0.5 * this.morph; // 其他群退远时保留可读名
      if (g.id === "industry" && this.morph > 0.55) op = 0;
      sprite.material.opacity = s.labels ? op : 0;
    }

    // 动效：聚合环自转 + 选中节点呼吸
    const selId = s.selectedNode;
    const labelFactor = 0.12 + 0.88 * this.morph; // 全景只看群、节点名几乎隐藏；展开后清晰
    for (const [id, view] of this.nodeViews) {
      view.setLabelFactor(labelFactor);
      if (view.refs.ring) {
        view.refs.ring.rotation.z += dt * 0.35;
      }
      if (view.refs.warn) view.refs.warn.rotation.z -= dt * 0.25;
      if (id === selId) {
        const k = 4.8 * (1 + 0.09 * Math.sin(this.clock * 3.2));
        view.refs.glow.scale.set(view.radius * k, view.radius * k, 1);
      }
    }

    if (this.stars) this.stars.rotation.y += dt * 0.006;

    this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  }
}
