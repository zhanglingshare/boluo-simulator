/* prng.js —— 确定性伪随机（与原版 model.js 同款 mulberry32）
 * 保证布局/实验在相同种子下逐字节复现，绝不每次随机飞散。 */

export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 单位球内均匀分布的确定性点（用于初始位置） */
export function randInBall(rng, radius) {
  const u = rng(), v = rng();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(rng());
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi)
  };
}
