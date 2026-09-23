import { createApp } from './app.js'
import './styles/index.css'
import 'katex/dist/katex.min.css'

const { app, router } = createApp()
router.isReady().then(() => app.mount('#app'))
