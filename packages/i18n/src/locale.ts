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
}

window.I18N = reactive<I18nConfig>({
  current: '',
  locales: {}
})

export const createI18n = (config: I18nConfig) => {
  Object.assign(window.I18N, config)
}

export const setLocale = (current: string) => {
  window.I18N.current = current
}

export const getLocale = () => {
  return window.I18N.current
}

export const t = (text?: string, options: TextOptions = {}) => {
  const localeMemo = window.I18N
  if( !text ) {
    return ''
  }

  const locale = localeMemo.locales[localeMemo.current]
  if( !locale ) {
    return text
  }

  const result: string = Array.isArray(locale)
    ? getValueFromPath(locale.find((candidate) => getValueFromPath(candidate, text)), text)
    : getValueFromPath(locale, text)

  if( !result ) {
    return text
  }

  const parts = Array.isArray(result)
    ? result
    : result.split('|').map((part) => part.trim())

  const translated: string = options.plural
    ? parts[1]
    : parts[0]

  return options.capitalize
    ? translated[0].toUpperCase() + translated.slice(1)
    : translated
}

