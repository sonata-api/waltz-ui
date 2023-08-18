import { createApp, App } from 'vue'
import { Router } from 'vue-router'

import { createPinia } from 'pinia'
import { arraysIntersects } from '@sonata-api/common'
import { capitalize, formatDateTime } from '@sonata-api/common/string'
import { formatToString, daysAgo, getRelativeTimeFromNow } from '@sonata-api/common/date'

import { createI18n } from 'vue-i18n'
import { routerInstance as createRouter } from './router'

import type { AppOptions } from './options'
import { useStore, useParentStore } from '@waltz-ui/state-management'
import { useMetaStore, useUserStore } from './stores'
import registerDirectives from './directives'

export const useApp = (options: AppOptions): Promise<{
  app: App
  router: Router
  mount: () => any
}> => new Promise(async (resolve) => {
  const {
    component,
    i18n: i18nConfig,
    menuSchema,
    routes

  }: AppOptions = options

  const app = createApp(component)
  registerDirectives(app)

  const pinia = window.PINIA = createPinia()
  app.use(pinia)

  const router = createRouter(routes || [])
  const i18n = createI18n(i18nConfig)

  pinia.use(() => ({
    router,
    i18n: i18n.global,
    store: useStore
  }))

  if( options.setup ) {
    await options.setup()
  }

  const metaStore = useMetaStore()
  const userStore = useUserStore()

  app.use(router)
  app.use(i18n)

  app.provide('menuSchema', menuSchema)
  app.provide('i18n', i18n)

  // app.provide('baseVersion', require('../package.json').version)
  app.provide('dashboardLayout', window.INSTANCE_VARS?.dashboardLayout || {})

  app.mixin({
    computed: {
      instanceVars: () => window.INSTANCE_VARS || {},
      currentUser: () => userStore.$currentUser,
      viewTitle: () => {
        const currentRoute = router.currentRoute.value
        const title = currentRoute.meta?.title as string

        if( !title ) {
          return
        }

        return title.replace(
          '%viewTitle%',
          I18N.global.tc(currentRoute.params?.collection || '', 2)
        )
      },
      viewIcon: () => {
        const currentRoute = router.currentRoute.value
        return currentRoute.meta.icon
          || metaStore.descriptions[currentRoute.params?.collection as string]?.icon
      }
    },
    methods: {
      getLayoutOption(optionName: keyof typeof INSTANCE_VARS['dashboardLayout']) {
        const dashboardLayout = INSTANCE_VARS.dashboardLayout

        if( !dashboardLayout ) {
          return null
        }

        const role = userStore.$currentUser.roles?.find((role: string) => role in dashboardLayout) || 'default'

        return dashboardLayout[role]?.[optionName]
      },
      hasRoles(roles: string|Array<string>) {
        return arraysIntersects(roles, userStore.$currentUser.roles)
      },
      useStore(storeName?: string) {
        return useParentStore(storeName)
      },

      // string
      capitalize,
      formatDateTime,

      // date
      formatToString,
      daysAgo,
      getRelativeTimeFromNow
    }
  })

  Object.assign(window, {
    ROUTER: router,
    QUERY_CACHE: {},
    I18N: i18n
  })

  if( userStore.signedIn ) {
    try {
      await metaStore.describe({
        roles: true
      })

    } catch( e ) {
      console.trace(e)

      // localStorage.clear()
      // setTimeout(() => {
      //   location.reload()
      // }, 10000)
    }
  }

  resolve({
    app,
    router,
    mount: () => app.mount('#app')
  })
})
