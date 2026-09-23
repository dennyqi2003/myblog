<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsByTag, tagTree } from '../data.js'
import TagTree from '../components/TagTree.vue'
import PostListItem from '../components/PostListItem.vue'

const route = useRoute()
const router = useRouter()

const isValid = (path) => Boolean(path) && postsByTag.has(path)
const selected = ref(isValid(route.query.t) ? String(route.query.t) : '')

const openPaths = ref(new Set(expandedFor(selected.value)))

/** Every ancestor of the selected tag should be expanded on arrival. */
function expandedFor(path) {
  const open = new Set()
  if (!path) return open
  let trail = ''
  for (const part of path.split('/')) {
    trail = trail ? `${trail}/${part}` : part
    open.add(trail)
  }
  return open
}

function select(path) {
  selected.value = path
  router.replace({ query: path ? { t: path } : {} })
  openPaths.value = new Set([...openPaths.value, ...expandedFor(path)])
}

function toggle(path) {
  const next = new Set(openPaths.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  openPaths.value = next
}

// Keep the address bar and the tree in step when arriving from a tag chip.
watch(
  () => route.query.t,
  (value) => {
    const path = isValid(value) ? String(value) : ''
    if (path === selected.value) return
    selected.value = path
    openPaths.value = new Set([...openPaths.value, ...expandedFor(path)])
  },
)

/** Filed under the selected tag, by title A→Z rather than by date. */
const matches = computed(() =>
  selected.value
    ? [...(postsByTag.get(selected.value) ?? [])].sort((a, b) => a.titleOrder - b.titleOrder)
    : [],
)

const breadcrumb = computed(() => (selected.value ? selected.value.split('/') : []))
</script>

<template>
  <div class="view">
    <header class="view-header">
      <h1 class="view-title">Tag</h1>
      <p class="view-subtitle">
        {{ tagTree.length }} top-level categories.
        {{ selected ? '' : 'Pick a tag to narrow the list.' }}
      </p>
    </header>

    <div class="tags-layout">
      <nav class="tags-panel" aria-label="Tag tree">
        <TagTree
          :selected="selected"
          :open-paths="openPaths"
          @select="select"
          @toggle="toggle"
        />
      </nav>

      <div class="tags-results">
        <div v-if="!selected" class="empty-note">
          <p>Select a tag on the left. Counts include every note filed underneath.</p>
        </div>

        <template v-else>
          <!-- Keyed on the selection so the panel re-enters whenever the tag
               changes, which reads as the list being replaced rather than
               flickering from one set of rows into another. -->
          <div :key="selected" class="tag-hits">
            <div class="tags-breadcrumb">
              <button class="crumb" type="button" @click="select('')">All</button>
              <template v-for="(part, i) in breadcrumb" :key="part">
                <span class="crumb-sep">/</span>
                <button
                  class="crumb"
                  type="button"
                  @click="select(breadcrumb.slice(0, i + 1).join('/'))"
                >
                  {{ part }}
                </button>
              </template>
              <span class="crumb-total">{{ matches.length }} notes</span>
            </div>

            <div v-if="!matches.length" class="empty-note">
              <p>Nothing filed under this tag yet.</p>
            </div>
            <PostListItem v-for="(post, i) in matches" :key="post.hash" :post="post" :index="i" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
