<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { outlineOf } from '../toc.js'
import { byHash, neighbours, postsByTag } from '../data.js'
import { formatDate, readingTime } from '../site.js'
import MarkdownBody from '../components/MarkdownBody.vue'

const route = useRoute()

const post = computed(() => byHash.get(route.params.hash))
// The body with anchors on its headings — the sidebar outline links to them.
const body = computed(() => (post.value ? outlineOf(post.value.hash).html : ''))
const meta = computed(() =>
  post.value
    ? `${post.value.author} · ${formatDate(post.value.date)} · ${readingTime(post.value.ert)}`
    : '',
)
const links = computed(() => (post.value ? neighbours(post.value.hash) : { newer: null, older: null }))

const tagsWithCount = computed(() => {
  if (!post.value) return []
  return post.value.tags.map((tag, i) => {
    const path = post.value.tags.slice(0, i + 1).join('/')
    return { name: tag, path, count: postsByTag.get(path)?.length ?? 0 }
  })
})
</script>

<template>
  <div class="view post-view post-block">
    <template v-if="post">
      <header class="post-header">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <span>{{ meta }}</span>
        </div>
      </header>

      <MarkdownBody :html="body" />

      <footer class="post-footer">
        <div v-if="tagsWithCount.length" class="post-tags">
          <span class="post-tags-label">Categories:</span>
          <router-link
            v-for="tag in tagsWithCount"
            :key="tag.path"
            class="tag-chip"
            :to="`/categories/?t=${encodeURIComponent(tag.path)}`"
          >
            {{ tag.name }}
          </router-link>
        </div>

        <nav class="post-nav">
          <router-link
            v-if="links.newer"
            class="post-nav-link newer"
            :to="`/post/${links.newer.hash}/`"
          >
            <span class="post-nav-label">Newer</span>
            <span class="post-nav-title">{{ links.newer.title }}</span>
          </router-link>
          <span v-else class="post-nav-link newer disabled">
            <span class="post-nav-label">Newer</span>
            <span class="post-nav-title">—</span>
          </span>

          <router-link
            v-if="links.older"
            class="post-nav-link older"
            :to="`/post/${links.older.hash}/`"
          >
            <span class="post-nav-label">Older</span>
            <span class="post-nav-title">{{ links.older.title }}</span>
          </router-link>
          <span v-else class="post-nav-link older disabled">
            <span class="post-nav-label">Older</span>
            <span class="post-nav-title">—</span>
          </span>
        </nav>
      </footer>
    </template>

    <template v-else>
      <header class="view-header">
        <h1 class="view-title">Not found</h1>
        <p class="view-subtitle">No note has that address.</p>
      </header>
      <p class="empty-note">
        Back to the <router-link to="/">note list</router-link>.
      </p>
    </template>
  </div>
</template>
