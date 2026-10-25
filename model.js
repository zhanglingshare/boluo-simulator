/* ============================================================
 * model.js —— 博罗产业风洞 统一模型内核
 * future / windtunnel / report 三页共用这一份，保证同一个问题
 * 在三个入口得到同一套基准、同一种子、同一概率。
 *
 * 口径说明（2026-10-26 联网核实后校准）：
 *  - BASE 1005.45 亿：博罗 2025 年 GDP（统计公报，A类）
 *  - TARGET 1600 亿：十五五（2026-2030）力争 GDP 达到1600亿（2026政府工作报告，A类）
 *  - 全局噪声 50 亿：加性外部冲击波动（模型设定）
 *
 *  - DEFAULT_PATHS 是「规划兑现路径」（C级情景参数，非实测）：
 *    以 2026 政府工作报告三大主导产业（新一代电子信息、智能装备、
 *    新能源新材料）+ 园区年550亿产值、工业投资110亿为依据，
 *    反推2030年要达到1600亿、各条路需贡献的五年累计GDP增量。
 *    同种子(42)实跑：基准中位约1601亿，达标率约50%——即"跳一跳够得到"。
 *
 *  - 重要对照：若按「现状延续路径」（双引擎150/工业底盘100/三产50/
 *    通道25/一产18，对应2025-2026上半年实际增速），中位仅约1350亿、
 *    达标率约0.1%。说明1600亿不是自然增长能到，必须靠投资扭转与项目投产。
 *  - 分位数用线性插值；路径相关系数 = |corr(路径贡献, 总产值)|
 * ============================================================ */
const HT = {
  BASE: 1005.45,
  TARGET: 1600,
  NOISE_SD: 50,   // 博罗用加性全局噪声，与 future.html 原口径一致
  // 规划兑现路径：五年累计GDP增量（亿元）
  DEFAULT_PATHS: [
    {mu: 250, sd: 55, name: '双引擎·电子信息+新能源', color: '#3b82f6'},
    {mu: 150, sd: 35, name: '工业底盘自然延续',       color: '#8b5cf6'},
    {mu: 110, sd: 35, name: '三产/文旅破局',         color: '#fbbf24'},
    {mu: 55,  sd: 22, name: '融深融莞通道',         color: '#06b6d4'},
    {mu: 30,  sd: 12, name: '一产·特色农业',         color: '#34d399'}
  ],
  // 现状延续路径（对照用）：2025-2026上半年实际增速外推
  TREND_PATHS: [
    {mu: 150, sd: 40, name: '双引擎·电子信息+新能源', color: '#3b82f6'},
    {mu: 100, sd: 28, name: '工业底盘自然延续',       color: '#8b5cf6'},
    {mu: 50,  sd: 30, name: '三产/文旅破局',         color: '#fbbf24'},
    {mu: 25,  sd: 20, name: '融深融莞通道',         color: '#06b6d4'},
    {mu: 18,  sd: 10, name: '一产·特色农业',         color: '#34d399'}
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
