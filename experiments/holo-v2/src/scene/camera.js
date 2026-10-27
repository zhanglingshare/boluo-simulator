/* camera.js —— 轻量轨道控制器 + 平滑镜头过渡（桌面鼠标 + 触摸，无 OrbitControls 依赖） */
/* global THREE */

const DESKTOP_POSES = {
  overview: { target: new THREE.Vector3(4, 0, 0), radius: 42, theta: 0, phi: 1.3 },
  industry: { target: new THREE.Vector3(3, 0, 0), radius: 28, theta: 0, phi: 1.36 }
};
const MOBILE_POSES = {
  // 竖屏水平视角窄，全景拉远以完整容纳五群；进入产业再推近；无右侧面板，目标居中。
  // 底部抽屉占据下屏，注视点下移使内容落在抽屉上方安全区。
  overview: { target: new THREE.Vector3(0, -2, 0), radius: 94, theta: 0, phi: 1.32 },
  industry: { target: new THREE.Vector3(0, -16, 0), radius: 55, theta: 0, phi: 1.3 }
};

function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

export class HoloCamera {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.portrait = camera.aspect < 0.75; // 竖屏（手机）
    this.poses = this.portrait ? MOBILE_POSES : DESKTOP_POSES;
    this.target = this.poses.overview.target.clone();
    this.radius = this.poses.overview.radius;
    this.theta = this.poses.overview.theta;
    this.phi = this.poses.overview.phi;
    this.minRadius = 6;
    this.maxRadius = 130;
    this.anim = null;
    this._v = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._up = new THREE.Vector3();
    this.bind();
    this.apply();
  }

  flyToView(view, duration = 1.3) {
    this.flyTo(this.poses[view] || this.poses.overview, duration);
  }

  bind() {
    const dom = this.dom;
    const isTouch = "ontouchstart" in window;
    this.isTouch = isTouch;

    if (!isTouch) {
      let down = false, button = 0, lx = 0, ly = 0;
      dom.addEventListener("mousedown", e => {
        down = true; button = e.button; lx = e.clientX; ly = e.clientY;
        this.cancelAnim();
      });
      window.addEventListener("mousemove", e => {
        if (!down) return;
        const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
        if (button === 2) this.pan(dx, dy);
        else this.rotate(dx, dy);
      });
      window.addEventListener("mouseup", () => { down = false; });
      dom.addEventListener("contextmenu", e => e.preventDefault());
      dom.addEventListener("wheel", e => {
        e.preventDefault(); this.cancelAnim();
        this.radius *= 1 + Math.sign(e.deltaY) * 0.09;
        this.clamp();
      }, { passive: false });
    } else {
      // 触摸：单指旋转，双指捏合缩放 + 平移
      let mode = null, lastTouches = [];
      const dist = ts => {
        const dx = ts[0].clientX - ts[1].clientX, dy = ts[0].clientY - ts[1].clientY;
        return Math.hypot(dx, dy);
      };
      const mid = ts => ({ x: (ts[0].clientX + ts[1].clientX) / 2, y: (ts[0].clientY + ts[1].clientY) / 2 });
      dom.addEventListener("touchstart", e => {
        this.cancelAnim();
        lastTouches = [...e.touches];
        mode = e.touches.length === 1 ? "rotate" : "pinch";
      }, { passive: true });
      dom.addEventListener("touchmove", e => {
        e.preventDefault();
        const ts = [...e.touches];
        if (mode === "rotate" && ts.length === 1) {
          const dx = ts[0].clientX - lastTouches[0].clientX;
          const dy = ts[0].clientY - lastTouches[0].clientY;
          this.rotate(dx, dy);
        } else if (mode === "pinch" && ts.length === 2) {
          const d0 = dist(lastTouches.length === 2 ? lastTouches : ts);
          const d1 = dist(ts);
          this.radius *= d0 / d1;
          const m0 = lastTouches.length === 2 ? mid(lastTouches) : mid(ts);
          const m1 = mid(ts);
          this.pan(m1.x - m0.x, m1.y - m0.y);
          this.clamp();
        }
        lastTouches = ts;
      }, { passive: false });
      dom.addEventListener("touchend", e => { lastTouches = [...e.touches]; mode = null; }, { passive: true });
    }
  }

  rotate(dx, dy) {
    this.theta -= dx * 0.0052;
    this.phi -= dy * 0.0052;
    this.phi = Math.max(0.18, Math.min(Math.PI - 0.18, this.phi));
  }
  pan(dx, dy) {
    this.camera.updateMatrixWorld();
    this._right.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this._up.setFromMatrixColumn(this.camera.matrixWorld, 1);
    const k = this.radius * 0.0016;
    this.target.addScaledVector(this._right, -dx * k).addScaledVector(this._up, dy * k);
  }
  clamp() {
    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
  }
  cancelAnim() { this.anim = null; }

  flyTo(pose, duration = 1.1) {
    this.anim = {
      from: { target: this.target.clone(), radius: this.radius, theta: this.theta, phi: this.phi },
      to: { target: pose.target.clone(), radius: pose.radius, theta: pose.theta, phi: pose.phi },
      t: 0, dur: duration
    };
  }

  /* 聚焦到某个节点（世界坐标），镜头停在其前方 */
  flyToNode(point, radius) {
    const r = radius ?? (this.portrait ? 27 : 10);
    // 手机底部抽屉占下屏，注视点小幅下移使被聚焦节点落在抽屉上方；偏移随距离收敛，避免近距把节点顶出视顶
    const t = point.clone();
    if (this.portrait) t.y -= 0.22 * r;
    // 取当前球坐标方向，保持相对方位、仅缩短距离并移动焦点
    this.flyTo({ target: t, radius: r, theta: this.theta, phi: this.phi }, 0.85);
  }

  update(dt) {
    if (this.anim) {
      this.anim.t += dt;
      const k = easeInOut(Math.min(1, this.anim.t / this.anim.dur));
      const { from, to } = this.anim;
      this.target.lerpVectors(from.target, to.target, k);
      this.radius = from.radius + (to.radius - from.radius) * k;
      this.theta = from.theta + (to.theta - from.theta) * k;
      this.phi = from.phi + (to.phi - from.phi) * k;
      if (k >= 1) this.anim = null;
    }
    this.apply();
  }

  apply() {
    const sp = Math.sin(this.phi), cp = Math.cos(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sp * Math.sin(this.theta),
      this.target.y + this.radius * cp,
      this.target.z + this.radius * sp * Math.cos(this.theta)
    );
    this.camera.lookAt(this.target);
  }
}

export { DESKTOP_POSES as POSES, MOBILE_POSES };
