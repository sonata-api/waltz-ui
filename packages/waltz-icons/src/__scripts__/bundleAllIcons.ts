import path from 'path'
import { writeFile } from 'fs/promises'
import { packTogether } from '../common'
import { icons, IconStyle } from '@phosphor-icons/core'

const bundlePath = path.join(__dirname, '..', '..', 'dist', 'icons.svg')

const bundle = async () => {
  const iconNames = icons.reduce((a, icon) => [
    ...a,
    ...Object.values(IconStyle).map((style) => `${style}:${icon.name}`)
  ], [] as string[])

  const content = await packTogether(iconNames)
  await writeFile(bundlePath, content)
}

bundle()

