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

  async function loadJson(file) {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error(file + ' 加载失败 (' + res.status + ')');
    return res.json();
  }

  async function loadAll() {
    const keys = Object.keys(FILES);
    const results = await Promise.all(keys.map(k => loadJson(FILES[k]).catch(err => {
      console.error(err);
      return null;
    })));
    const data = {};
    keys.forEach((k, i) => { data[k] = results[i]; });
    if (!data.meta || !data.sources) {
      throw new Error('核心数据文件缺失，无法渲染');
    }
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
