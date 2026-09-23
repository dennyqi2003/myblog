<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { site } from './site.js'
import { posts } from './data.js'

const route = useRoute()
const drawerOpen = ref(false)

const nav = [
  { to: '/', label: 'Post' },
  { to: '/archive/', label: 'Archive' },
  { to: '/search/', label: 'Search' },
  { to: '/tags/', label: 'Tag' },
  { to: '/faq/', label: 'FAQ' },
]

const current = computed(() => {
  if (route.name === 'post' || route.name === 'home' || route.name === 'page') return '/'
  return route.path
})

// Any navigation closes the mobile drawer.
watch(() => route.fullPath, () => {
  drawerOpen.value = false
})

const year = new Date().getFullYear()
</script>

<template>
  <div class="site">
    <header class="topbar">
      <button
        class="topbar-toggle"
        type="button"
        :aria-expanded="drawerOpen"
        aria-label="Toggle navigation"
        @click="drawerOpen = !drawerOpen"
      >
        <span /><span /><span />
      </button>
      <router-link class="topbar-title" to="/">{{ site.title }}</router-link>
    </header>

    <div class="main" :class="{ 'drawer-open': drawerOpen }">
      <aside class="sidebar" :class="{ open: drawerOpen }">
        <div class="site-brand">
          <router-link class="site-title" to="/">{{ site.title }}</router-link>
          <p class="site-subtitle">{{ site.subtitle }}</p>
        </div>

        <div class="site-avatar">
          <img :src="site.avatar" :alt="site.author" width="110" height="110" />
        </div>

        <nav class="site-nav">
          <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: current === item.to }"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <p class="site-count">{{ posts.length }} notes</p>
      </aside>

      <div class="drawer-mask" :class="{ open: drawerOpen }" @click="drawerOpen = false" />

      <main class="main-inner">
        <!-- Keyed on the path, not the full path: a new page should mount a new
             element (that is what re-runs the entrance in .view), while picking
             a tag only changes the query and must keep this view — and its
             expanded branches — alive. -->
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="route.path" />
        </router-view>

        <footer class="site-footer">
          <p>&copy; {{ year }} {{ site.author }}</p>
        </footer>
      </main>
    </div>
  </div>
</template>
