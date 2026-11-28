/* ============================================================
 * HC · 惠城区产业风洞 —— 统一模型内核
 *
 * 口径说明（2026-11-28 建，数据源见 data/facts.json）：
 *  - BASE 1203.33 亿：惠城区 2025 年 GDP（2025 统计公报初步核算数，A类，+4.3%）
 *  - TARGET 2000 亿：十五五规划纲要「到十五五期末向两千亿级跃升」，
 *    按 2000 亿设定目标线（A类，原文为"两千亿级"，此处取整便于测算）
 *  - 全局噪声 40 亿：加性外部冲击波动（模型设定，D级）
 *  - 2026 前三季度实测（惠城区统计局 2026-11-03，A类）：GDP 883.46 亿 +1.1%；
 *    社消零 622.07 亿 +2.0%；上半年 GDP 564.13 亿 +0.2%、规上工业增加值 +0.2%；
 *    工业用电 +19.7%（用电增速远超增加值增速）。
 *  - 由实测外推：2026 全年约 1216.6 亿、增速约 1.1%；
 *    若惯性延续到 2030，仅约 1271 亿，距 2000 亿差约 729 亿，
 *    达标所需五年年均增速约 10.7%。
 *
 * 参数来源与血统：
 *  - DEFAULT_PATHS 由方舟 deepseek-v4-flash 依据上述真实数据生成，
 *    经独立内核复刻校验（mu 合计 796.67，中位 2002.9、达标率 50.96%）。
 *    证据等级：制造 A / 商贸 B / 文旅 C / 服务业 B / 城市更新 C。
 *  - TREND_PATHS 的 sd 经人工下调至 ≤0.6×mu。原因：模型对路径贡献做
 *    负值截断（max(0,·)），当 sd 远大于 mu 时，截断会把期望系统性抬高——
 *    方舟原方案（sd 最大 45 而 mu 仅 7.66）使惠城惯性中位虚增至 1299 亿，
 *    比真实复利值 1271 高 28 亿。下调后中位 1272，与真实惯性一致。
 *    这是一个通用校准规则：sd/mu 应控制在 0.6 以内，否则截断偏差不可忽略。
 * ============================================================ */
const HC = {
  BASE: 1203.33,
  TARGET: 2000,
  NOISE_SD: 40,

  // 规划兑现路径：五年（2026-2030）累计 GDP 增量（亿元）
  DEFAULT_PATHS: [
    { mu: 200,    sd: 50, name: '东江湾·水口电子信息与新能源制造', short: '东江湾制造', color: '#3b82f6' },
    { mu: 160,    sd: 40, name: '江北CBD·金山湖商贸商务',          short: '江北商贸',   color: '#8b5cf6' },
    { mu: 80,     sd: 30, name: '西湖·水东街文旅消费',              short: '西湖文旅',   color: '#fbbf24' },
    { mu: 250,    sd: 80, name: '现代服务业与总部经济',              short: '服务业',     color: '#06b6d4' },
    { mu: 106.67, sd: 85, name: '融深融莞与城市更新',                short: '城市更新',   color: '#34d399' }
  ],

  // 现状延续路径：按 2026 前三季度 +1.1% 惯性复利，五年增量 67.66 亿
  // sd 已下调至 ≤0.6×mu，避免负值截断抬高期望
  TREND_PATHS: [
    { mu: 17,    sd: 10,   name: '东江湾·水口电子信息与新能源制造', short: '东江湾制造', color: '#3b82f6' },
    { mu: 14,    sd: 8,    name: '江北CBD·金山湖商贸商务',          short: '江北商贸',   color: '#8b5cf6' },
    { mu: 8,     sd: 4.8,  name: '西湖·水东街文旅消费',              short: '西湖文旅',   color: '#fbbf24' },
    { mu: 21,    sd: 12.6, name: '现代服务业与总部经济',              short: '服务业',     color: '#06b6d4' },
    { mu: 7.66,  sd: 4.6,  name: '融深融莞与城市更新',                short: '城市更新',   color: '#34d399' }
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
      total += randn() * noise;
      raw.push(total);
      sorted.push(total);
    }
    sorted.sort((a, b) => a - b);
    const coefs = paths.map((p, j) => Math.abs(this.corr(contribs[j], raw)));
    return {
      p10: this.quantile(sorted, 0.10),
      p50: this.quantile(sorted, 0.50),
      p90: this.quantile(sorted, 0.90),
      hit: sorted.filter(x => x >= target).length / N * 100,
      raw, sorted, coefs, contribs, paths, N
    };
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = HC;
