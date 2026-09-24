<script setup>
import { computed } from 'vue'
import { pagePosts, totalPages } from '../data.js'
import PostListItem from '../components/PostListItem.vue'

const props = defineProps({
  n: { type: String, default: '1' },
})

const current = computed(() => {
  const value = Number.parseInt(props.n, 10)
  return Number.isFinite(value) && value >= 1 ? value : 1
})

const items = computed(() => pagePosts(current.value))
const hasPrev = computed(() => current.value > 1)
const hasNext = computed(() => current.value < totalPages)
const prevTo = computed(() => (current.value === 2 ? '/' : `/page/${current.value - 1}/`))
</script>

<template>
  <div class="view">
    <!-- Each post is its own card (NexT Gemini .post-block). -->
    <div v-if="!items.length" class="empty-note post-block">
      <p>No notes yet. Drop a markdown file into <code>notes/</code> and rebuild.</p>
    </div>

    <PostListItem
      v-for="(post, i) in items"
      :key="post.hash"
      class="post-block"
      :post="post"
      :index="i"
    />

    <nav v-if="totalPages > 1" class="pagination">
      <router-link v-if="hasPrev" class="page-link sweep" :to="prevTo">← Newer</router-link>
      <span v-else class="page-link disabled">← Newer</span>

      <span class="page-status">{{ current }} / {{ totalPages }}</span>

      <router-link v-if="hasNext" class="page-link sweep" :to="`/page/${current + 1}/`">
        Older →
      </router-link>
      <span v-else class="page-link disabled">Older →</span>
    </nav>
  </div>
</template>
