import { request as originalRequest, defaultRequestTransformer, type RequestConfig } from '@sonata-api/common'
import { STORAGE_NAMESPACE } from './env'

export const request = <Return = any>(url: string, payload?: any, _config?: RequestConfig) => {
  const config = Object.assign({}, _config)
  config.requestTransformer ??= async (url, payload, _params) => {
    const params = Object.assign({}, _params)
    const auth = localStorage.getItem(`${STORAGE_NAMESPACE}:auth`)
    if( auth ) {
      const authObj = JSON.parse(auth)

      console.log(authObj)
      const token = authObj
        ? authObj.token?.content
        : null

      if( token ) {
        params.headers ??= {}
        params.headers.authorization = `Bearer ${token}`
      }
    }

    return defaultRequestTransformer(url, payload, params)
  }

  return originalRequest(url, payload, config) as Promise<Return>
}
