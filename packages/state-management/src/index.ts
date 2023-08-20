import {
  inject,
  isRef,
  reactive,
  isReactive,
  type Ref,
  type ComputedRef,
  type UnwrapRef

} from 'vue'

export type Store = StoreState & {
  $id: string
  $actions: Record<string, (...args: any[]) => any>
  $functions: Record<string, (...args: any[]) => any>
}

export type StoreState<TContent extends object=Record<string, Exclude<any, (...args: any[]) => any>>> = TContent

export type UnRef<TObj extends Record<string, ComputedRef<any>>> = {
  [P in keyof TObj]: UnwrapRef<TObj[P]>
}

window.STORES ??= {}

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
  TStoreActions extends Record<string, (...args: any[]) => any>,
  Return=TStoreState & UnRef<TStoreGetters> & {
    $id: TStoreId,
    $actions: TStoreActions
    $functions: Record<string, (...args: any[]) => any>
  }

>(fn: () => {
  $id: TStoreId
  state: TStoreState
  getters?: TStoreGetters,
  actions?: TStoreActions
}) => {
  const { $id, state, getters, actions } = fn()
  if( hasStore($id) ) {
    return () => STORES[$id] as Return
  }

  const store = isReactive(state)
    ? state
    : reactive(state) 

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

  STORES[$id] = store as Store
  return () => store as Return
}
