import type { RouteRecordRaw } from 'vue-router'
import {  ref, watch } from 'vue'
import { arraysIntersects } from '@sonata-api/common'
import { useStore } from '@waltz-ui/state-management'
import { Route, MenuSchema, MenuNode } from '..'

type Props = {
  entrypoint?: string
  schema: MenuSchema
}

export const useNavbar = async (props: Props) => {
  const {
    entrypoint = 'dashboard',
    schema: menuSchema
  } = props

  const metaStore = useStore('meta')
  const userStore = useStore('user')
  const router = ROUTER

  const getSchema = (schema: MenuSchema | Route[], routes: Route[]) => {
    return schema.map((node) => {
      if( typeof node === 'string' ) {
        return routes.find((route) => route.name === node)
      }

      if( 'path' in node ) {
        return node
      }

      return 'name' in node
        ? {
          ...node,
          ...routes.find((route) => route.name === node.name)
        }
        : node
    })
  }

  const getRoutes = async (node?: MenuNode) => {
    const children = node && 'children' in node
      ? node.children
      : null

    const routes = children || typeof entrypoint === 'string'
      ? router.getRoutes().filter((route) => route.name?.toString().startsWith(`/${entrypoint}/`))
      : router.getRoutes() 

    const schema = getSchema(children || menuSchema, routes as unknown as Route[])
    const entries: Record<string, Route | MenuNode> = {}

    await Promise.all(Object.entries(schema).map(async ([key, node]) => {
      if( !node ) {
        return
      }

      if( Array.isArray(node) ) {
        entries[key] = {
          children: await getRoutes({
            children: node
          })
        }
        return
      }

      const {
        children,
        ...route

      } = node

      const roles = route?.meta?.roles || ('roles' in node
        ? node.roles
        : null)

      if( roles ) {
        if( typeof roles === 'function' ) {
          if( !await roles(userStore.$currentUser.roles || []) ) {
            return
          }

        }
        else if( !arraysIntersects(userStore.$currentUser.roles, roles) ) {
          return
        }
      }


      if( 'collapsed' in node  ) {
        entries[key] = {
          ...node,
          children: await getRoutes(node)
        }

        return
      }

      entries[key] = route

      if( children ) {
        entries[key].children = await getRoutes(node as MenuNode)
      }
    }))

    return Object.values(entries) as Route[]
  }

  const isCurrent = (subroute: RouteRecordRaw) => {
    const route = router.currentRoute.value

    const pathMatches = typeof subroute.redirect === 'string'
      ? subroute.redirect === route.path
      : subroute.path === (route.redirectedFrom?.path || route.path)?.split(/\/home$/)[0]

    const nameMatches = subroute.name === (route.redirectedFrom?.name || route.name)
    return pathMatches || nameMatches
  }

  const routes = ref(await getRoutes())

  watch(() => metaStore.descriptions, async () => {
    routes.value = await getRoutes()
  })

  return {
    routes,
    isCurrent
  }
}
