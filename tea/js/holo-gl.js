/* 柏塘山茶 · WebGL 全息渲染器（Three.js r160）
   消费 TeaHolo 提供的 orbit 与统一数据模型，渲染节点/连线/粒子/环/地形/标签，
   支持 Raycaster 拾取、增量高亮、粒子流动与堵点脉冲。 */
(function (global) {
  'use strict';

  function create(container, THREE, orbit, shared) {
    const isMobile = !!shared.mobile;

    /* ---------- 渲染器 / 场景 / 相机 ---------- */
    const canvas = document.createElement('canvas');
    canvas.className = 'holo-canvas';
    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: !isMobile, alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, shared.pixelRatioCap || 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x081410, 0.022);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);

    /* 环境光 + 半球光 + 冷暖点光 + 平行光，保证暗部不死黑、地形有层次 */
    scene.add(new THREE.AmbientLight(0x335443, 1.15));
    const hemi = new THREE.HemisphereLight(0x8fb89a, 0x0a1712, 0.7);
    const warm = new THREE.PointLight(0xf5c46b, 2.2, 90);
    warm.position.set(-12, 14, -8);
    const cool = new THREE.PointLight(0x5eead4, 1.6, 90);
    cool.position.set(12, 9, 10);
    const dir = new THREE.DirectionalLight(0xbfe8d4, 0.9);
    dir.position.set(6, 16, 8);
    scene.add(hemi, warm, cool, dir);

    /* 透视网格地板（远景） */
    const grid = new THREE.GridHelper(120, 60, 0x2f7d5c, 0x1d4634);
    grid.material.transparent = true;
    grid.material.opacity = 0.32;
    grid.position.y = -5.2;
    scene.add(grid);

    /* 模型挂载根组 */
    const root = new THREE.Group();
    scene.add(root);
    const gNode = new THREE.Group();
    const gEdge = new THREE.Group();
    const gParticle = new THREE.Group();
    const gRing = new THREE.Group();
    const gTerrain = new THREE.Group();
    const gLabel = new THREE.Group();
    root.add(gTerrain, gEdge, gParticle, gRing, gNode, gLabel);

    /* ---------- 程序化纹理 ---------- */
    function radialTexture(stops) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(s => g.addColorStop(s[0], s[1]));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      t.needsUpdate = true;
      return t;
    }
    const glowTex = radialTexture([
      [0, 'rgba(255,255,255,0.95)'],
      [0.35, 'rgba(255,255,255,0.42)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    const ringTex = radialTexture([
      [0, 'rgba(255,255,255,0)'],
      [0.55, 'rgba(255,255,255,0)'],
      [0.72, 'rgba(255,255,255,0.9)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    function textTexture(text, hex) {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font = '600 30px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
      const w = Math.ceil(ctx.measureText(text).width) + 28;
      c.width = w * 2; c.height = 76;
      const ctx2 = c.getContext('2d');
      ctx2.scale(2, 2);
      ctx2.font = '600 30px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
      ctx2.textBaseline = 'middle';
      ctx2.fillStyle = '#' + hex.toString(16).padStart(6, '0');
      ctx2.shadowColor = ctx2.fillStyle;
      ctx2.shadowBlur = 12;
      ctx2.fillText(text, 14, 19);
      const t = new THREE.CanvasTexture(c);
      t.needsUpdate = true;
      return { tex: t, aspect: (w) / 38 };
    }

    /* ---------- 缓存 ---------- */
    const nodeCache = new Map();
    const edgeCache = new Map();
    const polyCache = new Map();
    const particleCache = new Map();
    const ringCache = new Map();
    const labelCache = new Map();
    const clickables = [];
    let model = null;
    let terrainBuilt = false;

    function v3(p) { return new THREE.Vector3(p.x, p.y, p.z); }

    /* ---------- 节点同步 ---------- */
    function syncNodes(nodes) {
      nodes = nodes || [];
      const seen = new Set();
      nodes.forEach((n, i) => {
        seen.add(n.id);
        let obj = nodeCache.get(n.id);
        if (!obj) {
          const group = new THREE.Group();
          const radius = n.radius || 0.34;
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 20, 16),
            new THREE.MeshBasicMaterial({ color: n.color, transparent: true })
          );
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTex, color: n.color, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false
          }));
          glow.scale.setScalar(radius * 5.2);
          group.add(dot, glow);
          let pulse = null;
          if (n.gap) {
            pulse = new THREE.Sprite(new THREE.SpriteMaterial({
              map: ringTex, color: n.pulseColor || 0xfb7185, transparent: true,
              blending: THREE.AdditiveBlending, depthWrite: false
            }));
            pulse.scale.setScalar(radius * 4);
            group.add(pulse);
          }
          dot.userData.nodeId = n.id;
          clickables.push(dot);
          gNode.add(group);
          obj = { group, dot, glow, pulse, baseR: radius };
          nodeCache.set(n.id, obj);
        }
        obj.group.position.set(n.pos.x, n.pos.y, n.pos.z);
        const st = n.state || 'normal';
        if (st === 'dim') {
          obj.dot.material.opacity = 0.14;
          obj.glow.material.opacity = 0.1;
        } else if (st === 'active') {
          obj.dot.material.opacity = 1;
          obj.glow.material.opacity = 1;
          obj.glow.scale.setScalar(obj.baseR * 6.4);
        } else {
          obj.dot.material.opacity = 1;
          obj.glow.material.opacity = 0.85;
          obj.glow.scale.setScalar(obj.baseR * 5.2);
        }
      });
      prune(nodeCache, seen, gNode, o => {
        const k = clickables.indexOf(o.dot);
        if (k >= 0) clickables.splice(k, 1);
      });
    }

    /* ---------- 连线同步 ---------- */
    function syncEdges(edges, nodes) {
      edges = edges || [];
      const posById = {};
      (nodes || []).forEach(n => { posById[n.id] = n.pos; });
      const seen = new Set();
      edges.forEach(e => {
        const key = e.from + '>' + e.to;
        seen.add(key);
        const a = posById[e.from], b = posById[e.to];
        if (!a || !b) return;
        let obj = edgeCache.get(key);
        if (!obj) {
          const geo = new THREE.BufferGeometry().setFromPoints([v3(a), v3(b)]);
          const mat = e.dashed
            ? new THREE.LineDashedMaterial({
                color: e.color || 0x34d399, dashSize: 0.4, gapSize: 0.32,
                transparent: true
              })
            : new THREE.LineBasicMaterial({ color: e.color || 0x34d399, transparent: true });
          const line = new THREE.Line(geo, mat);
          if (e.dashed) line.computeLineDistances();
          gEdge.add(line);
          obj = { line, mat };
          edgeCache.set(key, obj);
        } else {
          const arr = obj.line.geometry.attributes.position.array;
          arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
          arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
          obj.line.geometry.attributes.position.needsUpdate = true;
        }
        obj.mat.opacity = e.state === 'dim' ? 0.07 : (e.state === 'lit' ? 1 : 0.55);
      });
      prune(edgeCache, seen, gEdge);
    }

    /* ---------- 通用 3D 折线同步（茶山垄线，可动态更新） ---------- */
    function syncPolylines(polys) {
      polys = polys || [];
      const seen = new Set();
      polys.forEach(p => {
        seen.add(p.id);
        const vecs = p.points.map(v3);
        let obj = polyCache.get(p.id);
        if (!obj) {
          const geo = new THREE.BufferGeometry().setFromPoints(vecs);
          const mat = p.dashed
            ? new THREE.LineDashedMaterial({
                color: p.color, dashSize: 0.35, gapSize: 0.28, transparent: true
              })
            : new THREE.LineBasicMaterial({ color: p.color, transparent: true });
          const line = new THREE.Line(geo, mat);
          if (p.dashed) line.computeLineDistances();
          gEdge.add(line);
          obj = { line, mat };
          polyCache.set(p.id, obj);
        } else {
          obj.line.geometry.dispose();
          obj.line.geometry = new THREE.BufferGeometry().setFromPoints(vecs);
          if (p.dashed) obj.line.computeLineDistances();
        }
        obj.mat.opacity = p.opacity != null ? p.opacity : 0.6;
        obj.mat.color.setHex(p.color);
      });
      prune(polyCache, seen, gEdge);
    }

    /* ---------- 粒子同步 ---------- */
    function syncParticles(particles) {
      particles = particles || [];
      const seen = new Set();
      particles.forEach(p => {
        seen.add(p.key);
        let obj = particleCache.get(p.key);
        if (!obj) {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(p.positions, 3));
          const mat = new THREE.PointsMaterial({
            color: p.color, size: p.size || 0.18, transparent: true,
            opacity: p.opacity != null ? p.opacity : 0.9,
            blending: THREE.AdditiveBlending, depthWrite: false
          });
          const points = new THREE.Points(geo, mat);
          gParticle.add(points);
          obj = { points, mat, geo };
          particleCache.set(p.key, obj);
        }
        obj.geo.attributes.position.needsUpdate = true;
        obj.mat.size = p.size || obj.mat.size;
        obj.mat.opacity = p.opacity != null ? p.opacity : obj.mat.opacity;
        obj.mat.color.setHex(p.color);
      });
      prune(particleCache, seen, gParticle);
    }

    /* ---------- 环同步（目标环 / 静态环） ---------- */
    function syncRings(rings) {
      rings = rings || [];
      const seen = new Set();
      rings.forEach(r => {
        seen.add(r.id);
        let obj = ringCache.get(r.id);
        if (!obj) {
          const geo = new THREE.RingGeometry(r.inner != null ? r.inner : 0.92, 1, 64);
          const mat = new THREE.MeshBasicMaterial({
            color: r.color, transparent: true, opacity: r.opacity != null ? r.opacity : 0.9,
            side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.rotation.x = -Math.PI / 2;
          gRing.add(mesh);
          obj = { mesh, mat, geo };
          ringCache.set(r.id, obj);
        }
        obj.mesh.position.set(r.pos.x, r.pos.y, r.pos.z);
        obj.mesh.scale.setScalar(r.radius);
        obj.mat.opacity = r.opacity != null ? r.opacity : 0.9;
        obj.mat.color.setHex(r.color);
      });
      prune(ringCache, seen, gRing);
    }

    /* ---------- 标签同步 ---------- */
    function syncLabels(labels) {
      labels = labels || [];
      const seen = new Set();
      labels.forEach(l => {
        seen.add(l.id);
        let obj = labelCache.get(l.id);
        if (!obj) {
          const tt = textTexture(l.text, l.color);
          const mat = new THREE.SpriteMaterial({
            map: tt.tex, transparent: true, depthWrite: false
          });
          const sprite = new THREE.Sprite(mat);
          gLabel.add(sprite);
          obj = { sprite, mat, aspect: tt.aspect };
          labelCache.set(l.id, obj);
        }
        obj.sprite.position.set(l.pos.x, l.pos.y, l.pos.z);
        const h = l.height || 0.9;
        obj.sprite.scale.set(h * obj.aspect, h, 1);
        obj.mat.opacity = l.opacity != null ? l.opacity : 1;
      });
      prune(labelCache, seen, gLabel);
    }

    /* ---------- 地形同步（几何仅建一次，coverage 动态更新） ---------- */
    let coverageRing = null;
    function syncTerrain(t) {
      if (!t) return;
      if (!terrainBuilt) {
        const seg = isMobile ? 80 : 120;
        const geo = new THREE.CircleGeometry(t.size / 2, seg);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i);
          pos.setY(i, t.heightAt(x, z));
        }
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({
          color: t.color || 0x17402e, roughness: 0.92, metalness: 0.05,
          emissive: 0x0b2118, emissiveIntensity: 0.78,
          flatShading: false
        });
        gTerrain.add(new THREE.Mesh(geo, mat));

        /* 等高线 / 发光垄线 */
        (t.contours || []).forEach(cl => {
          const cgeo = new THREE.BufferGeometry().setFromPoints(
            cl.points.map(p => new THREE.Vector3(p.x, p.y, p.z))
          );
          const cmat = new THREE.LineBasicMaterial({
            color: cl.color || 0x34d399, transparent: true,
            opacity: cl.opacity != null ? cl.opacity : 0.5,
            blending: THREE.AdditiveBlending
          });
          gTerrain.add(new THREE.Line(cgeo, cmat));
        });

        /* 种植覆盖边界环 */
        const cgeo = new THREE.RingGeometry(0.97, 1, 80);
        const cmat = new THREE.MeshBasicMaterial({
          color: 0x34d399, transparent: true, opacity: 0.85,
          side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
        });
        coverageRing = new THREE.Mesh(cgeo, cmat);
        coverageRing.rotation.x = -Math.PI / 2;
        coverageRing.position.y = 0.18;
        gTerrain.add(coverageRing);
        terrainBuilt = true;
      }
      if (coverageRing && t.coverage != null) {
        coverageRing.scale.setScalar(t.coverage);
        coverageRing.material.color.setHex(t.coverageColor || 0x34d399);
      }
    }

    /* ---------- 缓存清理工具 ---------- */
    function prune(cache, seen, parent, extra) {
      const dead = [];
      cache.forEach((obj, key) => { if (!seen.has(key)) dead.push([key, obj]); });
      dead.forEach(([key, obj]) => {
        cache.delete(key);
        if (extra) extra(obj);
        disposeObject(obj, parent);
      });
    }
    function disposeObject(obj, parent) {
      if (obj.group || obj.line || obj.points || obj.mesh || obj.sprite) {
        const target = obj.group || obj.line || obj.points || obj.mesh || obj.sprite;
        if (parent) parent.remove(target);
        target.traverse ? target.traverse(disposeNode) : disposeNode(target);
      }
    }
    function disposeNode(n) {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        if (Array.isArray(n.material)) n.material.forEach(m => m.dispose());
        else n.material.dispose();
      }
    }

    /* ---------- 公共接口 ---------- */
    function setModel(m) {
      model = m;
      syncNodes(m.nodes);
      syncEdges(m.edges, m.nodes);
      syncPolylines(m.polylines);
      syncParticles(m.particles);
      syncRings(m.rings);
      syncLabels(m.labels);
      syncTerrain(m.terrain);
    }

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function pick(event) {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      return hits.length ? hits[0].object.userData.nodeId : null;
    }

    function resize() {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function frame(now, dt) {
      const cp = orbit.cameraPosition();
      camera.position.set(cp.x, cp.y, cp.z);
      camera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);

      /* 堵点脉冲 */
      const t = now / 1000;
      nodeCache.forEach(obj => {
        if (obj.pulse) {
          const c = (t * 1.3) % 1;
          obj.pulse.scale.setScalar(obj.baseR * (3.4 + c * 3.2));
          obj.pulse.material.opacity = (1 - c) * 0.85;
        }
      });

      /* 粒子流动更新 */
      if (model && model.particles) {
        model.particles.forEach(p => {
          if (typeof p.update === 'function') {
            const obj = particleCache.get(p.key);
            p.update(obj.geo.attributes.position.array, dt);
            obj.geo.attributes.position.needsUpdate = true;
          }
        });
      }

      renderer.render(scene, camera);
    }

    function destroy() {
      renderer.dispose();
      [glowTex, ringTex].forEach(t => t.dispose());
      scene.traverse(n => {
        if (n.geometry) n.geometry.dispose();
        if (n.material) {
          if (Array.isArray(n.material)) n.material.forEach(m => m.dispose());
          else n.material.dispose();
        }
      });
    }

    resize();
    return { name: 'webgl', canvas, setModel, pick, resize, frame, destroy };
  }

  global.TeaHoloGL = { create };
})(window);
