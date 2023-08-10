import type { Configuration } from 'webpack'

export type BuildConfig = Configuration & {
  tsTranspileOnly?: boolean
}

export type InstanceConfig = {
  icons?: Array<string>
  themes?: Array<string>
  darkThemes?: Array<string>
  scssRoot?: string
  title?: Array<string>
  signinText?: Array<string>
}

export type BuildParams = {
  appDir: string
  buildConfig: BuildConfig
  instanceConfig: InstanceConfig
}
