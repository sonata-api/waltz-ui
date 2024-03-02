import {
  inject,
  isRef,
  isReactive,
  reactive,
  computed,
  type Ref,
  type ComputedRef,
  type UnwrapRef,
  type Plugin,

} from 'vue'

export type StoreState = Record<string, any>

export type Store = StoreState & {
  $id: string
  $actions: Record<string, (...args: any[])=> any>
  $functions: Record<string, (...args: any[])=> any>
}

export type GlobalState = Record<string, Store>
export type GlobalStateManager = {
  __globalState: GlobalState
}

export type UnRef<TObj extends Record<string, ComputedRef<any>>> = {
  [P in keyof TObj]: UnwrapRef<TObj[P]>
}

export const GLOBAL_STATE_KEY = Symbol('globalState')
export const STORE_ID = Symbol('storeId')

export const createGlobalStateManager = (): GlobalStateManager & Plugin => {
  const globalState: GlobalState = {}

  return {
    __globalState: globalState,
    install(app) {
      app.provide(GLOBAL_STATE_KEY, globalState)
    },
  }
}

export const getGlobalStateManager = () => {
  return {
    __globalState: inject(GLOBAL_STATE_KEY, {} as GlobalState),
  }
}

export const getGlobalState = (manager: GlobalStateManager) => {
  return manager.__globalState
}

export const getStoreId = () => {
  return inject<Ref<string> | string | null>(STORE_ID, null)
}

export const useStore = (storeId: string, manager?: GlobalStateManager) => {
  const globalState = getGlobalState(manager || getGlobalStateManager())

  if( !(storeId in globalState) ) {
    throw new Error(`tried to invoke unregistered store "${storeId}"`)
  }

  return globalState[storeId]
}

export const useParentStore = (fallback?: string, manager?: GlobalStateManager) => {
  let parentStoreId = getStoreId()
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
    manager,
  )
}

export const hasStore = (storeId: string, manager?: GlobalStateManager) => {
  const globalState = getGlobalState(manager || getGlobalStateManager())
  return storeId in globalState
}

export const internalRegisterStore = <
  const TStoreId extends string,
  TStoreState extends StoreState,
  TStoreGetters extends Record<string, () => any>,
  TStoreActions extends Record<string, (...args: any[])=> any>,
>(
  manager: GlobalStateManager,
  fn: (manager: GlobalStateManager)=> {
    $id: TStoreId
    state: TStoreState
    getters?: TStoreGetters,
    actions?: TStoreActions
  },
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
    $id,
  })

  if( getters ) {
    Object.assign(
      store,
      Object.fromEntries(Object.entries(getters).map(([key, getter]) => [key, computed(getter)]))
    )
  }

  if( actions ) {
    const functions = new Proxy({}, {
      get: (_target, verb: string) => {
        return (...args: any[]) => actions.custom(verb, ...args)
      },
    })

    const proxiedActions = new Proxy(actions, {
      get: (target, key: string) => {
        if( typeof target[key] !== 'function' ) {
          return target[key]
        }
        return target[key].bind({
          ...actions,
          $functions: functions,
        })
      },
    })

    Object.defineProperty(store, '$actions', {
      value: proxiedActions,
      writable: true,
    })

    Object.defineProperty(store, '$functions', {
      value: functions,
      writable: true,
    })
  }

  globalState[$id] = store
  return store
}

export const registerStore = <
  const TStoreId extends string,
  TStoreState extends StoreState,
  TStoreGetters extends Record<string, () => any>,
  TStoreActions extends Record<string, (...args: any[])=> any>,
  Return = TStoreState & TStoreGetters & {
    $id: TStoreId,
    $actions: TStoreActions
    $functions: Record<string, (...args: any[])=> any>
  },

>(
  fn: (manager: GlobalStateManager)=> {
    $id: TStoreId
    state: TStoreState
    getters?: TStoreGetters,
    actions?: TStoreActions
  },
) => {
  return (manager: GlobalStateManager) => {
    return internalRegisterStore(manager, fn) as Return
  }
}

