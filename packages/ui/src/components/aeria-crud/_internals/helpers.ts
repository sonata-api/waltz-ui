import type { FiltersPreset } from '@sonata-api/types'
import type { CollectionStore } from '@waltz-ui/web'
import { watch } from 'vue'
import { useRouter } from 'vue-router/auto'

export const togglePreset = (preset: FiltersPreset<any> | null, store: CollectionStore) => {
  if( !store ) {
    return
  }

  if( !preset ) {
    store.filtersPreset = {}
    store.preferredTableProperties = []
    store.pagination.offset = 0
    return
  }

  store.filtersPreset = preset.filters || {}
  store.preferredTableProperties = preset.table
    ? Array.from(preset.table)
    : []

    store.pagination.offset = 0
}

export const watchStore = (store: CollectionStore, options = { persistInQuery: true }) => {
  const router = useRouter()
  const route = router.currentRoute

  return watch(() => route.value.query.section, (section) => {
    if( !store ) {
      return
    }

    if( store.description.filtersPresets ) {
      const currPreset = section as string
      || Object.keys(store.description.filtersPresets)[0]

      togglePreset(store.description.filtersPresets[currPreset], store)
    }

    if( options.persistInQuery ) {
      const query = route.value.query
      if( query.offset ) {
        store.pagination.offset = +query.offset
      }
      if( query.limit ) {
        store.pagination.limit = +query.limit
      }
      if( query.search ) {
        store.textQuery = query.search as string
        store.filters.$text = {
          $search: `"${query.search}"`,
          $caseSensitive: false
        }
      }
    }

  }, { immediate: true })

}
