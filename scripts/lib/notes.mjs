// Parsing + rendering for the notes/ corpus.
//
// Every note opens with the same five metadata lines, then a blank line, then
// the body — see splitNote() below. File names and folders carry no metadata;
// only the header does.
//
// The markdown body is rendered through the same remark/rehype stack as
// markdown-rendering/, with one deliberate difference: raw HTML is preserved
// (rehype-raw) instead of being dropped, because the corpus embeds <img>, <u>
// and <div align="center">.

import { createHash } from 'node:crypto'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'

/** Tags used as workflow markers rather than topics — hidden from the tag tree. */
export const HIDDEN_TAGS = new Set(['tmp', 'old', 'old1', 'old2', 'Category', 'other'])

// ---------------------------------------------------------------------------
// Note metadata
// ---------------------------------------------------------------------------

/**
 * Every note opens with the same five lines, then a blank line, then the body:
 *
 *   [^Date]: 2025.12.16
 *   [^ERT ]: 11min
 *   [^Author]: DennyQi
 *   [^Title]: 01 Representing and Manipulating Information
 *   [^Tag]: Informatics, Computer Systems, Computer Architecture
 *
 * The file name and the folders above it carry no meaning.
 *
 * These are read as raw lines rather than from the parse tree on purpose. GFM
 * reads `[^X]: …` as a footnote definition — which is why they never appear on
 * the page — but `[^ERT ]` has a space inside its label, so remark does not
 * recognise that one as a definition and folds the line into the content of
 * the *Date* definition above it. Nothing downstream can then tell the two
 * apart, so the tree is the wrong place to read from. Line order is the one
 * thing that is stable, and it is what this does.
 */
export const META_KEYS = ['Date', 'ERT', 'Author', 'Title', 'Tag']

/**
 * Splits a note into `{ meta, body }`, or returns null when the header is not
 * the five expected lines. `body` is normalised to \n and has the header and
 * the blank line after it removed, so callers never have to think about the
 * metadata again.
 *
 * @param {string} source
 */
export function splitNote(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const meta = {}

  for (let i = 0; i < META_KEYS.length; i++) {
    const m = lines[i]?.match(/^\[\^([^\]]*)\]\s*:\s*(.*)$/)
    // `[^ERT ]` and `[^ERT]` both name the key ERT.
    if (!m || m[1].trim().toLowerCase() !== META_KEYS[i].toLowerCase()) return null
    meta[META_KEYS[i]] = m[2].trim()
  }

  const rest = lines.slice(META_KEYS.length)
  while (rest.length && rest[0].trim() === '') rest.shift()

  return { meta, body: rest.join('\n') }
}

/**
 * @param {string} source
 * @returns {{tags: string[], date: string, ert: number, author: string, title: string, body: string}|null}
 */
export function parseNote(source) {
  const split = splitNote(source)
  if (!split) return null
  const { meta, body } = split

  const dateMatch = meta.Date.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!dateMatch) return null
  if (!meta.Title) return null

  const ertMatch = meta.ERT.match(/(\d+(?:\.\d+)?)/)

  return {
    date: `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`,
    ert: ertMatch ? Math.round(Number(ertMatch[1])) : 0,
    author: meta.Author,
    title: meta.Title,
    // Order is the author's and is what the tag tree is built from.
    tags: meta.Tag.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    body,
  }
}

/**
 * Stable 6-character lowercase-alphanumeric id derived from the note's path
 * relative to notes/, so a post keeps its URL as long as the note stays put.
 * A note that is renamed or moved lands on a new id; that is the trade for not
 * reading the id out of anything the author edits.
 */
export function resolveHash(relPath, taken) {
  const digest = createHash('sha1').update(relPath, 'utf8').digest()
  const full = BigInt('0x' + digest.subarray(0, 12).toString('hex')).toString(36)
  for (let len = 6; len <= full.length; len++) {
    const candidate = full.slice(0, len)
    if (!taken.has(candidate)) {
      taken.add(candidate)
      return candidate
    }
  }
  throw new Error(`Could not derive a unique id for ${relPath}`)
}

// ---------------------------------------------------------------------------
// Source pre-processing
// ---------------------------------------------------------------------------

/**
 * Ported verbatim from markdown-rendering/source/markdown.tsx (escapeBrackets):
 * turns LaTeX's \[..\] / \(..\) delimiters into the $$..$$ / $..$ that
 * remark-math understands, without touching fenced or inline code.
 */
export function escapeBrackets(text) {
  const pattern = /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g
  return text.replace(pattern, (match, codeBlock, squareBracket, roundBracket) => {
    if (codeBlock) return codeBlock
    if (squareBracket) return `$$${squareBracket}$$`
    if (roundBracket) return `$${roundBracket}$`
    return match
  })
}

/**
 * Points every local image at /image/<basename>; remote URLs are left alone.
 * Some references arrive percent-encoded (Typora encodes the Windows path into
 * the href), so they are decoded before the basename is taken.
 */
function rewriteImageSrc(src) {
  if (!src) return src
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return src

  let decoded = src
  if (/%[0-9a-fA-F]{2}/.test(decoded)) {
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      /* leave it encoded and take the basename as-is */
    }
  }
  const base = decoded.replace(/\\/g, '/').split('/').pop()
  return base ? `/image/${base}` : src
}

// ---------------------------------------------------------------------------
// rehype plugins
// ---------------------------------------------------------------------------

/** Rewrites <img> sources and turns Typora's ignored `zoom:N%` into a real width. */
function rehypeImages() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return
      const props = node.properties ?? (node.properties = {})

      props.src = rewriteImageSrc(props.src)
      props.loading = props.loading ?? 'lazy'
      props.decoding = props.decoding ?? 'async'

      const style = typeof props.style === 'string' ? props.style : ''
      const zoom = style.match(/zoom\s*:\s*([\d.]+)\s*%/i)
      if (zoom) {
        const rest = style
          .split(';')
          .map((d) => d.trim())
          .filter((d) => d && !/^zoom\s*:/i.test(d))
        // max() keeps the author's shrink intent but stops a 25% screenshot
        // from collapsing into an unreadable sliver.
        rest.push(`max-width:max(${zoom[1]}%,200px)`)
        props.style = rest.join(';')
      }
    })
  }
}

/** The page supplies the <h1>; demote any in-body H1 so there is only one. */
function rehypeDemoteHeadings() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'h1') node.tagName = 'h2'
    })
  }
}

/** Fenced blocks are wrapped so the client can attach copy + fold controls. */
function rehypeCodeBlocks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return
      const code = node.children?.find((c) => c.type === 'element' && c.tagName === 'code')
      if (!code) return
      const lang = (code.properties?.className ?? [])
        .map(String)
        .find((c) => c.startsWith('language-'))
        ?.slice('language-'.length)

      if (lang === 'mermaid') {
        node.tagName = 'div'
        node.properties = { className: ['mermaid-block'] }
        node.children = [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['mermaid-source'], hidden: true },
            children: [{ type: 'text', value: rawText(code) }],
          },
        ]
        return
      }

      code.properties.className = [...(code.properties.className ?? []), 'code-body']
      node.properties = { ...(node.properties ?? {}), className: ['code-block'] }
    })
  }
}

function rawText(node) {
  if (node.type === 'text') return node.value
  if (node.children) return node.children.map(rawText).join('')
  return ''
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkBreaks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  // A handful of notes wrap Chinese prose in $..$, which KaTeX reports as
  // "unicode text in math mode". Rendering it as text is the least surprising
  // outcome, so strict mode is off rather than the note being dropped.
  .use(rehypeKatex, { strict: 'ignore', throwOnError: false })
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeDemoteHeadings)
  .use(rehypeImages)
  .use(rehypeCodeBlocks)
  .use(rehypeStringify, { allowDangerousHtml: true })

const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkBreaks)

export function renderMarkdown(source) {
  const normalised = source.replace(/\r\n?/g, '\n')
  return String(processor.processSync(escapeBrackets(normalised)))
}

const HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  nbsp: ' ',
  '#x27': "'",
  '#x2F': '/',
  '#x3C': '<',
  '#x3E': '>',
  '#x26': '&',
}

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, name) => {
    if (HTML_ENTITIES[name] != null) return HTML_ENTITIES[name]
    if (name[0] === '#') {
      const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
      if (Number.isFinite(code)) return String.fromCodePoint(code)
    }
    return m
  })
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
}

/**
 * Plain text used for the list excerpt and the search index. Maths is dropped
 * entirely (the KaTeX markup would otherwise index as a soup of symbols) and
 * raw HTML is reduced to its text.
 */
export function toPlainText(source, { limit = Infinity } = {}) {
  const tree = parser.parse(source.replace(/\r\n?/g, '\n'))
  const chunks = []

  const walk = (node, inMath) => {
    if (chunks.join(' ').length > limit) return
    switch (node.type) {
      case 'text':
        if (!inMath) chunks.push(node.value)
        break
      case 'inlineCode':
      case 'code':
        if (!inMath) chunks.push(node.value)
        break
      case 'html':
        if (!inMath) chunks.push(stripTags(node.value))
        break
      case 'inlineMath':
      case 'math':
        return // dropped on purpose
      case 'image':
        return
      case 'break':
        chunks.push(' ')
        break
      case 'tableCell':
      case 'paragraph':
      case 'heading':
      case 'listItem': {
        for (const child of node.children ?? []) walk(child, inMath)
        chunks.push(' ')
        break
      }
      default:
        for (const child of node.children ?? []) walk(child, inMath)
    }
  }

  walk(tree, false)

  return chunks
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s([,.!?;:，。！？；：])/g, '$1')
    .trim()
}

/** First paragraph of the note — what the Post list shows under the title. */
export function firstParagraph(source, limit = 170) {
  const tree = parser.parse(source.replace(/\r\n?/g, '\n'))
  const body = tree.children.find(
    (node) => node.type === 'paragraph' || node.type === 'heading' || node.type === 'list',
  )
  if (!body) return ''
  const text = toPlainTextFromNode(body, parser)
  return text.length > limit ? text.slice(0, limit).trimEnd() + '…' : text
}

function toPlainTextFromNode(node, _parser) {
  const fake = { type: 'root', children: [node] }
  let out = ''
  const walk = (n) => {
    switch (n.type) {
      case 'text':
      case 'inlineCode':
      case 'code':
        out += n.value
        break
      case 'html':
        out += stripTags(n.value)
        break
      case 'inlineMath':
      case 'math':
      case 'image':
        break
      default:
        for (const child of n.children ?? []) walk(child)
    }
  }
  walk(fake)
  return out.replace(/\s+/g, ' ').trim()
}
