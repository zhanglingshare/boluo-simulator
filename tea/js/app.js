/* 主应用：数据加载、视图路由、导航与移动端菜单。 */
(function () {
  'use strict';

  const TITLES = {
    overview: '总览',
    network: '关系网络',
    evidence: '情报证据',
    simulate: '情景推演',
    records: '我的记录'
  };

  const root = document.getElementById('view-root');
  const crumb = document.getElementById('crumb');
  const nav = document.getElementById('nav');
  const stampText = document.getElementById('stamp-text');
  const sidebarUpdated = document.getElementById('sidebar-updated');
  const searchInput = document.getElementById('search');

  let data = null;
  let current = 'overview';

  function navigate(view) {
    if (!TeaViews[view]) view = 'overview';
    current = view;
    root.innerHTML = '';
    const ctx = { data: data, navigate: navigate };
    const viewNode = TeaViews[view](ctx);
    root.appendChild(viewNode);

    nav.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });
    crumb.innerHTML = '<b>柏塘山茶</b><span class="sep">/</span><span>' + TITLES[view] + '</span>';
    closeSidebar();
    window.scrollTo({ top: 0 });
  }

  nav.querySelectorAll('.nav-item').forEach(b => {
    b.addEventListener('click', () => navigate(b.dataset.view));
  });

  /* 搜索：匹配节点则进网络，否则进证据，无弹窗 */
  searchInput.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter') return;
    const q = searchInput.value.trim();
    if (!q) return;
    const hitNode = data.network.nodes.find(n => n.name.includes(q) || (n.sub || '').includes(q));
    if (hitNode) {
      navigate('network');
      setTimeout(() => {
        const stage = document.getElementById('network-stage');
        const comp = stage && stage.__tea;
      }, 50);
    } else {
      navigate('evidence');
    }
  });

  /* 移动端菜单 */
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  document.getElementById('menu-toggle').addEventListener('click', () => {
    sidebar.classList.add('open');
    backdrop.hidden = false;
  });
  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.hidden = true;
  }
  backdrop.addEventListener('click', closeSidebar);

  async function init() {
    try {
      data = await TeaData.loadAll();
      stampText.textContent = '更新于 ' + data.meta.updated;
      sidebarUpdated.textContent = '数据更新 ' + data.meta.updated;
      navigate('overview');
    } catch (err) {
      root.innerHTML = '';
      root.appendChild(document.createElement('div'));
      root.firstChild.className = 'view';
      root.firstChild.innerHTML = '<div class="empty" style="min-height:50vh;display:flex;align-items:center;justify-content:center;">数据加载失败：' + err.message + '<br>请检查网络后刷新页面。</div>';
    }
  }

  init();
})();
