// Build step 2 of 2: after `vite build` has produced the client bundle in
// dist/, render every route to static HTML so the site is fully readable
// without JavaScript (and crawlers see real content).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrOut = path.join(root, 'dist-ssr')

const templatePath = path.join(dist, 'index.html')
if (!fs.existsSync(templatePath)) {
  console.error('dist/index.html is missing — run `vite build` first.')
  process.exit(1)
}
const template = fs.readFileSync(templatePath, 'utf8')

console.log('· building the server bundle')
await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: path.join(root, 'src', 'entry-server.js'),
    outDir: 'dist-ssr',
    emptyOutDir: true,
    ssrEmitAssets: false,
  },
})

const { render } = await import(pathToFileURL(path.join(ssrOut, 'entry-server.js')).href)
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/manifest.json'), 'utf8'))

const perPage = 10
const pageCount = Math.max(1, Math.ceil(manifest.posts.length / perPage))

const routes = [
  '/',
  '/archive/',
  '/tags/',
  '/search/',
  '/faq/',
  ...Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => `/page/${i + 2}/`),
  ...manifest.posts.map((post) => `/post/${post.hash}/`),
]

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function writePage(route, html, title, description, targetOverride) {
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}">` : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  const page = template
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace('<div id="app"></div>', `<div id="app">${html}</div>`)

  const target =
    targetOverride ??
    (route === '/'
      ? path.join(dist, 'index.html')
      : path.join(dist, route.replace(/^\/|\/$/g, ''), 'index.html'))

  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, page, 'utf8')
}

let written = 0
const started = Date.now()

for (const route of routes) {
  const { html, title } = await render(route)
  const post = route.startsWith('/post/')
    ? manifest.posts.find((p) => `/post/${p.hash}/` === route)
    : null

  writePage(route, html, title, post?.excerpt ?? '')
  written++
  if (written % 100 === 0) console.log(`  rendered ${written}/${routes.length}`)
}

// A static 404 for the host to fall back on.
const notFound = await render('/this-page-does-not-exist/')
writePage('/404', notFound.html, notFound.title, '', path.join(dist, '404.html'))

fs.rmSync(ssrOut, { recursive: true, force: true })

console.log(
  `  prerendered ${written + 1} pages in ${((Date.now() - started) / 1000).toFixed(1)}s`,
)
