# 技能：创建新的预言网站

本技能用于在 dakar 项目中创建一个新的预言系列网站。项目使用静态站点生成器，数据驱动，支持中英双语。

---

## 一、项目架构概览

```
dakar/
├── build.js              # 站点生成器入口
├── server.js             # 本地预览服务器
├── gen-favicons.js       # Favicon 生成脚本（纯 Node.js，无外部依赖）
├── templates/            # 共用模板
│   ├── index.html.tpl    # HTML 模板（{{placeholder}} 语法）
│   ├── css/style.css.tpl # CSS 模板（使用 CSS 变量注入主题色）
│   └── js/app.js         # 运行时 JS（所有站共用）
├── db/sites.json          # 100个预言系列注册表（首页数据源）
├── db/shared.json        # 全局共用数据（分类、状态、通用文案）
├── db/{siteId}/          # 每个站点的数据目录
│   ├── config.json       # 站点配置（主题、SEO、logo）
│   ├── i18n.json         # 中英文界面文案（仅站点特有内容）
│   ├── prophecies.json   # 预言数据（仅预言条目）
│   └── img/              # logo.svg + favicon.png
└── docs/{siteId}/        # 构建输出（GitHub Pages 部署目录）
```

**构建流程**: `db/{siteId}/` 数据 + `templates/` → `build.js` → `docs/{siteId}/`

---

## 二、设计（5 项设计决策）

创建新站时，以下 5 项是唯一需要逐站设计的元素。布局、交互、筛选等由共用模板决定，无需逐站设计。

### 设计 1：色彩体系

写入 `config.json` → `theme` 对象。每个色值都注入为 CSS 变量，贯穿全站。

```json
"theme": {
  "bg": "#f6f6f1",          // 页面背景。暖中性色，#f0-f6 范围
  "white": "#fff",           // 卡片、弹层背景
  "text": "#494949",         // 主文字。与 bg 对比度 ≥ 7:1
  "text2": "#999",           // 次要文字（日期、说明）。与 bg 对比度 ≥ 4.5:1
  "textLight": "#666",       // 辅助文字（筛选标签）
  "primary": "#007722",      // 主色调。用于：Tab 激活态、时间线圆点、引用边框、已验证标签
  "primaryDark": "#005518",  // 深色调。用于：Tab 激活文字、hover 态
  "primaryBg": "#f0fff0",    // 主色浅底。用于：应验率徽章背景、高亮卡片
  "link": "#37a",            // 链接色
  "border": "#e5e5e5",       // 轻边框（卡片、分隔线）
  "border2": "#ccc",         // 重边框（输入框、按钮）
  "tagBg": "#f4f4ec"         // 标签背景（分类标签、年份标签）
}
```

**选色规则：**

| 约束 | 要求 |
|------|------|
| bg | 暖中性色，#f0-f6 范围，不能纯白 |
| text vs bg | 对比度 ≥ 7:1（WCAG AAA） |
| text2 vs bg | 对比度 ≥ 4.5:1（WCAG AA） |
| primary | 呼应预言者文化背景（如中国→靛蓝，欧洲→酒红，东欧→紫色） |
| primaryDark | primary 的加深版，色相不变，明度降低 |
| primaryBg | primary 的极浅底，用于大面积背景不刺眼 |

**现有站点色彩参考：**

| 站点 | primary | 文化关联 |
|------|---------|---------|
| kfk | #007722 绿 | 未来感、科幻 |
| vanga | #7b4a9e 紫 | 东欧神秘主义 |
| nostradamus | #8b1a1a 酒红 | 文艺复兴、炼金术 |
| tuibeitu | #1a3a5c 靛蓝 | 中国传统、水墨 |

### 设计 2：状态色

写入 `config.json` → `theme` 对象，与色彩体系同级。

```json
"orange": "#e09015",       // 部分相关 (partial)
"red": "#e04040",          // 未应验 (failed)
"blue": "#3377aa"          // 待验证 (pending)
```

- **已验证 (verified)** 复用 `primary`，无需单独定义
- 这三个颜色通常不需要逐站调整，除非与 `primary` 冲突（如 primary 本身是橙色）
- 状态色同样需要与 `bg` 保持足够对比度

### 设计 3：Logo 图标

放置于 `db/{siteId}/img/logo.svg`，左侧 0-28px 区域。

**设计要求：**

- 必须是能代表该预言者身份/文化的**独特符号**，优先选择此预言者已被广泛流传的符号
- 不能是通用图形（圆形、方形、书本等无辨识度的图案）
- 颜色使用 `primary` / `primaryDark`，可用 `bg` 色做留白/反色
- **不使用 `opacity` 属性**，需要半透明效果时将颜色与 `bg` 预合成为实色（避免 favicon 生成时因透明背景导致与 logo 显示不一致）
- 在 12×12px 物理尺寸下仍可辨识（favicon 和窄屏场景）

**SVG 结构约束：**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W 28" height="20">
  <!-- 图标：圆心 cx=14 cy=14，半径 ≤12，确保在 0-28 区域内 -->
  <!-- 文字：x=32 起 -->
</svg>
```

**现有图标参考：**

| 站点 | 图标 | 实现方式 |
|------|------|---------|
| tuibeitu | 太极阴阳 | circle + path + 小圆点 |
| vanga | 眼睛 | 三层同心圆 (fill/white/dark) |
| nostradamus | 五角星 | polygon + 内圆 |
| kfk | — | PNG 文字（无图标分离） |

### 设计 4：Logo 排版

Logo SVG 文字部分，从 x=32 开始。

**排版参数：**

| 参数 | 中文站名 | 英文站名 |
|------|---------|---------|
| font-family | `'Noto Serif SC', 'Source Han Serif CN', 'SimSun', Georgia, serif` | `Georgia, 'Times New Roman', serif` |
| font-size | 18 | 17-18（视字符数调整） |
| font-weight | bold | bold |
| letter-spacing | 2（中文字间距大） | 0.5-1（英文字间距小） |
| fill | primary 或 primaryDark | primary 或 primaryDark |

**viewBox 宽度规则：**

- **必须贴合实际文字渲染宽度**，不留右侧空白
- 计算公式：`图标区(~26) + 间距(6) + 文字渲染宽度`
- 文字渲染宽度难以精确计算（取决于系统字体），需**浏览器实测后微调**
- 宁可稍宽（文字后留 2-4px）也不要截字

**现有 viewBox 参考：**

| 站点 | 文字内容 | font-size | letter-spacing | viewBox 宽 |
|------|---------|-----------|---------------|-----------|
| tuibeitu | 推背图（3 字） | 18 | 2 | 92 |
| vanga | BABA VANGA（10 字符） | 18 | 1 | 172 |
| nostradamus | NOSTRADAMUS（11 字符） | 17 | 0.5 | 192 |
| kfk | — | — | — | PNG ~120 |

### 设计 5：Favicon

180×180 RGBA PNG，由 `gen-favicons.js` **自动从 logo.svg 生成**。

**工作原理：**

- 脚本自动解析 `db/{siteId}/img/logo.svg` 中的图形元素（circle、polygon、path）
- 将图标区域（0-28px）放大渲染为 180×180 PNG，带抗锯齿
- 支持的 SVG 元素：`<circle>`（fill + stroke）、`<polygon>`、`<path>`（M/A/L/Z 命令）
- `<text>` 元素自动忽略（只渲染图标，不渲染文字）
- 对没有 SVG 的站点（如 KFK 用 PNG logo），在 `customBuilders` 中注册自定义函数

**使用方法：**

```bash
node gen-favicons.js    # 自动发现所有站点并生成
```

- 新站只需创建好 `logo.svg`（图标在 0-28px 区域），运行脚本即可
- 无需手写像素绘制代码

**设计约束（仍需人工确保）：**

- Logo 图标符号需独特可辨，不能是通用图形
- 在 16×16 标签页尺寸下仍可辨识

---

## 三、数据

### 首页数据源：`db/sites.json`

100 个预言系列的注册表，首页的数据源。每条包含手动维护的静态字段和构建时自动回写的动态字段。

**静态字段（手动维护）：**

| 字段 | 说明 |
|------|------|
| name | 预言者名称（中英双语） |
| siteId | 站点 ID，与 `db/{siteId}/` 目录名一致 |
| status | `done` 或 `pending` |
| url | 站点 URL（pending 为 null） |
| category | 分类 key（对应 CATEGORY_LABELS） |
| country | ISO 国家代码 |
| startYear | 起始年份（字符串，支持负数表示公元前） |
| name_zh | 中文显示名（done 站点从 title_zh 去"预言"后缀生成，pending 站点从 name 按中英分割生成） |
| name_en | 英文显示名（done 站点从 title_en 去"Prophecies"后缀生成，pending 站点从 name 按中英分割生成） |

**动态字段（`buildIndex()` 自动回写，仅 done 站点）：**

| 字段 | 说明 |
|------|------|
| count | 预言总条数 |
| logo | logo 文件名（如 `logo.svg`） |
| title_zh | 中文站点标题 |
| title_en | 英文站点标题 |
| primary | 主题色（来自 config.json） |
| hitRate | 应验率百分比整数，计算公式：`round((verified + partial×0.5) / judged × 100)`，无已判定预言时为 null |

### 全局共用：`db/shared.json`

所有站点共用的数据，构建时自动加载，无需逐站配置：

- **categories** — 8 个主题分类（politics/war/tech/economy/society/climate/spirit/other），每项含 zh/en 名称和 CSS icon 类名。站点 `prophecies.json` 可定义同名 key 覆盖。
- **statusMap** — 4 种验证状态（verified/partial/failed/pending），含中英文标签、CSS 类名和 icon。
- **i18n** — 通用界面文案（搜索、筛选、应验率、结果计数等），所有站点相同。

**⚠️ 通常无需修改此文件。** 新站只需关注下面 3 个站点专属文件。

### 数据 1：`db/{siteId}/config.json`

```json
{
  "siteId": "example",
  "answererName": "预言者名字",
  "publishDate": "1555",
  "baseUrl": "https://pre.hilife.me/example",
  "defaultLang": "zh",
  "languages": ["zh", "en"],
  "meta": {
    "zh": {
      "htmlLang": "zh-CN",
      "title": "...",
      "description": "...",
      "keywords": "...",
      "siteName": "...",
      "ogTitle": "...",
      "ogDescription": "...",
      "locale": "zh_CN",
      "twitterDescription": "..."
    },
    "en": { /* 同结构英文版 */ }
  },
  "structuredData": [
    { "@context": "https://schema.org", "@type": "WebSite", "..." : "..." },
    { "@context": "https://schema.org", "@type": "FAQPage", "..." : "..." }
  ],
  "theme": { /* 见设计 1 + 设计 2 */ },
  "logo": {
    "type": "image",
    "file": "logo.svg",
    "alt": "站点名称"
  }
}
```

**⚠️ `publishDate` 必须有**，缺失则首页和卡片不显示发布时间。

### 数据 2：`db/{siteId}/i18n.json`

```json
{
  "zh": {
    "siteTitle": "...",
    "siteSubtitle": "...",
    "navHome": "预言介绍",
    "navAll": "预言全集",
    "homeTitle": "XXX 是谁？",
    "homeIntro1": "第一段介绍",
    "homeIntro2": "第二段介绍",
    "homeIntro3": "第三段介绍",
    "coreMessage": "核心信息",
    "coreQuote": "「核心引言」",
    "keyPoints": "关键时间节点",
    "keyPointsList": [
      "标签 —— 描述",
      "标签 —— 描述"
    ],
    "sourceTitle": "数据来源",
    "sourceList": [
      "预言原文来源说明（<a href=\"...\">链接</a>）",
      "验证评价基于公开新闻报道和统计数据",
      "编者观点不代表学术定论"
    ]
  },
  "en": { /* 对应英文版，所有 key 相同 */ }
}
```

**时间线 `keyPointsList` 规则：**

- 数组格式，数量不限（通常 3-7 个）
- 每项格式：`"标签 —— 描述"`（中文破折号 `——`）
- 渲染时按 `——` 分割，左边粗体标签，右边描述
- 标签可以是任意文本（年份、象数、章节号），不要求是年份

### 数据 3：`db/{siteId}/prophecies.json`

分类和验证状态均在 `db/shared.json` 中定义，此文件**只含预言条目**。如需覆盖某个分类，可在此文件中添加 `categories` 对象（同名 key 会覆盖 shared 中的定义）。

```json
{
  "prophecies": [
    {
      "id": 1,
      "cat": "catKey",
      "q": "中文问题/谶语",
      "q_en": "English question",
      "a": "中文回答/解读",
      "a_en": "English answer",
      "year": 2025,
      "date": "2019-06-22",
      "status": "verified",
      "verdict_zh": "验证说明...",
      "verdict_en": "Verification note..."
    }
  ]
}
```

**字段说明：**

| 字段 | 必需 | 说明 |
|------|------|------|
| id | ✅ | 唯一递增整数，连续不跳号 |
| cat | ✅ | 对应 `shared.json` 中 categories 的 key |
| a | ✅ | 预言内容（核心字段） |
| a_en | ✅ | 预言内容英文翻译 |
| q | ❌ | 问题/白话文翻译/标题/归纳（见内容规范） |
| q_en | ❌ | q 的英文翻译（有 q 时必须提供） |
| year | ❌ | 预言指向的目标年份（"预言说哪年会发生"） |
| date | ❌ | 该条发布时间，覆盖 config.publishDate |
| status | ❌ | verified / partial / failed / pending |
| verdict_zh / verdict_en | ❌ | 验证说明（有 status 时必须提供） |

**条目排序：**

- 问答形式（如 KFK）：按发布时间（`date`）从早到晚排序；发布时间相同的，按原始资料中的出场顺序排序；无发布时间的排在最后
- 诗集/章节形式（如 Nostradamus、推背图）：按章节自然顺序排序（如百诗集 I-1 → I-2 → ...，推背图第1象 → 第2象 → ...）
- `id` 字段的编号顺序必须与排序后的实际顺序一致

### 内容规范

**分类：**

- 使用 `shared.json` 中的全局分类，按预言的**内容主题**分类

**q/a 内容分工：**

- `a` — 预言本身的内容，是每条预言的核心字段
- `q` — 可选，根据预言形式灵活使用：
  - 问答形式：放提问者的问题（如 KFK）
  - 文言文：放白话文翻译（原文放 `a`）
  - 诗集/章节：放诗集标题或章节编号（如「百诗集I-35」）
  - 其他：放对预言内容的简要归纳
  - 如预言非问答形式，可只有 `a` 没有 `q`
- 编者的历史背景、事件解说放在 `verdict_zh`/`verdict_en` 中，不混入 `a`
- q/a 中**不包含**发布时间和预言目标时间信息，这些用 `date` 和 `year` 字段表示

**文言文处理：**

- 文言文预言必须同时附带白话文翻译
- 古典预言允许 q/a 按原文结构拆分（如推背图的谶/颂），不强制 q 放白话文翻译
- `a` 字段末尾应追加白话文翻译（用换行分隔），`a_en` 同步追加对应英文翻译

**时间字段：**

- `year` 表示预言指向的目标年份，不是发布年份。如无法确定具体年份，写 `"未确定"`；确定的年份必须有据可查
- `date` 和 config.`publishDate` 优先使用具体日期（如 `"2019-06-22"`）；如只能确定时间范围则写范围（如 `"1555-1558"`），不要只写起始日期；完全无法确定时使用模糊描述（如 `"约公元650年"`）
- q/a 文本中不重复写时间信息

**验证状态：**

- `year <= 当前年` 的预言必须给出 `status` 和 `verdict`
- i18n `keyPointsList` 中的时间节点**不需要**标注验证状态
- 有 `status` 必有 `verdict_zh`/`verdict_en` 字段，无 `status` 则不需 verdict
- `pending`（待验证）状态的 `verdict_zh`/`verdict_en` **必须为空字符串**——预言尚未到验证时间，不写任何内容

### 内容可信度

**数据来源：**

- 优先使用正规来源：出版物原文、学术文献、有时间戳的互联网存档
- 互联网内容优先使用 Archive.org/Wayback Machine 快照链接
- 来源信息在介绍页的"数据来源"板块（`i18n.json` 的 `sourceTitle`/`sourceList`）集中说明，不在每条预言中重复
- `sourceList` 中的来源链接支持 HTML `<a>` 标签，必须是可打开的有效链接

**verdict 撰写标准：**

- 必须包含具体事实依据（时间、事件、数据），不能只写"已应验"
- `partial` 状态须说明哪部分符合、哪部分不符
- 有争议的验证须承认争议，不做一边倒的判定
- 引用可查证的公开信息（新闻报道、统计数据、历史记录）

**分类规范：**

- 使用 `shared.json` 中的全局分类
- 每条预言只归入一个最相关的分类
- 分类依据是预言的核心主题，而非次要提及的领域
- 不确定时优先归入更具体的分类，避免滥用 "other"

**链接有效性：**

- `sourceList` 中的来源链接必须是可访问的有效 URL
- 优先使用稳定的链接（出版物页面、维基百科、学术数据库），避免可能失效的短链接或论坛帖子

---

## 四、构建与验证

```bash
node gen-favicons.js       # 从 logo.svg 自动生成 favicon（新站必做）
node build.js --all        # 构建所有站点
node build.js {siteId}     # 构建单个站点
node server.js             # 本地预览 http://localhost:3000/{siteId}/
```

---

## 五、检查清单

**设计：**

- [ ] theme 色彩对比度：text vs bg ≥ 7:1，text2 vs bg ≥ 4.5:1
- [ ] primary 呼应预言者文化背景，与现有站不重复
- [ ] Logo 图标在 0-28px 区域，符号独特可辨
- [ ] Logo viewBox 紧凑无右侧空白（浏览器实测）
- [ ] `node gen-favicons.js` 生成的 favicon 图案正确且独特

**数据：**

- [ ] `config.json` 包含 `publishDate`，时间尽量具体
- [ ] `i18n.json` 的 `keyPointsList` 每项使用 `——` 分隔，不标注验证状态
- [ ] 每条预言有 `a_en`（及 `q_en`，若有 `q`）英文翻译
- [ ] 文言文预言：`a` 放原文，`q` 放白话文翻译
- [ ] q/a 中不包含时间信息（用 `year`/`date` 字段表示）
- [ ] q/a 中不混入编者解说（放 `verdict` 中）
- [ ] 所有 `year <= 当前年` 的预言有 `status` 和 `verdict`
- [ ] `sourceList` 中的来源链接可正常打开
- [ ] verdict 包含具体事实依据，`partial` 说明符合/不符部分

**构建与预览：**

- [ ] `node build.js {siteId}` 无报错
- [ ] 首页介绍和时间线显示正确
- [ ] 窄屏（375px）logo 不被完全遮挡
- [ ] 预言卡片日期有"发布"/"预言"标签
- [ ] 浏览器标签页 favicon 可辨识

---

## 六、现有站点参考

| siteId | 预言者 | 主题色 | Logo 图标 | Favicon 图案 | 预言数 |
|--------|--------|--------|----------|-------------|--------|
| kfk | KFK | 绿 #007722 | PNG 文字 | (原始) | 281 |
| vanga | Baba Vanga | 紫 #7b4a9e | 眼睛圆圈 | 紫色眼睛 | ~40 |
| nostradamus | Nostradamus | 酒红 #8b1a1a | 五角星 | 酒红五角星 | ~40 |
| tuibeitu | 李淳风&袁天罡 | 靛蓝 #1a3a5c | 太极图 | 太极阴阳 | 60 |

---

## 七、Git 工作流

- 分支: 从 main 创建 feature 分支
- 构建输出在 `docs/` 目录，需要一起提交
- GitHub Pages 从 main 分支的 `/docs` 目录部署
- CNAME 文件在 `docs/CNAME`，内容为 `pre.hilife.me`
- PR 合并时用 `--delete-branch=false`（避免 worktree 冲突）

---

## Design Context

### Users
Chinese-speaking readers curious about prophecy and paranormal content, browsing on both mobile and desktop. They explore prophecy archives, read original texts, and check verification results. Secondary audience: English-speaking visitors via bilingual support.

### Brand Personality
Scholarly, archival, quietly mysterious. The site treats fringe content with the seriousness of a reference library rather than sensationalizing it.

### Aesthetic Direction
- **Primary influence**: Douban (豆瓣) — minimalist, text-focused, community-archive feel
- **Tone**: Academic neutrality meets curated curiosity cabinet
- **Anti-references**: Flashy conspiracy sites, new-age spiritual blogs, generic SaaS dashboards, AI-generated card grids with gradient text
- **Theme**: Light mode only. Warm neutral backgrounds (#f0-f6 range), per-site accent colors that evoke each prophet's cultural context
- **Typography**: System font stack; no decorative fonts. Chinese text is primary.

### Design Principles
1. **Content is the interface** — Text hierarchy does the heavy lifting; decoration is minimal
2. **Distinctive per site, cohesive overall** — Each prophet site has its own color palette and cultural personality, but shares the same layout and interaction patterns
3. **WCAG AA minimum** — All text must meet 4.5:1 contrast ratio. text2 values per site must be verified against that site's bg color
4. **No AI slop** — Avoid gradient text, glassmorphism, hero metric dashboards, bounce easing, generic card grids, and every other AI aesthetic tell from 2024-2025
5. **Mobile-first data density** — Filters, search, and scanning should work well on narrow screens. Hide secondary info (hit rate badge) rather than breaking layout
