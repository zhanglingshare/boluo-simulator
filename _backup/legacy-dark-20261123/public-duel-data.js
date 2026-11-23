const bulletin = {
  label: '2025 年博罗县统计公报（转载）',
  href: 'https://tjgb.hongheiku.com/xjtjgb/xj2020/75372.html'
};

export const quizzes = {
  index: {
    id: 'introduce',
    type: 'pick',
    title: '向外地朋友介绍博罗，你会先讲哪一样？',
    options: ['罗浮山', '山茶和菜心', '东江', '园洲石湾的产业', '去深圳的路'],
    picks: [
      '可以从一趟罗浮山的周末讲起。来逛、留下吃饭、留宿，是三种不同的体验。',
      '可以从一口家乡味讲起。柏塘山茶和福田菜心背后，各有种植、加工、销路的一笔账。',
      '可以从东江两岸讲起。沿江的镇各有自己的生活和产业。',
      '可以从园洲、石湾讲起。你看到的厂房背后，还有上下游配套和工作机会。',
      '可以从跨城通勤讲起。到站车程、上下班时间和末班车，会影响这条路好不好走。'
    ],
    evidence: { href: 'town.html', label: '看各镇的味道与山水' }
  },
  town: {
    id: 'weekend',
    type: 'pick',
    title: '只有半天，你想和朋友去哪边？',
    options: ['长宁看罗浮山', '柏塘喝山茶'],
    picks: [
      '长宁这条路，先选你想看的山景，再决定在附近吃哪一顿。',
      '柏塘这条路，把时间留给茶山和一杯茶。可以从各镇卡片先找柏塘。'
    ],
    evidence: { href: '#grid', label: '去看两地的镇街卡' }
  },
  network: {
    id: 'connection',
    type: 'guess',
    title: '图上东莞连了两处，哪一条线画得更粗？',
    options: ['东莞 ↔ 园洲', '东莞 ↔ 石湾'],
    correct: 0,
    answer: '图里的园洲线更粗',
    facts: [['东莞 ↔ 园洲', '较粗'], ['东莞 ↔ 石湾', '略细']],
    detail: '两条线都在本站关系图里。线宽表示图中的关系强弱设定。要查真实的产业往来，还得看订单、供货和通勤记录。',
    evidence: { href: '#svg', label: '回到原关系图找这两条线' }
  },
  who: {
    id: 'population',
    type: 'guess',
    title: '每 100 位博罗常住居民，大约几位住在城镇？',
    options: ['不到 50 位', '约 60 位', '超过 80 位'],
    correct: 1,
    answer: '约 60 位',
    facts: [['城镇常住居民', '74.60 万', .6019], ['农村常住居民', '49.34 万', .3981]],
    detail: '2025 年末博罗共有 123.94 万常住居民。城镇人口占 60.19%，统计范围包括全县各镇街。',
    source: bulletin,
    evidence: { href: '#c6', label: '看人口对照图' }
  },
  future: {
    id: 'future-spread',
    type: 'guess',
    title: '同一组条件推演 2030 年，常见结果能差多少？',
    options: ['不到 100 亿', '100 到 200 亿', '200 亿以上'],
    detail: '取默认一万次模拟中间 80% 的结果，比较这段区间的两端。高端和低端是同一组假设下的两种可能。',
    model: 'spread',
    evidence: { href: '#chHist', label: '打开分布图看整个区间' }
  },
  blindspot: {
    id: 'visitor-spend',
    type: 'guess',
    title: '博罗一年接待超千万人次，旅游收入摊下来每人次多少？',
    options: ['约 200 元', '约 500 元', '约 1,000 元'],
    correct: 1,
    answer: '约 505 元／人次',
    facts: [['2025 年旅游综合收入', '51.88 亿元'], ['2025 年接待游客', '1,028.09 万人次']],
    detail: '全县旅游综合收入除以接待游客人次，得到这个平均数。同样的客流下，接着查当天往返和留宿游客的钱分别花在哪。',
    source: bulletin,
    evidence: { href: '#ch2', label: '看过夜和消费的对照' }
  }
};

export const setups = {
  choices: {
    id: 'five-roads',
    title: '五条路，你会留下哪几条？',
    hint: '拨下面的开关，试出你的一套组合。好友打开即看到同一组开关，可以再改一项回给你。',
    metric: '2030 模拟过线率',
    target: 'curHit'
  },
  windtunnel: {
    id: 'wind-dials',
    title: '同一场风洞，朋友会先改哪一项？',
    hint: '拖动下面任意滑杆，把这组设置发给朋友。好友可以只改一项，看两种结果相差多少。',
    metric: '2030 模拟过线率',
    target: 'gProb'
  }
};

export const reportDuel = {
  id: 'five-year-guess',
  title: '博罗按 5.5% 连续增长五年，能到 1600 亿吗？',
  options: ['够，能追上', '还会差一截'],
  correct: 1,
  selectors: {
    stage: '#report-stage',
    ballot: '#report-vote'
  },
  keys: ['reach', 'short']
};
