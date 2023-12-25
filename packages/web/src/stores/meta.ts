import type { PromptAction } from '../behavior'
import { deepClone, deserialize } from '@sonata-api/common'
import { Description } from '@sonata-api/types'
import { reactive, computed } from 'vue'

import { useStore, hasStore, registerStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'
import { createCollectionStore } from '../state/collection'
import { freshItem, freshFilters } from '../state/helpers'
import { API_URL } from '../constants'
import { request } from '../http'
import { user } from './user'

type CollectionName = string
type PromptAnswer = { name: string }

export type Toast = {
  text: string
  icon?: string
  itr: number
  idx: number
  date: Date
}

export const meta = () => registerStore(() => {
  if( !window.INSTANCE_VARS ) {
    Object.assign(window, {
      INSTANCE_VARS: {}
    })
  }

  const state = reactive({
    descriptions: {} as Record<string, Description>,
    roles: [] as string[],
    isLoading: false,
    globalIsLoading: false,
    theme: '',
    themeOverride: '',
    availableThemes: INSTANCE_VARS?.themes || [],
    view: {
      title: '',
      layout: 'tabular',
      collection: '',
    },
    menu: {
      visible: false
    },
    modal: {
      visible: false,
      title: '',
      body: '',
      component: '',
      details: {}
    },
    prompt: {
      visible: false,
      title: '',
      body: '',
      actions: [] as PromptAction[],
    },
    toasts: [] as Toast[],
  })


  const getters = {
    $theme: computed((): string => {
      const currTheme = state.themeOverride || state.theme
      if( !currTheme ) {
        const defaultTheme = 'default'
        state.theme = localStorage.getItem('meta:theme') || defaultTheme
        return state.theme
      }

      return currTheme
    })
  }

  return {
    $id: 'meta',
    state,
    getters,
    actions: {
      async describe(props?: { revalidate?: boolean, roles?: boolean }) {
        state.isLoading = true
        const response = (await request(`${API_URL}/describe`, props))?.data
        const deserialized = deserialize(response)

        const globalDescriptions: Record<CollectionName, Description> =
          state.descriptions = deserialized.descriptions

        if( deserialized.roles ) {
          state.roles = deserialized.roles
        }

        if( deserialized.auth ) {
          localStorage.setItem('auth:token', deserialized.auth.token.content)
          user()().$actions.setCurrentUser(deserialized.auth.user)
        }

        for ( const [collectionName, description] of Object.entries(globalDescriptions) ) {
          const rawDescription = Object.assign({}, description)
          const item = freshItem(description)

          const filters = freshFilters(description)

          if( !description.properties ) {
            throw new Error(
              `collection ${collectionName} has no properties`
            )
          }

          if( hasStore(collectionName) ) {
            const store = useStore(collectionName)
            Object.assign(store, {
              item,
              filters,
              freshItem: deepClone(item),
              freshFilters: deepClone(filters),
              rawDescription
            })
            continue
          }

          registerStore(() => createCollectionStore<any>()({
            $id: collectionName,
            state: {
              item,
              filters,
              freshItem: deepClone(item),
              freshFilters: deepClone(filters),
              rawDescription
            }
          }))

        }

        state.isLoading = false
      },

    async ask(props: {
      action: (params: any) => unknown,
      params?: any
      title?: string
      body?: string
    }) {
      const answer = await useStore('meta').$actions.spawnPrompt({
        body: t(props.body || 'prompt.default'),
        actions: [
          {
            name: 'cancel',
            title: t('action.cancel'),
            variant: 'danger',
          },
          {
            name: 'confirm',
            title: t('action.confirm'),
          },
        ]
      })

      if( answer.name === 'confirm' ) {
        const { action, params } = props
        return action(params)
      }
    },

      spawnPrompt(props: {
        title?: string
        body?: string
        actions: PromptAction[]
      }): Promise<PromptAnswer> {
        Object.assign(state.prompt, {
          ...props,
          visible: true
        })

        return new Promise((resolve) => {
          const event = ({ detail }: any) => {
            window.removeEventListener('__prompt', event)
            state.prompt.visible = false
            resolve(detail.option)
          }

          window.addEventListener('__prompt', event)
        })
      },

      fulfillPrompt(answer: PromptAnswer) {
        window.dispatchEvent(new CustomEvent('__prompt', {
          detail: { option: answer }
        }))
      },

      spawnModal(props: Partial<Omit<typeof state.modal, 'visible'>>) {
        Object.assign(state.modal, {
          ...props,
          visible: true
        })
      },

      spawnToast(
        this: any,
        props: {
          text: string
          icon?: string
        }
      ) {
        if( state.toasts.length >= 3 ) {
          state.toasts.splice(-1)
        }

        state.toasts.unshift({
          ...props,
          itr: Math.random(),
          idx: state.toasts.length,
          date: new Date()
        })
      },

      popToast(this: { toasts: any[] }, itr?: number) {
        if( !itr ) {
          state.toasts.shift()
          return
        }

        state.toasts = state.toasts
          .filter((toast) => toast.itr !== itr)
      },

      saveTheme(theme?: string) {
        if( theme ) {
          state.theme = theme
        }

        localStorage.setItem('meta:theme', state.theme)
      },
    },
  }

})

