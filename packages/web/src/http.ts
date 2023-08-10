import { request } from '@sonata-api/common'
import { useStore } from './state/use'

export const SV_API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : '/api'

export const API_URL = import.meta.env.VITE_WALTZUI_API_URL || SV_API_URL

export const useHttp = () => {
  return {
    http: call(proxiedHttp),
    unproxiedHttp: call(request),
    apiUrl: API_URL
  }
}

const call = (target: typeof proxiedHttp | typeof request) => <Return=any>(...args: Parameters<typeof request<any>>) => {
  args[0] = `${API_URL}/${args[0]}`
  return (target<Return>).apply({}, args)
}

const proxiedHttp = async <Return>(...args: Parameters<typeof request<any>>) => {
  return request<Return>(...args).catch((error: any) => {
    const userStore = useStore('user')
    if( error.logout || ['JsonWebTokenError', 'TokenExpiredError'].includes(error.name) ) {
      userStore.signout()
      ROUTER.push({ name: '/user/signin' })
    }

    console.trace(error)
    throw error
  })
}
