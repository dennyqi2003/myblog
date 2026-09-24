<script setup>
// Numbered pager, as Hexo's paginator draws it for NexT (end_size 1,
// mid_size 1): the first and last page always, the current page with one
// neighbour either side, and an ellipsis for every gap. Arrows step back and
// forward and disappear at either end.
import { computed } from 'vue'
import FaIcon from './FaIcon.vue'

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
  /** Page number -> route. */
  to: { type: Function, required: true },
})

const items = computed(() => {
  const { current, total } = props
  const shown = new Set([1, total, current - 1, current, current + 1])
  const out = []
  let last = 0
  for (let n = 1; n <= total; n++) {
    if (!shown.has(n)) continue
    if (n - last > 2) out.push({ gap: true, key: `gap-${n}` })
    // A gap of exactly one page is shown as that page, not as "…".
    else if (n - last === 2) out.push({ page: n - 1, key: n - 1 })
    out.push({ page: n, key: n })
    last = n
  }
  return out
})
</script>

<template>
  <nav class="pagination" aria-label="Pages">
    <router-link
      v-if="current > 1"
      class="page-number prev"
      :to="to(current - 1)"
      rel="prev"
      aria-label="Previous page"
    >
      <FaIcon name="angle-left" />
    </router-link>

    <template v-for="item in items" :key="item.key">
      <span v-if="item.gap" class="space">…</span>
      <span v-else-if="item.page === current" class="page-number current" aria-current="page">
        {{ item.page }}
      </span>
      <router-link v-else class="page-number" :to="to(item.page)">{{ item.page }}</router-link>
    </template>

    <router-link
      v-if="current < total"
      class="page-number next"
      :to="to(current + 1)"
      rel="next"
      aria-label="Next page"
    >
      <FaIcon name="angle-right" />
    </router-link>
  </nav>
</template>
