<script setup>
// The second sidebar card, after NexT's Pisces scheme (layout/_macro/sidebar.njk
// and the TOC / back-to-top parts of source/js/utils.js).
//
// On a post with headings it has two tabs — the outline and the site overview —
// and opens on the outline. Everywhere else it is just the overview. The
// behaviour is NexT's: the heading above the top of the window is the current
// one, its branch of the outline is unfolded, and the outline scrolls itself to
// keep that entry in the middle.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { posts } from '../data.js'
import { site } from '../site.js'
import { outlineOf } from '../toc.js'
import FaIcon from './FaIcon.vue'
import TocList from './TocList.vue'

const emit = defineEmits(['navigate'])

const route = useRoute()

const outline = computed(() =>
  route.name === 'post' ? outlineOf(route.params.hash) : { items: [], flat: [] },
)
const hasToc = computed(() => outline.value.flat.length > 0)

// --- tabs ---------------------------------------------------------------------

const chosen = ref('toc')
const panel = computed(() => (hasToc.value ? chosen.value : 'overview'))

const container = ref(null)
const tocPanel = ref(null)
const overviewPanel = ref(null)
const panelVars = reactive({})

/** NexT's activateSidebarPanel: the two panels share one grid cell, and the
 *  heights they animate between are measured just before the swap. */
function activate(name) {
  if (panel.value === name) return
  const heights = {
    toc: topHeight.value || tocPanel.value?.scrollHeight || 0,
    overview: overviewPanel.value?.scrollHeight || 0,
  }
  panelVars['--inactive-panel-height'] = `${heights[panel.value]}px`
  panelVars['--active-panel-height'] = `${heights[name]}px`
  chosen.value = name
}

// --- outline state --------------------------------------------------------------

const currentIndex = ref(-1)
const rowHeight = ref(0)

const current = computed(() => outline.value.flat[currentIndex.value] ?? null)

const active = computed(() => {
  const ids = new Set()
  for (let node = current.value; node; node = node.parent) ids.add(node.id)
  return ids
})

/** NexT's activateNavByIndex height pass: every list on the current branch is
 *  opened to the height of its own rows plus the open list nested inside it,
 *  so the unfold can be a height transition rather than a jump. Rows never
 *  wrap (white-space: nowrap), so a row is one line-height tall. */
const expanded = computed(() => {
  const heights = new Map()
  let top = 0
  const node = current.value
  if (node && rowHeight.value) {
    let h = 0
    if (node.children.length) {
      h = node.children.length * rowHeight.value + 5
      heights.set(node.id, h)
    }
    for (let child = node; child; child = child.parent) {
      const siblings = child.parent ? child.parent.children : outline.value.items
      h += siblings.length * rowHeight.value + 5
      if (child.parent) heights.set(child.parent.id, h)
      else top = h
    }
  }
  return { heights, top }
})
const heights = computed(() => expanded.value.heights)
const topHeight = computed(() => expanded.value.top)

let sections = []

function collectSections() {
  sections = outline.value.flat.map((node) => document.getElementById(node.id))
  const row = container.value?.querySelector('.post-toc .nav-item')
  if (row) rowHeight.value = parseFloat(getComputedStyle(row).lineHeight) || 0
}

/** NexT's updateActiveNav: the last heading whose top has passed 10px from
 *  the top of the window; before the first one, the first one. */
function updateActiveNav() {
  if (!sections.length) return
  let index = sections.findIndex((el) => el?.getBoundingClientRect().top > 10)
  if (index === -1) index = sections.length - 1
  else if (index > 0) index--
  if (index !== currentIndex.value) currentIndex.value = index
}

// Keep the current entry in the middle of the outline when it is taller than
// the card, as NexT does.
watch(currentIndex, async () => {
  await nextTick()
  const box = container.value
  const target = box?.querySelector('.post-toc .active-current')
  if (!box || !target || panel.value !== 'toc') return
  const top =
    box.scrollTop -
    box.offsetHeight / 2 +
    target.getBoundingClientRect().top -
    box.getBoundingClientRect().top
  box.scrollTo({ top, behavior: 'smooth' })
})

function jump(id) {
  const target = document.getElementById(id)
  if (!target) return
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' })
  // replaceState rather than pushState: the router owns history entries.
  history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
  emit('navigate')
}

// --- back to top ----------------------------------------------------------------

const percent = ref(0)

function onScroll() {
  const height = document.body.scrollHeight - window.innerHeight
  percent.value = height > 0 ? Math.min((100 * window.scrollY) / height, 100) : 0
  updateActiveNav()
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// --- lifecycle ----------------------------------------------------------------

watch(
  () => route.path,
  () => {
    chosen.value = 'toc'
    currentIndex.value = -1
    collectSections()
    onScroll()
  },
  { flush: 'post' },
)

onMounted(() => {
  collectSections()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <aside class="sidebar">
    <div
      class="sidebar-inner"
      :class="[
        panel === 'toc' ? 'sidebar-toc-active' : 'sidebar-overview-active',
        { 'sidebar-nav-active': hasToc },
      ]"
    >
      <ul class="sidebar-nav">
        <li class="sidebar-nav-toc" @click="activate('toc')">Table of Contents</li>
        <li class="sidebar-nav-overview" @click="activate('overview')">Overview</li>
      </ul>

      <div ref="container" class="sidebar-panel-container" :style="panelVars">
        <div ref="tocPanel" class="post-toc-wrap sidebar-panel">
          <div v-if="hasToc" class="post-toc">
            <TocList
              :items="outline.items"
              :active="active"
              :current="current?.id ?? ''"
              :heights="heights"
              :style="{ '--height': `${topHeight}px` }"
              @jump="jump"
            />
          </div>
        </div>

        <div ref="overviewPanel" class="site-overview-wrap sidebar-panel">
          <a class="site-author" :href="site.homepage" target="_blank" rel="noopener">
            <img
              class="site-author-image"
              :src="site.avatar"
              :alt="site.author"
              width="96"
              height="96"
            />
            <p class="site-author-name">{{ site.displayName }}</p>
          </a>

          <nav class="site-state">
            <div class="site-state-item site-state-posts">
              <router-link to="/archive/">
                <span class="site-state-item-count">{{ posts.length }}</span>
                <span class="site-state-item-name">posts</span>
              </router-link>
            </div>
          </nav>
        </div>
      </div>

      <div
        class="back-to-top"
        :class="{ 'back-to-top-on': Math.round(percent) >= 5 }"
        role="button"
        aria-label="Back to top"
        tabindex="0"
        @click="backToTop"
        @keydown.enter="backToTop"
      >
        <FaIcon name="arrow-up" />
        <span>{{ Math.round(percent) }}%</span>
      </div>
    </div>
  </aside>
</template>
