import type { Description, Layout, LayoutName } from '@sonata-api/types'
import { computed, reactive, type ComputedRef } from 'vue'
import { useStore, type StoreState, type UnRef } from '@waltz-ui/state-management'
import { deepClone, deepMerge } from '@sonata-api/common'
import { PAGINATION_PER_PAGE_DEFAULT } from '../constants'
import { deepDiff } from './deepDiff'
import { insertReady } from './insertReady'
import { useStoreActions } from './actions'

import  {
  condenseItem,
  isNull,
  removeEmpty,
  normalizeFilters,
  normalizeActions

} from './helpers'

export type CollectionStoreState =
  ReturnType<typeof internalUseCollectionStore>['state']
  & UnRef<ReturnType<ReturnType<typeof internalUseCollectionStore>['getters']>> 

export type CollectionStore = CollectionStoreState & {
  $id: string
  $functions: Record<string, any>
  $actions: ReturnType<typeof useStoreActions>
}

export type CollectionStoreItem = Record<string, any> & {
  _id?: any
}

const internalUseCollectionStore = <TItem extends CollectionStoreItem>() => {
  const initialState = reactive({
    rawDescription: {} as Description,
    item: {} as TItem,
    referenceItem: {} as TItem,
    diffedItem: {} as Partial<TItem>,
    condensedItem: {} as TItem,
    freshItem: {} as TItem,

    items: [] as Array<TItem>,
    filters: {},
    freshFilters: {} as any,
    activeFilters: {} as any,
    filtersPreset: {} as any,

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

    transformers: {} as Record<Lowercase<string>, (value: any) => any>
  })

  const getters = (state: typeof initialState, storeActions: Record<string, (...args: any[]) => any>) => {
    const description = computed((): Description => {
      if( state.rawDescription.preferred ) {
        const userStore = useStore('user')
        const description = Object.assign({}, state.rawDescription)
        const toMerge = {}

        userStore.$currentUser.roles.forEach((role: string) => {
          if( role in state.rawDescription.preferred! ) {
            Object.assign(toMerge, deepMerge(toMerge, state.rawDescription.preferred![role]))
          }
        })

        Object.assign(description, deepMerge(description, toMerge, { arrays: false }))
        return description
      }

      return state.rawDescription
    })

    const $filters = computed(() => {
      const sanitizedFilters = removeEmpty(deepClone(state.filters)) as Record<Lowercase<string>, any>

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

    const properties = computed(() => description.value.properties || {})
    const actions = computed(() => normalizeActions(description.value.actions))
    const diffedItem = computed(() => deepDiff(
      state.referenceItem,
      state.item,
      { preserveIds: true }
    ))

    return {
      description,
      properties,
      $filters,
      actions,
      individualActions: computed(() => normalizeActions(description.value.individualActions)),
      hasSelectionActions: computed(() => actions.value.some((action) => !!action.selection)),
      condensedItem: computed(() => condenseItem(state.item)),

      itemsCount: computed(() => state.items.length),
      diffedItem,
      hasDiff: computed(() => Object.keys(diffedItem.value).length),
      isInsertReady: computed(() => insertReady(
        state.item,
        properties.value,
        description.value.required as Lowercase<string>[],
        description.value
      )),

      filtersCount: computed(() => Object.values($filters.value).filter((_: any) => !!_).length),
      hasActiveFilters: computed(() => Object.values(state.filters).some((_) => !!_)),
      availableFilters: computed(() => {
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
      }),

      references: computed(() => {
        if( !description.value.properties ) {
          return []
        }
        return Object.entries(description.value.properties).filter(([, property]) => {
          return property.s$isReference && property.s$inline
        })
      }),

      inlineReferences: computed(() => {
        if( !description.value.properties ) {
          return []
        }

        return Object.entries(description.value.properties).filter(([, property]) => {
          return property.s$isReference && property.s$inline
        })
      }),

      layout: computed(() => description.value.layout || <Layout>({
        name: 'tabular',
        options: {}
      })),

      $currentLayout: computed(() => state.currentLayout || (description.value.layout?.name||'tabular') as LayoutName),

      tableProperties: computed(() => {
        const preferredProperties = state.preferredTableProperties.length > 0
          ? state.preferredTableProperties
          : description.value.table

        return preferredProperties
          ? storeActions.useProperties(preferredProperties)
          : properties.value
      })
    }
  }

  return {
    state: initialState,
    getters
  }
}

export const useCollectionStore = <TItem extends CollectionStoreItem>() => <
  TStoreState extends StoreState<any>=any,
  TStoreGetters extends Record<string, ComputedRef<any>>={},
  TStoreActions extends Record<string, (...args: any[]) => any>={}
>(newer: {
  $id: string
  state?: TStoreState
  getters?: (
    state: CollectionStoreState & TStoreState & UnRef<TStoreGetters>,
    actions: ReturnType<typeof useStoreActions> & TStoreActions
  ) => TStoreGetters
  actions?: (
    state: CollectionStoreState & TStoreState & UnRef<TStoreGetters>,
    actions: ReturnType<typeof useStoreActions>
  ) => TStoreActions

}) => {
  const initial: any = internalUseCollectionStore<TItem>()
  const state = initial.state

  const actions = useStoreActions(state)
  if( newer?.actions ) {
    Object.assign(actions, newer.actions(state, actions))
  }

  if( newer.state ) {
    Object.assign(state, newer.state)
  }

  Object.assign(
    state,
    initial.getters(state, actions)
  )

  return {
    $id: newer?.$id,
    state: state as TStoreState,
    getters: newer.getters?.(state, actions as any) as TStoreGetters,
    actions: actions as TStoreActions extends {}
      ? typeof actions
      : typeof actions & TStoreActions
  }
}
