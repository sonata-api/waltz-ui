import path from 'path'
import { execSync } from 'child_process'
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

const checkPackageVersion = async () => {
  const {
    name: packageName,
    version: packageVersion
  } = require('../package.json')

  const remoteVersion = execSync(`npm view ${packageName} version`).toString().trim()

  if( packageVersion !== remoteVersion ) {
    console.log('local and remote versions differ')
  }

  console.log({
    remoteVersion,
    packageVersion
  })
}

const main = async () => {
  await checkPackageVersion()

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

