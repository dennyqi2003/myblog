<script setup>
import { site } from '../site.js'
</script>

<template>
  <div class="view">
    <header class="view-header">
      <h1 class="view-title">Not found</h1>
      <p class="view-subtitle">That page does not exist.</p>
    </header>

    <p class="empty-note">
      Try the <router-link to="/">note list</router-link> or
      <router-link to="/search/">search</router-link> — {{ site.title }} has
      nothing at this address.
    </p>
  </div>
</template>
