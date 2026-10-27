/* edges.js —— 关系线网格工厂
 * 视觉纪律：
 *  A 级：实线、高不透明度（公开硬数据）
 *  B 级：实线、半透明（交叉推断）
 *  C 级：虚点线（待核实）
 * 颜色按"关系类型"（供应链/环保/竞争/生态）；半径按结构权重 w。
 * 全部是"关系线"，不是流量线，不做脉冲/粒子。 */
/* global THREE */
import { KIND_META, LEVEL_META } from "../data/meta.js";

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _dir = new THREE.Vector3(), _mid = new THREE.Vector3();

function radiusFor(edge) {
  return 0.022 + edge.weight * 0.016;
}

/* 圆柱型光带（A/B），半径映射权重 */
function createCylinderEdge(edge, color) {
  const opacity = LEVEL_META[edge.evidenceLevel].opacity;
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 6, 1, true),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  const radius = radiusFor(edge);
  function update(p1, p2) {
    _a.copy(p1); _b.copy(p2);
    _dir.subVectors(_b, _a);
    const len = Math.max(_dir.length(), 0.001);
    _mid.addVectors(_a, _b).multiplyScalar(0.5);
    mesh.position.copy(_mid);
    mesh.scale.set(radius, len, radius);
    mesh.quaternion.setFromUnitVectors(UP, _dir.normalize());
  }
  return { mesh, update, baseOpacity: opacity };
}

/* 虚点线（C 级） */
function createDashedEdge(edge, color) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(6);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineDashedMaterial({
    color, transparent: true, opacity: LEVEL_META.C.opacity,
    dashSize: 0.35, gapSize: 0.28
  });
  const line = new THREE.Line(geo, mat);
  function update(p1, p2) {
    const attr = geo.attributes.position;
    attr.setXYZ(0, p1.x, p1.y, p1.z);
    attr.setXYZ(1, p2.x, p2.y, p2.z);
    attr.needsUpdate = true;
    line.computeLineDistances();
  }
  return { mesh: line, update, baseOpacity: LEVEL_META.C.opacity };
}

export function createEdge(edge) {
  const color = KIND_META[edge.relationType].color;
  const built = edge.evidenceLevel === "C" ? createDashedEdge(edge, color) : createCylinderEdge(edge, color);
  built.mesh.name = "edge-" + edge.source + "-" + edge.target;
  built.mesh.renderOrder = 1;
  const mesh = built.mesh;
  const mat = mesh.material;
  function setHighlight(state) {
    if (state === "active") mat.opacity = 0.98;
    else if (state === "dim") mat.opacity = built.baseOpacity * 0.12;
    else mat.opacity = built.baseOpacity;
  }
  return {
    object: mesh,
    key: [edge.source, edge.target].sort().join("|"),
    edge,
    update: built.update,
    setHighlight,
    baseOpacity: built.baseOpacity
  };
}
