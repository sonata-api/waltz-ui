declare module '@waltz-ui/ui' {
  export { default as routes } from '../ui/router'
}

declare module 'vue-router/auto' {
  import { createRouter as cr, createWebHistory, Router, RouteRecordRaw } from 'vue-router'
  export const createRouter: (config: Omit<Parameters<typeof cr>[0], 'routes'> & {
    extendRoutes: (routes: RouteRecordRaw[]) => RouteRecordRaw[]
  }) => Router

  export {
    Router,
    RouteRecordRaw,
    createWebHistory
  }
}

var I18N: any
var ROUTER: import('vue-router').Router
var STORES: Record<string, import('@waltz-ui/state-management').Store>
var INSTANCE_VARS: InstanceConfig['site']

