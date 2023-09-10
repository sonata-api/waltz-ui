import { deepClone, deserialize, request } from '@sonata-api/common'
import { Description } from '@sonata-api/types'
import { reactive, computed } from 'vue'

import { useStore, hasStore, registerStore } from '@waltz-ui/state-management'
import { createCollectionStore } from '../state/collection'
import { freshItem, freshFilters } from '../state/helpers'
import { API_URL } from '../constants'

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
    roles: [] as Array<string>,
    isLoading: false,
    globalIsLoading: false,
    theme: '',
    themeOverride: '',
    availableThemes: INSTANCE_VARS?.themes || [],
    view: {
      title: '',
      layout: 'tabular',
      collection: ''
    },
    sidepanel: {
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
      actions: [],
    },
    toasts: [] as Array<Toast>,
  })


  const getters = {
    $theme: computed(() => {
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
      async describe(props?: Parameters<ReturnType<typeof import('@sonata-api/system').algorithms.meta>['functions']['describe']>[0]) {
        state.isLoading = true
        const response = (await request(`${API_URL}/_/meta/describe`, props))?.data
        const deserialized = deserialize(response)

        const globalDescriptions: Record<CollectionName, Description> =
          state.descriptions = deserialized.descriptions

        if( deserialized.roles ) {
          state.roles = deserialized.roles
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

          // const store = defineStore(collectionName, {
          //   state: () => Object.assign(state(), {
          //     item,
          //     filters,
          //     freshItem: deepClone(item),
          //     freshFilters: deepClone(filters),
          //     _description: description,
          //     rawDescription
          //   }),

          //   actions,
          //   getters
          // })
          //
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

          // registerStore(store)
          // store()
        }

        state.isLoading = false
      },

      swapSidepanel() {
        state.sidepanel.visible = !state.sidepanel.visible
        localStorage.setItem('meta:sidepanel:visible', String(state.sidepanel.visible))
      },

      spawnPrompt(props: {
        title?: string
        body?: string
        actions: Array<{
          name: string
          title: string
          size?: string
          variant?: string
        }>
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
        this: { toasts: Array<any> },
        props: {
          text: string
          icon?: string
        }
      ) {
        state.toasts.push({
          ...props,
          itr: Math.random(),
          idx: state.toasts.length,
          date: new Date()
        })
      },

      popToast(this: { toasts: Array<any> }, itr?: number) {
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

