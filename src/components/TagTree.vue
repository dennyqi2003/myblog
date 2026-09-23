<script setup>
import { tagTree } from '../data.js'
import TagNode from './TagNode.vue'

defineProps({
  selected: { type: String, default: '' },
  openPaths: { type: Set, required: true },
})

const emit = defineEmits(['select', 'toggle'])
</script>

<template>
  <ul class="tag-tree">
    <TagNode
      v-for="node in tagTree"
      :key="node.path"
      :node="node"
      :depth="0"
      :selected="selected"
      :open-paths="openPaths"
      @select="emit('select', $event)"
      @toggle="emit('toggle', $event)"
    />
  </ul>
</template>
