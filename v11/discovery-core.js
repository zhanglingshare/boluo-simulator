(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./discovery-data.js'));
  else root.BoluoDiscovery = factory(root.BoluoDiscoveryData);
})(typeof window !== 'undefined' ? window : this, function (data) {
  'use strict';
  const savedKey = 'boluo-v11/discovery-questions/v1';
  const eventById = id => data.events.find(item => item.id === id);
  function context(input) {
    const params = input instanceof URLSearchParams ? input : new URLSearchParams(input || '');
    const topic = Object.hasOwn(data.topics, params.get('topic')) ? params.get('topic') : 'factory';
    const inquiry = data.topics[topic].inquiries.find(q => q.id === params.get('inquiry'))?.id || '';
    const town = data.towns.includes(params.get('town')) ? params.get('town') : '';
    const item = eventById(params.get('event'));
    const compatibleEvent = item && (!town || item.town === town) ? item.id : '';
    return { topic, inquiry, town, event: compatibleEvent };
  }
  function query(value, shared = false) {
    const clean = context(new URLSearchParams(value));
    const params = new URLSearchParams({ from: 'discovery', topic: clean.topic });
    for (const key of ['inquiry', 'town', 'event']) if (clean[key]) params.set(key, clean[key]);
    if (shared) params.set('share', '1');
    return params.toString();
  }
  function link(page, value, shared = false) {
    if (!['index.html', 'reality.html', 'industry-base.html', 'relations.html'].includes(page)) throw new Error('Unsupported discovery destination');
    return './' + page + '?' + query(value, shared);
  }
  function question(value) {
    const topic = data.topics[value.topic] || data.topics.factory;
    return topic.inquiries.find(q => q.id === value.inquiry)?.question || topic.defaultQuestion;
  }
  function filter(value = {}) {
    return data.events.filter(item => (!value.topic || value.topic === 'all' || item.topic === value.topic) && (!value.town || item.town === value.town));
  }
  const key = value => [value.topic, value.inquiry, value.town || '', value.event || ''].join('|');
  function caseFor(value) {
    if (value.event === 'jiangfeng') return 'electronic';
    if (['hande', 'procurement', 'copper', 'cement'].includes(value.event)) return 'projects';
    if (value.topic === 'factory') return 'projects';
    return data.topics[value.topic]?.case || 'projects';
  }
  function parseSaved(raw) {
    try {
      const values = JSON.parse(raw || '[]');
      if (!Array.isArray(values)) return [];
      const clean = values.filter(item => item && typeof item === 'object').map(item => context(new URLSearchParams(item)));
      return [...new Map(clean.filter(item => item.inquiry).map(item => [key(item), item])).values()].slice(0, 50);
    } catch { return []; }
  }
  return { data, context, query, link, question, filter, key, parseSaved, savedKey, eventById, caseFor };
});
