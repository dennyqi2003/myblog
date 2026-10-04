# DennyQi's Blog

[English](README.md) · 中文

一个由 `notes/` 文件夹生成的静态博客。Vue 3 + Vite，构建时预渲染成纯 HTML：不需要服务器端程序，不需要数据库。发布一篇笔记 = 放一个 markdown 文件，再跑一条命令。

这里没有 Hexo，也没有主题配置：布局、排版和配色都直接写在 `src/` 里。

## 写笔记：开头的标签

在 `notes/` 下任意位置放一个 `.md` 文件，放在顶层还是子文件夹都一样。文件开头是几行标签，空一行，然后是正文：

```
[^Date]: 2025.12.16
[^Title]: 01 Representing and Manipulating Information
[^Tag]: Informatics, Computer Systems, Computer Architecture

正文从这里开始……
```

### 必填（三行）

| 标签 | 写法 | 作用 |
|---|---|---|
| `[^Date]` | `2025.12.16`，分隔符也可以用 `-` 或 `/` | 发布日期，显示为「Posted …」，首页按它从新到旧排序 |
| `[^Title]` | 任意文字 | 标题，全站显示 |
| `[^Tag]` | 逗号分隔，**顺序有意义** | `A, B, C` 表示这篇归在分类 `A/B/C` 下。`tmp`、`old`、`old1`、`old2`、`Category`、`other` 被当作工作标记，不会出现在分类树里 |

少了任何一行必填标签，这篇笔记会被跳过，构建时给出提示，但不会导致构建失败。

### 可选（一般写在必填三行后面）

```
[^Modified]: 2026.10.04
[^Summary]: 一句话摘要，**markdown** 和 $\LaTeX$ 都能用
[^Visible]: 0
[^Order]: 3
```

| 标签 | 写法 | 作用 | 不写时 |
|---|---|---|---|
| `[^Modified]` | 日期，格式同 `[^Date]` | 上次修改时间，在首页卡片和文章页显示为「Posted … · Modified …」 | 自动取这个文件在 git 里**最后一次提交的日期**；还没提交过的文件取系统修改时间。和发布日期是同一天时不显示 Modified |
| `[^Summary]` | 一行文字，支持 markdown 和公式 | 首页卡片上的摘要，会渲染格式和公式，多长都**完整显示** | 显示文章开头的内容，铺满两行，多出的用「…」截断 |
| `[^Visible]` | `0` 或 `1` | `0` = 完全隐藏：不出现在首页、归档、分类、搜索，也不生成页面。适合还在写的草稿 | 默认可见（`1`）。构建时会列出被隐藏的笔记 |
| `[^Order]` | 整数 | 在同一个分类里排序：数字小的在前 | 没写 Order 的排在后面，按标题字典序；数字相同的也按标题排 |

几点说明：

- 标签行的**顺序随意**，只要都在文件最开头、彼此连续即可。第一个不是标签的行（比如空行）就是标签区的结束。
- 每个标签只能写**一行**，`[^Summary]` 也不例外。
- 标签行**不会**显示在页面上，也不会进入搜索索引。
- 旧笔记里的 `[^Author]`、`[^ERT ]`（作者、预计阅读时长）可以留着，会被忽略，不再显示。
- 不写 `[^Modified]` 时用 git 提交日期而不是文件的系统修改时间，是因为 git 不保存文件修改时间：在服务器上 `git pull` 之后，所有文件的修改时间都会变成 pull 的那一刻。服务器上的仓库需要是完整克隆（不要用 `--depth` 浅克隆），否则所有文章会拿到同一个日期。
- `[^Order]` 写成非整数、`[^Modified]` 写成不是日期的内容，构建时会提示，并当作没写。

### 文件名和文件夹

文件名和所在文件夹**不携带任何信息**，只是方便你自己找文件；分类完全由 `[^Tag]` 决定。

但要注意：文章网址是由「相对 `notes/` 的文件路径」算出来的。**改名或挪动文件，这篇文章的网址就会变**，之前分享出去的链接会失效。

## 分类排序

Categories 页面上分类的顺序由 `src/data/category-order.txt` 决定。写法是一个缩进大纲：一行一个分类，子分类缩进两个空格，从上到下就是显示顺序。

```
Mathematics
  Calculus
  Linear Algebra
Physics
```

- 只有行的顺序有意义，文件内容不会显示在页面上。
- 没列在文件里的分类，排在列出的分类后面，按字典序。所以新分类不填进来也能正常显示。
- 以 `#` 开头的行是注释。
- 构建时会提示：文件里写了但没有任何笔记用到的分类（通常是拼写错误），以及同一个分类写了两次（以第一次为准）。
- 改完需要重新构建才会生效。

## 图片

图片路径照 Typora 生成的样子写就行，比如 `![](C:\Users\...\image-123.png)` 或 `![](image%5Cfoo.png)`，都会解析成 `notes/image/` 里名为 `image-123.png` 的文件。路径**不**相对笔记所在的文件夹解析，只看文件名。

构建时只把被引用到的图片复制到 `public/image/`，并改写 `src`。`http(s)` 开头的网络图片和 `data:` 图片保持不变。

## 发布和预览

需要 Node 20 或更新版本（`node -v` 查看）。

在服务器上发布：

```bash
git pull          # 拉取新的或修改过的笔记
npm install       # 只有第一次需要
npm run build     # 重新生成内容并输出到 dist/
```

让网站服务器指向 `dist/`。每个页面都是预渲染好的，任何静态托管或普通文件服务器（nginx、Caddy、`python -m http.server`）都能用。

本地预览：

```bash
npm run dev       # http://127.0.0.1:5173，改动后自动刷新
npm run preview   # 预览构建好的 dist/，http://127.0.0.1:4173
```

注意：不要在 `npm run dev` 运行时同时跑 `npm run build`。构建会先删除再重建 `src/generated/`，开发服务器那一瞬间会找不到文件而报 500，构建完刷新即可恢复。

## 页面上的功能

- **布局**：仿 hexo-theme-next 的 Pisces 主题。左边是黑框加菜单、下面是大纲或站点概览卡片，右边是文章卡片。左侧栏始终固定不动。
- **文章大纲**：文章有标题时，左侧显示大纲，顶部是文章标题（点击回到顶部）。当前读到的章节高亮，只展开它所在的那一支；点条目平滑跳转。底部的「↑ xx%」显示阅读进度，点击回到顶部。
- **右下角按钮**：图片按钮开关全屏背景图（`public/background.jpg`，默认关闭）；背景图关闭时会多出月亮按钮，切换夜间模式。两个选择都记在浏览器里。
- **Categories**：手风琴式分类树，点一个分类展开，同级的其他分类自动收起；展开后直接列出这个分类下的文章。
- **搜索**：标题和正文都能搜，命中处黄色高亮。中英文都支持，第一次打开搜索页时才下载索引。
- **代码块**：带复制按钮，任何长度都完整显示，不折叠。
- **Mermaid 图**：只有页面里真的有图时才下载渲染器。

## 代码结构

```
notes/*.md
   │  scripts/build-content.mjs
   ▼
src/generated/               manifest.json · content/<hash>.html · faq.html
public/image/                笔记引用到的图片
public/search.json           搜索索引
   │  vite build
   ▼
dist/assets/                 前端代码
   │  scripts/prerender.mjs   （服务端渲染每个页面成 HTML）
   ▼
dist/                        index.html · categories/ · archive/ · search/ · about/
                             page/N/ · post/<hash>/ · 404.html
```

| 路径 | 作用 |
|---|---|
| `scripts/lib/notes.mjs` | 解析开头标签，以及 markdown → HTML 的渲染流程 |
| `scripts/build-content.mjs` | 读所有笔记，生成 `src/generated/` 和 `public/` 里的内容 |
| `scripts/prerender.mjs` | `vite build` 之后把每个页面渲染成静态 HTML |
| `src/data/category-order.txt` | 分类排序 |
| `src/data/faq.md` | About 页面的内容 |
| `src/site.js` | 站点标题、副标题、头像、主页链接、每页篇数 |
| `src/data.js` | 文章列表、分类树、分页、上一篇/下一篇 |
| `src/router.js` | 路由和页面标题 |
| `src/views/` | 每个页面一个组件 |
| `src/toc.js` | 给正文标题加锚点、生成侧边栏大纲 |
| `src/components/SiteSidebar.vue` | 大纲 / 概览卡片、阅读进度、回到顶部 |
| `src/styles/` | 布局与配色、正文排版、代码高亮主题 |

Markdown 渲染：GFM 表格和勾选框，`$…$` / `$$…$$` 公式由 KaTeX 渲染，单个换行即换行。`\[…\]` 和 `\(…\)` 会先转成 `$…$`。正文里的原始 HTML（`<img>`、`<u>`、`<div align="center">` 等）会保留。代码高亮用 highlight.js 的 Tokyo Night Dark 主题。
