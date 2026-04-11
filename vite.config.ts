import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { defineConfig } from 'vite'

const root = resolve(import.meta.dirname!)

export default defineConfig({
  root,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
    },
  },
})
