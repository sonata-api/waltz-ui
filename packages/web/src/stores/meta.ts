import { deepClone, deserialize } from '@sonata-api/common'
import { Description } from '@sonata-api/types'
import { reactive, computed, type ComputedRef } from 'vue'

import { useStore, hasStore, registerStore } from '@waltz-ui/state-management'
import { useHttp } from '../http'
import { useCollectionStore } from '../state/collection'
import { freshItem, freshFilters } from '../state/helpers'

type CollectionName = string
type PromptAnswer = { name: string }

const { http } = useHttp()

export const useMetaStore = () => registerStore(() => {
  const state = reactive({
    descriptions: {} as Record<string, Description>,
    roles: [] as Array<string>,

    isLoading: false,
    globalIsLoading: false,

    theme: '',
    $theme: {} as ComputedRef<ComputedRef<string>>,
    themeOverride: '',
    availableThemes: INSTANCE_VARS?.themes || [],

    view: {
      title: '',
      layout: 'tabular',
      collection: ''
    },
    menu: {
      visible: true,
      isMobileVisible: false
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
    toasts: [],
  })


  state.$theme = computed(() => {
    const currTheme = state.themeOverride || state.theme
    if( !currTheme ) {
      const defaultTheme = 'default'
      state.theme = localStorage.getItem('meta:theme__') || defaultTheme
      return state.theme
    }

    return currTheme
  })

  return {
    $id: 'meta',
    state,
    actions: {
      async describe(props?: Parameters<ReturnType<typeof import('@sonata-api/system').algorithms.meta>['functions']['describe']>[0]) {
        state.isLoading = true
        const response = (await http('_/meta/describe', props))?.data
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
            store.$patch({
              item,
              filters,
              freshItem: deepClone(item),
              freshFilters: deepClone(filters),
              _description: description,
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
          registerStore(() => useCollectionStore<any>()({
            $id: collectionName,
            state: {
              item,
              filters,
              freshItem: deepClone(item),
              freshFilters: deepClone(filters),
              _description: description,
              rawDescription
            }
          }))

          // registerStore(store)
          // store()
        }

        state.isLoading = false
      },

      swapMenu() {
        state.menu.visible = !state.menu.visible
        localStorage.setItem('meta:menu:visible', String(state.menu.visible))
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
        Object.assign(prompt, {
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
        this.toasts.push({
          ...props,
          itr: Math.random(),
          idx: this.toasts.length,
          date: new Date()
        })
      },

      popToast(this: { toasts: Array<any> }, itr?: Date) {
        if( !itr ) {
          this.toasts.shift()
          return
        }

        this.toasts = this.toasts
          .filter((toast) => toast.itr !== itr)
      },

      saveTheme() {
        localStorage.setItem('meta:theme', state.theme)
      },
    },
  }

})

