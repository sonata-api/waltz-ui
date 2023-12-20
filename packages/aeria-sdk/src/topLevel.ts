import type { InstanceConfig } from  './types'
import { authenticate, type AuthenticationPayload } from './auth'
import { request } from './http'

type UserFunctions = {
  user: TLOFunctions & {
    authenticate: (payload: AuthenticationPayload) => Promise<any>
  }
}

export type TLOFunctions = {
  [P in string]: ((payload?: any) => Promise<any>) & TLOFunctions
}

export type TopLevelObject = UserFunctions & {
  describe: (...args: any) => Promise<any>
}

export const topLevel = (config: InstanceConfig) => {
  const proxify = (target: any, parent?: string): TopLevelObject => new Proxy<TopLevelObject>(target, {
    get: (_, key: string) => {
      const endpoint = parent
        ? `${parent}/${key}`
        : `${key}`

      switch( endpoint ) {
        case 'user/authenticate': return authenticate(config)
      }

      const fn = async (payload: any) => {
        const response = payload
          ? await request(`${config.apiUrl}/${endpoint}`, payload)
          : await request(`${config.apiUrl}/${endpoint}`)

        return response.data
      }

      return proxify(fn, endpoint)
    }
  })

  return proxify({})
}

(async () => {
  const aeria = topLevel({
    apiUrl: 'https://pedidos.capsulbrasil.com.br/api'
  })

  await aeria.user.authenticate({
    email: 'root',
    password: '12569874'
  })
})()

