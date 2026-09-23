<script setup>
defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  selected: { type: String, default: '' },
  openPaths: { type: Set, required: true },
})

const emit = defineEmits(['select', 'toggle'])

// A branch has no intrinsic height to transition to, so the pixel values are
// measured here and CSS owns only the easing curve (see .tag-children). The
// inline height is cleared on both endings so the list sits at `auto` at rest
// and stays correct if its content ever changes.
function onEnter(el) {
  el.style.height = '0px'
  void el.offsetHeight
  el.style.height = `${el.scrollHeight}px`
}

function onAfterEnter(el) {
  el.style.height = ''
}

function onLeave(el) {
  el.style.height = `${el.scrollHeight}px`
  void el.offsetHeight
  el.style.height = '0px'
}

function onAfterLeave(el) {
  el.style.height = ''
}
</script>

<template>
  <li class="tag-node">
    <div class="tag-row" :style="{ paddingLeft: `${depth * 14}px` }">
      <button
        v-if="node.children.length"
        class="tag-toggle"
        type="button"
        :aria-label="openPaths.has(node.path) ? 'Collapse' : 'Expand'"
        :aria-expanded="openPaths.has(node.path)"
        @click.stop="emit('toggle', node.path)"
      >
        <Transition name="glyph" mode="out-in">
          <span :key="openPaths.has(node.path) ? 'open' : 'closed'">
            {{ openPaths.has(node.path) ? '−' : '+' }}
          </span>
        </Transition>
      </button>
      <span v-else class="tag-toggle tag-toggle-empty" />

      <button
        class="tag-label"
        type="button"
        :class="{ active: selected === node.path }"
        @click="emit('select', node.path)"
      >
        {{ node.name }}
      </button>
      <span class="tag-count">{{ node.count }}</span>
    </div>

    <Transition
      name="branch"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <ul v-if="node.children.length && openPaths.has(node.path)" class="tag-children">
        <TagNode
          v-for="child in node.children"
          :key="child.path"
          :node="child"
          :depth="depth + 1"
          :selected="selected"
          :open-paths="openPaths"
          @select="emit('select', $event)"
          @toggle="emit('toggle', $event)"
        />
      </ul>
    </Transition>
  </li>
</template>
