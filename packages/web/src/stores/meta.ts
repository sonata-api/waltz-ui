import { deepClone, deserialize } from '@sonata-api/common'
import { Description } from '@sonata-api/types'
import { ref, reactive, computed } from 'vue'

import { useStore, hasStore, registerStore } from '@waltz-ui/state-management'
import { useHttp } from '../http'
import { useCollectionStore } from '../state/collection'
import { freshItem, freshFilters } from '../state/helpers'

type CollectionName = string
type PromptAnswer = { name: string }

const { http } = useHttp()

export const useMetaStore = () => registerStore(() => {
  const descriptions = ref([])
  const roles = ref([])

  const isLoading = ref(false)
  const theme = ref('')
  const themeOverride = ref('')

  const $theme = computed(() => {
    const currTheme = themeOverride.value || theme.value
    if( !currTheme ) {
      const defaultTheme = 'default'
      theme.value = localStorage.getItem('meta:theme__') || defaultTheme
      return theme.value
    }

    return currTheme
  })

  const menu = reactive({
    visible: true,
    isMobileVisible: false
  })

  const sidepanel = reactive({
    visible: false
  })

  const modal = reactive({
    visible: false,
    title: '',
    body: '',
    component: '',
    details: {}
  })

  const prompt = reactive({
    visible: false,
    title: '',
    body: '',
    actions: [],
  })

  return {
    $id: 'meta',
    state: {
      descriptions: {} as Record<string, Description>,
      roles: {},

      isLoading,
      globalIsLoading: false,

      theme,
      $theme,
      themeOverride,
      availableThemes: INSTANCE_VARS?.themes || [],
      
      view: {
        title: '',
        layout: 'tabular',
        collection: ''
      },
      menu,
      sidepanel,
      modal,
      prompt,
      toasts: [],
    },

  actions: {
    async describe(props?: Parameters<ReturnType<typeof import('@sonata-api/system').algorithms.meta>['functions']['describe']>[0]) {
      isLoading.value = true
      const response = (await http('_/meta/describe', props))?.data
      const deserialized = deserialize(response)

      const globalDescriptions: Record<CollectionName, Description> =
        descriptions.value = deserialized.descriptions

      if( deserialized.roles ) {
        roles.value = deserialized.roles
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

      isLoading.value = false
    },

    swapMenu() {
      menu.visible = !menu.visible
      localStorage.setItem('meta:menu:visible', String(menu.visible))
    },
    swapSidepanel() {
      sidepanel.visible = !sidepanel.visible
      localStorage.setItem('meta:sidepanel:visible', String(sidepanel.visible))
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
          prompt.visible = false
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

    spawnModal(props: Partial<Omit<typeof modal, 'visible'>>) {
      Object.assign(modal, {
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
      localStorage.setItem('meta:theme', theme.value)
    },
  },
  }

})

