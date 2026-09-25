export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale)
}
