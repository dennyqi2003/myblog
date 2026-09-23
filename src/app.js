import { createSSRApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router.js'

export function createApp() {
  const app = createSSRApp(App)
  const router = createAppRouter(typeof window === 'undefined')
  app.use(router)
  return { app, router }
}
