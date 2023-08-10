import type { RouteRecordRaw } from 'vue-router'
import type { RouteMeta } from './router'

export type MenuAdvancedChildren = {
  name: string
  badgeFunction?: string
  badgePayload?: any
}

export type MenuSchema = Record<string, Partial<RouteMeta> & {
  roles?: Array<string>|((role: Array<string>) => boolean|Promise<boolean>)
  children: Array<string|MenuAdvancedChildren>
}>


export type AppOptions = {
  component: any
  i18n?: any
  menuSchema?: MenuSchema
  routes?: Array<RouteRecordRaw>
  setup?: () => void|Promise<void>
}

export const defineOptions = <TAppOptions extends AppOptions>(options: TAppOptions) => options
