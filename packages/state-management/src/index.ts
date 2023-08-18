import type { Store } from './types'
import { inject, isRef, reactive, type Ref } from 'vue'
export * from './types'

export const STORES: Record<string, Store> = {}

export const useStore = (storeId: string) => {
  if( !(storeId in STORES) ) {
    throw new Error(`tried to invoke unregistered store "${storeId}"`)
  }

  const store = STORES[storeId]
  if( store.$functions ) {
    store.functions = store.$functions()
  }

  return store
}

export const useParentStore = (fallback?: string) => {
  let parentStoreId = inject<Ref<string>| string|null>('storeId', null)
  if( !parentStoreId ) {
    if( !fallback ) {
      throw new Error('no parent store found')
    }

    parentStoreId = fallback
  }

  return useStore(
    isRef(parentStoreId)
      ? parentStoreId.value
      : parentStoreId
  )
}

export const hasStore = (storeId: string) => {
  return storeId in STORES
}

export const registerStore = <const TStore extends Store>(fn: () => TStore) => {
  const store = fn()
  STORES[store.$id] = reactive(store)
  return store
}
