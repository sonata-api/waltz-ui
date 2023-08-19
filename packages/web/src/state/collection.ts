import type { Description, Layout } from '@sonata-api/types'
import { computed, reactive } from 'vue'
import { useStore, type Store } from '@waltz-ui/state-management'
import { deepClone, deepMerge } from '@sonata-api/common'
import { PAGINATION_PER_PAGE_DEFAULT } from '../constants'
import { deepDiff } from './deepDiff'
import { insertReady } from './insertReady'
import { useActions } from './actions'

import  {
  condenseItem,
  isNull,
  removeEmpty,
  normalizeFilters,
  normalizeActions

} from './helpers'

export type CollectionStore = ReturnType<typeof internalUseCollectionStore> & {
  $id: string
}

const internalUseCollectionStore = <TItem extends Record<string, any> & { _id?: string|null }>() => {
  const rawDescription = reactive({} as Description)

  const description = computed(() => {
    if( rawDescription.preferred ) {
      const userStore = useStore('user')
      const description = Object.assign({}, rawDescription)
      const toMerge = {}

      userStore.$currentUser.roles.forEach((role: string) => {
        if( role in rawDescription.preferred! ) {
          Object.assign(toMerge, deepMerge(toMerge, rawDescription.preferred![role]))
        }
      })

      Object.assign(description, deepMerge(description, toMerge, { arrays: false }))
    }

    return rawDescription
  })

  const properties = computed(() => description.value.properties || {})

  const actions = computed(() => normalizeActions(description.value.actions))
  const individualActions = computed(() => normalizeActions(description.value.individualActions))

  const hasSelectionActions = computed(() => actions.value.some((action) => !!action.selection))


  const item = reactive({} as TItem)
  const referenceItem = reactive({} as TItem)
  const items = reactive<Array<TItem>>([])

  const condensedItem = computed(() => condenseItem(item))
  const diffedItem = computed(() => deepDiff(
    referenceItem,
    item,
    { preserveIds: true }
  ))

  const hasDiff = computed(() => Object.keys(diffedItem.value).length)
  const isInsertReady = computed(() => insertReady(
      item,
      properties.value,
      description.value.required as Lowercase<string>[],
      description.value
  ))

  const itemsCount = computed(() => items.length)

  const references = computed(() => {
    if( !description.value.properties ) {
      return []
    }
    return Object.entries(description.value.properties).filter(([, property]) => {
      return property.s$isReference && property.s$inline
    })
  })

 const inlineReferences = computed(() => {
   if( !description.value.properties ) {
     return []
   }

   return Object.entries(description.value.properties).filter(([, property]) => {
      return property.s$isReference && property.s$inline
    })
 })

  const filters = reactive({})
  const $filters = computed(() => {
    const sanitizedFilters = removeEmpty(deepClone(filters)) as Record<Lowercase<string>, any>

    const expr = (key: Lowercase<string>, value: any) => {
      const property = properties.value[key]
      const getValue = (value: any) => {
        if( !property ) {
          return value
        }

        if( property.type === 'boolean' && value === false ) {
          return {
            $ne: true
          }
        }

        if( property.type === 'string' && !property.format ) {
          return {
            $regex: value,
            $options: 'i'
          }
        }

        return value?._id||value
      }

      if( Array.isArray(value) ) {
        return {
          $in: value.map(v => getValue(v))
        }
      }

      return getValue(value)
    }

    const entries = Object.entries(sanitizedFilters).reduce((a: Array<any>, [key, filter]) => {
      if( key.startsWith('$') ) {
        return [
          ...a,
          [key, filter]
        ]
      }

      if( filter && typeof filter === 'object' && !Array.isArray(filter) ) {
        Object.keys(filter).forEach((key) => {
          if( isNull(filter[key]) || Object.values(filter[key]).every((_) => isNull(_)) ) {
            delete filter[key]
          }
        })
      }

      if( isNull(filter) || (typeof filter === 'object' && Object.keys(filter).length === 0) ) {
        return a
      }

      return [
        ...a,
        [key, expr(key as Lowercase<string>, filter)]
      ]
    }, [])


    return Object.fromEntries(entries)

  })

  const filtersCount = computed(() => Object.values($filters.value).filter((_: any) => !!_).length)
  const hasActiveFilters = computed(() => Object.values(filters).some((_) => !!_))

  const availableFilters = computed(() => {
    if( !description.value.filters || !description.value.properties ) {
      return {}
    }

    return Object.keys(normalizeFilters(description.value.filters)).reduce((a, k) => {
      const property = properties.value[k as Lowercase<string>]

      return {
        ...a,
        ...(property ? { [k]: property } : {})
      }
    }, {})
  })

  const layout = computed(() => description.value.layout || <Layout>({
    name: 'tabular',
    options: {}
  }))

  const transformers = {} as Record<Lowercase<string>, (value: any) => any>

  const state = {
    description,
    rawDescription,
    properties: description.value.properties,
    layout,

    item,
    referenceItem,
    diffedItem,
    condensedItem,
    freshItem: {} as TItem,
    hasDiff,
    isInsertReady,

    items,
    itemsCount,
    references,
    inlineReferences,

    filters,
    $filters,
    filtersCount,
    hasActiveFilters,
    availableFilters,
    freshFilters: {} as any,
    activeFilters: {} as any,
    filtersPreset: {} as any,

    actions,
    individualActions,
    hasSelectionActions,

    preferredTableProperties: [],
    customGetters: [],

    selected: [] as Array<TItem> | Array<string>,
    currentLayout: '',

    validationErrors: {} as any,
    loading: {} as any,
    halt: false,

    pagination: {
      offset: 0,
      limit: PAGINATION_PER_PAGE_DEFAULT,
      recordsCount: 0,
      recordsTotal: 0,
      currentPage: 0
    },

    transformers
  }

  return state
}

export const useCollectionStore = <const TStoreContent extends Store<any>=any>(newer?: TStoreContent) => {
  const initial = internalUseCollectionStore()

  const state: Store<any> & TStoreContent = newer
    ? deepMerge(initial as any, newer)
    : initial

  return {
    state: state,
    actions: useActions(state),
  }
}
