import path from 'path'
import { readFile } from 'fs/promises'
import { DEFAULT_STYLE } from './constants'

export type Options = {
  tag?: string
  ensureList?: Array<string>
  libraries?: Array<string>
  preEmit?: () => Promise<void>
  hash?: boolean
  allIcons?: boolean
}

export const defaultOptions: Partial<Options> = {
  tag: 'icon',
}

const makeExpressions = (options: Options) => {
  const regexes = [
    new RegExp(`<${options.tag}[^>]*[^:]icon="([^"]+)"`, 'mg'),
    /<[^>]*[^:]icon="([^"]+)"/mg,
    /icon: ?['"]([^'"]+)['"]/mg,
    /icon: ?([\w:-]+)$/mg,
  ]

  return regexes
}

export const icons = global.waltz__gatheredIcons = new Set<string>()

export const fileName = (iconName: string) => {
    const [style, filename] = iconName.includes(':')
      ? iconName.split(':')
      : [DEFAULT_STYLE, iconName]

    return path.join(style, `${filename}.svg`)
}

export const scrapper = (
  options: Options,
  emitFn: (newPath: string, content: string|Buffer) => void,
  errorCallback: (e: any) => void
) => async (source: string) => {
  const shouldAdd = new Set<string>()
  const regexes = makeExpressions(options)

  if( options.ensureList && !icons.size ) {
    options.ensureList.forEach((iconName: string) => {
      shouldAdd.add(iconName)
    })
  }

  for( const regex of regexes ) {
    let match: Array<string>|null
    while( match = regex.exec(source) ) {
      const iconName = match[1]
      if( !icons.has(iconName) ) {
        shouldAdd.add(iconName)
      }
    }
  }

  for( const iconName of shouldAdd ) {
    icons.add(iconName)

    try {
      const newPath = path.join(
        __dirname,
        '..',
        'core',
        'assets',
        fileName(iconName)
      )

      const content = await readFile(newPath)
      emitFn(newPath, content)

    } catch( e: any ) {
      errorCallback(e)
    }
  }
}

export const packTogether = async (icons: Array<string>) => {
  const symbols = []
  for( const iconName of icons ) {
    if( !iconName ) {
      continue
    }

    const [style, filename] = iconName.includes(':')
      ? iconName.split(':')
      : [DEFAULT_STYLE, iconName]

    try {
      const newPath = path.join(
        __dirname,
        '..',
        'core',
        'assets',
        fileName(iconName)
      )

      const content = await readFile(newPath)
      const paths = content.toString().match(/<path ([^>]+)>/g)!.join('')
      const icon = `<symbol id="${style}:${filename.replace(new RegExp(`-${style}`), '')}">${paths}</symbol>`

      symbols.push(icon)

    } catch( e ) {
      console.warn(`icon ${iconName} not found`)
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`

  return svg
}

export const makeHash = () => Date.now().toString().slice(-10)

