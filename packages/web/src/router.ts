import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router/auto'
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

export const routerInstance = (routes: Array<RouteRecordRaw>, dashboardComponent?: Component) => {
  const router = createRouter({
    history: createWebHistory(),
    extendRoutes: (fsRoutes) => {
      const dashboardRoute = fsRoutes.find((route) => route.path === '/dashboard')!

      if( dashboardComponent ) {
        dashboardRoute.component = dashboardComponent
      }

      return [
        ...routes,
        ...fsRoutes
      ]
    }
  })

  router.beforeEach(async (to, from) => {
    const metaStore = meta()()
    const userStore = user()()

    metaStore.menu.visible = false
    metaStore.view.title = to.meta?.title as string

    window.scrollTo(0, 0)

    if( /^\/dashboard/.test(to.path) && !userStore.signedIn ) {
      return {
        name: '/user/signin'
      }
    }

    if( router.options.history.state.forward === from.fullPath ) {
      to.query._popstate = 'true'
    }
  })

  return router
}

