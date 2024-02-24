import {
  inject,
  isRef,
  reactive,
  isReactive,
  type Ref,
  type ComputedRef,
  type UnwrapRef,
  type Plugin,

} from 'vue'

export type StoreState = Record<string, any>

export type Store = StoreState & {
  $id: string
  $actions: Record<string, (...args: any[]) => any>
  $functions: Record<string, (...args: any[]) => any>
}

export type GlobalState = Record<string, Store>
export type GlobalStateManager = Plugin & {
  __globalState: GlobalState
}

export type UnRef<TObj extends Record<string, ComputedRef<any>>> = {
  [P in keyof TObj]: UnwrapRef<TObj[P]>
}

const GLOBAL_STATE_KEY = '__globalState'

export const createGlobalStateManager = (): GlobalStateManager => {
  const globalState: GlobalState = {}

  return {
    __globalState: globalState,
    install(app) {
      app.provide(GLOBAL_STATE_KEY, globalState)
    }
  }
}

export const useStore = (storeId: string, manager?: GlobalStateManager) => {
  const globalState = manager?.__globalState || inject(GLOBAL_STATE_KEY, {} as GlobalState)
  if( !(storeId in globalState) ) {
    throw new Error(`tried to invoke unregistered store "${storeId}"`)
  }

  return globalState[storeId]
}

export const useParentStore = (fallback?: string, manager?: GlobalStateManager) => {
  let parentStoreId = inject<Ref<string> | string | null>('storeId', null)
  if( !parentStoreId ) {
    if( !fallback ) {
      throw new Error('no parent store found')
    }

    parentStoreId = fallback
  }

  return useStore(
    isRef(parentStoreId)
      ? parentStoreId.value
      : parentStoreId,
    manager
  )
}

export const hasStore = (storeId: string, manager?: GlobalStateManager) => {
  const globalState = manager?.__globalState || inject(GLOBAL_STATE_KEY, {} as GlobalState)
  return storeId in globalState
}

export const internalRegisterStore = <
  const TStoreId extends string,
  TStoreState extends StoreState,
  TStoreGetters extends Record<string, ComputedRef<any>>,
  TStoreActions extends Record<string, (...args: any[]) => any>,
>(
  manager: GlobalStateManager,
  fn: (manager: GlobalStateManager) => {
    $id: TStoreId
    state: TStoreState
    getters?: TStoreGetters,
    actions?: TStoreActions
  }
) => {
  const { $id, state, getters, actions } = fn(manager)
  const globalState = manager.__globalState

  if( hasStore($id, manager) ) {
    return globalState[$id]
  }

  const store = isReactive(state)
    ? <Store>state
    : reactive(<Store>state) 

  Object.assign(store, {
    $id
  })

  if( getters ) {
    Object.assign(store, getters)
  }

  if( actions ) {
    const functions = new Proxy({}, {
      get: (_target, verb: string) => {
        return (...args: any[]) => actions.custom(verb, ...args)
      }
    })

    const proxiedActions = new Proxy(actions, {
      get: (target, key: string) => {
        if( typeof target[key] !== 'function' ) {
          return target[key]
        }
        return target[key].bind({
          ...actions,
          $functions: functions
        })
      }
    })

    Object.defineProperty(store, '$actions', {
      value: proxiedActions,
      writable: true
    })

    Object.defineProperty(store, '$functions', {
      value: functions,
      writable: true
    })
  }

  globalState[$id] = store
  return store
}

export const registerStore = <
  const TStoreId extends string,
  TStoreState extends StoreState,
  TStoreGetters extends Record<string, ComputedRef<any>>,
  TStoreActions extends Record<string, (...args: any[]) => any>,
  Getters = string extends keyof TStoreGetters
    ? {}
    : UnRef<TStoreGetters>,
  Return = TStoreState & Getters & {
    $id: TStoreId,
    $actions: TStoreActions
    $functions: Record<string, (...args: any[]) => any>
  }

>(
  fn: (manager: GlobalStateManager) => {
    $id: TStoreId
    state: TStoreState
    getters?: TStoreGetters,
    actions?: TStoreActions
  }
) => {
  return (manager: GlobalStateManager) => {
    return internalRegisterStore(manager, fn) as Return
  }
}

