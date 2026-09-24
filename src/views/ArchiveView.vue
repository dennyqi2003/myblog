<script setup>
import { computed } from 'vue'
import { posts, years } from '../data.js'
import { formatMonthDay, readingTime } from '../site.js'

const grouped = computed(() =>
  years.map(([year, list]) => ({
    year,
    items: [...list].sort((a, b) =>
      a.date === b.date ? a.titleOrder - b.titleOrder : b.date.localeCompare(a.date),
    ),
  })),
)
</script>

<template>
  <div class="view post-block">
    <header class="view-header">
      <h1 class="view-title">Archive</h1>
      <p class="view-subtitle">{{ posts.length }} notes, newest first.</p>
    </header>

    <section v-for="group in grouped" :key="group.year" class="archive-year">
      <h2 class="archive-year-label">{{ group.year }}</h2>
      <ul class="archive-list">
        <li v-for="post in group.items" :key="post.hash" class="archive-item">
          <span class="archive-date">{{ formatMonthDay(post.date) }}</span>
          <router-link class="archive-title" :to="`/post/${post.hash}/`">
            {{ post.title }}
          </router-link>
          <span class="archive-ert">{{ readingTime(post.ert) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
