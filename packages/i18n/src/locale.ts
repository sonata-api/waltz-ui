import { getValueFromPath } from '@sonata-api/common'
import { reactive } from 'vue'

export type LocaleMessages = {
  [P in string]: string | [string, string] | LocaleMessages
}

export type Locales = Record<string, LocaleMessages | LocaleMessages[]>

export type I18nConfig = {
  current: string
  locales: Locales
}

export type TextOptions = {
  plural?: boolean
  capitalize?: boolean
  noFallback?: boolean
  context?: string
}

window.I18N = reactive<I18nConfig>({
  current: '',
  locales: {}
})

const wordsMemo = {} as Record<string, {
  plural: boolean
}>

export const createI18n = (config: I18nConfig) => {
  Object.assign(window.I18N, config)
}

export const setLocale = (current: string) => {
  window.I18N.current = current
}

export const getLocale = () => {
  return window.I18N.current
}

const capitalize = (text: string) => {
  return text[0].toUpperCase() + text.slice(1)
}

export const t = (originalText?: string, _options: TextOptions = {}): string => {
  const localeMemo = window.I18N
  if( !originalText ) {
    return ''
  }

  const text = originalText[0].toLowerCase() + originalText.slice(1)
  const options = Object.assign({}, _options)
  options.capitalize ??= originalText[0] === originalText[0].toUpperCase()

  if( !options.context && text.endsWith('s') && wordsMemo[text]?.plural !== false ) {
    const offset = text.endsWith('es')
      ? -2
      : -1

    const result = t(text.slice(0, offset), Object.assign({
      plural: true,
      noFallback: true
    }, options))

    if( result ) {
      return result
    }

    wordsMemo[text] = {
      plural: false
    }
  }

  const locale = localeMemo.locales[localeMemo.current]
  if( !locale ) {
    return text
  }

  const fullPath = (text: string) => options.context
    ? `${options.context}.${text}`
    : text

  const result: string | object = Array.isArray(locale)
    ? getValueFromPath(locale.find((candidate) => getValueFromPath(candidate, fullPath(text))), fullPath(text))
    : getValueFromPath(locale, fullPath(text))

  if( !result ) {
    return options.noFallback
      ? ''
      : options.capitalize
        ? capitalize(text)
        : text
  }

  const resultText = typeof result === 'string' || Array.isArray(result)
    ? result
    : '$' in result
      ? result.$ as string
      : text

  const parts = Array.isArray(resultText)
    ? resultText
    : resultText.split('|').map((part) => part.trim())

  const translated: string = options.plural && parts.length > 1
    ? parts[1]
    : parts[0]

  return options.capitalize
    ? capitalize(translated)
    : translated
}

