import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { RouteMeta } from './router'

export type MenuAdvancedChildBase = {
  badge?: () => string | number extends infer ReturnType
    ? ReturnType | Promise<ReturnType>
    : never
}

export type MenuAdvancedChildNamed = MenuAdvancedChildBase & {
  name: string
}

export type MenuAdvancedChildCollapsible = MenuAdvancedChildBase & {
  collapsed: boolean | 'user'
  children: Array<string | MenuAdvancedChild>
  meta: {
    title: string
    icon?: string
  }
}

export type MenuAdvancedChild = 
  | MenuAdvancedChildNamed
  | MenuAdvancedChildCollapsible

export type MenuSchemaNode = Partial<RouteMeta> & {
  roles?: Array<string> | ((role: Array<string>) => boolean | Promise<boolean>)
  children: Array<string | MenuAdvancedChild>
}

export type MenuSchema = Array<MenuSchemaNode | string | Array<string | MenuAdvancedChild>>

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
