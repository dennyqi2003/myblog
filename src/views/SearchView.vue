<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { posts } from '../data.js'
import PostListItem from '../components/PostListItem.vue'

const SEGMENTER =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('zh', { granularity: 'word' })
    : null

const state = ref('idle') // idle | loading | indexing | ready | error
const progress = ref(0)
const query = ref('')
const index = shallowRef(null)
const texts = shallowRef([])
const error = ref('')

let cancelled = false

function tokensOf(text) {
  const lower = text.toLowerCase()
  const out = []
  if (SEGMENTER) {
    for (const part of SEGMENTER.segment(lower)) {
      if (part.isWordLike && part.segment.length >= 2) out.push(part.segment)
    }
  } else {
    for (const part of lower.split(/[^\p{L}\p{N}]+/u)) {
      if (part.length >= 2) out.push(part)
    }
  }
  return out
}

const CHUNK = 40

async function buildIndex() {
  state.value = 'loading'
  let payload
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}search.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    payload = await response.json()
  } catch (e) {
    error.value = 'Search index could not be loaded.'
    state.value = 'error'
    return
  }
  if (cancelled) return

  state.value = 'indexing'
  const docs = payload.docs
  const map = new Map()
  const bodies = new Array(docs.length)

  for (let i = 0; i < docs.length; i++) {
    bodies[i] = docs[i].x
    const seen = new Set(tokensOf(`${docs[i].t} ${docs[i].g.join(' ')} ${docs[i].x}`))
    for (const token of seen) {
      const list = map.get(token)
      if (list) list.push(i)
      else map.set(token, [i])
    }
    if (i % CHUNK === 0) {
      progress.value = Math.round((i / docs.length) * 100)
      // Yield so the progress bar can paint.
      await new Promise((resolve) => setTimeout(resolve, 0))
      if (cancelled) return
    }
  }

  texts.value = bodies
  index.value = map
  progress.value = 100
  state.value = 'ready'
}

function ensureIndex() {
  if (state.value === 'idle') buildIndex()
}

onBeforeUnmount(() => {
  cancelled = true
})

function snippetFor(docIndex, terms) {
  const text = texts.value[docIndex] ?? ''
  const lower = text.toLowerCase()
  const found = terms
    .map((t) => lower.indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0]
  if (found == null) return text.slice(0, 150) + (text.length > 150 ? '…' : '')
  const start = Math.max(0, found - 60)
  const end = Math.min(text.length, found + 140)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

const results = computed(() => {
  const raw = query.value.trim()
  if (!raw || state.value !== 'ready') return []
  const terms = [...new Set(tokensOf(raw))]

  const needle = raw.toLowerCase()
  const scores = new Map()
  const add = (docIndex, amount) => scores.set(docIndex, (scores.get(docIndex) ?? 0) + amount)

  // Word tokens, weighted by rarity. A token shared by most of the corpus
  // carries almost no information.
  for (const term of terms) {
    const list = index.value.get(term)
    if (!list) continue
    const weight = Math.max(1, Math.log(posts.length / list.length))
    for (const docIndex of list) {
      add(docIndex, weight)
      if (posts[docIndex].title.toLowerCase().includes(term)) add(docIndex, weight)
    }
  }

  // The query as typed, anywhere in the title or the text — this catches
  // single characters and fragments the word segmenter splits differently.
  // A title hit outranks any amount of body text.
  for (let i = 0; i < texts.value.length; i++) {
    if (posts[i].title.toLowerCase().includes(needle)) add(i, 20)
    if (texts.value[i].toLowerCase().includes(needle)) add(i, 5)
  }

  // What gets highlighted: the whole query first, then its words.
  const marks = [...new Set([needle, ...terms])].sort((a, b) => b.length - a.length)

  // search.json is written in the same order as the manifest, so a doc index
  // doubles as a posts index.
  return [...scores.entries()]
    .map(([docIndex, score]) => ({
      post: posts[docIndex],
      score,
      snippet: snippetFor(docIndex, marks),
      marks,
    }))
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, 40)
})
</script>

<template>
  <div class="view post-block">
    <header class="view-header">
      <h1 class="view-title">Search</h1>
      <p class="view-subtitle">
        Full text of every note. Maths is stripped from the index, so search for prose.
      </p>
    </header>

    <div class="search-box">
      <input
        v-model="query"
        class="search-input"
        type="search"
        placeholder="Search notes…"
        autocomplete="off"
        spellcheck="false"
        @focus="ensureIndex"
        @input="ensureIndex"
      />
    </div>

    <p v-if="state === 'loading'" class="search-status">Loading the index…</p>
    <p v-else-if="state === 'indexing'" class="search-status">
      Building the index… {{ progress }}%
    </p>
    <div v-else-if="state === 'indexing'" class="search-progress"><span :style="{ width: `${progress}%` }" /></div>
    <p v-else-if="state === 'error'" class="search-status error">{{ error }}</p>

    <div v-if="state === 'ready'" class="search-results">
      <p v-if="query.trim() && !results.length" class="empty-note">
        Nothing matched “{{ query.trim() }}”.
      </p>
      <p v-else-if="results.length" class="search-status">
        {{ results.length }} result{{ results.length === 1 ? '' : 's' }}
      </p>

      <PostListItem
        v-for="(hit, i) in results"
        :key="hit.post.hash"
        :post="hit.post"
        :index="i"
        :snippet="hit.snippet"
        :highlight="hit.marks"
      />
    </div>
  </div>
</template>
