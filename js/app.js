let lang = 'zh';
let currentPage = 'home';
let currentCat = 'all';
let currentVerifyFilter = 'all';

function t(key) { return I18N[lang][key] || key; }

function switchLang() {
  lang = lang === 'zh' ? 'en' : 'zh';
  document.querySelector('.lang-toggle').textContent = lang === 'zh' ? 'EN' : '中文';
  renderAll();
}

function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.querySelector(`nav button[data-page="${page}"]`).classList.add('active');
  window.scrollTo(0, 0);
}

function renderNav() {
  document.querySelector('.logo').textContent = t('siteTitle');
  const btns = document.querySelectorAll('nav button');
  btns[0].textContent = t('navHome');
  btns[1].textContent = t('navAll');
  btns[2].textContent = t('navVerify');
}

function renderHome() {
  const page = document.getElementById('page-home');
  page.innerHTML = `
    <div class="hero">
      <h1>${t('siteTitle')}</h1>
      <p>${t('siteSubtitle')}</p>
    </div>
    <div class="card">
      <h2 class="section-title" style="margin-top:0">${t('homeTitle')}</h2>
      <p class="intro-text">${t('homeIntro1')}</p>
      <p class="intro-text">${t('homeIntro2')}</p>
      <p class="intro-text">${t('homeIntro3')}</p>
    </div>
    <div class="quote-card">
      <div class="label">${t('coreMessage')}</div>
      <blockquote>${t('coreQuote')}</blockquote>
    </div>
    <h2 class="section-title">${t('keyPoints')}</h2>
    <div class="timeline">
      <div class="timeline-item"><span class="year-label">${t('kp2019')}</span></div>
      <div class="timeline-item"><span class="year-label">${t('kp2035')}</span></div>
      <div class="timeline-item"><span class="year-label">${t('kp2038')}</span></div>
      <div class="timeline-item"><span class="year-label">${t('kp2048')}</span></div>
      <div class="timeline-item"><span class="year-label">${t('kp2060')}</span></div>
    </div>
  `;
}

function renderAllProphecies() {
  const page = document.getElementById('page-all');
  const search = document.getElementById('search-input')?.value?.toLowerCase() || '';

  let filtered = PROPHECIES.filter(p => {
    if (currentCat !== 'all' && p.cat !== currentCat) return false;
    if (search) {
      const text = (p.q + p.a).toLowerCase();
      return text.includes(search);
    }
    return true;
  }).sort((a, b) => a.id - b.id);

  const catKey = lang === 'zh' ? 'zh' : 'en';

  let filterHtml = `<button class="filter-btn ${currentCat === 'all' ? 'active' : ''}" onclick="setCat('all')">${t('filterAll')}</button>`;
  for (const [key, val] of Object.entries(CATEGORIES)) {
    filterHtml += `<button class="filter-btn ${currentCat === key ? 'active' : ''}" onclick="setCat('${key}')">${val.icon} ${val[catKey]}</button>`;
  }

  let itemsHtml = '';
  if (filtered.length === 0) {
    itemsHtml = `<div class="no-results">${lang === 'zh' ? '未找到相关预言' : 'No prophecies found'}</div>`;
  } else {
    filtered.forEach(p => {
      const cat = CATEGORIES[p.cat];
      itemsHtml += `
        <div class="prophecy-item">
          <div class="prophecy-header">
            <span class="prophecy-id">#${p.id}</span>
            <span class="prophecy-cat">${cat.icon} ${cat[catKey]}</span>
            ${p.year ? `<span class="prophecy-cat" style="color:var(--accent)">${p.year}</span>` : ''}
          </div>
          <div class="prophecy-q">${p.q}</div>
          <div class="prophecy-a">${p.a}</div>
        </div>
      `;
    });
  }

  page.innerHTML = `
    <h1 class="section-title" style="margin-top:0">${t('allTitle')}</h1>
    <p class="section-subtitle">${t('allSubtitle').replace('{count}', PROPHECIES.length)}</p>
    <div class="toolbar">
      <input type="text" class="search-box" id="search-input" placeholder="${t('searchPlaceholder')}" value="${search}" oninput="renderAllProphecies()">
    </div>
    <div class="filter-bar" style="margin-bottom:1.5rem">${filterHtml}</div>
    <div id="prophecy-list">${itemsHtml}</div>
  `;
}

function setCat(cat) {
  currentCat = cat;
  renderAllProphecies();
}

function renderVerify() {
  const page = document.getElementById('page-verify');
  const catKey = lang === 'zh' ? 'zh' : 'en';
  const verdictKey = lang === 'zh' ? 'verdict_zh' : 'verdict_en';

  const verifiable = PROPHECIES.filter(p => p.status);
  const verified = verifiable.filter(p => p.status === 'verified');
  const partial = verifiable.filter(p => p.status === 'partial');
  const failed = verifiable.filter(p => p.status === 'failed');
  const pending = verifiable.filter(p => p.status === 'pending');

  const decidable = verified.length + partial.length + failed.length;
  const hitRate = decidable > 0 ? Math.round((verified.length + partial.length * 0.5) / decidable * 100) : 0;

  let items = verifiable;
  if (currentVerifyFilter !== 'all') {
    items = verifiable.filter(p => p.status === currentVerifyFilter);
  }
  items.sort((a, b) => (a.year || 9999) - (b.year || 9999));

  const filterBtns = [
    { key: 'all', label: t('filterAll'), count: verifiable.length },
    { key: 'verified', label: STATUS_MAP.verified[catKey], count: verified.length },
    { key: 'partial', label: STATUS_MAP.partial[catKey], count: partial.length },
    { key: 'failed', label: STATUS_MAP.failed[catKey], count: failed.length },
    { key: 'pending', label: STATUS_MAP.pending[catKey], count: pending.length },
  ];

  let filterHtml = filterBtns.map(f =>
    `<button class="filter-btn ${currentVerifyFilter === f.key ? 'active' : ''}" onclick="setVerifyFilter('${f.key}')">${f.label} (${f.count})</button>`
  ).join('');

  let itemsHtml = items.map(p => {
    const st = STATUS_MAP[p.status];
    const verdict = p[verdictKey] || '';
    return `
      <div class="verify-item ${st.cls}">
        <div class="verify-header">
          <span class="prophecy-id">#${p.id}</span>
          <span class="status-badge ${st.cls}">${st.icon} ${st[catKey]}</span>
          ${p.year ? `<span class="verify-year">${t('yearLabel')}: ${p.year}</span>` : ''}
        </div>
        <div class="verify-body">
          <div class="verify-prophecy">
            <div class="verify-label">${t('prophecyLabel')}</div>
            <div class="verify-q">${p.q}</div>
            <div class="verify-a" style="margin-top:0.25rem">KFK: ${p.a}</div>
          </div>
          ${verdict ? `
            <div>
              <div class="verify-label">${t('realityLabel')}</div>
              <div class="verify-verdict">${verdict}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  page.innerHTML = `
    <h1 class="section-title" style="margin-top:0">${t('verifyTitle')}</h1>
    <p class="section-subtitle">${t('verifySubtitle')}</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-num accent">${verifiable.length}</div><div class="stat-label">${t('statsTotal')}</div></div>
      <div class="stat-card"><div class="stat-num green">${verified.length}</div><div class="stat-label">${t('statsVerified')}</div></div>
      <div class="stat-card"><div class="stat-num yellow">${partial.length}</div><div class="stat-label">${t('statsPartial')}</div></div>
      <div class="stat-card"><div class="stat-num red">${failed.length}</div><div class="stat-label">${t('statsFailed')}</div></div>
      <div class="stat-card"><div class="stat-num blue">${pending.length}</div><div class="stat-label">${t('statsPending')}</div></div>
    </div>
    <div class="hit-rate-card">
      <div class="hit-rate-num">${hitRate}%</div>
      <div class="hit-rate-label">${t('hitRate')}</div>
      <div class="hit-rate-note">${lang === 'zh' ? `基于 ${decidable} 条已到期预言（已应验计1分，部分相关计0.5分）` : `Based on ${decidable} expired predictions (verified=1, partial=0.5)`}</div>
    </div>
    <div class="verify-filters">${filterHtml}</div>
    <div id="verify-list">${itemsHtml}</div>
  `;
}

function setVerifyFilter(f) {
  currentVerifyFilter = f;
  renderVerify();
}

function renderFooter() {
  document.getElementById('footer-text').innerHTML = `
    <p>${t('footerNote')}</p>
    <p style="margin-top:0.5rem">${t('footerSource')}: <a href="https://www.15um.com/2709" target="_blank">15um.com</a></p>
  `;
}

function renderAll() {
  renderNav();
  renderHome();
  renderAllProphecies();
  renderVerify();
  renderFooter();
}

// Scroll to top
window.addEventListener('scroll', () => {
  const btn = document.querySelector('.scroll-top');
  btn.classList.toggle('show', window.scrollY > 400);
});

document.addEventListener('DOMContentLoaded', renderAll);
