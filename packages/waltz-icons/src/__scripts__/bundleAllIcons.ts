import path from 'path'
import { writeFile } from 'fs/promises'
import { globSync } from 'glob'
import { packTogether } from '../common'

const bundlePath = path.join(__dirname, '..', '..', 'dist', 'icons.svg')

const bundle = async () => {
  const fileList = globSync(path.join(__dirname, '..', '..', 'core', 'assets', '**', '*.svg')).map((path) => {
    return path.split('/').slice(-2).join(':').replace(/\.svg$/, '')
  })

  const content = await packTogether(fileList)
  await writeFile(bundlePath, content)
}

bundle()

