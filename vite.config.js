import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Each post body is emitted as its own lazily-loaded chunk so that opening
    // one article does not pull in the other 444. The longest notes are raw
    // HTML with embedded base64 images, hence the high ceiling.
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
})
