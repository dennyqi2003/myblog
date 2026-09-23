import manifest from './generated/manifest.json'
import { site } from './site.js'

export const posts = manifest.posts
export const tagTree = manifest.tags

export const byHash = new Map(posts.map((p) => [p.hash, p]))

/** Tag path -> the posts filed under it, counting everything in its subtree. */
export const postsByTag = (() => {
  const map = new Map()
  for (const post of posts) {
    let trail = ''
    for (const tag of post.tags) {
      trail = trail ? `${trail}/${tag}` : tag
      if (!map.has(trail)) map.set(trail, [])
      map.get(trail).push(post)
    }
  }
  return map
})()

export const years = (() => {
  const map = new Map()
  for (const post of posts) {
    const year = post.date.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year).push(post)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})()

export const totalPages = Math.max(1, Math.ceil(posts.length / site.perPage))

export function pagePosts(n) {
  const size = site.perPage
  return posts.slice((n - 1) * size, n * size)
}

/** Neighbouring posts in date order (the list is already newest-first). */
export function neighbours(hash) {
  const i = posts.findIndex((p) => p.hash === hash)
  if (i < 0) return { newer: null, older: null }
  return { newer: posts[i - 1] ?? null, older: posts[i + 1] ?? null }
}
