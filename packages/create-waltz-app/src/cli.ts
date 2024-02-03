import path from 'path'
import { parseArgs } from 'util'
import fs from 'fs/promises'

const {
  positionals,
  values: opts
} = parseArgs({
  allowPositionals: true,
  options: {
    batch: {
      type: 'string',
      short: 'y'
    }
  }
})

const DEFAULTS = {
  template: 'ts'
}

const moveFiles = () => {
  //
}

const main = async () => {
  const cwd = process.cwd()
  const projectPath = path.join(cwd, positionals[0])

  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'ts'
  )

  await fs.cp(
    templatePath,
    projectPath,
    { recursive: true }
  )

  console.log({
    cwd,
    templatePath
  })
}

main()

