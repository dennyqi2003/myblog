<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { site } from './site.js'
import FaIcon from './components/FaIcon.vue'
import SiteSidebar from './components/SiteSidebar.vue'
import CornerButtons from './components/CornerButtons.vue'

const route = useRoute()
const drawerOpen = ref(false)

// NexT's default menu icons: home, th, archive, search, user.
const nav = [
  { to: '/', label: 'Posts', icon: 'home' },
  { to: '/categories/', label: 'Categories', icon: 'th' },
  { to: '/archive/', label: 'Archive', icon: 'archive' },
  { to: '/search/', label: 'Search', icon: 'search' },
  { to: '/about/', label: 'About', icon: 'user' },
]

const current = computed(() => {
  if (route.name === 'post' || route.name === 'home' || route.name === 'page') return '/'
  return route.path
})

// Off a post the whole left column stays put while the page scrolls; on a
// post the brand card scrolls away so the outline has the height.
const pinned = computed(() => route.name !== 'post')

// Any navigation closes the mobile drawer.
watch(() => route.fullPath, () => {
  drawerOpen.value = false
})

const year = new Date().getFullYear()
</script>

<template>
  <div class="site">
    <div class="site-bg" aria-hidden="true" />
    <div class="headband" />

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

    <main class="main" :class="{ 'drawer-open': drawerOpen }">
      <div class="column" :class="{ open: drawerOpen, pinned }">
        <header class="header">
          <!-- The whole black box is the link home, not just the title. -->
          <router-link class="site-brand-container brand" to="/">
            <div class="site-meta">
              <p class="site-title">{{ site.title }}</p>
              <p class="site-subtitle">{{ site.subtitle }}</p>
            </div>
          </router-link>

          <nav class="site-nav">
            <ul class="menu">
              <li v-for="item in nav" :key="item.to" class="menu-item">
                <router-link
                  :to="item.to"
                  :class="{ 'menu-item-active': current === item.to }"
                >
                  <FaIcon :name="item.icon" />{{ item.label }}
                </router-link>
              </li>
            </ul>
          </nav>
        </header>

        <SiteSidebar @navigate="drawerOpen = false" />
      </div>

      <div class="drawer-mask" :class="{ open: drawerOpen }" @click="drawerOpen = false" />

      <div class="main-inner">
        <!-- Keyed on the path, not the full path: a new page should mount a new
             element (that is what re-runs the entrance in .view), while picking
             a tag only changes the query and must keep this view — and its
             expanded branches — alive. -->
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="route.path" />
        </router-view>
      </div>
    </main>

    <footer class="site-footer">
      <p>&copy; {{ year }} {{ site.author }}</p>
    </footer>

    <CornerButtons />
  </div>
</template>
