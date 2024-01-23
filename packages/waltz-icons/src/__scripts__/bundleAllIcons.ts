import path from 'path'
import { writeFile } from 'fs/promises'
import { packTogether } from '../common'
import { icons } from '@phosphor-icons/core'

const bundlePath = path.join(__dirname, '..', '..', 'dist', 'icons.svg')

const styles = [
  'thin',
  'light',
  'regular',
  'bold',
  'fill',
  'duotone'
]

const bundle = async () => {
  const iconNames = icons.reduce((a, icon) => [
    ...a,
    ...styles.map(
      (style) => style === 'regular'
        ? `${style}:${icon.name}`
        : `${style}:${icon.name}-${style}`
    )
  ], [] as string[])

  const content = await packTogether(iconNames)
  await writeFile(bundlePath, content)
}

bundle()

