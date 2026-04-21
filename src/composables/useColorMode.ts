import { ref, watch } from 'vue'

export type ColorMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'misstore:color-mode'
const mode = ref<ColorMode>(readStored())

function readStored(): ColorMode {
  if (typeof localStorage === 'undefined') return 'system'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

function apply(m: ColorMode) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.dataset.colorMode = m
  html.style.colorScheme = m === 'system' ? 'light dark' : m
}

apply(mode.value)
watch(mode, (m) => {
  localStorage.setItem(STORAGE_KEY, m)
  apply(m)
})

export function useColorMode() {
  function cycle() {
    mode.value = mode.value === 'system' ? 'light' : mode.value === 'light' ? 'dark' : 'system'
  }
  return { mode, cycle }
}
