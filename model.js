/* ============================================================
 * model.js —— 博罗产业风洞 统一模型内核
 * future / windtunnel / report 三页共用这一份。
 *
 * 口径：
 *  - BASE 1005 亿：博罗 2025 年规上/地区产值现实锚点
 *  - TARGET 1600 亿：模型外延参考目标，非政府刚性指标
 *  - 五条路径 μ/σ：模型设定的情景参数，非实测相关
 *  - 全局噪声 8%：模型设定的外部冲击波动
 * ============================================================ */
const HT = {
  BASE: 1005.45,
  TARGET: 1600,
  NOISE_SD: 40,   // 博罗用加性全局噪声（±40亿），与 future.html 原口径一致
  DEFAULT_PATHS: [
    {mu: 220, sd: 45, name: '产业承接升级', color: '#3b82f6'},
    {mu: 180, sd: 40, name: '新投产项目',   color: '#8b5cf6'},
    {mu: 70,  sd: 28, name: '融深融莞通道', color: '#06b6d4'},
    {mu: 60,  sd: 22, name: '罗浮山文旅',   color: '#fbbf24'},
    {mu: 45,  sd: 14, name: '特色农业',     color: '#34d399'}
  ],

  mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  makeRandn(prng) {
    return function () {
      let u = 0, v = 0;
      while (u === 0) u = prng();
      while (v === 0) v = prng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  },
  quantile(sorted, q) {
    if (!sorted.length) return NaN;
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos), w = pos - lo;
    return sorted[lo] * (1 - w) + sorted[hi] * w;
  },
  corr(xs, ys) {
    const n = xs.length;
    let mx = 0, my = 0;
    for (let k = 0; k < n; k++) { mx += xs[k]; my += ys[k]; }
    mx /= n; my /= n;
    let num = 0, dx = 0, dy = 0;
    for (let k = 0; k < n; k++) {
      num += (xs[k] - mx) * (ys[k] - my);
      dx += (xs[k] - mx) * (xs[k] - mx);
      dy += (ys[k] - my) * (ys[k] - my);
    }
    return num / Math.sqrt(dx * dy);
  },

  run(seed, N, paths, opts = {}) {
    const base = opts.base != null ? opts.base : this.BASE;
    const target = opts.target != null ? opts.target : this.TARGET;
    const noise = opts.noise != null ? opts.noise : this.NOISE_SD;
    const prng = this.mulberry32(seed), randn = this.makeRandn(prng);
    const raw = [], sorted = [], contribs = paths.map(() => []);
    for (let i = 0; i < N; i++) {
      let total = base;
      for (let j = 0; j < paths.length; j++) {
        let v = paths[j].mu + randn() * paths[j].sd;
        if (v < 0) v = 0;
        total += v;
        contribs[j].push(v);
      }
      total += randn() * noise;   // 加性全局噪声（博罗口径）
      raw.push(total);
      sorted.push(total);
    }
    sorted.sort((a, b) => a - b);
    return {
      p10: this.quantile(sorted, 0.10),
      p50: this.quantile(sorted, 0.50),
      p90: this.quantile(sorted, 0.90),
      hit: sorted.filter(x => x >= target).length / N * 100,
      coefs: contribs.map(c => Math.abs(this.corr(c, raw))),
      results: sorted,
      rawResults: raw
    };
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = HT;
