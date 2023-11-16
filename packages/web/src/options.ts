import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { RouteMeta } from './router'

export type MenuAdvancedChildrenBase = {
  badge?: () => string | number extends infer ReturnType
    ? ReturnType | Promise<ReturnType>
    : never
}

export type MenuAdvancedChildrenNamed = MenuAdvancedChildrenBase & {
  name: string
}

export type MenuAdvancedChildrenCollapsable = MenuAdvancedChildrenBase & {
  collapsed: boolean
  children: Array<string | MenuAdvancedChildren>
  meta: {
    title: string
    icon: string
  }
}

export type MenuAdvancedChildren = 
  | MenuAdvancedChildrenNamed
  | MenuAdvancedChildrenCollapsable

export type MenuSchema = Record<string, Partial<RouteMeta> & {
  roles?: Array<string> | ((role: Array<string>) => boolean | Promise<boolean>)
  children: Array<string | MenuAdvancedChildren>
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
