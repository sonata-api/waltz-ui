import { defineStore } from 'pinia'
import { deepClone, deserialize } from '@sonata-api/common'
import { Description } from '@sonata-api/types'

import { useHttp } from '../http'
import { useCollection } from '../state/collection'
import { useStore, hasStore, registerStore } from '../state/use'
import { freshItem, freshFilters } from '../state/helpers'

type CollectionName = string
type PromptAnswer = { name: string }

const { http } = useHttp()

export default defineStore('meta', {
  state: () => ({
    descriptions: [],
    roles: {},

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
      visible: true
    },
    menu: {
      visible: true,
      isMobileVisible: false
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
  }),

  actions: {
    async describe(props?: Parameters<ReturnType<typeof import('@sonata-api/system').algorithms.meta>['functions']['describe']>[0]) {
      this.isLoading = true
      const response = (await http('_/meta/describe', props))?.data
      const deserialized = deserialize(response)

      const descriptions: Record<CollectionName, Description> =
        this.descriptions = deserialized.descriptions

      if( deserialized.roles ) {
        this.roles = deserialized.roles
      }

      // monkeypatchs '@waltz-ui/web/stores' object
      for ( const [collectionName, description] of Object.entries(descriptions) ) {
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

        const {
          state,
          actions,
          getters
        } = useCollection()

        const store = defineStore(collectionName, {
          state: () => Object.assign(state(), {
            item,
            filters,
            freshItem: deepClone(item),
            freshFilters: deepClone(filters),
            _description: description,
            rawDescription
          }),

          actions,
          getters
        })

        registerStore(store)
        store()
      }

      this.isLoading = false
    },

    swapMenu() {
      this.menu.visible = !this.menu.visible
      localStorage.setItem('meta:menu:visible', String(this.menu.visible))
    },
    swapSidepanel() {
      this.sidepanel.visible = !this.sidepanel.visible
      localStorage.setItem('meta:sidepanel:visible', String(this.sidepanel.visible))
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
      this.$patch({
        prompt: {
          ...props,
          visible: true
        } as any
      })

      return new Promise((resolve) => {
        const event = ({ detail }: any) => {
          window.removeEventListener('__prompt', event)
          this.prompt.visible = false
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

    spawnModal(props: Partial<Omit<typeof this['modal'], 'visible'>>) {
      this.$patch({
        modal: {
          ...props,
          visible: true
        }
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
      localStorage.setItem('meta:theme', this.theme)
    },
  },

  getters: {
    $theme(): string {
      const theme = this.themeOverride || this.theme
      if( !theme ) {
        const defaultTheme = 'default'
        this.theme = localStorage.getItem('meta:theme__') || defaultTheme
        return this.theme
      }

      return theme
    },
  }
})
