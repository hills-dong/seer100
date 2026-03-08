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
├── db/{siteId}/          # 每个站点的数据目录
│   ├── config.json       # 站点配置（主题、SEO、logo）
│   ├── i18n.json         # 中英文界面文案
│   ├── prophecies.json   # 预言数据
│   └── img/              # logo.svg + favicon.png
└── docs/{siteId}/        # 构建输出（GitHub Pages 部署目录）
```

**构建流程**: `db/{siteId}/` 数据 + `templates/` → `build.js` → `docs/{siteId}/`

---

## 二、创建新站点的步骤

### 步骤 1：创建 `db/{siteId}/config.json`

必需字段：

```json
{
  "siteId": "example",
  "answererName": "预言者名字",
  "publishDate": "1555",        // ⚠️ 必须有，显示在首页和卡片上
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
    { "@context": "https://schema.org", "@type": "WebSite", ... },
    { "@context": "https://schema.org", "@type": "FAQPage", ... }
  ],
  "theme": {
    "bg": "#f6f6f1",         // 页面背景色
    "white": "#fff",
    "text": "#494949",       // 主文字色
    "text2": "#999",         // 次要文字色
    "textLight": "#666",
    "primary": "#007722",    // 主色调（时间线圆点、引用边框、Tab激活等）
    "primaryDark": "#005518",// 深色调
    "primaryBg": "#f0fff0",  // 主色背景
    "link": "#37a",
    "border": "#e5e5e5",
    "border2": "#ccc",
    "orange": "#e09015",     // 部分应验
    "red": "#e04040",        // 未应验
    "blue": "#3377aa",       // 待验证
    "tagBg": "#f4f4ec"       // 标签背景
  },
  "logo": {
    "type": "image",
    "file": "logo.svg",      // 放在 db/{siteId}/img/ 下
    "alt": "站点名称"
  },
  "footer": {
    "sourceUrl": "https://...",
    "sourceLabel": "来源名称"
  }
}
```

### 步骤 2：创建 `db/{siteId}/i18n.json`

**关键规则：**

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
    "kp2019": "标签 —— 描述",
    "kp2035": "标签 —— 描述",
    "kp2038": "标签 —— 描述",
    "kp2048": "标签 —— 描述",
    "kp2060": "标签 —— 描述",
    "allTitle": "预言全集",
    "allSubtitle": "共 {count} 条问答",
    "searchPlaceholder": "搜索预言内容...",
    "filterAll": "全部",
    "verifyTitle": "预言验证",
    "verifySubtitle": "...",
    "statsTotal": "收录总数",
    "statsVerified": "已应验",
    "statsPartial": "部分相关",
    "statsFailed": "未应验",
    "statsPending": "待验证",
    "hitRate": "综合命中率",
    "realityLabel": "现实验证：",
    "prophecyLabel": "预言原文：",
    "yearLabel": "年份",
    "footerNote": "免责声明...",
    "footerSource": "来源"
  },
  "en": { /* 对应英文版，所有 key 相同 */ }
}
```

**⚠️ 时间线关键点（kp2019-kp2060）格式规则：**

- 格式必须是 `"标签 —— 描述"`（使用中文破折号 `——`）
- `tlItem()` 函数自动按 `——` 分割，左边渲染为粗体标签，右边渲染为描述
- 标签可以是任意文本（年份、象数、章节号），**不要求是年份**
- 示例：`"第3象 —— 武则天称帝"`, `"2025年 —— 铁鸟无人驾驶"`, `"百诗集I:46 —— 三月围城"`
- **⚠️ 错误示范**：在未来预测时间线中标注"已应验"等验证状态

### 步骤 3：创建 `db/{siteId}/prophecies.json`

```json
{
  "categories": {
    "catKey": {
      "zh": "分类中文名",
      "en": "Category English Name",
      "icon": "🔬"
    }
  },
  "statusMap": {
    "verified": { "zh": "已应验", "en": "Verified", "cls": "verified", "icon": "✅" },
    "partial":  { "zh": "部分相关", "en": "Partial", "cls": "partial", "icon": "🔶" },
    "failed":   { "zh": "未应验", "en": "Failed", "cls": "failed", "icon": "❌" },
    "pending":  { "zh": "待验证", "en": "Pending", "cls": "pending", "icon": "🔵" }
  },
  "prophecies": [
    {
      "id": 1,
      "cat": "catKey",
      "q": "中文问题/谶语",
      "q_en": "English question",
      "a": "中文回答/解读",
      "a_en": "English answer",
      "year": 2025,
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
| id | ✅ | 唯一递增整数 |
| cat | ✅ | 对应 categories 中的 key |
| q / a | ✅ | 中文问答 |
| q_en / a_en | ❌ | 英文翻译（无则回退中文） |
| year | ❌ | 预言指向的年份（显示为"预言:2025"标签） |
| date | ❌ | 该条单独发布时间（覆盖 config.publishDate） |
| status | ❌ | verified / partial / failed / pending |
| verdict_zh / verdict_en | ❌ | 验证说明（有 status 时应提供） |

**⚠️ 分类设计注意事项：**
- 分类应反映预言的**内容主题**（如科技、政治、经济、气候等）
- **不要**用验证状态作为分类（如"已验证历史"），状态筛选已有独立功能
- 建议 5-8 个分类，每个分类至少 3 条预言

### 步骤 4：创建 Logo（SVG）

放置于 `db/{siteId}/img/logo.svg`。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W 28" height="20">
  <!-- 图标部分：x=0~28 -->
  <!-- 文字部分：x=32 起 -->
</svg>
```

**⚠️ Logo 设计规则：**

1. **viewBox 宽度要紧凑**：只包含实际内容，不留多余空白
2. **图标在左侧 0-28px 区域**：窄屏时文字可能被裁剪，图标必须在最左侧
3. **height="20" 固定**：与 CSS `.logo-img { height: 20px }` 配合
4. **颜色与 theme.primary / theme.primaryDark 一致**
5. 参考 viewBox 宽度：KFK ≈ 120, 推背图 = 120, Vanga = 160, Nostradamus = 195

### 步骤 5：生成 Favicon

在 `gen-favicons.js` 中添加新站点的 builder 函数：

1. 创建 `build{Name}Data()` 函数，生成 180×180 RGBA 像素数据
2. 图案应与 logo 的图标部分**保持一致**（不是简单换色的圆形）
3. 使用 `hexToRGB()` 从 theme 颜色创建调色板
4. 在 `sites` 数组中添加条目：`{ name: 'xxx', builder: buildXxxData, out: 'db/xxx/img/favicon.png' }`
5. 运行 `node gen-favicons.js` 生成 PNG

**⚠️ 常见错误：所有站 favicon 只是颜色不同的同一图案 → 用户在浏览器标签页分不清**

### 步骤 6：构建与验证

```bash
# 构建所有站点
node build.js --all

# 或构建单个站点
node build.js {siteId}

# 本地预览
node server.js
# 访问 http://localhost:3000/{siteId}/
```

---

## 三、已知陷阱与解决方案

### 陷阱 1：时间线标签不等于 key 名
**问题**：i18n key 名为 `kp2019`/`kp2035` 等，但这些只是标识符。`tlItem()` 函数从 `——` 左侧解析实际标签内容。
**规则**：key 名固定不变，实际显示由 i18n 字符串中 `——` 左侧决定。

### 陷阱 2：publishDate 缺失
**问题**：缺少 `publishDate` 则首页和卡片不显示发布时间。
**规则**：config.json 必须包含 `publishDate`。

### 陷阱 3：Logo 在窄屏被裁剪
**当前方案**：
- `.logo`: `flex-shrink: 1; overflow: hidden; min-width: 28px`（保证图标可见）
- `.nav-tabs`: `flex-shrink: 1; min-width: 0`（允许 tab 也收缩）
- 480px 断点：nav-tab padding 缩至 6px，字号 12px
**规则**：logo SVG viewBox 越窄越好。

### 陷阱 4：预言状态过期未更新
**问题**：目标年份已过但 status 仍为 "pending"。
**规则**：每年初审查 `year <= 当前年 && status === "pending"` 的预言，更新状态并添加 verdict。

### 陷阱 5：验证状态不应作为分类
**规则**：category 只表示主题领域。状态筛选是独立功能。

### 陷阱 6：两个日期字段容易混淆
**解决**：已加前缀标签 `发布/Pub:` 和 `预言/Pred:`，新站自动生效。

### 陷阱 7：Favicon 尺寸太小
**规则**：统一 180×180 PNG，`index.html.tpl` 已包含 `apple-touch-icon` 标签。

---

## 四、快速检查清单

创建新站点后，逐项检查：

- [ ] `config.json` 包含 `publishDate` 字段
- [ ] `i18n.json` 的 kp 键使用 `——` 分隔符，标签部分合理
- [ ] `prophecies.json` 分类是主题分类，不是状态分类
- [ ] 所有 `year <= 当前年` 的预言有 status 和 verdict
- [ ] Logo SVG viewBox 紧凑，图标在左侧 0-28px
- [ ] Favicon 180×180，图案与 logo 图标一致且独特
- [ ] `node build.js {siteId}` 无报错
- [ ] 本地预览：首页时间线显示正确
- [ ] 本地预览：窄屏（375px）logo 不被完全遮挡
- [ ] 本地预览：预言卡片日期有"发布"/"预言"标签
- [ ] 本地预览：浏览器标签页 favicon 可辨识
- [ ] `gen-favicons.js` 中已注册新站点

---

## 五、现有站点参考

| siteId | 预言者 | 主题色 | Logo图标 | Favicon图案 | 预言数 |
|--------|--------|--------|----------|-------------|--------|
| kfk | KFK | 绿 #007722 | PNG文字 | (原始) | 281 |
| vanga | Baba Vanga | 紫 #7b4a9e | 眼睛圆圈 | 紫色眼睛 | ~40 |
| nostradamus | Nostradamus | 酒红 #8b1a1a | 五角星 | 酒红五角星 | ~40 |
| tuibeitu | 李淳风&袁天罡 | 靛蓝 #1a3a5c | 太极图 | 太极阴阳 | 60 |

---

## 六、Git 工作流

- 分支: 从 main 创建 feature 分支
- 构建输出在 `docs/` 目录，需要一起提交
- GitHub Pages 从 main 分支的 `/docs` 目录部署
- CNAME 文件在 `docs/CNAME`，内容为 `pre.hilife.me`
- PR 合并时用 `--delete-branch=false`（避免 worktree 冲突）
