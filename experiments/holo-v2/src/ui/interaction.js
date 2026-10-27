/* interaction.js —— 画布点击 / 触摸 / 射线拾取（区分点击与拖拽，避免拖拽误选） */
export function createInteraction(atlas, actions) {
  const dom = atlas.renderer.domElement;
  dom.style.cursor = "grab";
  const TAP_DIST = 7;
  let downX = 0, downY = 0, downT = 0, pressed = false;

  function isTap(x, y) {
    return Math.hypot(x - downX, y - downY) <= TAP_DIST;
  }

  dom.addEventListener("pointerdown", e => {
    pressed = true; downX = e.clientX; downY = e.clientY; downT = performance.now();
    dom.style.cursor = "grabbing";
  });
  window.addEventListener("pointerup", e => {
    if (!pressed) return;
    pressed = false;
    if (isTap(e.clientX, e.clientY)) {
      const id = atlas.pick(e.clientX, e.clientY);
      if (id) { dom.style.cursor = "pointer"; actions.onNode(id); return; }
      const edgeName = atlas.pickEdge(e.clientX, e.clientY);
      if (edgeName) {
        const parts = edgeName.replace(/^edge-/, "").split("-");
        const key = parts.sort().join("|");
        actions.onEdge(key);
        return;
      }
      actions.onEmpty();
    }
    dom.style.cursor = "grab";
  });

  // 桌面 hover（仅在非触摸设备给反馈，不依赖 hover 完成任何操作）
  if (!("ontouchstart" in window)) {
    dom.addEventListener("pointermove", e => {
      if (pressed) return;
      const id = atlas.pick(e.clientX, e.clientY);
      dom.style.cursor = id ? "pointer" : "grab";
    });
  }
}
