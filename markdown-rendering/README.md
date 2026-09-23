# Markdown / LaTeX 渲染 —— 只读归档

本目录把 NextChat 中所有与 **Markdown 渲染** 和 **LaTeX（KaTeX）公式渲染** 相关的实现
集中在一起，并附上一份实现说明，方便脱离庞大的 `app/` 目录单独阅读理解。

> ### ⚠️ 这里是只读副本，不是可运行的代码
>
> `source/` 下的文件是从仓库中**逐字复制**出来的快照，**不参与编译、不被任何模块 import**。
> **正本仍在 `app/` 下**。要改渲染行为，请改 `app/` 里的正本，然后按下面的
> [重新同步](#重新同步) 更新本目录 —— 不要在本目录里改代码，改动不会生效。

---

## 目录内容

| 路径 | 类型 | 正本位置 | 说明 |
|---|---|---|---|
| `README.md` | 文档 | —— | 你正在读的这个：导航、对应表、同步约定 |
| `implementation.md` | 文档 | —— | 深入说明：渲染管线、各子系统、扩展点、已知坑 |
| `source/markdown.tsx` | 代码（逐字副本） | `app/components/markdown.tsx` | **全部渲染逻辑**都在这一个文件里 |
| `source/markdown.scss` | 样式（逐字副本） | `app/styles/markdown.scss` | `.markdown-body` 的 GitHub 风格主题（亮/暗） |
| `source/highlight.scss` | 样式（逐字副本） | `app/styles/highlight.scss` | 代码块语法高亮配色（Tokyo Night Dark） |
| `source/globals.code-block.scss` | 样式（**摘录片段**） | `app/styles/globals.scss` 第 273–338 行 | 复制按钮、代码折叠按钮的定位样式 |

`globals.code-block.scss` 是唯一**非逐字**的文件：它是一段从 1132 行之外的 `globals.scss`
里摘出来的片段，文件头部有来源标注。其余三个 `.scss` / `.tsx` 与正本 **byte 级一致**。

---

## 一张图看懂渲染管线

```
                    getMessageTextContent(message)          ← app/utils.ts
                                  │
                                  ▼
                      ┌───────────────────────┐
   预处理层            │  escapeBrackets()     │  \[..\] → $$..$$   \(..\) → $..$
  (纯字符串改写)       │  tryWrapHtmlCode()    │  裸 <!DOCTYPE html> 自动套 ```html 围栏
                      └───────────┬───────────┘
                                  ▼
                      ┌───────────────────────┐
   解析 / 转换层       │     ReactMarkdown     │
  remark = mdast      │  ┌─ remark-math      │  $..$ / $$..$$ → math 节点
  rehype = hast       │  ├─ remark-gfm       │  表格 / 删除线 / 任务列表 / 自动链接
                      │  ├─ remark-breaks    │  单个换行 → <br>
                      │  ├─ rehype-katex     │  math 节点 → KaTeX HTML
                      │  └─ rehype-highlight │  代码块 → hljs token 着色
                      └───────────┬───────────┘
                                  ▼
                      ┌───────────────────────┐
   组件覆盖层          │  components={...}     │  pre → PreCode      code → CustomCode
  (react-markdown)    │                       │  p → dir="auto"     a  → audio/video/链接
                      └───────────┬───────────┘
                                  ▼
                      ┌───────────────────────┐
   样式层              │  .markdown-body       │  markdown.scss + highlight.scss
                      │                       │  + globals.code-block.scss 片段
                      │  + katex.min.css      │  （由 markdown.tsx 副作用 import 带入）
                      └───────────────────────┘
```

其中 **Mermaid 图表** 和 **HTML Artifacts 预览** 是挂在代码块上的两条旁路：
`PreCode` 在挂载后探测代码块内容，命中则额外渲染 `<Mermaid>` 或 `<HTMLPreview>`。

---

## 建议阅读顺序

1. **`implementation.md` 第 1–3 节** —— 先搞清入口、管线、预处理这两段"脏活"。
   `escapeBrackets` 是理解"为什么模型输出的 `\(x^2\)` 也能渲染"的钥匙。
2. **`source/markdown.tsx`** —— 全文只有 353 行，按 `Mermaid` → `PreCode` → `CustomCode`
   → `escapeBrackets` / `tryWrapHtmlCode` → `_MarkDownContent` → `Markdown` 的顺序读。
3. **`implementation.md` 第 6–9 节** —— 回头看代码块子系统、Mermaid、Artifacts、
   LaTeX 这四条通路的细节。
4. **`source/markdown.scss` / `highlight.scss`** —— 样式与逻辑是解耦的，
   只有一组 DOM 契约（类名）把两边绑在一起，见 `implementation.md` 第 10 节。

---

## 谁在用这套渲染

| 调用方 | 位置 | 用途 |
|---|---|---|
| 聊天消息 | `app/components/chat.tsx:133`、`:1970` | 主链路。`next/dynamic` 懒加载，`loading` 时显示三点图标 |
| 导出 / 预览 | `app/components/exporter.tsx:44`、`:297`、`:576`、`:690` | 导出弹窗里的消息预览与 Markdown 源码预览 |
| TTS 文本提取 | `app/components/chat.tsx:1301` | 用 `markdown-to-txt` 把 Markdown 剥成纯文本再送 TTS |
| 插件编辑框 | `app/components/plugin.tsx:340` | 只借用 `markdown-body` 类名做排版，**不走** ReactMarkdown |

---

## 重新同步

本目录是快照，正本演进后需要手动同步。在仓库根目录执行：

```bash
cp app/components/markdown.tsx   markdown-rendering/source/markdown.tsx
cp app/styles/markdown.scss      markdown-rendering/source/markdown.scss
cp app/styles/highlight.scss     markdown-rendering/source/highlight.scss
```

`globals.code-block.scss` 是摘录片段，同步时需人工核对 `app/styles/globals.scss` 中
`pre { position: relative; ... }` 到 `.collapsed { ... }` 的区间是否仍然一致。

同步完建议跑一次 `diff` 确认，并更新本文件与 `implementation.md` 里引用的行号。

**当前快照对应 commit：** `defdcdb5`（2026-09-23，`main` 分支）

---

## 为什么本目录被排除在编译之外

`source/markdown.tsx` 保留了 `.tsx` 扩展名（保真、编辑器有语法高亮），但它是**位置错误的副本**：
里面的 `import ... from "../utils"`、`"./ui-lib"`、`"../store"` 等相对路径是相对
`app/components/` 写的，放在 `markdown-rendering/source/` 下全部解析不到。

而 `tsconfig.json` 的 `include` 是 `["next-env.d.ts", "**/*.ts", "**/*.tsx", ...]`，
`exclude` 原本只有 `node_modules` —— 意味着 `tsc` 会主动扫描整个仓库，
把这个副本也拉进来并抛出 `TS2307: Cannot find module '../utils'`，
**直接让 `yarn build` 失败**。

因此加了两行纯增量的排除配置：

- `tsconfig.json` → `"exclude": ["node_modules", "markdown-rendering"]`
- `.eslintignore` → 新增一行 `markdown-rendering`

其余构建环节本就不会碰到本目录：`next.config.mjs` 没有额外的编译入口；
`.lintstagedrc.json` 的 glob 限定在 `./app/**`；`jest.config.ts` 的 `testMatch` 只匹配
`**/*.test.{js,ts,jsx,tsx}`。回退只需删掉那两行。
