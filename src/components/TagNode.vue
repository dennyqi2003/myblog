<script setup>
// One category in the tree. Every category opens: into its sub-categories,
// and then the notes filed directly under it, oldest first. The dot on the
// left is filled while closed and hollow while open.
import { computed } from 'vue'
import { formatDate } from '../site.js'

defineOptions({ name: 'TagNode' })

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  /** Path of the deepest open category; everything above it is open too. */
  openPath: { type: String, default: '' },
  /** Tag path -> notes whose tags end exactly there, oldest first. */
  direct: { type: Map, required: true },
})

const emit = defineEmits(['toggle'])

const open = computed(
  () => props.openPath === props.node.path || props.openPath.startsWith(`${props.node.path}/`),
)
const notes = computed(() => props.direct.get(props.node.path) ?? [])

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
  <li class="tag-node" :class="{ open }">
    <button
      class="tag-row"
      type="button"
      :style="{ paddingLeft: `${depth * 22 + 8}px` }"
      :aria-expanded="open"
      @click="emit('toggle', node.path)"
    >
      <span class="tag-dot" aria-hidden="true" />
      <span class="tag-label">{{ node.name }}</span>
      <span class="tag-count">{{ node.count }}</span>
    </button>

    <Transition
      name="branch"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-if="open" class="tag-children">
        <ul v-if="node.children.length" class="tag-tree">
          <TagNode
            v-for="child in node.children"
            :key="child.path"
            :node="child"
            :depth="depth + 1"
            :open-path="openPath"
            :direct="direct"
            @toggle="emit('toggle', $event)"
          />
        </ul>
        <ul v-if="notes.length" class="tag-posts">
          <li v-for="post in notes" :key="post.hash">
            <router-link
              class="tag-post"
              :to="`/post/${post.hash}/`"
              :style="{ paddingLeft: `${(depth + 1) * 22 + 8}px` }"
            >
              <span class="tag-post-title">{{ post.title }}</span>
              <time class="tag-post-date" :datetime="post.date">{{ formatDate(post.date) }}</time>
            </router-link>
          </li>
        </ul>
      </div>
    </Transition>
  </li>
</template>
