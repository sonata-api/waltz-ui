import type { Description } from '@sonata-api/types'
import { watch } from 'vue'
import { useRouter } from 'vue-router/auto'
import { arraysIntersects } from '@sonata-api/common'
import { useStore } from '@waltz-ui/state-management'

export const bootstrapRoutes = () => {
  const router = useRouter()
  const metaStore = useStore('meta')
  const userStore = useStore('user')

  watch(() => metaStore.descriptions, (descriptions: Record<string, Description>) => {
    Object.values(descriptions).forEach((description) => {
      const routeVisibility = description.route
      if(
        Array.isArray(routeVisibility)
          && !arraysIntersects(userStore.currentUser.roles, routeVisibility)
      ) {
        return
      }

      const routeName = `/dashboard/${description.$id}`
      if( router.hasRoute(routeName) ) {
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

      router.addRoute('dashboard', route)
    })

  }, { immediate: true })
}
