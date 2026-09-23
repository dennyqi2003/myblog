// Post bodies are emitted as one file per post so opening an article fetches
// only that article. A router guard resolves the body *before* the route
// changes, which keeps SSR and client navigation identical and avoids a
// "content flashes in" state.

import { byHash } from './data.js'

const loaders = import.meta.glob('./generated/content/*.html', {
  query: '?raw',
  import: 'default',
})

const cache = new Map()

export async function loadBody(hash) {
  if (cache.has(hash)) return cache.get(hash)
  const load = loaders[`./generated/content/${hash}.html`]
  const html = load ? await load() : ''
  cache.set(hash, html)
  return html
}

/** Synchronous read — valid once `loadBody` has resolved for this hash. */
export function bodyOf(hash) {
  return cache.get(hash) ?? ''
}

export async function prefetchRoute(to) {
  if (to.name === 'post' && byHash.has(to.params.hash)) {
    await loadBody(to.params.hash)
  }
}
