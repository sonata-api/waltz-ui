import type { defineOptions } from './options'
import { createApp, App } from 'vue'
import { Router } from 'vue-router'
import { arraysIntersects } from '@sonata-api/common'
import { createI18n, t } from '@waltz-ui/i18n'
import { routerInstance as createRouter } from './router'
import { templateFunctions } from './templateFunctions'

import { useParentStore } from '@waltz-ui/state-management'
import { meta, user } from './stores'
import registerDirectives from './directives'

export type * from './templateFunctions'

export const useApp = async (optionsFn: ReturnType<typeof defineOptions>): Promise<{
  app: App
  router: Router
  mount: () => any
}> => new Promise(async (resolve) => {
  const useMetaStore = meta()
  const useUserStore = user()

  const options = typeof optionsFn === 'function'
    ? await optionsFn()
    : optionsFn

  const {
    component,
    menuSchema,
    routes

  } = options

  const app = createApp(component)
  registerDirectives(app)

  const router = createRouter(routes || [], options.dashboardComponent)
  if( options.i18n ) {
    createI18n(options.i18n)
  }

  if( options.setup ) {
    await options.setup()
  }

  const metaStore = useMetaStore()
  const userStore = useUserStore()

  app.use(router)
  app.provide('menuSchema', menuSchema)

  app.mixin({
    computed: {
      instanceVars: () => INSTANCE_VARS || {},
      currentUser: () => userStore.$currentUser,
      viewTitle: () => {
        const currentRoute = router.currentRoute.value
        const title = currentRoute.meta?.title as string

        if( !title ) {
          return
        }

        return title.replace(
          '%viewTitle%',
          t(currentRoute.params?.collection as string, {
            plural: true
          })
        )
      },
      viewIcon: () => {
        const currentRoute = router.currentRoute.value
        return currentRoute.meta.icon
          || metaStore.descriptions[currentRoute.params?.collection as string]?.icon
      }
    },
    methods: {
      ...templateFunctions,
      hasRoles(roles: string | string[]) {
        return arraysIntersects(roles, userStore.$currentUser.roles)
      },
      useStore(storeName?: string) {
        return useParentStore(storeName)
      },
      t
    }
  })

  Object.assign(window, {
    ROUTER: router,
  })

  if( userStore.signedIn || /^\/dashboard(\/|$)/.test(location.pathname) ) {
    try {
      await metaStore.$actions.describe({
        roles: true,
        revalidate: true
      })
    } catch( err ) {
      localStorage.removeItem('auth:token')
      router.push('/user/signin')
    }
  }

  resolve({
    app,
    router,
    mount: () => app.mount('#app')
  })
})
