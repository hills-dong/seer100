#!/usr/bin/env node
// Build script: pre-renders prophecy data into static HTML for SEO crawlers
const fs = require('fs');
const path = require('path');

// Load data.js by evaluating it
const dataJs = fs.readFileSync(path.join(__dirname, 'js/data.js'), 'utf8');
const module_ = { exports: {} };
const fn = new Function('module', 'exports', dataJs + '\nmodule.exports = { PROPHECIES, CATEGORIES, STATUS_MAP };');
fn(module_, module_.exports);
const { PROPHECIES, CATEGORIES, STATUS_MAP } = module_.exports;

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateAllProphecies(lang) {
  const catKey = lang === 'zh' ? 'zh' : 'en';
  const sorted = [...PROPHECIES].sort((a, b) => a.id - b.id);

  let html = '';
  sorted.forEach(p => {
    const cat = CATEGORIES[p.cat];
    const q = lang === 'en' && p.q_en ? p.q_en : p.q;
    const a = lang === 'en' && p.a_en ? p.a_en : p.a;
    html += `<div class="prophecy-item">`;
    html += `<div class="prophecy-header"><span class="prophecy-id">#${p.id}</span> <span class="prophecy-cat">${cat.icon} ${cat[catKey]}</span>${p.year ? ` <span class="prophecy-year-tag">${p.year}</span>` : ''}</div>`;
    html += `<div class="prophecy-q">${escapeHtml(q)}</div>`;
    html += `<div class="prophecy-a"><span class="kfk-name">KFK: </span>${escapeHtml(a)}</div>`;
    html += `</div>\n`;
  });
  return html;
}

function generateVerifyList(lang) {
  const catKey = lang === 'zh' ? 'zh' : 'en';
  const verdictKey = lang === 'zh' ? 'verdict_zh' : 'verdict_en';
  const verifiable = PROPHECIES.filter(p => p.status);
  const sorted = [...verifiable].sort((a, b) => (a.year || 9999) - (b.year || 9999));

  let html = '';
  sorted.forEach(p => {
    const st = STATUS_MAP[p.status];
    const q = lang === 'en' && p.q_en ? p.q_en : p.q;
    const a = lang === 'en' && p.a_en ? p.a_en : p.a;
    const verdict = p[verdictKey] || '';
    html += `<div class="verify-item ${st.cls}">`;
    html += `<div class="verify-header"><span class="prophecy-id">#${p.id}</span> <span class="status-badge ${st.cls}">${st.icon} ${st[catKey]}</span>${p.year ? ` <span class="verify-year">${lang === 'zh' ? '预言时间点' : 'Predicted Year'}: ${p.year}</span>` : ''}</div>`;
    html += `<div class="verify-body">`;
    html += `<div class="verify-prophecy"><div class="verify-q">${escapeHtml(q)}</div>`;
    html += `<div class="verify-a"><strong>KFK:</strong> ${escapeHtml(a)}</div></div>`;
    if (verdict) {
      html += `<div><div class="verify-verdict">${escapeHtml(verdict)}</div></div>`;
    }
    html += `</div></div>\n`;
  });
  return html;
}

function injectIntoHtml(htmlPath, lang) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  const allTitle = lang === 'zh' ? '预言全集' : 'All Prophecies';
  const allCount = lang === 'zh' ? `共 ${PROPHECIES.length} 条问答` : `${PROPHECIES.length} Q&A entries in total`;
  const verifyTitle = lang === 'zh' ? '预言验证' : 'Prophecy Verification';
  const verifySubtitle = lang === 'zh' ? '对已到期的预言时间点进行真实度评估' : 'Evaluating predictions against reality for expired time points';

  // Generate combined noscript content for page-home
  const noscriptHtml = `<noscript><h1>KFK 2060 ${allTitle}</h1><p>${allCount}</p>\n` +
    generateAllProphecies(lang) +
    `<h2>${verifyTitle}</h2><p>${verifySubtitle}</p>\n` +
    generateVerifyList(lang) +
    `</noscript>`;

  // Inject noscript content after last section div, replacing any existing noscript
  html = html.replace(
    /(\s*<div id="section-intro"[^>]*><\/div>)\s*(?:<noscript>[\s\S]*?<\/noscript>\s*)?/,
    `$1\n    ${noscriptHtml}\n`
  );

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Built: ${htmlPath}`);
}

// Build both pages
injectIntoHtml(path.join(__dirname, 'index.html'), 'zh');
injectIntoHtml(path.join(__dirname, 'en/index.html'), 'en');

console.log('Done. All prophecies pre-rendered into static HTML.');
