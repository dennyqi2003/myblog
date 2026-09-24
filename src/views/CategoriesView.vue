<script setup>
// The category tree works as an accordion: one branch is open at a time, down
// to the category last clicked. Opening a category closes whatever else was
// open beside it; clicking an open category closes it. Notes appear inside
// the tree, under the category they are filed in.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { posts, postsByTag, tagTree } from '../data.js'
import TagNode from '../components/TagNode.vue'

const route = useRoute()
const router = useRouter()

const isValid = (path) => Boolean(path) && postsByTag.has(path)
const openPath = ref(isValid(route.query.t) ? String(route.query.t) : '')

/** Notes whose tag list ends at a given path, oldest first. */
const direct = (() => {
  const map = new Map()
  for (const post of posts) {
    const key = post.tags.join('/')
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(post)
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.date === b.date ? a.titleOrder - b.titleOrder : a.date.localeCompare(b.date)))
  }
  return map
})()

const parentOf = (path) => path.split('/').slice(0, -1).join('/')

function setOpen(path) {
  openPath.value = path
  router.replace({ query: path ? { t: path } : {} })
}

function toggle(path) {
  const isOpen = openPath.value === path || openPath.value.startsWith(`${path}/`)
  setOpen(isOpen ? parentOf(path) : path)
}

// Arriving from a category chip on a post opens that branch.
watch(
  () => route.query.t,
  (value) => {
    const path = isValid(value) ? String(value) : ''
    if (path !== openPath.value) openPath.value = path
  },
)

/** The open branch, as a trail of clickable steps. */
const trail = computed(() => {
  if (!openPath.value) return []
  const parts = openPath.value.split('/')
  return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
})

const openCount = computed(() => postsByTag.get(openPath.value)?.length ?? 0)
</script>

<template>
  <div class="view post-block">
    <header class="view-header categories-header">
      <h1 class="view-title">Categories</h1>
      <nav v-if="trail.length" class="category-trail" aria-label="Open category">
        <button class="trail-step" type="button" @click="setOpen('')">All</button>
        <template v-for="(step, i) in trail" :key="step.path">
          <span class="trail-sep" aria-hidden="true">/</span>
          <button
            class="trail-step"
            :class="{ current: i === trail.length - 1 }"
            type="button"
            @click="setOpen(step.path)"
          >
            {{ step.name }}
          </button>
        </template>
        <span class="trail-count">{{ openCount }} notes</span>
      </nav>
    </header>

    <ul class="tag-tree tag-tree-root">
      <TagNode
        v-for="node in tagTree"
        :key="node.path"
        :node="node"
        :open-path="openPath"
        :direct="direct"
        @toggle="toggle"
      />
    </ul>
  </div>
</template>
