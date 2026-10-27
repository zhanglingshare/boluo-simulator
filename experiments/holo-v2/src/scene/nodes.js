/* nodes.js —— 节点全息网格工厂（球 + 辉光 + 中文标签 + 聚合/警示环） */
/* global THREE */
import { makeGlowTexture, makeLabelTexture } from "./textures.js";
import { TYPE_META, CLUSTER_TYPES, LEVEL_META } from "../data/meta.js";

/* radius 已由 degree 加权；degree 用于让枢纽略大（结构中心度） */
export function createNode(node, radius, quality) {
  const meta = TYPE_META[node.type];
  const color = meta.color;
  const group = new THREE.Group();
  group.name = "node-" + node.id;

  const low = quality === "low";
  const segs = low ? 14 : 28;

  /* 核心球（自发光纯色） */
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segs, segs),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
  );
  group.add(core);

  /* 内高光（小白核，增强"光点"感） */
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.42, segs, segs),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
  );
  group.add(inner);

  /* 辉光精灵 */
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(color),
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  glow.scale.set(radius * 3.6, radius * 3.6, 1);
  group.add(glow);

  /* 聚合节点（群落）：虚线感外环 */
  let ring = null;
  if (CLUSTER_TYPES.has(node.type)) {
    ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.5, radius * 0.035, 8, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);
  }

  /* 待核实（yellow）：黄色警示环 */
  let warn = null;
  if (node.needsReview || node.state === "yellow") {
    warn = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.82, radius * 0.03, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.85 })
    );
    warn.rotation.x = Math.PI / 2.1;
    group.add(warn);
  }

  /* 中文标签 */
  const label = makeLabelTexture(node.name, 0xe8f0fb);
  const labelSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: label.texture, transparent: true, opacity: 0.92, depthWrite: false })
  );
  const labelH = 0.86;
  labelSprite.scale.set(labelH * label.aspect, labelH, 1);
  labelSprite.position.y = radius + 0.95;
  group.add(labelSprite);

  const refs = { core, inner, glow, label: labelSprite, ring, warn };
  const base = { glow: 0.9, label: 0.92, core: 0.95, ring: ring ? 0.55 : 0, warn: warn ? 0.85 : 0, inner: 0.55 };
  let labelFactor = 1; // 全景淡化节点标签、展开后清晰（普通态生效）
  let lastState = "normal";

  /* 高亮三态 */
  function setHighlight(state) {
    lastState = state;
    if (state === "active") {
      refs.glow.material.opacity = 1; refs.glow.scale.set(radius * 4.8, radius * 4.8, 1);
      refs.label.material.opacity = 1; refs.core.material.opacity = 1;
      if (refs.ring) refs.ring.material.opacity = 0.9;
    } else if (state === "focus") {
      // 引导态轻高亮（园洲链主）：比 normal 亮、比 active 弱，不呼吸
      refs.glow.material.opacity = 1; refs.glow.scale.set(radius * 4.3, radius * 4.3, 1);
      refs.label.material.opacity = 1; refs.core.material.opacity = 1;
      if (refs.ring) refs.ring.material.opacity = 0.7;
    } else if (state === "dim") {
      refs.glow.material.opacity = 0.06; refs.core.material.opacity = 0.07; refs.inner.material.opacity = 0.05;
      refs.label.material.opacity = 0.06;
      if (refs.ring) refs.ring.material.opacity = 0.05;
      if (refs.warn) refs.warn.material.opacity = 0.1;
    } else {
      refs.glow.material.opacity = base.glow; refs.glow.scale.set(radius * 3.6, radius * 3.6, 1);
      refs.label.material.opacity = base.label * labelFactor; refs.core.material.opacity = base.core; refs.inner.material.opacity = base.inner;
      if (refs.ring) refs.ring.material.opacity = base.ring;
      if (refs.warn) refs.warn.material.opacity = base.warn;
    }
  }

  function setLabelFactor(f) {
    labelFactor = f;
    if (lastState === "normal") refs.label.material.opacity = base.label * labelFactor;
  }

  return { object: group, id: node.id, refs, setHighlight, setLabelFactor, meta, radius };
}
