<script setup>
// The switches in the bottom-right corner: background picture on/off, and —
// only while the picture is off — night mode. Both states live on <html>
// (data-bg, data-theme), which an inline script in index.html sets before
// first paint; this component flips them and remembers the choice.
import { onMounted, ref } from 'vue'
import FaIcon from './FaIcon.vue'

const bgOn = ref(true)
const dark = ref(false)

onMounted(() => {
  const root = document.documentElement
  bgOn.value = root.dataset.bg !== 'off'
  dark.value = root.dataset.theme === 'dark'
})

function remember(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode — the switch still works for this visit */
  }
}

function toggleBg() {
  bgOn.value = !bgOn.value
  const root = document.documentElement
  if (bgOn.value) delete root.dataset.bg
  else root.dataset.bg = 'off'
  remember('bg', bgOn.value ? 'on' : 'off')
}

function toggleTheme() {
  dark.value = !dark.value
  const root = document.documentElement
  if (dark.value) root.dataset.theme = 'dark'
  else delete root.dataset.theme
  remember('theme', dark.value ? 'dark' : 'light')
}
</script>

<template>
  <div class="corner-buttons">
    <Transition name="corner">
      <button
        v-if="!bgOn"
        class="corner-button"
        type="button"
        :aria-pressed="dark"
        :title="dark ? 'Day mode' : 'Night mode'"
        aria-label="Toggle night mode"
        @click="toggleTheme"
      >
        <FaIcon :name="dark ? 'sun' : 'moon'" />
      </button>
    </Transition>
    <button
      class="corner-button"
      type="button"
      :aria-pressed="bgOn"
      :title="bgOn ? 'Hide background' : 'Show background'"
      aria-label="Toggle background image"
      @click="toggleBg"
    >
      <FaIcon name="image" />
    </button>
  </div>
</template>
