import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router/auto'
import { meta } from './stores'

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

let __popstateListenerAttached = false
let __popstate = false

export {
  __popstate
}

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

  if( !__popstateListenerAttached ) {
    window.addEventListener('popstate', () => {
      __popstate = true
    })

    __popstateListenerAttached = true
  }

  router.beforeEach(async (to, _from) => {
    const metaStore = meta()()

    metaStore.menu.visible = false
    metaStore.view.title = to.meta?.title as string

    if( __popstate ) {
      to.query._popstate = 'true'
      __popstate = false
    }
  })

  return router
}

