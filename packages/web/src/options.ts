import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { RouteMeta } from './router'

export type MenuAdvancedChildren = {
  name: string
  badge?: () => string | number extends infer ReturnType
    ? ReturnType | Promise<ReturnType>
    : never
}

export type MenuSchema = Record<string, Partial<RouteMeta> & {
  roles?: Array<string>|((role: Array<string>) => boolean|Promise<boolean>)
  children: Array<string|MenuAdvancedChildren>
}>


export type AppOptions = {
  component: Component
  dashboardComponent?: Component
  i18n?: any
  menuSchema?: MenuSchema
  routes?: Array<RouteRecordRaw>
  setup?: () => void|Promise<void>
}

export const defineOptions = <TAppOptions extends AppOptions>(options: TAppOptions | (() => TAppOptions | Promise<TAppOptions>)) => {
  return options
}
