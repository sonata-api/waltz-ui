import type { Store } from './types'
import { inject, isRef, reactive, type Ref } from 'vue'
export * from './types'

export const STORES = (<any>window).STORES = {} as Record<string, Store>

export const useStore = (storeId: string) => {
  if( !(storeId in STORES) ) {
    throw new Error(`tried to invoke unregistered store "${storeId}"`)
  }

  return STORES[storeId]
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

export const registerStore = <const TStore extends Store>(fn: () => {
  state: TStore
  actions: Record<string, (...args: any[]) => any>
}) => {
  const { state, actions } = fn()
  const store = reactive(state)

  Object.defineProperty(store, 'actions', {
    value: actions
  })

  Object.defineProperty(store, 'functions', {
    value: new Proxy({}, {
      get: (_target, verb: string) => {
        return (...args: any[]) => actions.custom(verb, ...args)
      }
    })
  })

  STORES[store.$id] = store
  return store
}
