import { readFile } from 'fs/promises'

export type InstanceConfig = {
  exposed: {
    title: string
    signinText: string
    signupForm?: boolean
  }
  icons?: string[]
}

export const getInstanceConfig = async () => {
  const config = await (async (): Promise<Partial<InstanceConfig>> => {
    try {
      const content = await readFile('./instance.json')
      return JSON.parse(content.toString())
    } catch( e ) {
      return {}
    }
  })()

  const {
    exposed = {},
    icons
  } = config

  return {
    exposed,
    icons
  }
}
