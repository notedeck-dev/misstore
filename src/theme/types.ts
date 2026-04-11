export interface MisskeyTheme {
  id: string
  name: string
  base?: 'light' | 'dark'
  props: Record<string, string>
}

export type CompiledProps = Record<string, string>
