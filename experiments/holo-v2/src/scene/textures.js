/* textures.js —— 程序化生成辉光与中文标签纹理（无外部图片资源） */
/* global THREE */

function rgbOf(hex) {
  const c = new THREE.Color(hex);
  return { r: Math.round(c.r * 255), g: Math.round(c.g * 255), b: Math.round(c.b * 255) };
}

/* 径向渐变光晕（中心白 → 主体色 → 透明） */
export function makeGlowTexture(hex) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const { r, g, b } = rgbOf(hex);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.16, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(0.46, `rgba(${r},${g},${b},0.26)`);
  grad.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/* 中文标签（高分辨率、轻微发光、透明底）。返回 {texture, aspect} */
export function makeLabelTexture(text, hex, opts = {}) {
  const fs = opts.fontSize || 42;
  const pad = 26;
  const dpr = 2;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `600 ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
  const textW = measure.measureText(text).width;
  const w = Math.ceil(textW + pad * 2);
  const h = Math.ceil(fs + pad);
  const canvas = document.createElement("canvas");
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.font = `600 ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  const { r, g, b } = rgbOf(hex == null ? 0xdfe9f5 : hex);
  ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
  ctx.shadowBlur = 12;
  ctx.fillStyle = `rgba(${r},${g},${b},0.96)`;
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return { texture: tex, aspect: w / h };
}

/* 星群名称标签（更大、半透明） */
export function makeGroupLabelTexture(text, hex) {
  return makeLabelTexture(text, hex, { fontSize: 54 });
}
