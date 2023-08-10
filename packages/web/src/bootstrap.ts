import { watch } from 'vue'
import { arraysIntersects } from '@sonata-api/common'
import type { Description } from '@sonata-api/types'
import { useStore } from './state/use'

export const bootstrapRoutes = () => {
  const metaStore = useStore('meta')
  const userStore = useStore('user')

  watch(() => metaStore.descriptions, (descriptions: Record<string, Description>) => {
    Object.values(descriptions).forEach((description) => {
      const routeVisibility = description.route
      if(
        Array.isArray(routeVisibility)
          && !arraysIntersects(userStore.$currentUser.roles, routeVisibility)
      ) {
        return
      }

      const routeName = `/dashboard/${description.$id}`
      if( ROUTER.hasRoute(routeName) ) {
        return
      }

      const route = {
        name: routeName,
        path: description.$id,
        redirect: `/dashboard/c/${description.$id}`,
        meta: {
          title: description.$id,
          icon: description.icon,
        }
      }

      ROUTER.addRoute('dashboard', route)
    })

  }, { immediate: true })
}
