import { request as originalRequest, defaultRequestTransformer, type RequestConfig } from '@sonata-api/common'

export const request = <Return = any>(url: string, payload?: any, _config?: RequestConfig) => {
  const config = Object.assign({}, _config)
  config.requestTransformer ??= async (url, payload, _params) => {
    const params = Object.assign({}, _params)
    const token = localStorage.getItem('auth:token')
    if( token ) {
      params.headers ??= {}
      params.headers.authorization = `Bearer ${token}`
    }

    return defaultRequestTransformer(url, payload, params)
  }

  return originalRequest(url, payload, config) as Promise<Return>
}
