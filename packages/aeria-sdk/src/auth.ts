import type { InstanceConfig } from  './types'
import { isLeft, unwrapEither } from '@sonata-api/common'
import { request } from './http'

export type AuthenticationResult = {
  user: any
  token: {
    type: 'bearer'
    content: string
  }
}

export type AuthenticationPayload = {
  email: string
  password: string
}

export const authMemo = {} as AuthenticationResult

export const authenticate = (config: InstanceConfig) => async (payload: AuthenticationPayload) => {
  const response = await request(`${config.apiUrl}/user/authenticate`, payload)
  const resultEither = response.data
  if( isLeft(resultEither) ) {
    //
    return
  }

  const result = unwrapEither(resultEither)
  Object.assign(authMemo, result)

  return result
}
