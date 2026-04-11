import { ref } from 'vue'

export function useCopySource() {
  const copiedId = ref<string | null>(null)

  async function copy(sourceUrl: string, id: string) {
    try {
      const res = await fetch(`/${sourceUrl}`)
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      copiedId.value = id
      setTimeout(() => { copiedId.value = null }, 2000)
    } catch {
      // Silently fail
    }
  }

  return { copiedId, copy }
}
