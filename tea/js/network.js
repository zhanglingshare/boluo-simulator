/* SNA 关系网络渲染：纯 SVG，节点可拖拽、可选中，待验证关系用虚线。 */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const R = 26;

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
    return node;
  }

  function createNetwork(container, network, handlers) {
    const cw = network.canvas.width;
    const ch = network.canvas.height;
    const svg = el('svg', { viewBox: '0 0 ' + cw + ' ' + ch, preserveAspectRatio: 'xMidYMid meet' });
    const gEdges = el('g');
    const gNodes = el('g');
    svg.appendChild(gEdges);
    svg.appendChild(gNodes);
    container.innerHTML = '';
    container.appendChild(svg);

    const edgeEls = {};
    const nodeEls = {};
    const adjacency = {};

    network.nodes.forEach(n => { adjacency[n.id] = new Set(); });

    /* 边 */
    network.edges.forEach(e => {
      const from = nodeById(e.from);
      const to = nodeById(e.to);
      const path = el('path', {
        class: 'sna-edge' + (e.dashed ? ' dashed' : '') + (e.status === 'catalog' ? ' amber' : ''),
        'data-edge': e.id
      });
      gEdges.appendChild(path);
      edgeEls[e.id] = { path, e, from: e.from, to: e.to };
      adjacency[e.from].add(e.to);
      adjacency[e.to].add(e.from);
    });

    /* 节点 */
    network.nodes.forEach(n => {
      const g = el('g', {
        class: 'sna-node' + (n.group === 1 ? ' amber' : '') + (n.gap ? ' gap' : ''),
        transform: 'translate(' + n.x + ',' + n.y + ')'
      });
      g.appendChild(el('circle', { class: 'node-circle', r: R }));
      const label = el('text', { class: 'node-label', y: 1 });
      label.textContent = shortName(n.name);
      g.appendChild(label);
      const sub = el('text', { class: 'node-sub', y: R + 13 });
      sub.textContent = shortSub(n.sub);
      g.appendChild(sub);
      gNodes.appendChild(g);
      nodeEls[n.id] = { g, n };

      g.addEventListener('click', ev => {
        ev.stopPropagation();
        select(n.id);
        if (handlers && handlers.onSelect) handlers.onSelect(n);
      });
      attachDrag(g, n);
    });

    function nodeById(id) { return network.nodes.find(x => x.id === id); }
    function shortName(name) { return name.length > 4 ? name.slice(0, 4) : name; }
    function shortSub(s) {
      if (!s) return '';
      return s.length > 9 ? s.slice(0, 9) + '…' : s;
    }

    function positionEdges() {
      Object.keys(edgeEls).forEach(id => {
        const item = edgeEls[id];
        const a = nodeById(item.from);
        const b = nodeById(item.to);
        const da = Math.hypot(b.x - a.x, b.y - a.y);
        const ax = a.x + (b.x - a.x) / da * R;
        const ay = a.y + (b.y - a.y) / da * R;
        const bx = b.x - (b.x - a.x) / da * R;
        const by = b.y - (b.y - a.y) / da * R;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        item.path.setAttribute('d', 'M' + ax + ',' + ay + ' Q' + mx + ',' + (my - 12) + ' ' + bx + ',' + by);
      });
    }

    /* 节点拖拽 */
    function attachDrag(g, n) {
      let dragging = false;
      function toSvg(clientX, clientY) {
        const pt = svg.createSVGPoint();
        pt.x = clientX; pt.y = clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
      }
      g.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        dragging = true;
        g.setPointerCapture(ev.pointerId);
      });
      g.addEventListener('pointermove', ev => {
        if (!dragging) return;
        const p = toSvg(ev.clientX, ev.clientY);
        n.x = Math.max(R, Math.min(cw - R, p.x));
        n.y = Math.max(R, Math.min(ch - R, p.y));
        g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
        positionEdges();
      });
      g.addEventListener('pointerup', ev => {
        if (!dragging) return;
        dragging = false;
        try { g.releasePointerCapture(ev.pointerId); } catch (e) {}
      });
    }

    function select(id) {
      Object.keys(nodeEls).forEach(nid => {
        nodeEls[nid].g.classList.toggle('selected', nid === id);
      });
      const connected = new Set([id]);
      Object.keys(edgeEls).forEach(eid => {
        const item = edgeEls[eid];
        const hit = item.from === id || item.to === id;
        item.path.classList.toggle('highlight', hit);
        if (hit) { connected.add(item.from); connected.add(item.to); }
      });
      Object.keys(nodeEls).forEach(nid => {
        nodeEls[nid].g.style.opacity = (connected.has(nid)) ? '1' : '0.4';
      });
    }

    function clearSelection() {
      Object.keys(nodeEls).forEach(nid => {
        nodeEls[nid].g.classList.remove('selected');
        nodeEls[nid].g.style.opacity = '1';
      });
      Object.keys(edgeEls).forEach(eid => edgeEls[eid].path.classList.remove('highlight'));
    }

    svg.addEventListener('click', () => {
      clearSelection();
      if (handlers && handlers.onBackground) handlers.onBackground();
    });

    positionEdges();
    return { select, clearSelection };
  }

  global.TeaNetwork = { create: createNetwork };
})(window);
