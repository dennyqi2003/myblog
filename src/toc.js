// Post outline, derived from the already-rendered body HTML. This lives on the
// display side on purpose: the build hands over plain HTML, and the frontend
// gives the headings anchors and reads the outline back out of them. It runs on
// strings rather than the DOM, so the prerenderer and the browser produce the
// same ids and the same sidebar markup.

import { bodyOf } from './content.js'

const HEADING = /<h([2-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi
const ID_ATTR = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/i

const cache = new Map()

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Visible text of a heading. KaTeX renders every formula twice (MathML for
 *  screen readers, HTML for the eye); only the MathML annotation is dropped so
 *  the text is not doubled. */
function headingText(inner) {
  const withoutMathml = inner.replace(/<span class="katex-mathml">[\s\S]*?<\/math><\/span>/g, '')
  return decodeEntities(withoutMathml.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
}

/** GitHub-style slug: lowercased, punctuation dropped, spaces to hyphens.
 *  CJK characters are letters and survive as-is. */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-')
}

/** Heading markup for the outline: links flattened to text (an <a> cannot
 *  sit inside the outline's own <a>), ids removed so nothing is duplicated. */
function outlineHtml(inner) {
  return inner
    .replace(/<a\b[^>]*>/gi, '')
    .replace(/<\/a>/gi, '')
    .replace(/\sid\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
}

/**
 * @param {string} html rendered post body
 * @returns {{ html: string, items: Array, flat: Array }}
 *   `html` — the body with an id on every h2–h6;
 *   `items` — nested outline, each node `{ id, level, number, html, children }`;
 *   `flat` — the same nodes in document order (what the scroll spy indexes).
 */
export function buildOutline(html) {
  const taken = new Set()
  for (const m of html.matchAll(/\sid\s*=\s*"([^"]*)"/g)) taken.add(m[1])

  const flat = []
  const out = html.replace(HEADING, (whole, level, attrs = '', inner) => {
    const text = headingText(inner)
    if (!text) return whole

    const existing = attrs.match(ID_ATTR)
    let id = existing ? existing[1] ?? existing[2] : ''
    if (!id) {
      const base = slugify(text) || 'section'
      id = base
      for (let n = 1; taken.has(id); n++) id = `${base}-${n}`
      taken.add(id)
    }

    flat.push({ id, level: Number(level), html: outlineHtml(inner), children: [] })
    return existing ? whole : `<h${level} id="${id}"${attrs}>${inner}</h${level}>`
  })

  // Nest by relative level, so a note that skips from h2 to h4 still gets a
  // child rather than a hole, and a note whose top heading is h3 still starts
  // at 1.
  const items = []
  const stack = []
  for (const node of flat) {
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop()
    const siblings = stack.length ? stack[stack.length - 1].children : items
    siblings.push(node)
    node.parent = stack[stack.length - 1] ?? null
    stack.push(node)
  }

  // Hexo's list_number format: 1. / 1.1. / 1.1.1.
  const number = (nodes, prefix) =>
    nodes.forEach((node, i) => {
      node.number = `${prefix}${i + 1}.`
      number(node.children, node.number)
    })
  number(items, '')

  return { html: out, items, flat }
}

/** Outline for a post whose body `loadBody` has already fetched. */
export function outlineOf(hash) {
  if (cache.has(hash)) return cache.get(hash)
  const html = bodyOf(hash)
  const outline = buildOutline(html)
  if (html) cache.set(hash, outline)
  return outline
}
