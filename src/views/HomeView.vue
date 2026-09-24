<script setup>
import { computed } from 'vue'
import { pagePosts, totalPages } from '../data.js'
import PostListItem from '../components/PostListItem.vue'
import PageNav from '../components/PageNav.vue'

const props = defineProps({
  n: { type: String, default: '1' },
})

const current = computed(() => {
  const value = Number.parseInt(props.n, 10)
  return Number.isFinite(value) && value >= 1 ? value : 1
})

const items = computed(() => pagePosts(current.value))
const pageRoute = (n) => (n === 1 ? '/' : `/page/${n}/`)
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

    <PageNav v-if="totalPages > 1" :current="current" :total="totalPages" :to="pageRoute" />
  </div>
</template>
