# DennyQi's Blog

A static blog built from the `notes/` folder. Vue 3 + Vite, pre-rendered to plain
HTML at build time — no server, no runtime framework, no database. Publishing a
note means adding a markdown file and running one command.

There is no Hexo here, and no theme to configure: the layout, typography and
colours are implemented directly in `src/`.

## Requirements

- Node 20 or newer (`node -v`)

## Publishing

```bash
git pull          # fetch new or edited notes
npm install       # first time only
npm run build     # regenerate content/ and write dist/
```

Point your web server at `dist/`. Because every route is pre-rendered, the site
works on any static host, and a plain file server (nginx, Caddy, `python -m
http.server`) is enough.

For local preview:

```bash
npm run dev       # http://127.0.0.1:5173, hot reload
npm run preview   # serve the built dist/ on http://127.0.0.1:4173
```

## Adding a note

Drop a `.md` file anywhere under `notes/` — at the top level or in a
subdirectory, it makes no difference. The file opens with five metadata lines,
then one blank line, then the body:

```
[^Date]: 2025.12.16
[^ERT ]: 11min
[^Author]: DennyQi
[^Title]: 01 Representing and Manipulating Information
[^Tag]: Informatics, Computer Systems, Computer Architecture
```

- **`[^Date]`** — `YYYY.MM.DD` (also accepts `-` or `/` as the separator).
- **`[^ERT ]`** — estimated reading time, any number; `10min`, `10`, `~10 min`
  all work. The space before `]` is part of the template; `[^ERT]` is accepted too.
- **`[^Author]`** — shown on the post card and on the post page.
- **`[^Title]`** — the title, shown everywhere and used for sorting.
- **`[^Tag]`** — comma-separated, **order matters**: `A, B, C` files the note
  under `A/B/C` in the tag tree. `tmp`, `old`, `old1`, `old2`, `Category` and
  `other` are treated as workflow markers and hidden from the tree.

The **file name and folder carry no metadata** — they are only a way for you to
find the file. Renaming or moving a note does change its URL, though: the post
id is a hash of the note's path relative to `notes/`.

A file whose header is missing or malformed is skipped with a warning during the
build rather than breaking it. Posts are listed newest first; `src/site.js` sets
the title, subtitle, author, avatar and page size.

Those five lines never reach the page. Markdown reads `[^X]: …` as a footnote
definition, which renders as nothing — and even so the build strips the header
before rendering, so nothing depends on that. The header is also removed before
the excerpt is taken and before the note is indexed for search.

## Images

Write image paths however Typora wrote them — `![](C:\Users\...\image-123.png)`
or `![](image%5Cfoo.png)` both resolve to the same thing: a file named
`image-123.png` in `notes/image/`. Paths are not resolved relative to the note's
own folder; only the file name is used. The build copies every referenced image
into `public/image/` and rewrites the `src`. Absolute `http(s)` and `data:` URLs
are left untouched.

## How it works

```
notes/*.md
   │  scripts/build-content.mjs
   ▼
src/generated/               manifest.json · content/<hash>.html · faq.html
public/image/                images referenced by the notes
public/search.json           client-side search index
   │  vite build
   ▼
dist/assets/                 client bundle
   │  scripts/prerender.mjs   (SSR bundle → HTML per route → throw away the bundle)
   ▼
dist/                        index.html · categories/ · archive/ · search/ · about/
                             page/N/ · post/<hash>/ · 404.html
```

| Path | |
|---|---|
| `scripts/lib/notes.mjs` | File-name parsing, and the markdown → HTML pipeline |
| `scripts/build-content.mjs` | Reads the corpus, writes `src/generated/` + `public/` |
| `scripts/prerender.mjs` | Renders every route to static HTML after `vite build` |
| `src/site.js` | Site title, author, avatar, posts per page |
| `src/data.js` | Manifest → post lists, tag tree, pagination, neighbours |
| `src/router.js` | Routes; `titleFor()` sets `<title>` without loading post bodies |
| `src/views/` | One component per section of the sidebar |
| `src/toc.js` | Heading anchors + the sidebar outline, derived from the rendered body |
| `src/components/SiteSidebar.vue` | Outline / overview card, scroll tracking, back-to-top |
| `src/styles/` | Layout tokens, note typography, syntax theme |

### Markdown

The pipeline lives in `scripts/lib/notes.mjs` and mirrors
`markdown-rendering/source/markdown.tsx`: `remark-parse`, GFM tables and
checkboxes, `$…$` / `$$…$$` maths via KaTeX, single newlines as `<br>`.
`\[…\]` and `\(…\)` are rewritten to `$…$` before parsing, so half-typed LaTeX
still renders.

Two deliberate deviations from the reference renderer:

- Raw HTML is **kept** (`rehype-raw`) instead of dropped — the notes contain
  `<img>`, `<u>` and `<div align="center">`.
- Code is highlighted with highlight.js using the Tokyo Night Dark theme ported
  verbatim from `markdown-rendering/source/highlight.scss`.

### Search

`Intl.Segmenter` word-segmenting over title, tags and body, indexed in the
browser the first time the Search page is opened; only `public/search.json` is
fetched. Chinese and English both work — a query is segmented the same way, and
matches are scored by inverse document frequency.

### Client-side extras

Copy buttons on code blocks, a "Show more" fold for blocks taller than 440px,
and Mermaid diagrams — the diagram renderer is downloaded only if a page
actually contains one.

The layout copies hexo-theme-next's Pisces scheme: a brand + menu card and a
sticky sidebar card on the left, the content card on the right. On a post with
headings the sidebar card shows the outline (current section highlighted, its
branch unfolded); elsewhere it shows the site overview. A full-screen
background picture (`public/background.jpg`) sits behind translucent cards and
can be switched off with the button in the bottom-right corner; the choice is
remembered in `localStorage`.

## Notes on the build

- Route output is deterministic: a post's URL is a 6-character hash of its file
  name, so renaming a note is the only thing that changes its link.
- The build fails loudly on an unreadable note, but a note with a malformed file
  name is reported and skipped.
- `dist/` is roughly the size of the corpus, because the notes are image-heavy
  and every referenced image is copied. It is not committed.
