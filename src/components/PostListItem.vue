<script setup>
import { computed } from 'vue'
import { formatDate, readingTime } from '../site.js'

const props = defineProps({
  post: { type: Object, required: true },
  /** Position in the list; drives the staggered entrance (see .post-item). */
  index: { type: Number, default: 0 },
  /** Replaces the stored excerpt — the search view passes a query snippet. */
  snippet: { type: String, default: '' },
  /** Search terms to mark in the title and excerpt, longest first. */
  highlight: { type: Array, default: () => [] },
})

const meta = computed(
  () => `${props.post.author} · ${formatDate(props.post.date)} · ${readingTime(props.post.ert)}`,
)

const excerpt = computed(() => props.snippet || props.post.excerpt)
/** The author's [^Summary], already rendered (markdown + maths) at build
 *  time. Shown in full; a search snippet takes precedence over it. */
const summaryHtml = computed(() => (props.snippet ? '' : props.post.summaryHtml))

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Escaped text with every search term wrapped in <mark>. */
function marked(text) {
  const terms = props.highlight.filter(Boolean)
  if (!terms.length) return escapeHtml(text)
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  return text
    .split(pattern)
    .map((part, i) => (i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join('')
}

const titleHtml = computed(() => marked(props.post.title))
const excerptHtml = computed(() => marked(excerpt.value))

// Past a handful of rows the delay would start to be felt rather than seen.
const stagger = computed(() => Math.min(props.index, 8))
</script>

<template>
  <article class="post-item" :style="{ '--i': stagger }">
    <h2 class="post-item-title">
      <!-- v-html sits on a plain element: on a component (router-link) the
           server renderer drops it, and prerendered titles come out empty. -->
      <router-link :to="`/post/${post.hash}/`"><span v-html="titleHtml" /></router-link>
    </h2>
    <div class="post-meta">
      <span>{{ meta }}</span>
    </div>
    <div v-if="summaryHtml" class="post-item-excerpt post-item-summary" v-html="summaryHtml" />
    <p v-else-if="excerpt" class="post-item-excerpt" v-html="excerptHtml" />
    <div class="post-button">
      <router-link class="btn" :to="`/post/${post.hash}/`">Read more &raquo;</router-link>
    </div>
  </article>
</template>
