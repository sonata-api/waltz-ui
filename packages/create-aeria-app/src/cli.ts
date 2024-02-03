import path from 'path'
import { execSync } from 'child_process'
import { parseArgs } from 'util'
import semver from 'semver'
import fs from 'fs/promises'

type Tuple = [string] | [undefined, string]

const error = (value: string): Tuple => [value]
const success = (value: string): Tuple => [,value]
const isError = (tuple: Tuple) => !!tuple[1]
const unwrap = (tuple: Tuple) => tuple[0] || tuple[1]

const $ = (cmd: string) => execSync(cmd).toString().trim()

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

const allChecksPass = async (checks: Promise<Tuple>[]) => {
  for( const check of checks ) {
    const result = await check
    if( isError(result) ) {
      return
    }
  }

  return true
}

const checkPackageVersion = async () => {
  const {
    name: packageName,
    version: packageVersion
  } = require('../package.json')

  const remoteVersion = $(`npm view ${packageName} version`)

  if( packageVersion !== remoteVersion ) {
    return error('local and remote versions of this package differ')
  }

  return success('ok')
}

const checkCompatibility = async () => {
  const localNodeVersion = $('node -v')
  const remoteNodeVersion = $('npm view aeria engine.node')

  if( !semver.satisfies(localNodeVersion, remoteNodeVersion) ) {
    return error('local node version is outdated')
  }

  return success('')
}

const main = async () => {
  const checksOk = await allChecksPass([
    checkPackageVersion(),
    checkCompatibility()
  ])

  if( !checksOk ) {
    return
  }

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

