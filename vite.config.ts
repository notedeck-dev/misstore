import vue from '@vitejs/plugin-vue'
import JSON5 from 'json5'
import { resolve } from 'path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

function json5Plugin(): Plugin {
  return {
    name: 'json5',
    transform(code, id) {
      if (!id.endsWith('.json5')) return undefined
      const parsed = JSON5.parse(code)
      return { code: `export default ${JSON.stringify(parsed)}`, map: null }
    },
  }
}

const root = resolve(import.meta.dirname!)

export default defineConfig({
  root,
  plugins: [json5Plugin(), vue()],
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
    },
  },
})
