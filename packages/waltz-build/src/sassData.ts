import type { InstanceConfig } from './types'

const DEFAULT_THEMES = [
  'default',
  'dark',
  'contrast'
]

export const sassData = (config: InstanceConfig) => {
  const {
    themes = DEFAULT_THEMES,
    scssRoot = 'node_modules/@waltz-ui/ui/dist/scss'

  } = config

  const lines = []

  lines.push(`@import '${scssRoot}/_theming.scss'`)
  lines.push(`$themes: ${themes.join(',')}`)
  return lines.join('\n;') + ';'
}
