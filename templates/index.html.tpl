<!DOCTYPE html>
<html lang="{{htmlLang}}">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{{title}}</title>
  <meta name="description" content="{{description}}">
  <meta name="keywords" content="{{keywords}}">
  <meta name="author" content="{{siteName}} Archive">
  <link rel="canonical" href="{{canonicalUrl}}">

  <!-- hreflang -->
{{hreflangTags}}

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{ogTitle}}">
  <meta property="og:description" content="{{ogDescription}}">
  <meta property="og:url" content="{{canonicalUrl}}">
  <meta property="og:site_name" content="{{siteName}}">
  <meta property="og:locale" content="{{locale}}">
{{ogLocaleAlternates}}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{{ogTitle}}">
  <meta name="twitter:description" content="{{twitterDescription}}">

  <link rel="icon" type="image/png" href="{{assetPrefix}}img/favicon.png">
  <link rel="apple-touch-icon" href="{{assetPrefix}}img/favicon.png">
  <link rel="stylesheet" href="{{assetPrefix}}css/style.css">

  <!-- Structured Data -->
{{structuredData}}
</head>

<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="nav-tabs">
        <button class="nav-tab active" data-tab="all" onclick="switchTab('all')"><span class="logo">{{logoHtml}}</span></button>
        <button class="nav-tab" data-tab="intro" onclick="switchTab('intro')">{{navHome}}</button>
      </div>
      <div class="header-right">
        <div class="header-tools" id="header-tools"></div>
        <button class="lang-toggle" onclick="switchLang()">{{langToggleText}}</button>
      </div>
    </div>
  </header>

  <main>
    <div id="page-home" class="page active">
      <div id="section-all"></div>
      <div id="section-intro" style="display:none">{{introContent}}</div>
    {{noscriptContent}}
    </div>
  </main>

  <footer>
    <p class="disclaimer">{{disclaimer}}</p>
  </footer>

  <button class="scroll-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Scroll to top">↑</button>

  <script>var defaultLang = '{{lang}}';</script>
  <script>
{{i18nScript}}
  </script>
  <script>
{{dataScript}}
  </script>
  <script src="{{assetPrefix}}js/app.js"></script>
</body>

</html>
