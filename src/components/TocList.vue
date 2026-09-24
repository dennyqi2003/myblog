<script setup>
// One level of the post outline. Markup and class names follow Hexo's toc()
// helper as NexT renders it (ol.nav > li.nav-item > a.nav-link + ol.nav-child),
// so the NexT stylesheet rules port over unchanged.
defineOptions({ name: 'TocList' })

defineProps({
  items: { type: Array, required: true },
  /** Ids of the current heading and every ancestor (NexT's `.active`). */
  active: { type: Set, required: true },
  current: { type: String, default: '' },
  /** Expanded height of each open .nav-child, keyed by its parent's id. */
  heights: { type: Map, required: true },
  child: { type: Boolean, default: false },
})

const emit = defineEmits(['jump'])
</script>

<template>
  <ol :class="child ? 'nav-child' : 'nav'">
    <li
      v-for="item in items"
      :key="item.id"
      class="nav-item"
      :class="[
        `nav-level-${item.level}`,
        { active: active.has(item.id), 'active-current': current === item.id },
      ]"
    >
      <a class="nav-link" :href="`#${item.id}`" @click.prevent="emit('jump', item.id)">
        <span class="nav-number">{{ item.number }}</span> <span class="nav-text" v-html="item.html" />
      </a>
      <TocList
        v-if="item.children.length"
        :items="item.children"
        :active="active"
        :current="current"
        :heights="heights"
        child
        :style="{ '--height': `${heights.get(item.id) ?? 0}px` }"
        @jump="emit('jump', $event)"
      />
    </li>
  </ol>
</template>
