import { renderToString } from 'vue/server-renderer'
import { createApp } from './app.js'
import { titleFor } from './router.js'

export async function render(url) {
  const { app, router } = createApp()

  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  return { html, title: titleFor(router.currentRoute.value) }
}
