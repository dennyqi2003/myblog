// Build step 1 of 2: turn notes/*.md into the data and pre-rendered HTML the
// Vue app consumes. Runs before `vite build`, so rolling out new notes is just
// `git pull && npm run build`.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  HIDDEN_TAGS,
  openingText,
  parseNote,
  renderMarkdown,
  resolveHash,
  toPlainText,
} from './lib/notes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NOTES = path.join(root, 'notes')
const IMAGES = path.join(NOTES, 'image')
const GENERATED = path.join(root, 'src', 'generated')
const CONTENT = path.join(GENERATED, 'content')
const PUBLIC_IMAGE = path.join(root, 'public', 'image')
const CATEGORY_ORDER = path.join(root, 'src', 'data', 'category-order.txt')

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`

fs.rmSync(GENERATED, { recursive: true, force: true })
fs.rmSync(PUBLIC_IMAGE, { recursive: true, force: true })
fs.mkdirSync(CONTENT, { recursive: true })
fs.mkdirSync(PUBLIC_IMAGE, { recursive: true })

// ---------------------------------------------------------------------------
// 1. Find every .md file, at any depth
// ---------------------------------------------------------------------------

/** Relative POSIX paths of every .md under notes/, sorted so the order is stable. */
function findNotes(dir, prefix = '') {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) found.push(...findNotes(path.join(dir, entry.name), rel))
    else if (entry.name.toLowerCase().endsWith('.md')) found.push(rel)
  }
  return found
}

const warnings = []
const notePaths = findNotes(NOTES).sort()
const taken = new Set()
const posts = []
const hiddenNotes = []

// ---------------------------------------------------------------------------
// 2. Read and parse
// ---------------------------------------------------------------------------

for (const relPath of notePaths) {
  const source = fs.readFileSync(path.join(NOTES, relPath), 'utf8')
  const meta = parseNote(source)
  if (!meta) {
    warnings.push(`metadata header missing or malformed, skipped: ${relPath}`)
    continue
  }
  // [^Visible]: 0 — a note still being written. It is left out of
  // everything: list, archive, categories, search, and the pages themselves.
  if (!meta.visible) {
    hiddenNotes.push(relPath)
    continue
  }
  if (meta.orderInvalid) warnings.push(`[^Order] is not an integer, ignored: ${relPath}`)

  // Tags used as workflow markers are dropped from the tag list but do not
  // hide the note: drafts under tmp/ and old/ stay published, as before.
  const tags = meta.tags.filter((t) => !HIDDEN_TAGS.has(t))

  posts.push({
    hash: resolveHash(relPath, taken),
    file: relPath,
    title: meta.title,
    date: meta.date,
    ert: meta.ert,
    author: meta.author,
    tags,
    hiddenTagCount: meta.tags.length - tags.length,
    summary: meta.summary,
    order: meta.order,
    // Metadata-free, so nothing downstream has to strip it again.
    body: meta.body,
  })
}

// Newest first; ties broken by title so the order is deterministic.
posts.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, 'zh') : b.date.localeCompare(a.date)))

// ---------------------------------------------------------------------------
// 3. Render
// ---------------------------------------------------------------------------

const referencedImages = new Set()
const searchDocs = []
const manifest = []

for (const post of posts) {
  const html = renderMarkdown(post.body)
  fs.writeFileSync(path.join(CONTENT, `${post.hash}.html`), html, 'utf8')

  for (const m of html.matchAll(/<img[^>]*\ssrc="\/image\/([^"]+)"/g)) referencedImages.add(m[1])

  const text = toPlainText(post.body)
  searchDocs.push({ h: post.hash, t: post.title, g: post.tags, d: post.date, x: text })

  manifest.push({
    hash: post.hash,
    title: post.title,
    date: post.date,
    ert: post.ert,
    author: post.author,
    tags: post.tags,
    // The list excerpt: the author's [^Summary], rendered like the body
    // (markdown + maths) and shown in full; otherwise the opening text of the
    // note, which the list clamps to two lines.
    summaryHtml: post.summary ? renderMarkdown(post.summary) : '',
    excerpt: openingText(post.body),
    // [^Order]: sort key within a category; null when not given.
    order: post.order,
    file: post.file,
  })
}

// A second, stable ordering for the tag listings. The rank is assigned here,
// in Node, rather than sorted in the browser: `localeCompare` only agrees
// between the pre-rendered HTML and the hydrated client if their ICU data
// agrees, and the tag page shows a whole list in this order.
{
  const byTitle = [...manifest].sort((a, b) => a.title.localeCompare(b.title, 'zh'))
  byTitle.forEach((post, i) => {
    post.titleOrder = i
  })
}

// ---------------------------------------------------------------------------
// 3. Tag tree
// ---------------------------------------------------------------------------

const roots = []
const byPath = new Map()

for (const post of manifest) {
  let level = roots
  let trail = ''
  for (const tag of post.tags) {
    trail = trail ? `${trail}/${tag}` : tag
    let node = byPath.get(trail)
    if (!node) {
      node = { name: tag, path: trail, count: 0, children: [] }
      byPath.set(trail, node)
      level.push(node)
    }
    node.count++
    level = node.children
  }
}

// Sibling order comes from src/data/category-order.txt: an indented outline
// of category names, listed in the order they should appear. Categories it
// does not mention follow the listed ones, alphabetically.
function readCategoryOrder(file) {
  const rank = new Map()
  if (!fs.existsSync(file)) return rank
  const stack = []
  let position = 0
  for (const raw of fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').split('\n')) {
    const name = raw.trim()
    if (!name || name.startsWith('#')) continue
    const indent = raw.match(/^[ \t]*/)[0].replace(/\t/g, '  ').length
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
    const trail = stack.length ? `${stack[stack.length - 1].path}/${name}` : name
    // The first mention wins; a repeat is almost certainly a leftover.
    if (rank.has(trail)) warnings.push(`category-order.txt lists a category twice: ${trail}`)
    else rank.set(trail, position++)
    stack.push({ indent, path: trail })
  }
  return rank
}

const categoryRank = readCategoryOrder(CATEGORY_ORDER)
for (const listed of categoryRank.keys()) {
  if (!byPath.has(listed)) warnings.push(`category-order.txt lists a category no note uses: ${listed}`)
}

const bySetting = (a, b) => {
  const ra = categoryRank.get(a.path)
  const rb = categoryRank.get(b.path)
  if (ra !== undefined && rb !== undefined) return ra - rb
  if (ra !== undefined) return -1
  if (rb !== undefined) return 1
  return a.name.localeCompare(b.name, 'zh')
}

const trim = (nodes) => {
  nodes.sort(bySetting)
  for (const n of nodes) trim(n.children)
  return nodes
}
trim(roots)

// ---------------------------------------------------------------------------
// 4. Images actually referenced by at least one note
// ---------------------------------------------------------------------------

let copied = 0
let copiedBytes = 0
const missing = []

for (const base of referencedImages) {
  const from = path.join(IMAGES, base)
  if (!fs.existsSync(from)) {
    missing.push(base)
    continue
  }
  fs.copyFileSync(from, path.join(PUBLIC_IMAGE, base))
  copied++
  copiedBytes += fs.statSync(from).size
}

// ---------------------------------------------------------------------------
// 5. FAQ
// ---------------------------------------------------------------------------

const faqSource = path.join(root, 'src', 'data', 'faq.md')
const faqHtml = fs.existsSync(faqSource)
  ? renderMarkdown(fs.readFileSync(faqSource, 'utf8'))
  : '<p class="empty">No FAQ entries yet.</p>'
fs.writeFileSync(path.join(GENERATED, 'faq.html'), faqHtml, 'utf8')

// ---------------------------------------------------------------------------
// 6. Write
// ---------------------------------------------------------------------------

fs.writeFileSync(
  path.join(GENERATED, 'manifest.json'),
  JSON.stringify({ posts: manifest, tags: roots }),
  'utf8',
)

const searchPath = path.join(root, 'public', 'search.json')
fs.writeFileSync(searchPath, JSON.stringify({ docs: searchDocs }), 'utf8')

// ---------------------------------------------------------------------------
// 7. Report
// ---------------------------------------------------------------------------

const perPage = 10
console.log('')
console.log(`  notes found       ${notePaths.length} .md files, at any depth`)
console.log(`  posts published   ${manifest.length}`)
console.log(
  `  date range        ${manifest[manifest.length - 1]?.date} .. ${manifest[0]?.date}`,
)
console.log(`  tag tree roots    ${roots.length}  (${byPath.size} nodes)`)
console.log(`  list pages        ${Math.max(1, Math.ceil(manifest.length / perPage))}`)
console.log(`  images copied     ${copied} → public/image/  (${mb(copiedBytes)})`)
console.log(`  search index      ${mb(fs.statSync(searchPath).size)}`)
let contentBytes = 0
for (const f of fs.readdirSync(CONTENT)) contentBytes += fs.statSync(path.join(CONTENT, f)).size
console.log(`  rendered bodies   ${mb(contentBytes)} across ${fs.readdirSync(CONTENT).length} files`)
if (missing.length) {
  console.log(`  ! ${missing.length} image reference(s) point at files not in notes/image/:`)
  for (const m of missing.slice(0, 8)) console.log(`      ${m}`)
  if (missing.length > 8) console.log(`      … and ${missing.length - 8} more`)
}
if (hiddenNotes.length) {
  console.log(`  hidden            ${hiddenNotes.length} note(s) with [^Visible]: 0`)
  for (const h of hiddenNotes) console.log(`      ${h}`)
}
for (const w of warnings) console.log(`  ! ${w}`)
console.log('')
