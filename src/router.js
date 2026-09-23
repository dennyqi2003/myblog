import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router'
import { site } from './site.js'
import { byHash } from './data.js'
import { prefetchRoute } from './content.js'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/page/:n(\\d+)/', name: 'page', component: () => import('./views/HomeView.vue') },
  { path: '/archive/', name: 'archive', component: () => import('./views/ArchiveView.vue') },
  { path: '/tags/', name: 'tags', component: () => import('./views/TagsView.vue') },
  { path: '/search/', name: 'search', component: () => import('./views/SearchView.vue') },
  { path: '/faq/', name: 'faq', component: () => import('./views/FaqView.vue') },
  { path: '/post/:hash/', name: 'post', component: () => import('./views/PostView.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/NotFoundView.vue'),
  },
]

/** Title comes from the manifest, not from the rendered view, so the
 *  prerenderer and the client always agree. */
export function titleFor(route) {
  const base = site.title
  switch (route.name) {
    case 'post': {
      const post = byHash.get(route.params.hash)
      return post ? `${post.title} · ${base}` : `Not found · ${base}`
    }
    case 'archive':
      return `Archive · ${base}`
    case 'tags':
      return `Tags · ${base}`
    case 'search':
      return `Search · ${base}`
    case 'faq':
      return `FAQ · ${base}`
    case 'page':
      return `Posts — page ${route.params.n} · ${base}`
    case 'not-found':
      return `Not found · ${base}`
    default:
      return base
  }
}

export function createAppRouter(ssr = false) {
  const router = createRouter({
    history: ssr ? createMemoryHistory('/') : createWebHistory('/'),
    routes,
    scrollBehavior(to, from, saved) {
      if (to.hash) return { el: to.hash, top: 64 }
      if (to.path !== from.path) return { top: 0 }
      // Same page. A saved position (back/forward) wins; otherwise the only
      // thing that changed is the query — picking a tag filters the list
      // rather than moving the reader, so `false` leaves the scroll alone.
      return saved ?? false
    },
  })

  router.beforeResolve((to) => prefetchRoute(to))

  return router
}
