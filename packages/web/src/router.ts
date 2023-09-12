import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router/auto'
import { isRight } from '@sonata-api/common'
import { meta, user } from './stores'

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

  router.beforeEach(async (to, _from, next) => {
    const metaStore = meta()()
    const userStore = user()()

    metaStore.menu.visible = false
    metaStore.view.title = to.meta?.title as string

    if( to.fullPath.startsWith('/dashboard') && !userStore.currentUser.pinged ) {
      const resultEither = await userStore.$functions.ping()
      if( isRight(resultEither) ) {
        userStore.currentUser.pinged = true
        return next()
      }

      next('/user/signin')
    }

    else next()
  })

  return router
}

