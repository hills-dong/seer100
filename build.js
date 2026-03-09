#!/usr/bin/env node
// Site generator: reads db/{siteId}/ data and templates to produce a complete static site
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const DIST_DIR = path.join(ROOT, 'docs');

// ---------------------------------------------------------------------------
// Shared data (categories, statusMap, common i18n)
// ---------------------------------------------------------------------------
const SHARED = JSON.parse(fs.readFileSync(path.join(ROOT, 'db/shared.json'), 'utf8'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ---------------------------------------------------------------------------
// Load site data from db/{siteId}/
// ---------------------------------------------------------------------------
function loadSiteData(siteId) {
  const dbDir = path.join(ROOT, 'db', siteId);
  const config = JSON.parse(fs.readFileSync(path.join(dbDir, 'config.json'), 'utf8'));
  const prophecies = JSON.parse(fs.readFileSync(path.join(dbDir, 'prophecies.json'), 'utf8'));
  const i18n = JSON.parse(fs.readFileSync(path.join(dbDir, 'i18n.json'), 'utf8'));
  // Merge categories: site-specific overrides shared defaults
  prophecies.categories = { ...SHARED.categories, ...(prophecies.categories || {}) };
  return { config, prophecies, i18n, dbDir };
}

// ---------------------------------------------------------------------------
// Simple CSS/JS minification (no dependencies)
// ---------------------------------------------------------------------------
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // remove comments
    .replace(/\s*([{}:;,>~+])\s*/g, '$1') // collapse whitespace around symbols
    .replace(/\s+/g, ' ')                // collapse remaining whitespace
    .replace(/;}/g, '}')                 // remove last semicolons
    .replace(/^\s+|\s+$/g, '')           // trim
    .replace(/\s*(!important)/g, '$1');  // no space before !important
}

function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')           // remove block comments
    .replace(/(?<![:'"])\/\/(?!['"]).*/g, '')    // remove line comments (careful with URLs)
    .replace(/\n\s*\n/g, '\n')                  // collapse blank lines
    .replace(/^\s+/gm, '')                      // remove leading whitespace per line
    .trim();
}

// ---------------------------------------------------------------------------
// Generate CSS from template + theme
// ---------------------------------------------------------------------------
function generateCSS(theme) {
  let css = fs.readFileSync(path.join(TEMPLATES_DIR, 'css/style.css.tpl'), 'utf8');
  // Replace {{theme.xxx}} placeholders
  css = css.replace(/\{\{theme\.(\w+)\}\}/g, (_, key) => theme[key] || '');
  return minifyCSS(css);
}


// ---------------------------------------------------------------------------
// Generate noscript HTML for SEO crawlers
// ---------------------------------------------------------------------------
function generateNoscript(siteData, lang) {
  const { config, prophecies } = siteData;
  const { categories, prophecies: items } = prophecies;
  const statusMap = SHARED.statusMap;
  const st = SHARED.i18n[lang] || SHARED.i18n.zh;
  const answerer = config.answererName;
  const catKey = lang === 'zh' ? 'zh' : 'en';
  const verdictKey = lang === 'zh' ? 'verdict_zh' : 'verdict_en';

  let html = `<noscript><h1>${escapeHtml(config.meta[lang]?.siteName || answerer)} ${st.allTitle}</h1><p>${st.allSubtitle.replace('{count}', items.length)}</p>\n`;

  // All prophecies
  const sorted = [...items].sort((a, b) => a.id - b.id);
  sorted.forEach(p => {
    const cat = categories[p.cat];
    const q = lang === 'en' && p.q_en ? p.q_en : p.q;
    const a = lang === 'en' && p.a_en ? p.a_en : p.a;
    html += `<div class="prophecy-item">`;
    html += `<div class="prophecy-header"><span class="prophecy-id">#${p.id}</span> <span class="prophecy-cat"><i class="${cat.icon}"></i> ${cat[catKey]}</span>${p.year ? ` <span class="prophecy-year-tag">${p.year}</span>` : ''}</div>`;
    html += `<div class="prophecy-q">${escapeHtml(q)}</div>`;
    html += `<div class="prophecy-a"><span class="kfk-name">${answerer}: </span>${escapeHtml(a)}</div>`;
    html += `</div>\n`;
  });

  // Verify list
  html += `<h2>${st.verifyTitle}</h2><p>${st.verifySubtitle}</p>\n`;
  const verifiable = items.filter(p => p.status);
  const verSorted = [...verifiable].sort((a, b) => (a.year || 9999) - (b.year || 9999));
  verSorted.forEach(p => {
    const st = statusMap[p.status];
    const q = lang === 'en' && p.q_en ? p.q_en : p.q;
    const a = lang === 'en' && p.a_en ? p.a_en : p.a;
    const verdict = p[verdictKey] || '';
    html += `<div class="verify-item ${st.cls}">`;
    html += `<div class="verify-header"><span class="prophecy-id">#${p.id}</span> <span class="status-badge ${st.cls}"><i class="${st.icon}"></i> ${st[catKey]}</span>${p.year ? ` <span class="verify-year">${st.predYear}: ${p.year}</span>` : ''}</div>`;
    html += `<div class="verify-body">`;
    html += `<div class="verify-prophecy"><div class="verify-q">${escapeHtml(q)}</div>`;
    html += `<div class="verify-a"><strong>${answerer}:</strong> ${escapeHtml(a)}</div></div>`;
    if (verdict) {
      html += `<div><div class="verify-verdict">${escapeHtml(verdict)}</div></div>`;
    }
    html += `</div></div>\n`;
  });

  html += `</noscript>`;
  return html;
}

// ---------------------------------------------------------------------------
// Generate HTML page from template
// ---------------------------------------------------------------------------
function generateHTML(siteData, lang) {
  const { config, prophecies, i18n } = siteData;
  const meta = config.meta[lang];
  const defaultLang = config.defaultLang;
  const isDefault = (lang === defaultLang);
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  let tpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html.tpl'), 'utf8');

  // Asset prefix: default lang at root, others in subdir
  const assetPrefix = isDefault ? '' : '../';
  const canonicalUrl = isDefault ? baseUrl + '/' : baseUrl + '/' + lang + '/';

  // hreflang tags
  const hreflangTags = config.languages.map(l => {
    const url = l === defaultLang ? baseUrl + '/' : baseUrl + '/' + l + '/';
    const hreflang = config.meta[l]?.htmlLang === 'zh-CN' ? 'zh' : l;
    return `  <link rel="alternate" hreflang="${hreflang}" href="${url}">`;
  }).concat([`  <link rel="alternate" hreflang="x-default" href="${baseUrl}/">`]).join('\n');

  // OG locale alternates
  const ogLocaleAlternates = config.languages
    .filter(l => l !== lang)
    .map(l => `  <meta property="og:locale:alternate" content="${config.meta[l]?.locale || ''}">`)
    .join('\n');

  // Structured data
  const structuredData = (config.structuredData || [])
    .map(sd => `  <script type="application/ld+json">\n  ${JSON.stringify(sd, null, 2).split('\n').join('\n  ')}\n  </script>`)
    .join('\n');

  // Logo HTML
  let logoHtml = '';
  if (config.logo.type === 'image') {
    logoHtml = `<img src="${assetPrefix}img/${config.logo.file}" alt="${escapeHtml(config.logo.alt)}" class="logo-img">`;
  } else {
    logoHtml = escapeHtml(config.logo.text || config.answererName);
  }

  // i18n labels
  const labels = i18n[lang] || i18n[defaultLang];

  // Intro section (server-rendered for SEO)
  const answerer = config.answererName;
  const pubDate = config.publishDate || '';
  const keyPointsHtml = (labels.keyPointsList || []).map(item => {
    const sep = item.includes('——') ? '——' : '—';
    const parts = item.split(sep);
    return `<li><span class="tl-year">${escapeHtml((parts[0] || '').trim())}</span> — ${escapeHtml((parts[1] || '').trim())}</li>`;
  }).join('\n        ');
  const sourceListHtml = (labels.sourceList || []).map(item =>
    `<li>${item}</li>`
  ).join('\n        ');
  const introContent = `
    <div class="topic-header">
      <h1 class="topic-title">${escapeHtml(labels.homeTitle || '')}</h1>
      <div class="topic-meta">
        <span class="author">${escapeHtml(answerer)}</span>
        ${pubDate ? ` · <span>${escapeHtml(pubDate)}</span>` : ''}
      </div>
    </div>
    <div class="topic-body">
      <p>${labels.homeIntro1 || ''}</p>
      <p>${labels.homeIntro2 || ''}</p>
      <p>${labels.homeIntro3 || ''}</p>
      <div class="quote-block">
        <div class="quote-label">${escapeHtml(labels.coreMessage || '')}</div>
        ${labels.coreQuote || ''}
      </div>
      <div class="section-header">${escapeHtml(labels.keyPoints || '')}</div>
      <ul class="timeline-list">
        ${keyPointsHtml}
      </ul>${labels.sourceTitle ? `
      <div class="section-header">${escapeHtml(labels.sourceTitle)}</div>
      <ul class="source-list">
        ${sourceListHtml}
      </ul>` : ''}
    </div>`;

  // Noscript
  const noscriptContent = generateNoscript(siteData, lang);

  // Inline data scripts
  const dataScript = `const PROPHECIES = ${JSON.stringify(prophecies.prophecies)};\nconst CATEGORIES = ${JSON.stringify(prophecies.categories)};\nconst STATUS_MAP = ${JSON.stringify(SHARED.statusMap)};\nconst SHARED_I18N = ${JSON.stringify(SHARED.i18n)};`;
  // Calculate hit rate at build time
  let _v = 0, _pa = 0, _judged = 0;
  for (const p of prophecies.prophecies) {
    if (p.status === 'verified') { _v++; _judged++; }
    else if (p.status === 'partial') { _pa++; _judged++; }
    else if (p.status === 'failed') { _judged++; }
  }
  const _hitRate = _judged > 0 ? Math.round((_v + _pa * 0.5) / _judged * 100) : 0;
  const siteConfigScript = `var SITE_CONFIG = ${JSON.stringify({ answererName: config.answererName, siteId: config.siteId, publishDate: config.publishDate || '', hitRate: _hitRate, verifiedCount: _v, partialCount: _pa, judgedCount: _judged })};`;

  // Replace all placeholders
  const replacements = {
    htmlLang: meta.htmlLang,
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    siteName: meta.siteName,
    canonicalUrl: canonicalUrl,
    hreflangTags: hreflangTags,
    ogTitle: meta.ogTitle,
    ogDescription: meta.ogDescription,
    locale: meta.locale,
    ogLocaleAlternates: ogLocaleAlternates,
    twitterDescription: meta.twitterDescription,
    assetPrefix: assetPrefix,
    structuredData: structuredData,
    logoHtml: logoHtml,
    navAll: labels.navAll,
    navHome: labels.navHome,
    langToggleText: SHARED.i18n[lang]?.langToggle || 'EN',
    introContent: introContent,
    noscriptContent: noscriptContent,
    disclaimer: SHARED.i18n[lang]?.disclaimer || SHARED.i18n.zh.disclaimer,
    lang: lang,
    i18nScript: siteConfigScript,
    dataScript: dataScript,
  };

  for (const [key, val] of Object.entries(replacements)) {
    tpl = tpl.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }

  return tpl;
}

// ---------------------------------------------------------------------------
// Build a site
// ---------------------------------------------------------------------------
function buildSite(siteId) {
  console.log(`\nBuilding site: ${siteId}`);
  const siteData = loadSiteData(siteId);
  const { config, dbDir } = siteData;
  const distDir = path.join(DIST_DIR, siteId);

  // Clean and create dist dir
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  mkdirp(distDir);

  // Generate CSS
  const css = generateCSS(config.theme);
  mkdirp(path.join(distDir, 'css'));
  fs.writeFileSync(path.join(distDir, 'css/style.css'), css, 'utf8');
  console.log(`  Generated: css/style.css`);

  // Minify and write app.js
  mkdirp(path.join(distDir, 'js'));
  const appJs = fs.readFileSync(path.join(TEMPLATES_DIR, 'js/app.js'), 'utf8');
  fs.writeFileSync(path.join(distDir, 'js/app.js'), minifyJS(appJs), 'utf8');
  console.log(`  Generated: js/app.js`);

  // Copy images from db/{siteId}/img/
  const imgSrc = path.join(dbDir, 'img');
  if (fs.existsSync(imgSrc)) {
    copyDir(imgSrc, path.join(distDir, 'img'));
    console.log(`  Copied: img/`);
  }

  // Generate HTML for each language
  for (const lang of config.languages) {
    const html = generateHTML(siteData, lang);
    const isDefault = lang === config.defaultLang;
    const htmlDir = isDefault ? distDir : path.join(distDir, lang);
    mkdirp(htmlDir);
    fs.writeFileSync(path.join(htmlDir, 'index.html'), html, 'utf8');
    console.log(`  Generated: ${isDefault ? '' : lang + '/'}index.html`);
  }

  // Generate robots.txt
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
  console.log(`  Generated: robots.txt`);

  // Generate sitemap.xml
  const today = new Date().toISOString().split('T')[0];
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
  for (const lang of config.languages) {
    const isDefault = lang === config.defaultLang;
    const url = isDefault ? baseUrl + '/' : baseUrl + '/' + lang + '/';
    const priority = isDefault ? '1.0' : '0.9';
    sitemap += `  <url>\n    <loc>${url}</loc>\n`;
    for (const l of config.languages) {
      const href = l === config.defaultLang ? baseUrl + '/' : baseUrl + '/' + l + '/';
      const hreflang = config.meta[l]?.htmlLang === 'zh-CN' ? 'zh' : l;
      sitemap += `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>\n`;
    }
    sitemap += `    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  }
  sitemap += `</urlset>\n`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`  Generated: sitemap.xml`);

  console.log(`Done: docs/${siteId}/`);
}

// ---------------------------------------------------------------------------
// Build index page listing all sites + upcoming prophecies
// ---------------------------------------------------------------------------
const CATEGORY_LABELS = {
  'time-traveler': { zh: '时间旅行者', en: 'Time Traveler' },
  'psychic': { zh: '灵媒/预言家', en: 'Psychic' },
  'ancient-text': { zh: '古代典籍', en: 'Ancient Text' },
  'religion': { zh: '宗教预言', en: 'Religion' },
  'sci-fi': { zh: '科幻预言', en: 'Sci-Fi' },
  'futurist': { zh: '未来学家', en: 'Futurist' },
  'indigenous': { zh: '原住民预言', en: 'Indigenous' },
  'pop-culture': { zh: '流行文化', en: 'Pop Culture' },
  'internet': { zh: '互联网预言', en: 'Internet' },
  'folk': { zh: '民间传说', en: 'Folk' },
};

const COUNTRY_LABELS = {
  'CN': { zh: '中国', en: 'China' }, 'US': { zh: '美国', en: 'USA' },
  'GB': { zh: '英国', en: 'UK' }, 'FR': { zh: '法国', en: 'France' },
  'BG': { zh: '保加利亚', en: 'Bulgaria' }, 'IN': { zh: '印度', en: 'India' },
  'JP': { zh: '日本', en: 'Japan' }, 'DE': { zh: '德国', en: 'Germany' },
  'IT': { zh: '意大利', en: 'Italy' }, 'RU': { zh: '俄罗斯', en: 'Russia' },
  'GR': { zh: '希腊', en: 'Greece' }, 'IL': { zh: '以色列', en: 'Israel' },
  'IR': { zh: '伊朗', en: 'Iran' }, 'IE': { zh: '爱尔兰', en: 'Ireland' },
  'PT': { zh: '葡萄牙', en: 'Portugal' }, 'BA': { zh: '波黑', en: 'Bosnia' },
  'MX': { zh: '墨西哥', en: 'Mexico' }, 'PE': { zh: '秘鲁', en: 'Peru' },
  'AU': { zh: '澳大利亚', en: 'Australia' }, 'IS': { zh: '冰岛', en: 'Iceland' },
  'CH': { zh: '瑞士', en: 'Switzerland' }, 'AT': { zh: '奥地利', en: 'Austria' },
  'RS': { zh: '塞尔维亚', en: 'Serbia' }, 'SA': { zh: '沙特', en: 'Saudi Arabia' },
  'KR': { zh: '韩国', en: 'South Korea' },
};

function buildIndex() {
  console.log('\nBuilding index page...');
  const dbRoot = path.join(ROOT, 'db');
  const sitesJsonPath = path.join(dbRoot, 'sites.json');
  const sites = JSON.parse(fs.readFileSync(sitesJsonPath, 'utf8'));

  // Auto-promote pending sites to done if their data files exist
  for (const site of sites) {
    if (site.status === 'done') continue;
    const cfgPath = path.join(dbRoot, site.siteId, 'config.json');
    if (fs.existsSync(cfgPath)) {
      site.status = 'done';
      site.url = site.url || `https://seer100.com/${site.siteId}/`;
    }
  }

  // Enrich done sites with data from their db directories
  for (const site of sites) {
    if (site.status !== 'done') continue;
    const cfgPath = path.join(dbRoot, site.siteId, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;

    const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const i18n = JSON.parse(fs.readFileSync(path.join(dbRoot, site.siteId, 'i18n.json'), 'utf8'));
    const prophecies = JSON.parse(fs.readFileSync(path.join(dbRoot, site.siteId, 'prophecies.json'), 'utf8'));

    site.count = prophecies.prophecies.length;
    site.logo = config.logo.file;
    site.title_zh = i18n.zh.siteTitle;
    site.title_en = i18n.en.siteTitle;
    site.primary = config.theme.primary;

    // Calculate verification rate (hitRate)
    let verified = 0, partial = 0, judged = 0;
    for (const p of prophecies.prophecies) {
      if (p.status === 'verified') { verified++; judged++; }
      else if (p.status === 'partial') { partial++; judged++; }
      else if (p.status === 'failed') { judged++; }
    }
    site.hitRate = judged > 0 ? Math.round((verified + partial * 0.5) / judged * 100) : null;
    // Clean up legacy fields
    delete site.verified; delete site.partial; delete site.failed; delete site.judged;
  }

  // Write back enriched sites.json
  fs.writeFileSync(sitesJsonPath, JSON.stringify(sites, null, 2) + '\n', 'utf8');
  console.log('  Updated: db/sites.json');

  // Collect upcoming prophecies (current year to +4)
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 4;
  const upcoming = [];

  for (const site of sites) {
    if (site.status !== 'done') continue;
    const propPath = path.join(dbRoot, site.siteId, 'prophecies.json');
    if (!fs.existsSync(propPath)) continue;
    const prophecies = JSON.parse(fs.readFileSync(propPath, 'utf8'));
    for (const p of prophecies.prophecies) {
      if (p.year && p.year >= currentYear && p.year <= maxYear) {
        upcoming.push({
          year: p.year,
          q: p.q || '',
          q_en: p.q_en || '',
          a: p.a,
          a_en: p.a_en,
          status: p.status || 'pending',
          verdict_zh: p.verdict_zh || '',
          verdict_en: p.verdict_en || '',
          siteNameZh: site.name_zh || site.name,
          siteNameEn: site.name_en || site.name,
          siteId: site.siteId,
          siteUrl: site.url,
          siteUrlEn: site.url ? site.url.replace(/\/$/, '') + '/en/' : '',
          primary: site.primary || '#494949',
          hitRate: site.hitRate,
        });
      }
    }
  }
  // Sort upcoming by year
  upcoming.sort((a, b) => a.year - b.year);

  // Count and sort categories/countries by frequency (descending)
  const catCounts = {};
  const countryCounts = {};
  for (const s of sites) {
    catCounts[s.category] = (catCounts[s.category] || 0) + 1;
    countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
  }
  const usedCategories = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
  const usedCountries = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]);

  // Sort sites by startYear descending (parse as number)
  const sortedSites = [...sites].sort((a, b) => {
    const ya = parseInt(a.startYear, 10) || 0;
    const yb = parseInt(b.startYear, 10) || 0;
    return yb - ya;
  });

  // Upcoming years for tabs
  const upcomingYears = [...new Set(upcoming.map(u => u.year))].sort();

  // Generate table rows
  const tableRows = sortedSites.map(s => {
    const catLabel = CATEGORY_LABELS[s.category] || { zh: s.category, en: s.category };
    const countryLabel = COUNTRY_LABELS[s.country] || { zh: s.country, en: s.country };
    const isDone = s.status === 'done';
    const nameZh = s.name_zh || s.name;
    const nameEn = s.name_en || s.name;
    const urlZh = s.url || '';
    const urlEn = isDone && s.url ? s.url.replace(/\/$/, '') + '/en/' : '';
    const yearDisplay = parseInt(s.startYear, 10) < 0
      ? `<span data-lang="zh">公元前${Math.abs(parseInt(s.startYear, 10))}年</span><span data-lang="en">${Math.abs(parseInt(s.startYear, 10))} BC</span>`
      : s.startYear;
    const logoCell = isDone && s.logo
      ? `<img src="${s.siteId}/img/${escapeHtml(s.logo)}" alt="" class="tbl-logo">`
      : '';
    const nameCell = isDone
      ? `<a href="${escapeHtml(urlZh)}" target="_blank" rel="noopener" class="site-link" data-lang="zh">${logoCell}<span>${escapeHtml(nameZh)}</span></a><a href="${escapeHtml(urlEn)}" target="_blank" rel="noopener" class="site-link" data-lang="en">${logoCell}<span>${escapeHtml(nameEn)}</span></a>`
      : `<span data-lang="zh" class="site-pending">${escapeHtml(nameZh)}</span><span data-lang="en" class="site-pending">${escapeHtml(nameEn)}</span>`;
    const countCell = isDone && s.count ? s.count : '';
    const rateCell = isDone && s.hitRate !== null
      ? `<span class="hit-rate">${s.hitRate}%</span>`
      : '';
    const statusCell = isDone
      ? `<a href="${escapeHtml(urlZh)}" target="_blank" rel="noopener" class="status-done" data-lang="zh"><span>进入</span> →</a><a href="${escapeHtml(urlEn)}" target="_blank" rel="noopener" class="status-done" data-lang="en"><span>Enter</span> →</a>`
      : `<span class="status-coming"><span data-lang="zh">即将推出</span><span data-lang="en">Coming soon</span></span>`;

    return `<tr data-cat="${s.category}" data-country="${s.country}" class="${isDone ? '' : 'row-pending'}">
      <td class="col-name">${nameCell}</td>
      <td class="col-cat"><span data-lang="zh">${escapeHtml(catLabel.zh)}</span><span data-lang="en">${escapeHtml(catLabel.en)}</span></td>
      <td class="col-country"><span data-lang="zh">${escapeHtml(countryLabel.zh)}</span><span data-lang="en">${escapeHtml(countryLabel.en)}</span></td>
      <td class="col-year">${yearDisplay}</td>
      <td class="col-count">${countCell}</td>
      <td class="col-rate">${rateCell}</td>
      <td class="col-status">${statusCell}</td>
    </tr>`;
  }).join('\n');

  // Generate category filter buttons
  const catButtons = usedCategories.map(cat => {
    const label = CATEGORY_LABELS[cat] || { zh: cat, en: cat };
    return `<button type="button" class="filter-btn" aria-pressed="false" data-filter-cat="${cat}"><span data-lang="zh">${escapeHtml(label.zh)}</span><span data-lang="en">${escapeHtml(label.en)}</span> <span class="filter-count">${catCounts[cat]}</span></button>`;
  }).join('\n      ');

  // Generate country filter buttons
  const countryButtons = usedCountries.map(c => {
    const label = COUNTRY_LABELS[c] || { zh: c, en: c };
    return `<button type="button" class="filter-btn" aria-pressed="false" data-filter-country="${c}"><span data-lang="zh">${escapeHtml(label.zh)}</span><span data-lang="en">${escapeHtml(label.en)}</span> <span class="filter-count">${countryCounts[c]}</span></button>`;
  }).join('\n      ');

  // Generate upcoming prophecies HTML
  const upcomingHtml = upcomingYears.map(year => {
    const items = upcoming.filter(u => u.year === year);
    const itemsHtml = items.map(u => {
      const statusCls = u.status === 'verified' ? 'st-verified' : u.status === 'partial' ? 'st-partial' : u.status === 'failed' ? 'st-failed' : 'st-pending';
      return `<div class="upcoming-item ${statusCls}">
        <div class="upcoming-source">
          <a href="${escapeHtml(u.siteUrl)}" target="_blank" rel="noopener" style="color:${u.primary}" data-lang="zh">${escapeHtml(u.siteNameZh)}</a><a href="${escapeHtml(u.siteUrlEn)}" target="_blank" rel="noopener" style="color:${u.primary}" data-lang="en">${escapeHtml(u.siteNameEn)}</a>${u.hitRate !== null ? ` <span class="upcoming-rate"><span data-lang="zh">历史应验率</span><span data-lang="en">Hit rate</span> ${u.hitRate}%</span>` : ''}
        </div>
        ${u.q ? `<div class="upcoming-q"><span data-lang="zh">${escapeHtml(u.q)}</span><span data-lang="en">${escapeHtml(u.q_en)}</span></div>` : ''}
        <div class="upcoming-a">
          <span data-lang="zh">${escapeHtml(u.a)}</span>
          <span data-lang="en">${escapeHtml(u.a_en)}</span>
        </div>
        ${u.verdict_zh ? `<div class="upcoming-verdict"><span data-lang="zh">${escapeHtml(u.verdict_zh)}</span><span data-lang="en">${escapeHtml(u.verdict_en)}</span></div>` : ''}
      </div>`;
    }).join('\n    ');

    return `<div class="year-group" data-year="${year}">
    <h3 class="year-heading">${year}</h3>
    ${itemsHtml}
  </div>`;
  }).join('\n  ');

  // Year groups are shown flat (no tabs)

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>预言档案馆 | Prophecy Archive</title>
<meta name="description" content="收录100个预言系列的完整档案与验证分析。A collection of 100 prophecy archives with verification analysis.">
<link rel="icon" type="image/svg+xml" href="img/logo.svg">
<style>
:root {
  --bg: #f5f5f0;
  --white: #fff;
  --text: #494949;
  --text2: #767676;
  --text-light: #666;
  --heading: #333;
  --border: #e5e5e5;
  --border2: #ccc;
  --primary: #494949;
  --tag-bg: #f4f4ec;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { font-kerning: normal; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
:focus-visible { outline: 2px solid var(--text2); outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }
::selection { background: rgba(73,73,73,.15); }

/* Skip nav */
.skip-link {
  position: absolute; left: -9999px; top: 0; padding: 8px 16px;
  background: var(--heading); color: var(--white); font-size: 14px; z-index: 100;
  text-decoration: none; border-radius: 0 0 4px 0;
}
.skip-link:focus { left: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

/* Header — compact single line */
.header {
  display: flex; align-items: center; gap: 12px;
  padding: 24px 20px 16px; max-width: 960px; margin: 0 auto;
}
.header-logo { width: 28px; height: 28px; flex-shrink: 0; }
.header h1 { font-size: 20px; font-weight: 700; color: var(--heading); }
.header p { color: var(--text2); font-size: 13px; }
.header .sep { color: var(--border2); font-size: 14px; }
.lang-switch {
  margin-left: auto; padding: 3px 12px;
  border: 1px solid var(--border2); border-radius: 12px; cursor: pointer;
  font-size: 12px; color: var(--text-light); background: var(--white);
  transition: border-color .2s, color .2s;
}
.lang-switch:hover { border-color: var(--text2); color: var(--heading); }

/* Main tabs */
.main-tabs {
  display: flex; gap: 0; margin: 0 auto 24px;
  max-width: 960px; padding: 0 20px; border-bottom: 1px solid var(--border);
}
.main-tab {
  padding: 10px 24px; font-size: 15px; font-weight: 500; cursor: pointer;
  background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--text2); transition: color .2s, border-color .2s;
}
.main-tab:hover { color: var(--text); }
.main-tab.active { color: var(--heading); border-bottom-color: var(--heading); }

/* Content */
.content { max-width: 960px; margin: 0 auto; padding: 0 20px 60px; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* Filters */
.filters { margin-bottom: 20px; }
.filter-group {
  margin-bottom: 10px; display: flex; align-items: center;
}
.filter-label { font-size: 13px; color: var(--text2); white-space: nowrap; flex-shrink: 0; margin-right: 6px; }
.filter-scroll {
  display: flex; flex-wrap: nowrap; gap: 6px; align-items: center;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
  padding-bottom: 4px; min-width: 0;
}
.filter-scroll::-webkit-scrollbar { display: none; }
.filter-btn {
  padding: 4px 12px; font-size: 12px; border: 1px solid var(--border);
  border-radius: 12px; background: var(--white); color: var(--text-light);
  cursor: pointer; transition: border-color .15s, color .15s, background .15s;
  white-space: nowrap; flex-shrink: 0;
}
.filter-btn:hover { border-color: var(--text2); color: var(--text); }
.filter-btn.active { background: var(--heading); color: var(--white); border-color: var(--heading); }
.filter-btn.active .filter-count { color: rgba(255,255,255,.7); }
.filter-count { font-size: 11px; color: var(--text2); margin-left: 1px; }

/* Table */
.sites-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.sites-table th {
  text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px;
  color: var(--text2); border-bottom: 2px solid var(--border);
  white-space: nowrap;
}
.sites-table td {
  padding: 10px 10px; border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.sites-table tr:hover { background: rgba(0,0,0,.02); }
.row-pending td { color: var(--text2); }
.row-pending:hover td { color: var(--text2); }
.col-name { min-width: 160px; }
.col-cat, .col-country { white-space: nowrap; }
.col-year, .col-count, .col-rate { text-align: center; white-space: nowrap; }
.col-status { text-align: right; white-space: nowrap; }
.tbl-logo { height: 16px; width: auto; margin-right: 6px; vertical-align: middle; }
.site-link {
  text-decoration: none; color: var(--text); font-weight: 500;
  display: inline-flex; align-items: center;
}
.site-link:hover { color: var(--heading); }
.site-pending { color: var(--text2); }
.country-code { font-size: 11px; color: var(--text2); }
.status-done {
  font-size: 12px; font-weight: 500; text-decoration: none;
  color: var(--heading); white-space: nowrap;
}
.status-done:hover { opacity: .7; }
.status-coming { font-size: 12px; color: var(--border2); }
.hit-rate { font-weight: 600; color: var(--heading); }
.upcoming-rate { font-size: 12px; color: var(--text2); margin-left: auto; }

/* Upcoming prophecies */
.year-group { margin-bottom: 32px; }
.year-heading { font-size: 16px; font-weight: 700; color: var(--heading); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.upcoming-item {
  background: var(--white); border-radius: 8px; padding: 16px 20px;
  margin-bottom: 12px; border-left: 3px solid var(--border);
}
.upcoming-item.st-verified { border-left-color: #007722; }
.upcoming-item.st-partial { border-left-color: #e09015; }
.upcoming-item.st-failed { border-left-color: #e04040; }
.upcoming-item.st-pending { border-left-color: #3377aa; }
.upcoming-source { margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.upcoming-source a { font-size: 13px; font-weight: 600; text-decoration: none; }
.upcoming-source a:hover { opacity: .7; }
.upcoming-q {
  font-size: 14px; color: var(--text-light); margin-bottom: 6px;
  padding: 8px 12px; background: var(--tag-bg); border-radius: 4px;
}
.upcoming-a { font-size: 14px; line-height: 1.7; }
.upcoming-verdict {
  margin-top: 8px; font-size: 13px; color: var(--text2);
  padding-top: 8px; border-top: 1px solid var(--border);
}
.empty-hint { text-align: center; padding: 40px 20px; color: var(--text2); font-size: 14px; }
.site-count { font-size: 13px; color: var(--text2); margin-bottom: 16px; }

/* Footer */
.footer-note { text-align: center; padding: 20px; color: var(--text2); font-size: 12px; }

/* Responsive */
@media (max-width: 640px) {
  .header { padding: 20px 12px 12px; }
  .header h1 { font-size: 18px; }
  .header-logo { width: 24px; height: 24px; }
  .content { padding: 0 12px 48px; }
  .main-tab { padding: 8px 16px; font-size: 14px; }
  .col-cat, .col-country, .col-count, .col-rate { display: none; }
  .col-name { min-width: 120px; }
  .sites-table th:nth-child(2), .sites-table th:nth-child(3), .sites-table th:nth-child(5), .sites-table th:nth-child(6) { display: none; }
  .upcoming-item { padding: 12px 14px; }
}
@media (max-width: 375px) {
  .content { padding: 0 8px 40px; }
  .header { padding: 16px 8px 10px; }
}
@media (pointer: coarse) {
  .lang-switch { min-height: 36px; padding: 6px 16px; }
  .filter-btn { min-height: 36px; padding: 8px 12px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
[data-lang="en"] { display: none; }
body.en [data-lang="zh"] { display: none; }
body.en [data-lang="en"] { display: initial; }
body.en a.site-link[data-lang="en"],
body.en a.status-done[data-lang="en"] { display: inline-flex; }
</style>
</head>
<body>
<a href="#panel-list" class="skip-link">Skip to content</a>
<header class="header">
  <img class="header-logo" src="img/logo.svg" alt="预言档案馆">
  <h1><span data-lang="zh">预言档案馆</span><span data-lang="en">Prophecy Archive</span></h1>
  <span class="sep">·</span>
  <p><span data-lang="zh">收录 ${sites.length} 个预言系列</span><span data-lang="en">${sites.length} prophecy series</span></p>
  <button type="button" class="lang-switch" aria-label="Switch language" onclick="document.body.classList.toggle('en');this.textContent=document.body.classList.contains('en')?'中文':'EN'">EN</button>
</header>

<nav class="main-tabs" role="tablist" aria-label="Content sections">
  <button type="button" class="main-tab active" role="tab" aria-selected="true" aria-controls="panel-list" data-tab="list">
    <span data-lang="zh">预言列表</span>
    <span data-lang="en">Prophecy List</span>
  </button>
  <button type="button" class="main-tab" role="tab" aria-selected="false" aria-controls="panel-upcoming" data-tab="upcoming">
    <span data-lang="zh">近期预言 (${currentYear}–${maxYear})</span>
    <span data-lang="en">Upcoming (${currentYear}–${maxYear})</span>
  </button>
</nav>

<main class="content">
  <!-- Tab 1: Prophecy List -->
  <div class="tab-panel active" id="panel-list" role="tabpanel" aria-labelledby="tab-list">
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label"><span data-lang="zh">分类：</span><span data-lang="en">Category:</span></span>
        <div class="filter-scroll">
          <button type="button" class="filter-btn active" aria-pressed="true" data-filter-cat="all"><span data-lang="zh">全部</span><span data-lang="en">All</span></button>
          ${catButtons}
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label"><span data-lang="zh">国家：</span><span data-lang="en">Country:</span></span>
        <div class="filter-scroll">
          <button type="button" class="filter-btn active" aria-pressed="true" data-filter-country="all"><span data-lang="zh">全部</span><span data-lang="en">All</span></button>
          ${countryButtons}
        </div>
      </div>
    </div>
    <div class="site-count">
      <span data-lang="zh">共 <strong id="visible-count">${sites.length}</strong> 个预言系列</span>
      <span data-lang="en"><strong id="visible-count-en">${sites.length}</strong> prophecy series</span>
    </div>
    <table class="sites-table">
      <thead>
        <tr>
          <th><span data-lang="zh">名称</span><span data-lang="en">Name</span></th>
          <th><span data-lang="zh">分类</span><span data-lang="en">Category</span></th>
          <th><span data-lang="zh">国家</span><span data-lang="en">Country</span></th>
          <th><span data-lang="zh">起始年</span><span data-lang="en">Start</span></th>
          <th><span data-lang="zh">预言数</span><span data-lang="en">Count</span></th>
          <th><span data-lang="zh">历史应验率</span><span data-lang="en">Historical Hit Rate</span></th>
          <th><span class="sr-only">Action</span></th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <!-- Tab 2: Upcoming Prophecies -->
  <div class="tab-panel" id="panel-upcoming" role="tabpanel" aria-labelledby="tab-upcoming">
    ${upcomingYears.length > 0 ? upcomingHtml : `<div class="empty-hint">
      <span data-lang="zh">暂无 ${currentYear}–${maxYear} 年的预言数据</span>
      <span data-lang="en">No prophecies for ${currentYear}–${maxYear} yet</span>
    </div>`}
  </div>
</main>

<footer class="footer-note">
  <span data-lang="zh">预言档案馆 — 记录与验证</span>
  <span data-lang="en">Prophecy Archive — Record & Verify</span>
</footer>

<script>
(function() {
  // Main tab switching
  document.querySelectorAll('.main-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Filter state
  var activeCat = 'all';
  var activeCountry = 'all';

  function applyFilters() {
    var rows = document.querySelectorAll('.sites-table tbody tr');
    var count = 0;
    rows.forEach(function(row) {
      var catMatch = activeCat === 'all' || row.dataset.cat === activeCat;
      var countryMatch = activeCountry === 'all' || row.dataset.country === activeCountry;
      var show = catMatch && countryMatch;
      row.style.display = show ? '' : 'none';
      if (show) count++;
    });
    var el = document.getElementById('visible-count');
    var el2 = document.getElementById('visible-count-en');
    if (el) el.textContent = count;
    if (el2) el2.textContent = count;
  }

  // Category filter
  document.querySelectorAll('[data-filter-cat]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-filter-cat]').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeCat = btn.dataset.filterCat;
      applyFilters();
    });
  });

  // Country filter
  document.querySelectorAll('[data-filter-country]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-filter-country]').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeCountry = btn.dataset.filterCountry;
      applyFilters();
    });
  });

  // Year groups are shown flat, no tab switching needed
})();
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf8');
  console.log('  Generated: docs/index.html');
}

// ---------------------------------------------------------------------------
// Main: build one site or all sites
// ---------------------------------------------------------------------------
const arg = process.argv[2];

if (arg === '--all') {
  // Build all sites found in db/
  const dbRoot = path.join(ROOT, 'db');
  for (const entry of fs.readdirSync(dbRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(dbRoot, entry.name, 'config.json'))) {
      buildSite(entry.name);
    }
  }
  buildIndex();
} else if (arg === '--index') {
  buildIndex();
} else {
  buildSite(arg || 'kfk');
}

console.log('\nBuild complete!');
console.log('Run `node server.js` to preview at http://localhost:3000/');
console.log('Output in docs/ — GitHub Pages serves from /docs on main branch');
