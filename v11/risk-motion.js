/* Motion is a transition between declared scenarios, never an observed live feed. */
(() => {
  "use strict";
  const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let userReduced = false;
  const reduced = new EventTarget();
  Object.defineProperty(reduced, "matches", { get: () => systemMotion.matches || userReduced });
  const updatePreference = () => {
    document.documentElement.classList.toggle("reduce-motion", reduced.matches);
    reduced.dispatchEvent(new Event("change"));
  };
  systemMotion.addEventListener("change", updatePreference);
  document.documentElement.classList.toggle("reduce-motion", reduced.matches);
  const jobs = new Map();
  let frame = 0;
  const numeric = /[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;
  const geometry = new Set(["d", "points", "x", "y", "cx", "cy", "r", "width", "height", "stroke-width", "stroke-dasharray"]);
  function tick(now) {
    for (const [node, props] of jobs) {
      if (!node.isConnected) { jobs.delete(node); continue; }
      for (const [key, job] of props) {
        const t = Math.min(1, (now - job.start) / job.duration), eased = 1 - Math.pow(1 - t, 3);
        const result = job.template.replace(numeric, () => {
          const i = job.index++;
          return +(job.from[i] + (job.to[i] - job.from[i]) * eased).toFixed(3);
        });
        job.index = 0;
        node.setAttribute(key, t === 1 ? job.target : result);
        if (t === 1) props.delete(key);
      }
      if (!props.size) jobs.delete(node);
    }
    frame = jobs.size ? requestAnimationFrame(tick) : 0;
  }
  function attr(node, key, value, animate) {
    const old = node.getAttribute(key);
    if (old === value) { jobs.get(node)?.delete(key); return; }
    const from = old?.match(numeric)?.map(Number), to = value.match(numeric)?.map(Number);
    if (animate && !reduced.matches && geometry.has(key) && from?.length === to?.length && from?.length && old.replace(numeric, "#") === value.replace(numeric, "#")) {
      if (!jobs.has(node)) jobs.set(node, new Map());
      jobs.get(node).set(key, { from, to, template: value, target: value, index: 0, start: performance.now(), duration: 260 });
      if (!frame) frame = requestAnimationFrame(tick);
    } else { jobs.get(node)?.delete(key); node.setAttribute(key, value); }
  }
  function same(a, b) { return a.nodeType === b.nodeType && a.nodeName === b.nodeName; }
  function patch(a, b, animate) {
    if (!same(a, b)) { a.replaceWith(b.cloneNode(true)); return; }
    if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (a.nodeType !== 1) return;
    for (const name of a.getAttributeNames()) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const name of b.getAttributeNames()) attr(a, name, b.getAttribute(name), animate);
    // Stable SVG/HTML nodes preserve focus, pointer targets, and interrupted transitions.
    const old = [...a.childNodes], next = [...b.childNodes];
    if (old.length !== next.length || old.some((node, i) => !same(node, next[i]))) {
      a.replaceChildren(...next.map(node => node.cloneNode(true)));
    } else old.forEach((node, i) => patch(node, next[i], animate));
  }
  function html(id, markup, animate = true) {
    const root = document.getElementById(id);
    if (!root) throw new Error("Missing risk-lab container: " + id);
    const holder = document.createElement("template"); holder.innerHTML = markup;
    const old = [...root.childNodes], next = [...holder.content.childNodes];
    if (old.length !== next.length || old.some((node, i) => !same(node, next[i]))) root.replaceChildren(holder.content);
    else old.forEach((node, i) => patch(node, next[i], animate));
  }
  const counters = new WeakMap();
  function number(node, value, digits = 1, duration = 260) {
    const previous = counters.get(node);
    if (previous?.frame) cancelAnimationFrame(previous.frame);
    const startValue = previous?.value ?? value;
    const job = { value: startValue, frame: 0 }, start = performance.now();
    counters.set(node, job);
    const draw = now => {
      const t = reduced.matches || duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
      job.value = startValue + (value - startValue) * (1 - Math.pow(1 - t, 3));
      node.textContent = job.value.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
      node.dataset.value = String(value);
      job.frame = t < 1 ? requestAnimationFrame(draw) : 0;
    };
    draw(performance.now());
  }
  function reveal(id) {
    const root = document.getElementById(id);
    if (!root || reduced.matches) return;
    root.querySelectorAll(".rv-trace,.rv-trace2,.rv-trace3,.flow-ribbon").forEach(node => {
      node.classList.remove("draw-in");
      // One entrance per topic; parameter edits use interrupted geometric transitions.
      requestAnimationFrame(() => node.classList.add("draw-in"));
    });
  }
  reduced.addEventListener("change", () => {
    if (!reduced.matches) return;
    for (const [node, props] of jobs) for (const [key, job] of props) node.setAttribute(key, job.target);
    jobs.clear(); cancelAnimationFrame(frame); frame = 0;
  });
  window.RiskMotion = { html, number, reveal, reduced, systemMotion,
    setReduced: value => { userReduced = value; updatePreference(); } };
})();
