import type { Component } from 'vue'
import type { Icon } from '@sonata-api/types'
import type { GlobalStateManager } from '@waltz-ui/state-management'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router/auto'
import { meta } from './stores'

export type RouteMeta = {
  meta: {
    title: string
    icon?: Icon
    roles?: string[]
  }
}

export type Route = RouteMeta & Omit<RouteRecordRaw, 'children'> & {
  path: string
  children?: Route[]
  components?: any
  badgeFunction?: string
  badgePayload?: any
}

export type RouterExtensionNode = Omit<Route, 'name'>[]
export type RouterExtension = Record<string, RouterExtensionNode>

export const routerInstance = (
  routes: RouteRecordRaw[],
  instance: GlobalStateManager,
  dashboardComponent?: Component,
) => {
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
    const metaStore = meta(instance)()
    metaStore.menu.visible = false
    metaStore.view.title = to.meta?.title as string

    window.scrollTo(0, 0)

    if( router.options.history.state.forward === from.fullPath ) {
      to.query._popstate = 'true'
    }
  })

  return router
}

