/* 数据加载器：前端只读静态 JSON，不做任何在线 AI 调用。 */
(function (global) {
  'use strict';

  const FILES = {
    meta: 'data/meta.json',
    sources: 'data/sources.json',
    facts: 'data/facts.json',
    network: 'data/network.json',
    conflicts: 'data/conflicts.json',
    changes: 'data/changes.json'
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 对瞬时网络错误/5xx 做有限重试（最多 8 次，平缓退避），避免边缘节点波动导致整页不可用
  const BACKOFF = [200, 350, 500, 700, 900, 1100, 1400];
  async function loadJson(file, attempt) {
    attempt = attempt || 1;
    try {
      const res = await fetch(file, { cache: 'no-store' });
      if (!res.ok) throw new Error(file + ' 加载失败 (' + res.status + ')');
      return await res.json();
    } catch (err) {
      if (attempt > BACKOFF.length) throw err;
      await sleep(BACKOFF[attempt - 1]);
      return loadJson(file, attempt + 1);
    }
  }

  const CORE = ['meta', 'sources', 'facts'];       // 渲染必需
  const OPTIONAL = ['network', 'conflicts', 'changes']; // 当前视图不直接使用，后台加载

  async function loadAll() {
    const data = {};
    // 核心文件并行加载，成功即放行首屏（loadJson 内部已对瞬时 5xx 重试）
    const core = await Promise.all(CORE.map(async k => [k, await loadJson(FILES[k])]));
    core.forEach(([k, v]) => { data[k] = v; });
    if (!data.meta || !data.sources || !data.facts) {
      throw new Error('核心数据文件缺失，无法渲染');
    }
    // 非核心文件后台加载，不阻塞首屏；失败静默为 null
    OPTIONAL.forEach(k => {
      data[k] = null;
      loadJson(FILES[k]).then(v => { data[k] = v; }).catch(err => console.warn('可选数据未加载:', err.message));
    });
    return data;
  }

  /* 便捷查询：把扁平事实展开为数组 */
  function flatFacts(data) {
    const out = [];
    data.facts.groups.forEach(g => {
      g.facts.forEach(f => out.push(Object.assign({ group: g.group }, f)));
    });
    return out;
  }

  function sourceMap(data) {
    const m = {};
    data.sources.sources.forEach(s => { m[s.id] = s; });
    return m;
  }

  function formatValue(f) {
    if (typeof f.value === 'string') return f.value;
    return String(f.value);
  }

  global.TeaData = { loadAll, flatFacts, sourceMap, formatValue };
})(window);
