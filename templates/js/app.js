let lang = (typeof defaultLang !== 'undefined') ? defaultLang : 'zh';
let currentCat = 'all';
let currentStatus = 'all';
let currentTab = 'all'; // 'intro' or 'all'

function s(key) { return (SHARED_I18N[lang] || SHARED_I18N.zh)[key] || key; }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function pq(p) { return esc((lang === 'en' && p.q_en) ? p.q_en : p.q); }
function pa(p) { return esc((lang === 'en' && p.a_en) ? p.a_en : p.a); }

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
  document.querySelector(`.nav-tab[data-tab="${tab}"]`)?.classList.add('active');
  if (tab === 'intro') {
    document.getElementById('section-intro').style.display = 'block';
    document.getElementById('section-all').style.display = 'none';
    document.getElementById('header-tools').style.display = 'none';
  } else {
    document.getElementById('section-intro').style.display = 'none';
    document.getElementById('section-all').style.display = 'block';
    document.getElementById('header-tools').style.display = '';
  }
  window.scrollTo({ top: 0 });
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
    itemsHtml = `<div class="no-results">${s('noResults')}</div>`;
  } else {
    filtered.forEach(p => {
      const cat = CATEGORIES[p.cat];
      const st = p.status ? STATUS_MAP[p.status] : null;
      const verdict = esc(p[verdictKey] || '');
      const pubDate = p.date || (typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.publishDate : '');
      const yearReason = p.year ? esc(lang === 'en' ? (p.yearReason_en || '') : (p.yearReason || '')) : '';
      itemsHtml += `
        <div class="prophecy-item${st ? ' ' + st.cls : ''}">
          <div class="prophecy-header">
            <div class="prophecy-header-title"><span class="prophecy-id">#${p.id}</span> ${pq(p)} ${pubDate ? `<span class="prophecy-date">${s('pubPrefix')} ${pubDate}</span>` : ''}</div>
            <div class="prophecy-header-tags">
              <span class="prophecy-cat"><i class="${cat.icon}"></i> ${cat[catKey]}</span>
              ${p.year ? `<span class="prophecy-year-tag"${yearReason ? ` data-reason` : ''}><i class="i-target"></i> ${p.year}${yearReason ? `<span class="year-reason-tip">${yearReason}</span>` : ''}</span>` : ''}
              ${st ? `<span class="status-badge ${st.cls}"><i class="${st.icon}"></i> ${st[catKey]}</span>` : ''}
            </div>
          </div>
          <div class="prophecy-a"><span class="kfk-name">${answerer}: </span>${pa(p)}</div>
          ${verdict ? `<div class="prophecy-verdict"><span class="verify-label">${s('realityLabel')}</span> ${verdict}</div>` : ''}
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
  let catFilterHtml = `<button class="filter-btn ${currentCat === 'all' ? 'active' : ''}" onclick="setCat('all')">${s('filterAll')} (${PROPHECIES.length})</button>`;
  for (const [key, val] of Object.entries(CATEGORIES)) {
    const catCount = PROPHECIES.filter(p => p.cat === key).length;
    catFilterHtml += `<button class="filter-btn ${currentCat === key ? 'active' : ''}" onclick="setCat('${key}')"><i class="${val.icon}"></i> ${val[catKey]} (${catCount})</button>`;
  }

  // Status filter
  const verifiable = PROPHECIES.filter(p => p.status);
  const verified = verifiable.filter(p => p.status === 'verified');
  const partial = verifiable.filter(p => p.status === 'partial');
  const failed = verifiable.filter(p => p.status === 'failed');
  const pending = verifiable.filter(p => p.status === 'pending');
  const noStatus = PROPHECIES.filter(p => !p.status);

  const statusBtns = [
    { key: 'all', label: s('filterAll'), count: PROPHECIES.length },
    { key: 'verified', label: STATUS_MAP.verified[catKey], count: verified.length },
    { key: 'partial', label: STATUS_MAP.partial[catKey], count: partial.length },
    { key: 'failed', label: STATUS_MAP.failed[catKey], count: failed.length },
    { key: 'pending', label: STATUS_MAP.pending[catKey], count: pending.length },
    { key: 'none', label: s('filterNoStatus'), count: noStatus.length },
  ];
  let statusFilterHtml = statusBtns.map(f => {
    const iconHtml = f.key !== 'all' && f.key !== 'none' && STATUS_MAP[f.key] ? `<i class="${STATUS_MAP[f.key].icon}"></i> ` : '';
    return `<button class="filter-btn ${currentStatus === f.key ? 'active' : ''}" onclick="setStatus('${f.key}')">${iconHtml}${f.label} (${f.count})</button>`;
  }).join('');

  // Stats (pre-calculated at build time)
  const hitRate = SITE_CONFIG.hitRate;
  const _vc = SITE_CONFIG.verifiedCount, _pc = SITE_CONFIG.partialCount, _jc = SITE_CONFIG.judgedCount;

  // Populate header tools (search + hit rate)
  document.getElementById('header-tools').innerHTML = `
    <input type="text" class="search-box" id="search-input" placeholder="${s('searchPlaceholder')}" aria-label="${s('searchPlaceholder')}" oninput="renderList(true)">
    <button class="search-icon-btn" onclick="openSearchOverlay()" aria-label="${s('searchLabel')}"><i class="i-search"></i></button>
    <span class="hit-rate-badge">${s('hitRate')} ${hitRate}%<span class="hit-rate-info"><i class="i-info"></i><span class="hit-rate-tooltip">${lang === 'zh' ? `已应验 ${_vc} + 部分相关 ${_pc}×0.5，共 ${_jc} 条可判定` : `Verified ${_vc} + Partial ${_pc}×0.5, ${_jc} decidable`}<br>${s('formula')}: (${_vc}+${_pc}×0.5)÷${_jc} = ${hitRate}%</span></span></span>
  `;

  document.getElementById('section-all').innerHTML = `
    <div class="sticky-filter-wrap">
    <div class="filter-section">
      <div class="filter-row">
        <span class="filter-label">${s('filterCategory')}:</span>
        <div class="filter-bar-wrap"><div class="filter-bar">${catFilterHtml}</div></div>
      </div>
      <div class="filter-row">
        <span class="filter-label">${s('filterStatus')}:</span>
        <div class="filter-bar-wrap"><div class="filter-bar">${statusFilterHtml}</div></div>
      </div>
    </div>
    <div class="list-info">${s('resultCount').replace('{count}', `<span id="result-count">${filtered.length}</span>`)}</div>
    </div>
    <div class="prophecy-list" id="prophecy-list">${itemsHtml}</div>
  `;

  // Filter scroll fade: hide gradient when scrolled to end
  document.querySelectorAll('.filter-bar').forEach(function(bar) {
    var wrap = bar.parentElement;
    function checkScroll() {
      var atEnd = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 4;
      wrap.classList.toggle('scrolled-end', atEnd);
    }
    bar.addEventListener('scroll', checkScroll);
    checkScroll();
  });
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

function openSearchOverlay() {
  let overlay = document.getElementById('search-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'search-overlay';
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-overlay-inner">
        <input type="text" class="search-box" id="search-overlay-input" placeholder="${s('searchPlaceholder')}" aria-label="${s('searchLabel')}">
        <button class="search-overlay-close" onclick="closeSearchOverlay()">✕</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeSearchOverlay();
    });
    document.getElementById('search-overlay-input').addEventListener('input', function() {
      var mainInput = document.getElementById('search-input');
      if (mainInput) mainInput.value = this.value;
      renderList(true);
    });
  }
  var overlayInput = document.getElementById('search-overlay-input');
  var mainInput = document.getElementById('search-input');
  if (mainInput) overlayInput.value = mainInput.value;
  overlay.classList.add('active');
  overlayInput.focus();
}

function closeSearchOverlay() {
  var overlay = document.getElementById('search-overlay');
  if (overlay) overlay.classList.remove('active');
}

function renderAll() {
  renderList();
}

window.addEventListener('scroll', () => {
  const btn = document.querySelector('.scroll-top');
  btn.classList.toggle('show', window.scrollY > 400);
});

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});

// Prevent pinch-zoom on mobile
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });
