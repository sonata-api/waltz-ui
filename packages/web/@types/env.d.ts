declare module '@waltz-ui/ui' {
  export { default as routes } from '../ui/router'
}

declare module 'vue-router/auto' {
  import { createRouter as cr, createWebHistory, Router, RouteRecordRaw } from 'vue-router'
  export const createRouter: (config: Omit<Parameters<typeof cr>[0], 'routes'> & {
    extendRoutes: (routes: Array<RouteRecordRaw>) => Array<RouteRecordRaw>
  }) => Router

  export {
    Router,
    RouteRecordRaw,
    createWebHistory
  }
}

var ROUTER: import('vue-router').Router
var I18N: any
var STORES: Record<string, import('@waltz-ui/state-management').Store>
var QUERY_CACHE: Record<string, {
  items: Array<any>
  satisfied: boolean
}>

var INSTANCE_VARS: {
  themes?: Array<string>
  darkThemes?: Array<string>
  dashboardLayout?: Record<string, {
  }>
}
