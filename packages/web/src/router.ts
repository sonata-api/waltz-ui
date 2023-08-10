import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router/auto'
import { useStore } from './state/use'

export type RouteMeta = {
  meta: {
    title: string
    icon?: string
    roles?: Array<string>
  }
}

export type Route = RouteMeta & Omit<RouteRecordRaw, 'children'> & {
  path: string
  children?: Array<Route>
  components?: any
  badgeFunction?: string
  badgePayload?: any
}

export type RouterExtensionNode = Array<Omit<Route, 'name'>>
export type RouterExtension = Record<string, RouterExtensionNode>

export const routerInstance = (routes: Array<RouteRecordRaw>) => {
  const router = createRouter({
    history: createWebHistory(),
    extendRoutes: (fsRoutes) => {
      return [
        ...routes,
        ...fsRoutes
      ]
    }
  })

  const metaStore = useStore('meta')
  // const userStore = useStore('user')

  router.beforeEach(async (to, _from, next) => {
    metaStore.view.title = to.meta?.title
    if( process.env.NODE_ENV === 'development' ) {
      return next()
    }

    // if( to.fullPath.startsWith('/dashboard') && !userStore.$currentUser._id ) {
    //   next('/user/signin')
    // }

    else next()
  })

  return router
}

export const normalizeRoutes = (node: RouterExtensionNode, parentName?: string) => {
  return node.map((child) => {
    const normalizedName = (() => {
      if( !child.path ) {
        return parentName
      }

      return `${parentName}-` + child.path
        .replace(/(^\/|\?)/g, '')
        .replace(/\/:?/g, '-')
    })()

    if( child.children ) {
      child.children = normalizeRoutes(child.children, normalizedName)
    }

    return {
      name: normalizedName,
      ...child
    }
  })
}

export const extendRouter = (router: any, routerExtension: RouterExtension) => {
  Object.entries(routerExtension).forEach(([key, routes]) => {
    const parentName = key === 'public'
      ? ''
      : key

    const normalized = normalizeRoutes(routes, key)
    normalized.forEach((route) => router.addRoute(parentName, route))
  })
}
