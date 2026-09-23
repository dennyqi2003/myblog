# Markdown / LaTeX 渲染实现说明

本文讲解 NextChat 的 Markdown / LaTeX 渲染实现。所有行号指向本目录 `source/` 下的副本，
它与 `app/` 中的正本在快照 commit `defdcdb5` 上 byte 级一致。

---

## 1. 入口与整体结构

整条管线只有 **一个模块**：`source/markdown.tsx`（353 行）。它导出两个东西：

| 导出 | 行 | 职责 |
|---|---|---|
| `MarkdownContent` | `:319` | 纯渲染：`content: string` → React 元素树。`React.memo` 包裹 |
| `Markdown` | `:321` | 外壳：加 `.markdown-body` 容器、`fontSize` / `fontFamily` / `dir="auto"`、`loading` 占位 |

`Markdown` 内部渲染 `MarkdownContent`（`:348`）。调用方一律用 `next/dynamic` 懒加载
`Markdown`（`chat.tsx:133`、`exporter.tsx:44`），所以整个渲染栈 —— 包括 ReactMarkdown、
KaTeX、highlight.js、Mermaid —— 都不在首屏 bundle 里。

模块顶部的 `import "katex/dist/katex.min.css"`（`:2`）是个**副作用 import**：
KaTeX 的字体与公式样式由这个懒加载 chunk 一并带出，不需要在 `layout.tsx` 里引。
相比之下，另两个样式文件是在 `app/layout.tsx:3-4` 全局引入的：

```ts
import "./styles/markdown.scss";
import "./styles/highlight.scss";
```

---

## 2. 预处理层：两段字符串改写

在内容进入 ReactMarkdown **之前**，`_MarkDownContent` 用 `useMemo` 做了一次改写（`:271`）：

```ts
const escapedContent = useMemo(() => {
  return tryWrapHtmlCode(escapeBrackets(props.content));
}, [props.content]);
```

顺序不能反：先修 LaTeX 分隔符，再补 HTML 围栏。两个函数都是纯粹的正则字符串替换，
没有解析器，因此**对代码块的处理是"先保护再改写"**。

### 2.1 `escapeBrackets` —— LaTeX 分隔符归一化（`:231-247`）

```ts
const pattern =
  /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
```

这是**三个交替分支**，从左到右贪婪度不同：

| 分支 | 匹配 | 捕获组 | 处理 |
|---|---|---|---|
| 1 | ` ```…``` ` 或 `` `…` `` | `codeBlock` | **原样返回**，不改写 |
| 2 | `\[ … \]` | `squareBracket` | 改写为 `$$ … $$`（块级公式） |
| 3 | `\( … \)` | `roundBracket` | 改写为 `$ … $`（行内公式） |

**为什么需要它：** `remark-math` 只认美元符语法（`$…$` / `$$…$$`），
但 OpenAI 系模型习惯按 `app/constant.ts` 里的 `DEFAULT_SYSTEM_TEMPLATE` 输出

```
Latex inline: \(x^2\)
Latex block: $$e=mc^2$$
```

即行内公式用 `\(…\)`、块级两种混用。没有这一步，`\(x^2\)` 会原样显示成字面量。

**几个细节：**

- 分支 1 排在首位，保证**代码块和行内代码里的反斜杠括号不会被误改写**。
  但它只认 ` ``` ` 和单反引号两种围栏，**不认 `~~~` 围栏，也不认缩进式代码块**。
- 分支 2 的捕获组是 `([\s\S]*?[^\\])` —— 末尾强制要求一个**非反斜杠字符**，
  避免把内容末尾的转义反斜杠吞进来。
- 三个分支都只做一次替换（`g` 标志下每处独立匹配），不做嵌套解析。

### 2.2 `tryWrapHtmlCode` —— 裸 HTML 文档自动补围栏（`:249-268`）

模型经常直接吐一整个 HTML 页面而不套代码围栏。这个函数把它补上 ` ```html `：

```ts
// 1. 全文只要出现 ``` 就直接放弃
if (text.includes("```")) return text;

// 2. 找到未被反引号前缀的 <!DOCTYPE html>，在其前插入围栏开头
.replace(/([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
  (match, quoteStart, lang, newLine, doctype) =>
    !quoteStart ? "\n```html\n" + doctype : match)

// 3. 找到未被反引号后缀的 </body>…</html>，在其后插入围栏结尾
.replace(/(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
  (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) =>
    !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match);
```

两个 `replace` 都靠捕获到的反引号（`quoteStart` / `quoteEnd`）判断"是否已经在围栏里"，
是则原样返回。

**已知局限：** 第 1 步的提前返回是按**全文**判断的。所以如果一条消息里既有任意一个
已有围栏、又有一个裸 HTML 文档，裸 HTML 不会被补围栏 —— 这是刻意用简单换取的健壮，
代价是一个真实的边界情况。这个函数的注释也自陈了这点（`// fixed: html codeblock include 2 newline`）。

---

## 3. 插件链（`:277-287`）

```tsx
<ReactMarkdown
  remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
  rehypePlugins={[
    RehypeKatex,
    [RehypeHighlight, { detect: false, ignoreMissing: true }],
  ]}
  ...
```

remark 阶段操作 mdast（Markdown 语法树），rehype 阶段操作 hast（HTML 语法树），
顺序即数组顺序：

| 插件 | 阶段 | 作用 |
|---|---|---|
| `remark-math` | mdast | 把 `$…$` / `$$…$$` 解析成 `math` / `inlineMath` 节点 |
| `remark-gfm` | mdast | 表格、删除线、任务列表、自动链接 |
| `remark-breaks` | mdast | 单个换行渲染成 `<br>`（否则 Markdown 会折叠成空格） |
| `rehype-katex` | hast | 把 math 节点渲染成 KaTeX 的 HTML + MathML |
| `rehype-highlight` | hast | 用 highlight.js 给 `<pre><code class="language-*">` 上色 |

`rehype-highlight` 传了两个非默认选项：

- `detect: false` —— 关闭语言自动探测。**必须关**：聊天流式输出时内容不断增长，
  自动探测会让同一个代码块的语言反复变来变去，配色闪烁。关掉后只认显式
  `language-xxx` 类名。
- `ignoreMissing: true` —— 遇到 highlight.js 没注册的语言（比如 `mermaid`、
  `language-mermaid`）不抛错，降级成纯文本。这为下面的 Mermaid 通路留了空间。

> KaTeX 的 CSS 通过 `markdown.tsx:2` 的副作用 import 引入；KaTeX 本身（JS）
> 由 `rehype-katex` 间接使用。项目 `package.json` 里没有直接依赖 `katex`，
> 它是 `rehype-katex` 的传递依赖 —— 这一点在升级依赖时需要注意。

---

## 4. 组件覆盖层（`:288-312`）

ReactMarkdown 的 `components` 属性按标签名替换渲染器。这里覆盖了四个：

| 标签 | 替换为 | 原因 |
|---|---|---|
| `pre` | `PreCode`（`:74`） | 代码块外壳：复制按钮、折叠、Artifacts 探测 |
| `code` | `CustomCode`（`:176`） | 代码折叠与高度限制 |
| `p` | `<p dir="auto">` | 按内容自动判定 LTR/RTL，支持阿拉伯语等 |
| `a` | 分支函数 | 见下 |

`a` 的处理（`:292-311`）按 URL 后缀分流成三种：

```tsx
if (/\.(aac|mp3|opus|wav)$/.test(href))     → <figure><audio controls/></figure>
if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) → <video controls width="99.9%">
```

其余按 `isInternal = /^\/#/i.test(href)` 决定 `target`：站内锚点用 `_self`，
外部链接用 `target ?? "_blank"`。注意正则**只匹配路径结尾**，带 query string 的
音频链接（`x.mp3?token=…`）不会被识别成音频。

---

## 5. 代码块子系统

这是整个文件里逻辑最密的部分，由 `PreCode` 与 `CustomCode` 两个组件配合完成。
关键前提：**这俩不是父子关系**。ReactMarkdown 渲染 `` ```js … ``` `` 时的结构是
`<pre>` → `<code class="language-js">`，于是 `components.pre = PreCode` 负责 `<pre>`，
`components.code = CustomCode` 负责 `<code>`，二者通过 **DOM 查询**（`ref.current.querySelector`）
互相感知，而不是通过 props。

### 5.1 `PreCode`：外壳、复制、旁路探测（`:74-174`）

渲染结构：

```tsx
<pre ref={ref}>
  <span className="copy-code-button" onClick={…复制…} />
  {props.children}          {/* 即 CustomCode 渲染出来的 <code> */}
</pre>
{/* 下面是两条旁路，条件渲染 */}
{mermaidCode.length > 0 && <Mermaid code={mermaidCode} key={mermaidCode} />}
{htmlCode.length > 0 && enableArtifacts && <FullScreen>…<HTMLPreview/>…</FullScreen>}
```

**三件事：**

1. **复制按钮**（`:137-145`）—— 一个空的 `<span>`，点击时取
   `ref.current.querySelector("code")?.innerText` 交给 `copyToClipboard`
   （`app/utils.ts:28`，内部兼容 Tauri 环境）。按钮本身"copy"字样由 CSS
   `::after` 伪元素提供。详见第 7 节。

2. **给纯文本类语言开自动换行**（`:107-131`）—— 挂载时遍历所有 `<code>`，
   若语言属于
   `["", "md", "markdown", "text", "txt", "plaintext", "tex", "latex"]`
   则设 `style.whiteSpace = "pre-wrap"`。这是用**行内样式**覆盖样式表里的规则，
   所以优先级足够。注意 `tex` / `latex` 也在列表里 —— 纯文本形式的公式同样换行。

3. **Artifacts 探测**（`:83-100`）—— `renderArtifacts` 是个 **600ms 防抖**回调，
   在挂载时由 `setTimeout(renderArtifacts, 1)` 触发（`:129`）。它查询：
   - `code.language-mermaid` → 取 `innerText` 存入 `mermaidCode`
   - `code.language-html` → 存入 `htmlCode`
   - 否则看第一个 `<code>` 的文本是否以 `<!DOCTYPE` / `<svg` / `<?xml` 开头
     → 也当作 HTML 存起来

   这个 `<svg` / `<?xml` 的兜底，与预处理层 `tryWrapHtmlCode` 只认
   `<!DOCTYPE html>` 形成互补：**外层负责补围栏，内层负责识别变体**。

   ⚠️ 探测效应函数的依赖数组是 `[]`（`:131`），只在**挂载时跑一次**。
   流式输出期间同一个 `<pre>` 的节点通常被 React 复用、不会重挂载，所以 Artifacts
   的识别实际发生在流结束后的重挂载时刻 —— `chat.tsx:1971` 给 `<Markdown>` 传了
   `key={message.streaming ? "loading" : "done"}`，流式状态翻转时强制整棵树重挂载，
   这就是那个 `key` 存在的原因。

**开关联动：**

```ts
const enableArtifacts =
  session.mask?.enableArtifacts !== false && config.enableArtifacts;
```

两级与门：全局配置 `config.enableArtifacts`（`app/store/config.ts:54`，默认 `true`）
**且**当前会话的 mask 没有显式关掉。`!== false` 的写法意味着 mask 上缺省时视为开启。
对应 UI 在 `app/components/settings.tsx:1718`（全局）与 `app/components/mask.tsx:170`（单会话）。
`CustomCode` 的 `enableCodeFold`（`:180`）是同样的双层结构。

### 5.2 `CustomCode`：高度限制与折叠（`:176-229`）

```tsx
const [collapsed, setCollapsed] = useState(true);   // 默认折叠
useEffect(() => {
  if (ref.current) {
    const codeHeight = ref.current.scrollHeight;
    setShowToggle(codeHeight > 400);                // 超过 400px 才给折叠按钮
    ref.current.scrollTop = ref.current.scrollHeight; // 自动滚到代码末尾
  }
}, [props.children]);

<code ref={ref} style={{
  maxHeight: enableCodeFold && collapsed ? "400px" : "none",
  overflowY: "hidden",
}}>
```

要点：

- **400px 是硬编码阈值**，出现两处（判定与限高）。
- `scrollTop = scrollHeight` 让长代码块默认停在**结尾** —— 因为流式输出时代码是
  从上往下长出来的，停在结尾更符合"正在生成"的观感。
- `overflowY: "hidden"` 是**无条件**设置的，只有 `maxHeight` 受开关控制。
- 折叠按钮的文案取自 `Locale.NewChat.More`（`:207`），是多语言 key。
- `ref` 声明为 `useRef<HTMLPreElement>` 却挂在 `<code>` 上 —— 类型不精确，
  但两者共享 `scrollHeight` / `scrollTop` 等 HTML 元素接口，实际能工作。

### 5.3 DOM 契约：逻辑与样式靠类名对接

`.tsx` 与 `.scss` 之间没有共享常量，全靠三个类名 + 两个开关类：

| 类名 | 产出方 | 消费者 |
|---|---|---|
| `.copy-code-button` | `markdown.tsx:137` | `globals.code-block.scss` 中的 `pre` 规则 |
| `.show-hide-button` | `markdown.tsx:202`，内含 `.collapsed` / `.expanded` | 同上 |
| `.markdown-body` | `markdown.tsx:335` | 全部三个样式文件 |
| `.language-mermaid` / `.language-html` | rehype-highlight（由围栏语言名生成） | `PreCode` 的 `querySelector` |

改类名时这三处必须同步，没有任何工具会提醒你。

---

## 6. 四条渲染通路

### 6.1 LaTeX / KaTeX

```
\(x^2\) 或 $x^2$          escapeBrackets        remark-math          rehype-katex
$$e=mc^2$$         ──►    $…$ / $$…$$     ──►   math 节点      ──►   KaTeX HTML+MathML
```

- 进入渲染的前提是 `escapeBrackets` 把反斜杠括号转成美元符，见 2.1。
- 输出的是 **KaTeX 的 HTML 标记 + MathML**，而非图片，因此可选中、可缩放、支持无障碍朗读。
- 样式来自 `katex.min.css`（`markdown.tsx:2`）。
- `escapeBrackets` 对 `\[…\]` 生成的是 `$$…$$`（块级），对 `\(…\)` 生成 `$…$`（行内），
  与模型在 `DEFAULT_SYSTEM_TEMPLATE` 里被要求的格式一致。

### 6.2 Mermaid

`source/markdown.tsx:28-72`。

- 触发：`PreCode` 探测到 `code.language-mermaid` 并把源码存进 `mermaidCode`，
  渲染 `<Mermaid code={mermaidCode} key={mermaidCode} />`（`:148-150`）。
  **`key` 用源码本身**，源码变了就重挂载 —— 这是让 `mermaid.run` 重新执行的最简单办法。
- 执行：`mermaid.run({ nodes: [ref.current], suppressErrors: true })`（`:34-38`）。
  注意 `Mermaid` 组件首次渲染时把源码作为 `children` 塞进 `<div>`，`mermaid.run`
  就地替换该 div 的内容为 SVG。
- 错误处理：`suppressErrors: true` + `.catch` 里 `setHasError(true)` →
  组件**返回 `null`**（`:55-57`），即渲染失败时整个图表消失，不显示源码。
- 交互：点击图表把 SVG 序列化成 Blob → `showImageModal(URL.createObjectURL(blob))`
  （`app/components/ui-lib.tsx:452`）弹出大图。
- 样式：`.markdown-body .mermaid`（`markdown.scss:1122`）给容器加边框内边距；
  `#dmermaid { display: none }`（`:1130`）隐藏的是 **mermaid 库自己创建的离屏
  测量/渲染容器**，不是我们的组件。

### 6.3 HTML Artifacts

- 触发：`PreCode` 探测到 `language-html`，或以 `<!DOCTYPE` / `<svg` / `<?xml` 开头的代码块。
- 前置条件：`enableArtifacts` 为真（见 5.1）。
- 渲染：`<FullScreen>` 包裹 `HTMLPreview`，右上角叠两个按钮 —— Artifacts 分享按钮
  与重新加载按钮（`:152-170`）。
- `HTMLPreview` 定义在 `app/components/artifacts.tsx:36`，通过 `forwardRef` 暴露
  `HTMLPreviewHandler`（`:32`），使 `PreCode` 能调 `previewRef.current?.reload()`。
  它在 `<iframe sandbox>` 里渲染用户/模型生成的 HTML —— **这是本文件里唯一会执行
  不受信内容的地方**，安全性完全依赖 `artifacts.tsx` 里的 sandbox 配置。
- `autoHeight={!document.fullscreenElement}` 与 `height={document.fullscreenElement ? height : 600}`
  （`:167-168`）—— 全屏与否影响高度策略，且**在渲染期直接读 `document`**，
  这意味着该组件只能在客户端渲染（调用方用 `next/dynamic` 懒加载，恰好规避了 SSR 问题）。

### 6.4 纯文本提取（TTS 用）

`app/components/chat.tsx:1301` 用 `markdown-to-txt` 在**渲染之前**剥掉 Markdown 语法：

```ts
const { markdownToTxt } = require("markdown-to-txt");
const textContent = markdownToTxt(text);
```

这条通路与 ReactMarkdown 完全独立，只是消费同一份原始 Markdown 文本。
用的是 `require` 而非 `import`，属于历史写法。

---

## 7. 样式分层

三个样式文件各管一段，靠 CSS 变量与 `.markdown-body` 作用域衔接。
在 `app/layout.tsx:2-4` 中的引入顺序决定了层叠结果：

```ts
import "./styles/globals.scss";     // 1. 全局基础 + 代码块外壳（摘录见 globals.code-block.scss）
import "./styles/markdown.scss";    // 2. .markdown-body 的 GitHub 风格排版与配色变量
import "./styles/highlight.scss";   // 3. 代码块语法高亮配色
```

### 7.1 `markdown.scss`（1132 行）

结构上分三段：

1. **`@mixin light` / `@mixin dark`（`:1-92`）** —— 定义一整套
   `--color-prettylights-syntax-*` CSS 变量。名称来自 GitHub 的
   [prettylights](https://github.com/primer/github-v2-highlights) 语法高亮配色，
   这是这套样式源自 GitHub Markdown CSS 的痕迹。
2. **主题选择（`:93-121`）** —— `.markdown-body` 的基础声明（`:93`，含
   `background-color: var(--color-canvas-default)`），随后
   `:root { @include light }`（`:112`）先把亮色变量铺到根节点，
   `@media (prefers-color-scheme: dark) { :root { @include dark } }`（`:116`）
   在系统偏好深色时覆盖成暗色；`.light` / `.dark` 两个类（`:104`、`:108`）
   供 App 手动切换主题时使用。
3. **GitHub Markdown 正文样式（`:122-1132`）** —— 标题、表格、引用、任务列表、
   `kbd`、锚点 octicon、`::-webkit-*` 伪元素等。

注意 `--color-canvas-default: transparent`（`:36` 亮色、`:82` 暗色，
由 `.markdown-body:98` 消费）—— 正文底色是**透明**的，
让聊天界面的背景透出来，这是它能嵌进任意主题的原因。

### 7.2 `highlight.scss`（115 行）

全部包在 `.markdown-body` 下，是 **Tokyo Night Dark** 主题（文件头保留了原始
出处与作者署名：`enkia/tokyo-night-vscode-theme`）。

关键一条（`:21-25`）：

```scss
.hljs, pre {
  background: #1a1b26;   // 恒定的深色底
  color: #cbd2ea;
}
```

而 `markdown.scss` 的 `.markdown-body pre`（`:841`）**只设内边距/圆角/字号，不设背景**。
两者同为 `.markdown-body pre` 特异性，按引入顺序 highlight.scss 在后 ——
**结果是代码块在任何主题下都是深色的**，亮色主题下也是。这是刻意的设计（得到
统一的"终端感"代码块），但如果你要改，得知道这个层叠关系。

其余是 `.hljs-*` 的 token 配色表。

### 7.3 `globals.code-block.scss`（摘录片段，正本 `globals.scss:273-338`）

只干两件事，都是**绝对定位**：

- `pre { position: relative }` + `.copy-code-button` —— 初始
  `opacity: 0; pointer-events: none; transform: translateX(10px)`，
  `pre:hover` 时才 `opacity: .5` 淡入。文案由 `&:after { content: "copy" }` 提供，
  所以 `markdown.tsx` 里那个 `<span>` 是空的。
- `pre .show-hide-button` —— 用一个 `inset: 0 0 auto 0` 的覆盖层居中放置按钮，
  容器 `pointer-events: none`、按钮本身 `pointer-events: auto`，
  避免挡住底下的代码交互。
  `.collapsed` 的渐变背景（`linear-gradient` 到透明）负责折叠时的视觉淡出。

依赖的 CSS 变量 `--black` / `--white` / `--border-in-light` 定义在
`globals.scss` 的主题块里，因此这个片段**不能脱离 `globals.scss` 单独使用**。

### 7.4 三者与内联样式的优先级

`CustomCode` / `PreCode` 用的是 **行内 `style`**，优先级高于任何类选择器。
所以：

- `whiteSpace: "pre-wrap"`（`:126`）覆盖 `markdown.scss` 的
  `.markdown-body pre > code { white-space: pre }`（`:826`）。
- `maxHeight` / `overflowY`（`:219-220`）同理覆盖样式表。

**调试样式问题时，先看 `markdown.tsx` 里的行内样式，再看 SCSS** —— 这是排查时的
第一优先级。

---

## 8. 依赖边界

`markdown.tsx` 依赖以下外部模块。归档只复制了 `markdown.tsx` 本身，
这些依赖保持原位，列在这里是为了让"这个文件为什么不能单独跑起来"有个完整答案。

### 同仓库内部模块

| 导入 | 位置 | 用途 |
|---|---|---|
| `copyToClipboard`、`useWindowSize` | `app/utils.ts:28`、`:121` | 复制、监听窗口尺寸（全屏高度用） |
| `Locale` | `app/locales` | 折叠按钮文案 |
| `LoadingIcon` | `app/icons/three-dots.svg` | `Markdown` 的 loading 占位（经 svgr） |
| `ReloadButtonIcon` | `app/icons/reload.svg` | Artifacts 重载按钮图标 |
| `showImageModal`、`FullScreen` | `app/components/ui-lib.tsx:452`、`:555` | Mermaid 大图、Artifacts 全屏容器 |
| `HTMLPreview`、`HTMLPreviewHandler`、`ArtifactsShareButton` | `app/components/artifacts.tsx:36`、`:32`、`:109` | HTML 预览与分享 |
| `IconButton` | `app/components/button.tsx` | 重载按钮外壳 |
| `useChatStore` | `app/store` | 取 `currentSession().mask` 的开关 |
| `useAppConfig` | `app/store/config` | 取全局开关 |

### 第三方包

| 包 | 用途 |
|---|---|
| `react-markdown` | 渲染内核 |
| `remark-math` / `remark-gfm` / `remark-breaks` | remark 插件 |
| `rehype-katex` / `rehype-highlight` | rehype 插件 |
| `katex`（**传递依赖**，未直接声明） | 公式渲染 + `katex.min.css` |
| `mermaid` | 图表渲染 |
| `use-debounce` | `renderArtifacts` 的 600ms 防抖 |
| `clsx` | 条件类名 |

**唯独 `mermaid` 是静态 import**（`markdown.tsx:10`）。它体积可观（数 MB），
虽然随整个 `Markdown` chunk 一起懒加载，但没有进一步拆分 —— 不用 Mermaid 的用户
也会加载它。这是一个明确的优化空间，但改动需要处理 `mermaid.run` 的时序。

---

## 9. 扩展点

**加一个 remark / rehype 插件** —— 改 `:277-287` 的两个数组即可，注意顺序，
remark 插件一律排在 rehype 插件之前。

**加一个"纯文本类"语言（走自动换行）** —— 往 `:112-121` 的 `wrapLanguages`
数组里加语言名。

**加一种代码块旁路渲染器**（例如 PlantUML、Vega）——
参照 Mermaid 的三步：在 `renderArtifacts` 里加一条 `querySelector("code.language-xxx")`
探测、加一个 `useState` 存源码、在 `PreCode` 的返回值里条件渲染对应组件。

**改 KaTeX 的渲染选项**（例如 `throwOnError`、`macros`）——
`rehype-katex` 支持传 options，把 `RehypeKatex` 从裸函数改成
`[RehypeKatex, { … }]` 的元组形式，与 `RehypeHighlight` 的写法一致。

**改代码折叠阈值** —— `:190` 与 `:219` 的 `400` 两处必须同改。

**让代码块跟随亮色主题** —— 需要处理第 7.2 节描述的层叠顺序，给
`highlight.scss` 的背景色加主题分支。

---

## 10. 已知坑

1. **`escapeBrackets` 不认 `~~~` 围栏与缩进代码块**。如果模型用这两种方式写代码，
   且代码里含 `\[…\]` 或 `\(…\)`，会被误改写成数学公式。

2. **`tryWrapHtmlCode` 的全文提前返回**（见 2.2）：消息里已经有任意围栏、
   又有裸 HTML 时，裸 HTML 不会被补围栏。

3. **`PreCode` 的探测效应只在挂载时执行一次**（`:107-131` 的 `[]` 依赖）。
   它依赖 `chat.tsx:1971` 的 `key` 切换来在流式结束后重挂载。若在别的调用方
   （如 `exporter.tsx`）里让内容在不重挂载的情况下变化，Artifacts / Mermaid
   不会被探测到。

4. **`a` 组件的音视频分流只匹配路径结尾**，带 query string 的 URL 不生效（见第 4 节）。

5. **`Mermaid` 出错时整块消失**（返回 `null`），用户看不到源码也没有报错提示，
   只在 console 里留一条 `[Mermaid]` 日志。源码本身仍在原始消息里，不会丢失。

6. **`HTMLPreview` 执行不受信 HTML**，安全性完全取决于
   `app/components/artifacts.tsx` 的 iframe sandbox 配置 —— 修改那里时请单独评估。

7. **`markdown.tsx` 是唯一未拆分的单文件**。353 行里混了预处理、组件覆盖、
   两条旁路渲染器与折叠逻辑。想拆分的话，`Mermaid` / `PreCode` / `CustomCode` /
   预处理函数各自边界都清晰，是可以独立出去的。

---

## 11. 测试现状

**本渲染管线没有任何单元测试。**

`test/` 目录下的 34 个测试文件覆盖的是 utils、hmac、adapter、model 等纯逻辑模块，
没有一个测试触及 `markdown.tsx`、`markdown.scss` 或 `highlight.scss`。

最值得补测试的是两个**纯函数** —— `escapeBrackets`（`:231`）与
`tryWrapHtmlCode`（`:249`）不依赖 React 与 DOM，输入输出都是字符串，
用现有 jest 配置即可直接测。它们的正则复杂度（三交替分支、嵌套捕获组、
反引号保护）是整条管线里最容易出回归的地方，而目前只靠人工在浏览器里观察。

要测的话，把它们从 `markdown.tsx` 导出即可 —— 目前两者都未导出。
