<script setup>
import faqHtml from '../generated/faq.html?raw'
import MarkdownBody from '../components/MarkdownBody.vue'
</script>

<template>
  <div class="view post-block">
    <header class="view-header">
      <h1 class="view-title">About</h1>
      <p class="view-subtitle">How this site is put together.</p>
    </header>

    <MarkdownBody :html="faqHtml" />
  </div>
</template>
