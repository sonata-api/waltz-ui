import { request as originalRequest, defaultRequestTransformer, type RequestConfig } from '@sonata-api/common'
import { authMemo } from './auth'

export const request = <Return = any>(url: string, payload?: any, _config?: RequestConfig) => {
  const config = Object.assign({}, _config)
  config.requestTransformer ??= async (url, payload, _params) => {
    const params = Object.assign({}, _params)

    if( authMemo.token ) {
      params.headers ??= {}
      switch( authMemo.token.type ) {
        case 'bearer': {
          params.headers.authorization = `Bearer ${authMemo.token.content}`
          break
        }
      }
    }

    return defaultRequestTransformer(url, payload, params)
  }

  return originalRequest(url, payload, config) as Promise<Return>
}
