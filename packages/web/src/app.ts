import type { defineOptions } from './options'
import { isLeft } from '@sonata-api/common'
import { createApp, App } from 'vue'
import { Router } from 'vue-router'
import { createI18n, t } from '@waltz-ui/i18n'
import { routerInstance as createRouter } from './router'
import { templateFunctions } from './templateFunctions'
import { meta, user } from './stores'
import { STORAGE_NAMESPACE } from './constants'
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
  app.use(router)

  if( options.i18n ) {
    createI18n(options.i18n)
  }

  if( options.setup ) {
    await options.setup()
  }

  const metaStore = useMetaStore()
  const userStore = useUserStore()

  app.provide('menuSchema', menuSchema)

  app.mixin({
    computed: {
      instanceVars: () => INSTANCE_VARS || {},
      currentUser: () => userStore.$currentUser,
      viewTitle: () => {
        const currentRoute = ROUTER.currentRoute.value
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
    methods: templateFunctions
  })

  Object.assign(window, {
    ROUTER: router,
  })

  if( userStore.signedIn || /^\/dashboard(\/|$)/.test(location.pathname) ) {
    let hasError = false

    try {
      const resultEither = await metaStore.$actions.describe({
        roles: true,
        revalidate: true
      })

      if( isLeft(resultEither) ) {
        hasError = true
      }
    } catch( err: any ) {
      hasError = true
    }

    if( hasError ) {
      const next = `${location.pathname}${location.search}`
      localStorage.removeItem(`${STORAGE_NAMESPACE}:auth`)

      if( router.currentRoute.value.path.startsWith('/user/signin') ) {
        localStorage.setItem(`${STORAGE_NAMESPACE}:auth:next`, next)
        router.push({
          name: '/user/signin',
          query: {
            next
          }
        })
        return
      }

      router.push({
        name: '/user/signin'
      })
    }

  }

  resolve({
    app,
    router,
    mount: () => app.mount('#app')
  })
})
