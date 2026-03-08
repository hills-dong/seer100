#!/usr/bin/env node
// Site generator: reads db/{siteId}/ data and templates to produce a complete static site
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const DIST_DIR = path.join(ROOT, 'docs');

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
  return { config, prophecies, i18n, dbDir };
}

// ---------------------------------------------------------------------------
// Generate CSS from template + theme
// ---------------------------------------------------------------------------
function generateCSS(theme) {
  let css = fs.readFileSync(path.join(TEMPLATES_DIR, 'css/style.css.tpl'), 'utf8');
  // Replace {{theme.xxx}} placeholders
  css = css.replace(/\{\{theme\.(\w+)\}\}/g, (_, key) => theme[key] || '');
  return css;
}

// ---------------------------------------------------------------------------
// Generate noscript HTML for SEO crawlers
// ---------------------------------------------------------------------------
function generateNoscript(siteData, lang) {
  const { config, prophecies } = siteData;
  const { categories, statusMap, prophecies: items } = prophecies;
  const answerer = config.answererName;
  const catKey = lang === 'zh' ? 'zh' : 'en';
  const verdictKey = lang === 'zh' ? 'verdict_zh' : 'verdict_en';
  const allTitle = lang === 'zh' ? '预言全集' : 'All Prophecies';
  const allCount = lang === 'zh' ? `共 ${items.length} 条问答` : `${items.length} Q&A entries in total`;
  const verifyTitle = lang === 'zh' ? '预言验证' : 'Prophecy Verification';
  const verifySubtitle = lang === 'zh' ? '对已到期的预言时间点进行真实度评估' : 'Evaluating predictions against reality for expired time points';

  let html = `<noscript><h1>${escapeHtml(config.meta[lang]?.siteName || answerer)} ${allTitle}</h1><p>${allCount}</p>\n`;

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
  html += `<h2>${verifyTitle}</h2><p>${verifySubtitle}</p>\n`;
  const verifiable = items.filter(p => p.status);
  const verSorted = [...verifiable].sort((a, b) => (a.year || 9999) - (b.year || 9999));
  verSorted.forEach(p => {
    const st = statusMap[p.status];
    const q = lang === 'en' && p.q_en ? p.q_en : p.q;
    const a = lang === 'en' && p.a_en ? p.a_en : p.a;
    const verdict = p[verdictKey] || '';
    html += `<div class="verify-item ${st.cls}">`;
    html += `<div class="verify-header"><span class="prophecy-id">#${p.id}</span> <span class="status-badge ${st.cls}"><i class="${st.icon}"></i> ${st[catKey]}</span>${p.year ? ` <span class="verify-year">${lang === 'zh' ? '预言时间点' : 'Predicted Year'}: ${p.year}</span>` : ''}</div>`;
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

  // Footer
  const footerSourceLabel = labels.footerSource || 'Source';
  const footerSourceUrl = config.footer.sourceUrl || '';

  // Noscript
  const noscriptContent = generateNoscript(siteData, lang);

  // Inline data scripts
  const dataScript = `const PROPHECIES = ${JSON.stringify(prophecies.prophecies)};\nconst CATEGORIES = ${JSON.stringify(prophecies.categories)};\nconst STATUS_MAP = ${JSON.stringify(prophecies.statusMap)};`;
  const i18nScript = `const I18N = ${JSON.stringify(i18n)};`;
  const siteConfigScript = `var SITE_CONFIG = ${JSON.stringify({ answererName: config.answererName, siteId: config.siteId, publishDate: config.publishDate || '' })};`;

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
    langToggleText: lang === 'zh' ? 'EN' : '中文',
    noscriptContent: noscriptContent,
    footerSourceLabel: footerSourceLabel,
    footerSourceUrl: footerSourceUrl,
    lang: lang,
    i18nScript: siteConfigScript + '\n' + i18nScript,
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

  // Copy app.js
  mkdirp(path.join(distDir, 'js'));
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, 'js/app.js'),
    path.join(distDir, 'js/app.js')
  );
  console.log(`  Copied: js/app.js`);

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
// Build index page listing all sites
// ---------------------------------------------------------------------------
function buildIndex() {
  console.log('\nBuilding index page...');
  const dbRoot = path.join(ROOT, 'db');
  const sites = [];

  for (const entry of fs.readdirSync(dbRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const cfgPath = path.join(dbRoot, entry.name, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;

    const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const i18n = JSON.parse(fs.readFileSync(path.join(dbRoot, entry.name, 'i18n.json'), 'utf8'));
    const prophecies = JSON.parse(fs.readFileSync(path.join(dbRoot, entry.name, 'prophecies.json'), 'utf8'));

    sites.push({
      id: config.siteId,
      answerer: config.answererName,
      publishDate: config.publishDate || '',
      primary: config.theme.primary,
      primaryDark: config.theme.primaryDark,
      primaryBg: config.theme.primaryBg,
      logoFile: config.logo.file,
      logoType: config.logo.type,
      logoAlt: config.logo.alt,
      count: prophecies.prophecies.length,
      zh: {
        title: i18n.zh.siteTitle,
        subtitle: i18n.zh.siteSubtitle,
        desc: config.meta.zh.description,
      },
      en: {
        title: i18n.en.siteTitle,
        subtitle: i18n.en.siteSubtitle,
        desc: config.meta.en.description,
      },
    });
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>预言档案馆 | Prophecy Archive</title>
<meta name="description" content="收录多位预言者的预言全集与验证分析。A collection of prophecy archives with verification analysis.">
<link rel="icon" type="image/png" href="kfk/img/favicon.png">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: "Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: #f5f5f0;
  color: #494949;
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
}
.header {
  text-align: center;
  padding: 48px 20px 32px;
}
.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}
.header p {
  color: #888;
  font-size: 15px;
}
.lang-switch {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 16px;
  border: 1px solid #ccc;
  border-radius: 14px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  background: #fff;
  transition: all .2s;
}
.lang-switch:hover { border-color: #999; color: #333; }
.grid {
  max-width: 880px;
  margin: 0 auto;
  padding: 0 20px 60px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .header { padding: 36px 20px 24px; }
  .header h1 { font-size: 22px; }
}
.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  transition: box-shadow .2s, transform .15s;
  display: flex;
  flex-direction: column;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  transform: translateY(-2px);
}
.card-accent {
  height: 4px;
}
.card-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-logo {
  height: 22px;
  margin-bottom: 12px;
  object-fit: contain;
  object-position: left;
  max-width: 160px;
}
.card-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}
.card-subtitle {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}
.card-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #aaa;
}
.card-stats span { margin-right: 12px; }
.card-enter {
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  padding: 4px 14px;
  border-radius: 14px;
  transition: all .2s;
}
.card-enter:hover { opacity: .85; }
.footer-note {
  text-align: center;
  padding: 20px;
  color: #bbb;
  font-size: 12px;
}
[data-lang="en"] { display: none; }
body.en [data-lang="zh"] { display: none; }
body.en [data-lang="en"] { display: initial; }
</style>
</head>
<body>
<div class="header">
  <h1>
    <span data-lang="zh">预言档案馆</span>
    <span data-lang="en">Prophecy Archive</span>
  </h1>
  <p>
    <span data-lang="zh">收录多位预言者的预言全集与验证分析</span>
    <span data-lang="en">A collection of prophecy archives with verification</span>
  </p>
  <div class="lang-switch" onclick="document.body.classList.toggle('en');this.textContent=document.body.classList.contains('en')?'中文':'EN'">EN</div>
</div>
<div class="grid">
${sites.map(s => `  <div class="card">
    <div class="card-accent" style="background:${s.primary}"></div>
    <div class="card-body">
      <img class="card-logo" src="${s.id}/img/${s.logoFile}" alt="${escapeHtml(s.logoAlt)}">
      <div class="card-title">
        <span data-lang="zh">${escapeHtml(s.zh.title)}</span>
        <span data-lang="en">${escapeHtml(s.en.title)}</span>
      </div>
      <div class="card-subtitle">
        <span data-lang="zh">${escapeHtml(s.zh.subtitle)}</span>
        <span data-lang="en">${escapeHtml(s.en.subtitle)}</span>
      </div>
      <div class="card-desc">
        <span data-lang="zh">${escapeHtml(s.zh.desc)}</span>
        <span data-lang="en">${escapeHtml(s.en.desc)}</span>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-stats">
        <span data-lang="zh">${s.count} 条预言</span>
        <span data-lang="en">${s.count} prophecies</span>
        <span>·</span>
        <span data-lang="zh">发布: ${s.publishDate}</span>
        <span data-lang="en">Pub: ${s.publishDate}</span>
      </div>
      <a class="card-enter" href="${s.id}/" style="color:${s.primary};border:1px solid ${s.primary}">
        <span data-lang="zh">进入 →</span>
        <span data-lang="en">Enter →</span>
      </a>
    </div>
  </div>`).join('\n')}
</div>
<div class="footer-note">
  <span data-lang="zh">预言档案馆 — 记录与验证</span>
  <span data-lang="en">Prophecy Archive — Record & Verify</span>
</div>
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
