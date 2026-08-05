import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // frontend 用 5173/5174，錯開避免同時開發時撞埠
    port: 5175,
  },
})
