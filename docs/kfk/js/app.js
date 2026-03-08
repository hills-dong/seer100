let lang = (typeof defaultLang !== 'undefined') ? defaultLang : 'zh';
let currentCat = 'all';
let currentStatus = 'all';
let currentTab = 'all'; // 'intro' or 'all'

function t(key) { return I18N[lang][key] || key; }
function pq(p) { return (lang === 'en' && p.q_en) ? p.q_en : p.q; }
function pa(p) { return (lang === 'en' && p.a_en) ? p.a_en : p.a; }

function switchLang() {
  const path = location.pathname;
  if (lang === 'zh') {
    if (path.endsWith('index.html')) {
      location.href = path.replace(/index\.html$/, 'en/index.html');
    } else {
      location.href = path.replace(/\/?$/, '/') + 'en/';
    }
  } else {
    if (path.endsWith('index.html')) {
      location.href = path.replace(/\/en\/index\.html$/, '/index.html');
    } else {
      location.href = path.replace(/\/en\/?$/, '/');
    }
  }
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-tab[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'intro') {
    document.getElementById('section-intro').style.display = 'block';
    document.getElementById('section-all').style.display = 'none';
  } else {
    document.getElementById('section-intro').style.display = 'none';
    document.getElementById('section-all').style.display = 'block';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function tlItem(key) {
  const raw = t(key);
  const sep = raw.includes('——') ? '——' : '—';
  const parts = raw.split(sep);
  return `<li><span class="tl-year">${(parts[0] || '').trim()}</span> — ${(parts[1] || '').trim()}</li>`;
}

function renderIntro() {
  const answerer = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.answererName : '';
  const pubDate = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.publishDate : '';
  document.getElementById('section-intro').innerHTML = `
    <div class="topic-header">
      <h1 class="topic-title">${t('homeTitle')}</h1>
      <div class="topic-meta">
        <span class="author">${answerer}</span>
        ${pubDate ? ` · <span>${pubDate}</span>` : ''}
      </div>
    </div>
    <div class="topic-body">
      <p>${t('homeIntro1')}</p>
      <p>${t('homeIntro2')}</p>
      <p>${t('homeIntro3')}</p>
      <div class="quote-block">
        <div class="quote-label">${t('coreMessage')}</div>
        ${t('coreQuote')}
      </div>
      <div class="section-header">${t('keyPoints')}</div>
      <ul class="timeline-list">
        ${tlItem('kp2019')}
        ${tlItem('kp2035')}
        ${tlItem('kp2038')}
        ${tlItem('kp2048')}
        ${tlItem('kp2060')}
      </ul>
    </div>
  `;
}

function renderList(searchOnly) {
  const answerer = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.answererName : 'KFK';
  const search = document.getElementById('search-input')?.value?.toLowerCase() || '';
  const catKey = lang === 'zh' ? 'zh' : 'en';
  const verdictKey = lang === 'zh' ? 'verdict_zh' : 'verdict_en';

  let filtered = PROPHECIES.filter(p => {
    if (currentCat !== 'all' && p.cat !== currentCat) return false;
    if (currentStatus !== 'all') {
      if (currentStatus === 'none') {
        if (p.status) return false;
      } else {
        if (p.status !== currentStatus) return false;
      }
    }
    if (search) {
      const text = (p.q + p.a + (p.q_en || '') + (p.a_en || '')).toLowerCase();
      return text.includes(search);
    }
    return true;
  }).sort((a, b) => a.id - b.id);

  let itemsHtml = '';
  if (filtered.length === 0) {
    itemsHtml = `<div class="no-results">${lang === 'zh' ? '未找到相关预言' : 'No prophecies found'}</div>`;
  } else {
    filtered.forEach(p => {
      const cat = CATEGORIES[p.cat];
      const st = p.status ? STATUS_MAP[p.status] : null;
      const verdict = p[verdictKey] || '';
      const pubDate = p.date || (typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.publishDate : '');
      itemsHtml += `
        <div class="prophecy-item${st ? ' ' + st.cls : ''}">
          <div class="prophecy-header">
            <div class="prophecy-header-title"><span class="prophecy-id">#${p.id}</span> ${pq(p)}</div>
            <div class="prophecy-header-tags">
              <span class="prophecy-cat">${cat.icon} ${cat[catKey]}</span>
              ${pubDate ? `<span class="prophecy-date">${pubDate}</span>` : ''}
              ${p.year ? `<span class="prophecy-year-tag">${p.year}</span>` : ''}
              ${st ? `<span class="status-badge ${st.cls}">${st.icon} ${st[catKey]}</span>` : ''}
            </div>
          </div>
          <div class="prophecy-a"><span class="kfk-name">${answerer}: </span>${pa(p)}</div>
          ${verdict ? `<div class="prophecy-verdict"><span class="verify-label">${t('realityLabel')}</span> ${verdict}</div>` : ''}
        </div>
      `;
    });
  }

  if (searchOnly) {
    document.getElementById('prophecy-list').innerHTML = itemsHtml;
    document.getElementById('result-count').textContent = `${filtered.length}`;
    return;
  }

  // Category filter
  let catFilterHtml = `<button class="filter-btn ${currentCat === 'all' ? 'active' : ''}" onclick="setCat('all')">${t('filterAll')}</button>`;
  for (const [key, val] of Object.entries(CATEGORIES)) {
    catFilterHtml += `<button class="filter-btn ${currentCat === key ? 'active' : ''}" onclick="setCat('${key}')">${val.icon} ${val[catKey]}</button>`;
  }

  // Status filter
  const verifiable = PROPHECIES.filter(p => p.status);
  const verified = verifiable.filter(p => p.status === 'verified');
  const partial = verifiable.filter(p => p.status === 'partial');
  const failed = verifiable.filter(p => p.status === 'failed');
  const pending = verifiable.filter(p => p.status === 'pending');
  const noStatus = PROPHECIES.filter(p => !p.status);

  const statusBtns = [
    { key: 'all', label: t('filterAll'), count: PROPHECIES.length },
    { key: 'verified', label: STATUS_MAP.verified[catKey], count: verified.length },
    { key: 'partial', label: STATUS_MAP.partial[catKey], count: partial.length },
    { key: 'failed', label: STATUS_MAP.failed[catKey], count: failed.length },
    { key: 'pending', label: STATUS_MAP.pending[catKey], count: pending.length },
    { key: 'none', label: lang === 'zh' ? '无状态' : 'No Status', count: noStatus.length },
  ];
  let statusFilterHtml = statusBtns.map(f =>
    `<button class="filter-btn ${currentStatus === f.key ? 'active' : ''}" onclick="setStatus('${f.key}')">${f.label} (${f.count})</button>`
  ).join('');

  // Stats
  const decidable = verified.length + partial.length + failed.length;
  const hitRate = decidable > 0 ? Math.round((verified.length + partial.length * 0.5) / decidable * 100) : 0;

  document.getElementById('section-all').innerHTML = `
    <div class="stats-bar">
      <div class="stat-item"><div class="stat-num accent">${verifiable.length}</div><div class="stat-label">${t('statsTotal')}</div></div>
      <div class="stat-item"><div class="stat-num green">${verified.length}</div><div class="stat-label">${t('statsVerified')}</div></div>
      <div class="stat-item"><div class="stat-num orange">${partial.length}</div><div class="stat-label">${t('statsPartial')}</div></div>
      <div class="stat-item"><div class="stat-num red">${failed.length}</div><div class="stat-label">${t('statsFailed')}</div></div>
      <div class="stat-item"><div class="stat-num blue">${pending.length}</div><div class="stat-label">${t('statsPending')}</div></div>
      <div class="hit-rate-box">
        <div class="hit-rate-num">${hitRate}%</div>
        <div class="hit-rate-label">${t('hitRate')}</div>
        <div class="hit-rate-note">${lang === 'zh' ? `(${verified.length}+${partial.length}×0.5)÷${decidable}` : `(${verified.length}+${partial.length}×0.5)÷${decidable}`}</div>
      </div>
    </div>
    <div class="sticky-filter-wrap">
    <div class="toolbar">
      <input type="text" class="search-box" id="search-input" placeholder="${t('searchPlaceholder')}" oninput="renderList(true)">
    </div>
    <div class="filter-section">
      <div class="filter-row">
        <span class="filter-label">${lang === 'zh' ? '分类' : 'Category'}:</span>
        <div class="filter-bar">${catFilterHtml}</div>
      </div>
      <div class="filter-row">
        <span class="filter-label">${lang === 'zh' ? '状态' : 'Status'}:</span>
        <div class="filter-bar">${statusFilterHtml}</div>
      </div>
    </div>
    <div class="list-info">${lang === 'zh' ? '共' : ''} <span id="result-count">${filtered.length}</span> ${lang === 'zh' ? '条结果' : 'results'}</div>
    </div>
    <div class="prophecy-list" id="prophecy-list">${itemsHtml}</div>
  `;
}

function setCat(cat) {
  const bar = document.querySelector('.filter-row:first-child .filter-bar');
  const scrollPos = bar ? bar.scrollLeft : 0;
  currentCat = cat;
  renderList();
  const newBar = document.querySelector('.filter-row:first-child .filter-bar');
  if (newBar) newBar.scrollLeft = scrollPos;
}

function setStatus(status) {
  const bar = document.querySelector('.filter-row:last-child .filter-bar');
  const scrollPos = bar ? bar.scrollLeft : 0;
  currentStatus = status;
  renderList();
  const newBar = document.querySelector('.filter-row:last-child .filter-bar');
  if (newBar) newBar.scrollLeft = scrollPos;
}

function renderFooter() {
  document.getElementById('footer-text').innerHTML = `
    <p>${t('footerNote')}</p>
  `;
}

function renderAll() {
  renderIntro();
  renderList();
  renderFooter();
}

window.addEventListener('scroll', () => {
  const btn = document.querySelector('.scroll-top');
  btn.classList.toggle('show', window.scrollY > 400);
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.lang-toggle').textContent = lang === 'zh' ? 'EN' : '中文';
  // Set tab labels
  document.querySelector('.nav-tab[data-tab="intro"]').textContent = t('navHome');
  document.querySelector('.nav-tab[data-tab="all"]').textContent = t('navAll');
  renderAll();
});
