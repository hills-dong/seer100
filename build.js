#!/usr/bin/env node
// Site generator: reads db/{siteId}/ data and templates to produce a complete static site
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const DIST_DIR = path.join(ROOT, 'dist');

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
    html += `<div class="prophecy-header"><span class="prophecy-id">#${p.id}</span> <span class="prophecy-cat">${cat.icon} ${cat[catKey]}</span>${p.year ? ` <span class="prophecy-year-tag">${p.year}</span>` : ''}</div>`;
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
    html += `<div class="verify-header"><span class="prophecy-id">#${p.id}</span> <span class="status-badge ${st.cls}">${st.icon} ${st[catKey]}</span>${p.year ? ` <span class="verify-year">${lang === 'zh' ? '预言时间点' : 'Predicted Year'}: ${p.year}</span>` : ''}</div>`;
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
  const siteConfigScript = `var SITE_CONFIG = ${JSON.stringify({ answererName: config.answererName, siteId: config.siteId })};`;

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

  console.log(`Done: dist/${siteId}/`);
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
} else {
  buildSite(arg || 'kfk');
}

console.log('\nBuild complete!');
console.log('Run `node server.js` to preview at http://localhost:3000/kfk/');
console.log('Output in dist/');
