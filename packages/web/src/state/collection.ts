import type { Description } from '@sonata-api/types'
import type { CollectionState } from '../types/state'
import { deepMerge } from '@sonata-api/common'
import { PAGINATION_PER_PAGE_DEFAULT } from '../constants'
import actions from './actions'
import getters from './getters'

type StoreOptions =
  'state'
  | 'actions'
  | 'getters'

export const useCollection = (
  newer?: {
    [P in StoreOptions]?: Record<string, any>
  }
) => {
  const initial = {
    state,
    actions,
    getters
  }

  const merge = (right: NonNullable<typeof newer>) => {
    const merged = deepMerge(initial, right)
    const rState = right.state instanceof Function
      ? right.state()
      : right.state

    merged.state = () => Object.assign(initial.state(), rState)

    return merged
  }

  return newer
    ? merge(newer)
    : initial
}

const state = <T=object>() => {
  const ret = {
    item: {},
    freshItem: {},
    referenceItem: {},
    items: [],
    filters: {},
    freshFilters: {},
    activeFilters: {},
    filtersPreset: {},
    preferredTableProperties: [],
    customGetters: {},

    selected: [],
    currentLayout: '',

    queryCache: {},
    _description: {} as Description,
    rawDescription: {},

    validationErrors: {},

    loading: {},
    halt: false,

    pagination: {
      offset: 0,
      limit: PAGINATION_PER_PAGE_DEFAULT,
      recordsCount: 0,
      recordsTotal: 0,
      currentPage: 0
    }
  }

  return ret as typeof ret & CollectionState<T>
}
