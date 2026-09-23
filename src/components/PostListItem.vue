<script setup>
import { computed } from 'vue'
import { formatDate, readingTime } from '../site.js'

const props = defineProps({
  post: { type: Object, required: true },
  /** Position in the list; drives the staggered entrance (see .post-item). */
  index: { type: Number, default: 0 },
  /** Replaces the stored excerpt — the search view passes a query snippet. */
  snippet: { type: String, default: '' },
})

const meta = computed(
  () => `${props.post.author} · ${formatDate(props.post.date)} · ${readingTime(props.post.ert)}`,
)

const excerpt = computed(() => props.snippet || props.post.excerpt)

// Past a handful of rows the delay would start to be felt rather than seen.
const stagger = computed(() => Math.min(props.index, 8))
</script>

<template>
  <article class="post-item" :style="{ '--i': stagger }">
    <h2 class="post-item-title">
      <router-link :to="`/post/${post.hash}/`">{{ post.title }}</router-link>
    </h2>
    <div class="post-meta">
      <span>{{ meta }}</span>
    </div>
    <p v-if="excerpt" class="post-item-excerpt">{{ excerpt }}</p>
    <router-link class="post-item-more" :to="`/post/${post.hash}/`">Read more</router-link>
  </article>
</template>
