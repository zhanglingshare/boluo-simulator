/* 柏塘山茶 · 全息 3D 公共框架
   职责：能力检测、Three.js 按需容错加载、GL/2D 共用的轨道控制器、
   统一 mount 生命周期（可见性暂停、resize、销毁）。
   实际渲染由 TeaHoloGL（WebGL）与 TeaHolo2D（Canvas 降级）实现，二者消费同一数据模型。 */
(function (global) {
  'use strict';

  /* 与 style.css 对齐的强调色（数值形式） */
  const COLORS = {
    neon: 0x34d399,
    neonDeep: 0x0f9f6e,
    amber: 0xf5c46b,
    coral: 0xfb7185,
    cyan: 0x5eead4,
    gradeD: 0x94a3b8,
    ink: 0xeef6f1
  };

  /* 确定性字符串 hash → 0..1（保证每次加载坐标一致，不随机） */
  function hash01(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 100000) / 100000;
  }

  /* ---------- WebGL 能力检测 ---------- */
  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(global.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  /* ---------- 脚本动态加载（带退避重试，用于可选的 three.min.js） ---------- */
  const LOAD_BACKOFF = [300, 500, 800, 1200, 1800];
  function loadScript(src, attempt) {
    attempt = attempt || 0;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { s.remove(); reject(new Error('load fail ' + src)); };
      document.head.appendChild(s);
    }).catch(() => {
      if (attempt >= LOAD_BACKOFF.length) return Promise.reject(new Error(src));
      return new Promise(r => setTimeout(r, LOAD_BACKOFF[attempt]))
        .then(() => loadScript(src, attempt + 1));
    });
  }

  let threePromise = null;
  function loadThree() {
    if (global.THREE) return Promise.resolve(global.THREE);
    if (!threePromise) {
      // three 是可选增强：加载失败不 reject，返回 null 让上层走 2D 降级
      threePromise = loadScript('lib/three.min.js')
        .then(() => global.THREE || null)
        .catch(() => null);
    }
    return threePromise;
  }

  function pointerXY(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length)
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  /* ---------- 轨道控制器（GL / 2D 共用，球坐标） ---------- */
  class Orbit {
    constructor(opts) {
      opts = opts || {};
      this.theta = opts.theta != null ? opts.theta : 0.6;
      this.phi = opts.phi != null ? opts.phi : 1.05;
      this.radius = opts.radius || 18;
      this.minRadius = opts.minRadius || 8;
      this.maxRadius = opts.maxRadius || 42;
      this.target = opts.target || { x: 0, y: 0, z: 0 };
      this.autoRotate = opts.autoRotate !== false;
      this.autoSpeed = opts.autoSpeed || 0.14;
      this.dragging = false;
      this.moved = false;
      this._lastX = 0; this._lastY = 0;
      this._initTheta = this.theta; this._initPhi = this.phi;
    }
    attach(el) {
      this._el = el;
      this._down = e => {
        this.dragging = true; this.moved = false;
        const p = pointerXY(e);
        this._lastX = p.x; this._lastY = p.y;
        if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) {} }
      };
      this._move = e => {
        if (!this.dragging) return;
        const p = pointerXY(e);
        const dx = p.x - this._lastX, dy = p.y - this._lastY;
        if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true;
        this.theta -= dx * 0.0062;
        this.phi -= dy * 0.0062;
        this.phi = Math.max(0.2, Math.min(Math.PI - 0.2, this.phi));
        this._lastX = p.x; this._lastY = p.y;
      };
      this._up = () => { this.dragging = false; };
      this._wheel = e => {
        e.preventDefault();
        this.radius *= (1 + (e.deltaY > 0 ? 0.09 : -0.09));
        this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
      };
      this._dbl = () => this.reset();
      el.addEventListener('pointerdown', this._down);
      el.addEventListener('pointermove', this._move);
      global.addEventListener('pointerup', this._up);
      el.addEventListener('wheel', this._wheel, { passive: false });
      el.addEventListener('dblclick', this._dbl);
    }
    reset() { this.theta = this._initTheta; this.phi = this._initPhi; }
    tick(dt) {
      if (this.autoRotate && !this.dragging) this.theta += this.autoSpeed * dt;
    }
    detach() {
      const el = this._el;
      if (!el) return;
      el.removeEventListener('pointerdown', this._down);
      el.removeEventListener('pointermove', this._move);
      global.removeEventListener('pointerup', this._up);
      el.removeEventListener('wheel', this._wheel);
      el.removeEventListener('dblclick', this._dbl);
      this._el = null;
    }
    cameraPosition() {
      const sp = Math.sin(this.phi);
      return {
        x: this.target.x + this.radius * sp * Math.cos(this.theta),
        y: this.target.y + this.radius * Math.cos(this.phi),
        z: this.target.z + this.radius * sp * Math.sin(this.theta)
      };
    }
  }

  /* ---------- 统一 mount 入口 ----------
     opts: {
       orbit: {radius, target, autoRotate...},
       renderer: 'auto' | '2d',
       onPick: fn(id),
       pixelRatioCap: number
     }
     返回 controller: { update(model), setAutoRotate(v), destroy(), renderer, canvas } */
  async function mount(container, opts) {
    opts = opts || {};
    const isMobile = global.matchMedia && global.matchMedia('(max-width: 760px)').matches;
    const orbit = new Orbit(Object.assign({ autoRotate: true }, opts.orbit));
    const shared = { mobile: isMobile, pixelRatioCap: opts.pixelRatioCap || 2 };

    let impl = null;
    if (opts.renderer !== '2d' && webglAvailable()) {
      const THREE = await loadThree();
      if (THREE && global.TeaHoloGL) {
        try {
          impl = global.TeaHoloGL.create(container, THREE, orbit, shared);
        } catch (err) {
          global.console && console.warn('WebGL 初始化失败，改用 2D 降级：', err);
          impl = null;
        }
      }
    }
    if (!impl && global.TeaHolo2D) {
      impl = global.TeaHolo2D.create(container, orbit, shared);
    }
    if (!impl) throw new Error('无可用的全息渲染器');

    orbit.attach(impl.canvas);
    impl.canvas.addEventListener('click', e => {
      if (orbit.moved) return; // 拖拽结束的 click 不触发拾取
      const id = impl.pick(e);
      if (id != null && opts.onPick) opts.onPick(id);
    });

    container.appendChild(impl.canvas);

    /* 离屏 / 后台标签页：暂停渲染，省电省性能 */
    let visible = true;
    const io = new IntersectionObserver(es => {
      es.forEach(en => { visible = en.isIntersecting; });
    }, { threshold: 0.04 });
    io.observe(container);

    const ro = new ResizeObserver(() => impl.resize());
    ro.observe(container);

    let last = performance.now();
    function loop(now) {
      impl._raf = requestAnimationFrame(loop);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (!visible || document.hidden) return;
      orbit.tick(dt);
      impl.frame(now, dt);
    }
    impl._raf = requestAnimationFrame(loop);

    return {
      update(model) { impl.setModel(model); },
      setAutoRotate(v) { orbit.autoRotate = v; },
      pick(clientX, clientY) { return impl.pick({ clientX, clientY }); },
      get renderer() { return impl.name; },
      canvas: impl.canvas,
      destroy() {
        cancelAnimationFrame(impl._raf);
        orbit.detach();
        io.disconnect();
        ro.disconnect();
        if (impl.destroy) impl.destroy();
        if (impl.canvas.parentNode) impl.canvas.parentNode.removeChild(impl.canvas);
      }
    };
  }

  global.TeaHolo = { mount, Orbit, loadThree, webglAvailable, hash01, COLORS, pointerXY };
})(window);
