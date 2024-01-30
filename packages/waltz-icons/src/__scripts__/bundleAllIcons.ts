import { writeFile } from 'fs/promises'
import { packTogether } from '../common.js'
import { icons, IconStyle } from '@phosphor-icons/core'

const bundlePath = new URL(await import.meta.resolve!('../../dist/icons.svg')).pathname

const bundle = async () => {
  const iconNames = icons.reduce((a, icon) => [
    ...a,
    ...Object.values(IconStyle).map((style) => `${style}:${icon.name}`)
  ], [] as string[])

  const content = await packTogether(iconNames)
  await writeFile(bundlePath, content)
}

bundle()

