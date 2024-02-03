import path from 'path'
import { execSync } from 'child_process'
import { parseArgs } from 'util'
import semver from 'semver'
import fs from 'fs'

type Tuple = string | string[] extends infer Value
  ? [Value] | [undefined, Value]
  : never

const error = (value: string | string[]): Tuple => [value]
const success = (value: string | string[]): Tuple => [,value]
const isError = (tuple: Tuple) => !!tuple[0]
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

enum LogLevel {
  Info = 'info',
  Error = 'error',
  Warning = 'warning',
  Debug = 'debug'
}

const log = (level: LogLevel, value: any) => {
  console.log(
    `[${level}]`,
    Array.isArray(value)
      ? value.join('\n')
      : value
  )
}

const allChecksPass = async (checks: Promise<Tuple>[]) => {
  for( const check of checks ) {
    const result = await check
    log(isError(result) ? LogLevel.Error : LogLevel.Info, unwrap(result))

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
    return error([
      'local and remote versions of this package differ',
      `run 'npm i -g --force ${packageName}@latest' to update your installation, then run this command again (you may need root privileges in order to install packages globally)`
    ])
  }

  return success('package is up-to-date')
}

const checkCompatibility = async () => {
  const localNodeVersion = $('node -v')
  const remoteNodeVersion = $('npm view aeria engine.node')

  if( !semver.satisfies(localNodeVersion, remoteNodeVersion) ) {
    return error('local node version is outdated')
  }

  return success('node version is compatible')
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
  const projectName = positionals[0]
  const projectPath = path.join(cwd, projectName)

  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'ts'
  )

  if( fs.existsSync(templatePath) ) {
    log(LogLevel.Error, `path '${templatePath}' already exists`)
    return
  }

  await fs.promises.cp(
    templatePath,
    projectPath,
    { recursive: true }
  )

  log(LogLevel.Info, `your project '${projectName}' was created, make good use of it`)
}

main()

