import {
  inject,
  isRef,
  reactive,
  isReactive,
  type Ref,
 
  type ComputedRef
} from 'vue'

export type StoreState<TContent extends object=Record<string, any>> = TContent

export const STORES = (<any>window).STORES = {} as Record<string, StoreState>

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

export const registerStore = <
  const TStoreId extends string,
  TStoreState extends StoreState,
  TStoreGetters extends Record<string, ComputedRef<any>>,
  TStoreActions extends Record<string, (...args: any[]) => any>

>(fn: () => {
  $id: TStoreId
  state: TStoreState
  getters?: TStoreGetters,
  actions?: TStoreActions
}) => {
  const { $id, state, getters, actions } = fn()
  const store = isReactive(state)
    ? state
    : reactive(state) 

  if( getters ) {
    Object.assign(store, getters)
  }

  if( actions ) {
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
  }

  STORES[$id] = store
  return store as unknown as TStoreState & TStoreGetters & {
    $id: TStoreId,
    actions: TStoreActions
    functions: Record<string, (...args: any[]) => any>
  }

}
