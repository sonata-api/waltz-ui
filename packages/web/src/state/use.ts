import { inject } from 'vue'
import { getActivePinia, setActivePinia, defineStore as piniaDefineStore } from 'pinia'

if( !window.STORES ) {
  Object.assign(window, { STORES: {} })
}

export const useStore = (storeId: string) => {
  if( !getActivePinia() ) {
    setActivePinia(PINIA)
  }

  if( !(storeId in STORES) ) {
    throw new Error(`tried to invoke unregistered store "${storeId}"`)
  }

  const store = STORES[storeId]()
  if( store.$functions ) {
    store.functions = store.$functions()
  }

  return store
}

export const useParentStore = (fallback?: string) => {
  let parentStoreId = inject<any>('storeId', null)
  if( !parentStoreId ) {
    if( !fallback ) {
      throw new Error('no parent store found')
    }

    parentStoreId = fallback
  }

  return useStore(parentStoreId.value||parentStoreId)
}

export const hasStore = (storeId: string) => {
  return storeId in STORES
}

export const defineStore = (...args: Parameters<typeof piniaDefineStore>) => {
  if( !getActivePinia() ) {
    setActivePinia(PINIA)
  }
  return piniaDefineStore(...args)
}

export const registerStore = async <
  T extends { $id: string },
  F extends (() => T) & T,
  A extends Promise<{ default: F }>
>(fn: F | A): Promise<void> => {
  if( fn instanceof Promise ) {
    return fn.then((store) => {
      registerStore(store.default)
    })
  }

  const store: F = fn as F
  const storeId = store.$id
  STORES[storeId] = fn
}
