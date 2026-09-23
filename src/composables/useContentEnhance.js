// Client-only embellishments for rendered post bodies: copy buttons, code
// folding and lazy mermaid rendering. The generated HTML stays plain so the
// prerendered markup is meaningful without JavaScript.

import { onBeforeUnmount, onMounted, watch, nextTick } from 'vue'

const FOLD_HEIGHT = 400

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  }
}

function attachCopyButtons(root, disposers) {
  for (const pre of root.querySelectorAll('pre.code-block')) {
    const code = pre.querySelector('code')
    if (!code) continue

    const button = document.createElement('span')
    button.className = 'copy-code-button'
    button.setAttribute('role', 'button')
    button.setAttribute('tabindex', '0')
    button.setAttribute('aria-label', 'Copy code')

    let timer = null
    const onCopy = async () => {
      const ok = await copyText(code.innerText)
      button.classList.toggle('copied', ok)
      button.classList.toggle('failed', !ok)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => button.classList.remove('copied', 'failed'), 1600)
    }
    const onKey = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onCopy()
      }
    }

    button.addEventListener('click', onCopy)
    button.addEventListener('keydown', onKey)
    pre.appendChild(button)

    disposers.push(() => {
      if (timer) clearTimeout(timer)
      button.removeEventListener('click', onCopy)
      button.removeEventListener('keydown', onKey)
    })
  }
}

function attachFold(root, disposers) {
  for (const pre of root.querySelectorAll('pre.code-block')) {
    const code = pre.querySelector('code')
    if (!code) continue
    // Only fold blocks that are actually long enough to hide something.
    if (code.scrollHeight <= FOLD_HEIGHT + 40) continue

    pre.classList.add('collapsed')
    code.style.maxHeight = `${FOLD_HEIGHT}px`

    const wrap = document.createElement('div')
    wrap.className = 'show-hide-button collapsed'

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Show more'

    const toggle = () => {
      const collapsed = pre.classList.toggle('collapsed')
      pre.classList.toggle('expanded', !collapsed)
      wrap.classList.toggle('collapsed', collapsed)
      wrap.classList.toggle('expanded', !collapsed)
      code.style.maxHeight = collapsed ? `${FOLD_HEIGHT}px` : 'none'
      button.textContent = collapsed ? 'Show more' : 'Show less'
    }

    button.addEventListener('click', toggle)
    wrap.appendChild(button)
    pre.appendChild(wrap)

    disposers.push(() => {
      button.removeEventListener('click', toggle)
      code.style.maxHeight = ''
    })
  }
}

let mermaidPromise = null
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'inherit',
        securityLevel: 'strict',
      })
      return mermaid
    })
  }
  return mermaidPromise
}

async function renderMermaidBlocks(root) {
  const blocks = [...root.querySelectorAll('.mermaid-block')].filter(
    (block) => !block.dataset.rendered,
  )
  if (!blocks.length) return

  let mermaid
  try {
    mermaid = await loadMermaid()
  } catch {
    return
  }

  let index = 0
  for (const block of blocks) {
    const source = block.querySelector('.mermaid-source')?.textContent ?? ''
    block.dataset.rendered = '1'
    try {
      const { svg } = await mermaid.render(`mermaid-${Date.now()}-${index++}`, source)
      block.innerHTML = svg
      block.classList.add('mermaid-rendered')
    } catch (error) {
      block.classList.add('mermaid-failed')
      block.textContent = source
      if (import.meta.env.DEV) console.warn('mermaid render failed', error)
    }
  }
}

export function useContentEnhance(rootRef, getSource) {
  let disposers = []

  function teardown() {
    for (const dispose of disposers) dispose()
    disposers = []
    const root = rootRef.value
    if (!root) return
    for (const node of root.querySelectorAll('.copy-code-button, .show-hide-button')) node.remove()
  }

  async function enhance() {
    teardown()
    await nextTick()
    const root = rootRef.value
    if (!root) return
    attachCopyButtons(root, disposers)
    attachFold(root, disposers)
    await renderMermaidBlocks(root)
  }

  onMounted(enhance)
  if (getSource) watch(getSource, enhance)
  onBeforeUnmount(teardown)

  return { enhance }
}
