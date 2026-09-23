<script setup>
import { ref, toRef } from 'vue'
import { useContentEnhance } from '../composables/useContentEnhance.js'

const props = defineProps({
  html: { type: String, default: '' },
})

const root = ref(null)
useContentEnhance(root, toRef(props, 'html'))
</script>

<template>
  <div ref="root" class="markdown-body" v-html="html" />
</template>
