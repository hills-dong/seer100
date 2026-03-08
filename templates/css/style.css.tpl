:root {
  --bg: {{theme.bg}};
  --white: {{theme.white}};
  --text: {{theme.text}};
  --text2: {{theme.text2}};
  --text-light: {{theme.textLight}};
  --green: {{theme.primary}};
  --green-dark: {{theme.primaryDark}};
  --green-bg: {{theme.primaryBg}};
  --link: {{theme.link}};
  --border: {{theme.border}};
  --border2: {{theme.border2}};
  --orange: {{theme.orange}};
  --red: {{theme.red}};
  --blue: {{theme.blue}};
  --tag-bg: {{theme.tagBg}};
  --hover-bg: color-mix(in srgb, var(--bg) 60%, var(--green) 3%);
}

/* Icon system - SVG mask icons */
[class^="i-"] {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  background: currentColor;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}
.i-politics {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 13V7l2.5-3.5L8 7l2.5-3.5L13 7v6'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 13V7l2.5-3.5L8 7l2.5-3.5L13 7v6'/%3E%3C/svg%3E");
}
.i-war {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 12L12 4'/%3E%3Cpath d='M9.5 4H12v2.5'/%3E%3Cpath d='M12 12L4 4'/%3E%3Cpath d='M6.5 12H4V9.5'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 12L12 4'/%3E%3Cpath d='M9.5 4H12v2.5'/%3E%3Cpath d='M12 12L4 4'/%3E%3Cpath d='M6.5 12H4V9.5'/%3E%3C/svg%3E");
}
.i-tech {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 2v5L2.5 13h11L10 7V2'/%3E%3Cpath d='M5 2h6'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 2v5L2.5 13h11L10 7V2'/%3E%3Cpath d='M5 2h6'/%3E%3C/svg%3E");
}
.i-economy {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 13l4-5 3 2.5L14 4'/%3E%3Cpath d='M10 4h4v4'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 13l4-5 3 2.5L14 4'/%3E%3Cpath d='M10 4h4v4'/%3E%3C/svg%3E");
}
.i-society {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 14h14'/%3E%3Cpath d='M3 14V8'/%3E%3Cpath d='M8 14V5'/%3E%3Cpath d='M13 14V8'/%3E%3Cpath d='M5 7l3-4 3 4'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 14h14'/%3E%3Cpath d='M3 14V8'/%3E%3Cpath d='M8 14V5'/%3E%3Cpath d='M13 14V8'/%3E%3Cpath d='M5 7l3-4 3 4'/%3E%3C/svg%3E");
}
.i-climate {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M1 7c2-3 4-3 6 0s4 3 6 0'/%3E%3Cpath d='M1 11c2-3 4-3 6 0s4 3 6 0'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M1 7c2-3 4-3 6 0s4 3 6 0'/%3E%3Cpath d='M1 11c2-3 4-3 6 0s4 3 6 0'/%3E%3C/svg%3E");
}
.i-spirit {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linejoin='round'%3E%3Cpath d='M8 1.5L14.5 8 8 14.5 1.5 8z'/%3E%3Cpath d='M1.5 8h13'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linejoin='round'%3E%3Cpath d='M8 1.5L14.5 8 8 14.5 1.5 8z'/%3E%3Cpath d='M1.5 8h13'/%3E%3C/svg%3E");
}
.i-other {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='3.5' cy='8' r='1.5' fill='%23000'/%3E%3Ccircle cx='8' cy='8' r='1.5' fill='%23000'/%3E%3Ccircle cx='12.5' cy='8' r='1.5' fill='%23000'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='3.5' cy='8' r='1.5' fill='%23000'/%3E%3Ccircle cx='8' cy='8' r='1.5' fill='%23000'/%3E%3Ccircle cx='12.5' cy='8' r='1.5' fill='%23000'/%3E%3C/svg%3E");
}
.i-verified {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3.5L12.5 4.5'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3.5L12.5 4.5'/%3E%3C/svg%3E");
}
.i-partial {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='M3.5 8h9'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='M3.5 8h9'/%3E%3C/svg%3E");
}
.i-failed {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 4l8 8M12 4l-8 8'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 4l8 8M12 4l-8 8'/%3E%3C/svg%3E");
}
.i-pending {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='M8 4.5v4l2.5 1.5'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='M8 4.5v4l2.5 1.5'/%3E%3C/svg%3E");
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  font-kerning: normal;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Focus-visible for keyboard accessibility */
:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

a {
  color: var(--link);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Selection color */
::selection {
  background: color-mix(in srgb, var(--green) 25%, transparent);
}

/* Header - Douban style top bar */
.site-header {
  background: var(--white);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo {
  cursor: pointer;
  white-space: nowrap;
  min-width: 28px;
  flex-shrink: 1;
  overflow: hidden;
}

.logo-img {
  height: 20px;
  max-width: 100%;
  vertical-align: middle;
}

.nav-tabs {
  display: flex;
  gap: 0;
  flex-shrink: 1;
  min-width: 0;
}

.nav-tab {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text2);
  padding: 10px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: normal;
  transition: color 0.2s ease-out, border-color 0.2s ease-out;
  white-space: nowrap;
}

.nav-tab:hover {
  color: var(--green-dark);
}

.nav-tab.active {
  color: var(--green-dark);
  border-bottom-color: var(--green-dark);
}

nav {
  display: flex;
  gap: 0;
  height: 100%;
}

nav button {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text);
  padding: 0 15px;
  cursor: pointer;
  font-size: 0.875rem;
  height: 48px;
  line-height: 48px;
  transition: color 0.2s ease-out;
}

nav button:hover {
  color: var(--green);
}

nav button.active {
  color: var(--green);
  border-bottom-color: var(--green);
  font-weight: bold;
}

.lang-toggle {
  margin-left: auto;
  background: none;
  border: 1px solid var(--border2);
  color: var(--text-light);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: border-color 0.2s ease-out, color 0.2s ease-out;
}

.lang-toggle:hover {
  border-color: var(--green);
  color: var(--green);
}

/* Main content */
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 12px 48px;
}

.page {
  display: none;
}

.page.active {
  display: block;
}

/* Filter section */
.filter-section {
  background: var(--white);
  border: 1px solid var(--border);
  border-top: none;
  padding: 10px 20px;
}

.filter-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 0.75rem;
  color: var(--text2);
  white-space: nowrap;
  flex-shrink: 0;
}

.list-info {
  padding: 8px 20px;
  font-size: 0.75rem;
  color: var(--text2);
  background: var(--white);
  border: 1px solid var(--border);
  border-top: none;
}

.all-title {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--text);
}

/* Prophecy verdict inline */
.prophecy-verdict {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--tag-bg);
  border-radius: 4px;
  font-size: 0.8125rem;
  color: var(--text);
  line-height: 1.7;
}

.prophecy-verdict .verify-label {
  font-size: 0.75rem;
  color: var(--green-dark);
  font-weight: bold;
  margin-right: 6px;
}

/* Status colors on prophecy items */
.prophecy-item.verified {
  border-left: 3px solid var(--green);
}

.prophecy-item.partial {
  border-left: 3px solid var(--orange);
}

.prophecy-item.failed {
  border-left: 3px solid var(--red);
}

.prophecy-item.pending {
  border-left: 3px solid var(--blue);
}

/* ===== Home page - Douban group topic style ===== */
.topic-header {
  background: var(--white);
  border: 1px solid var(--border);
  padding: 20px 24px;
  margin-bottom: 0;
  border-bottom: none;
}

.topic-title {
  font-size: 1.375rem;
  color: var(--text);
  margin-bottom: 8px;
  font-weight: normal;
  letter-spacing: 0.01em;
}

.topic-meta {
  font-size: 0.75rem;
  color: var(--text2);
}

.topic-meta .author {
  color: var(--link);
}

.topic-meta .group {
  color: var(--link);
}

.topic-body {
  background: var(--white);
  border: 1px solid var(--border);
  padding: 24px;
}

.topic-body p {
  margin-bottom: 12px;
  line-height: 1.8;
  color: var(--text);
  font-size: 0.875rem;
}

.topic-body .quote-block {
  background: var(--tag-bg);
  border-left: 3px solid var(--green);
  padding: 12px 18px;
  margin: 20px 0;
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.8;
}

.topic-body .quote-block .quote-label {
  font-size: 0.75rem;
  color: var(--green);
  margin-bottom: 5px;
  font-weight: bold;
}

.timeline-list {
  margin: 16px 0;
  padding-left: 0;
  list-style: none;
}

.timeline-list li {
  padding: 10px 0 10px 20px;
  position: relative;
  border-bottom: 1px dashed var(--border);
  font-size: 0.875rem;
  line-height: 1.6;
}

.timeline-list li:last-child {
  border-bottom: none;
}

.timeline-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16px;
  width: 8px;
  height: 8px;
  background: var(--green);
  border-radius: 50%;
}

.timeline-list .tl-year {
  color: var(--green-dark);
  font-weight: bold;
}

/* Section header within topic */
.section-header {
  font-size: 0.9375rem;
  font-weight: bold;
  color: var(--text);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  margin: 24px 0 12px;
}

/* ===== All prophecies - Douban comment/reply style ===== */
.all-header {
  background: var(--white);
  border: 1px solid var(--border);
  padding: 15px 20px;
  margin-bottom: 0;
}

.all-header h2 {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text);
}

.all-header .count {
  font-size: 0.75rem;
  color: var(--text2);
  margin-top: 2px;
}

/* Toolbar */
.sticky-filter-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
}

.toolbar {
  background: var(--white);
  border: 1px solid var(--border);
  padding: 10px 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 180px;
  border: 1px solid var(--border2);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 1rem;
  color: var(--text);
  background: var(--white);
  outline: none;
  transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out;
}

.search-box:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 12%, transparent);
}

.search-box::placeholder {
  color: var(--text2);
}

.filter-bar {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--tag-bg);
  border: 1px solid var(--border);
  color: var(--text-light);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: color 0.15s ease-out, border-color 0.15s ease-out, background 0.15s ease-out;
  white-space: nowrap;
}

.filter-btn:hover {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-bg);
}

.filter-btn.active {
  color: var(--white);
  background: var(--green);
  border-color: var(--green);
}

/* Prophecy items - styled as Douban comments */
.prophecy-list {
  border: 1px solid var(--border);
  border-top: none;
}

.prophecy-item {
  background: var(--white);
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease-out;
}

.prophecy-item:last-child {
  border-bottom: none;
}

.prophecy-item:hover {
  background: var(--hover-bg);
}

.prophecy-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.prophecy-header-title {
  font-size: 0.8125rem;
  color: var(--text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prophecy-header-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
}

.prophecy-id {
  color: var(--text2);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.prophecy-cat {
  font-size: 0.6875rem;
  color: var(--text2);
  background: var(--tag-bg);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--border);
}

.prophecy-date {
  font-size: 0.6875rem;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}

.prophecy-year-tag {
  font-size: 0.6875rem;
  color: var(--green-dark);
  background: var(--green-bg);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid color-mix(in srgb, var(--green) 25%, var(--border));
  font-variant-numeric: tabular-nums;
}

.prophecy-q {
  color: var(--text-light);
  font-size: 0.8125rem;
  margin-bottom: 6px;
  padding-left: 2px;
}

.prophecy-a {
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.7;
  padding-left: 2px;
}

.prophecy-a .kfk-name {
  color: var(--green);
  font-weight: bold;
}

/* No results */
.no-results {
  text-align: center;
  color: var(--text2);
  padding: 48px 12px;
  font-size: 0.875rem;
  background: var(--white);
}

/* ===== Verify page ===== */
.stats-bar {
  background: var(--white);
  border: 1px solid var(--border);
  padding: 8px 20px;
  margin-bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-num.green {
  color: var(--green);
}

.stat-num.orange {
  color: var(--orange);
}

.stat-num.red {
  color: var(--red);
}

.stat-num.blue {
  color: var(--blue);
}

.stat-num.accent {
  color: var(--text);
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text2);
  margin-top: 4px;
}

.hit-rate-box {
  margin-left: auto;
  text-align: center;
  padding: 6px 20px;
  border-left: 1px solid var(--border);
}

.hit-rate-num {
  font-size: 2rem;
  font-weight: bold;
  color: var(--green);
  font-variant-numeric: tabular-nums;
}

.hit-rate-label {
  font-size: 0.6875rem;
  color: var(--text2);
}

.hit-rate-note {
  font-size: 0.6875rem;
  color: var(--text2);
  font-variant-numeric: tabular-nums;
}

.verify-filters {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

/* Verify items - styled as Douban review entries */
.verify-item {
  background: var(--white);
  border: 1px solid var(--border);
  margin-bottom: 10px;
}

.verify-item .verify-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: var(--hover-bg);
  border-bottom: 1px solid var(--border);
  font-size: 0.8125rem;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
}

.status-badge.verified {
  background: color-mix(in srgb, var(--green) 12%, var(--white));
  color: var(--green);
}

.status-badge.partial {
  background: color-mix(in srgb, var(--orange) 12%, var(--white));
  color: var(--orange);
}

.status-badge.failed {
  background: color-mix(in srgb, var(--red) 12%, var(--white));
  color: var(--red);
}

.status-badge.pending {
  background: color-mix(in srgb, var(--blue) 12%, var(--white));
  color: var(--blue);
}

.verify-year {
  font-size: 0.75rem;
  color: var(--green-dark);
  font-weight: bold;
}

.verify-body {
  padding: 12px 15px;
}

.verify-prophecy {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border);
}

.verify-label {
  font-size: 0.75rem;
  color: var(--text2);
  margin-bottom: 3px;
}

.verify-q {
  color: var(--text-light);
  font-size: 0.8125rem;
}

.verify-a {
  color: var(--text);
  font-size: 0.875rem;
}

.verify-verdict {
  color: var(--text);
  font-size: 0.8125rem;
  line-height: 1.7;
  background: var(--tag-bg);
  padding: 8px 12px;
  border-radius: 4px;
}

.verify-item.verified {
  border-left: 3px solid var(--green);
}

.verify-item.partial {
  border-left: 3px solid var(--orange);
}

.verify-item.failed {
  border-left: 3px solid var(--red);
}

.verify-item.pending {
  border-left: 3px solid var(--blue);
}

/* Footer - Douban style */
footer {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 12px;
  border-top: 1px solid var(--border);
  text-align: center;
  color: var(--text2);
  font-size: 0.75rem;
  line-height: 1.8;
}

footer a {
  color: var(--link);
}

/* Scroll to top */
.scroll-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  background: var(--white);
  color: var(--text-light);
  border: 1px solid var(--border2);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: color 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--text) 8%, transparent);
}

.scroll-top:hover {
  color: var(--green);
  border-color: var(--green);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--text) 12%, transparent);
}

.scroll-top.show {
  display: flex;
}

/* Responsive */
@media (max-width: 768px) {
  .header-inner {
    gap: 4px;
  }

  nav button {
    padding: 0 10px;
    font-size: 0.8125rem;
  }

  .topic-header,
  .topic-body {
    padding: 16px;
  }

  .stats-bar {
    gap: 8px;
    padding: 4px 12px;
  }

  .stat-num {
    font-size: 1.125rem;
  }

  .stat-label {
    font-size: 0.625rem;
  }

  .hit-rate-num {
    font-size: 1.125rem;
  }

  .hit-rate-label,
  .hit-rate-note {
    font-size: 0.625rem;
  }

  .hit-rate-box {
    padding: 5px 12px;
  }

  .filter-bar {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .filter-bar::-webkit-scrollbar {
    display: none;
  }

  .prophecy-header {
    flex-wrap: wrap;
  }

  .prophecy-header-title {
    flex-basis: 100%;
    white-space: normal;
    overflow: visible;
    order: -1;
  }

  .prophecy-header-tags {
    margin-left: auto;
  }
}

@media (max-width: 480px) {
  .logo {
    font-size: 0.9375rem;
  }

  .nav-tab {
    padding: 10px 6px;
    font-size: 0.75rem;
  }

  nav button {
    padding: 0 8px;
    font-size: 0.75rem;
  }

  .lang-toggle {
    padding: 3px 6px;
    font-size: 0.6875rem;
  }

  main {
    padding: 8px 6px 32px;
  }
}

/* Touch device optimizations */
@media (pointer: coarse) {
  .filter-btn {
    padding: 6px 10px;
    min-height: 32px;
  }

  .nav-tab {
    min-height: 44px;
  }

  .lang-toggle {
    min-height: 32px;
    padding: 4px 12px;
  }

  .scroll-top {
    width: 44px;
    height: 44px;
  }
}
