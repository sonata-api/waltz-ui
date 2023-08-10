import { reactive } from 'vue'
import type { Router } from 'vue-router'
import type { CollectionAction, StoreEffect } from '@sonata-api/types'
import { deepClone } from '@sonata-api/common'
import { STORE_EFFECTS } from '@sonata-api/types'

export type ActionEvent<T={ _id: string }> = {
  id: number
  name: string
  params?: T|object
}

const getEffect = (store: any, effectName: StoreEffect) => {
  const effect = STORE_EFFECTS[effectName]
  return store[effect]
}

export const useAction = <T extends { $id: string }, F extends { _id: string }>(
  store: (T & Record<string, (...args: any[]) => any>),
  router: Router
): [(...args: any[]) => void, any] => {
  const eventBus = reactive<ActionEvent>({
    id: -1,
    name: '',
    params: {}
  })

  const fn = (actionProps: CollectionAction<any> & { action: string }): (filters: F) => void => {
    const { action: actionName, effect: actionEffect } = actionProps
    const [scopeName, scopedAction] = actionName.split(':')

    if( scopedAction ) {
      if( scopeName === 'route' ) {
        return async (filters: F) => {
          if( actionProps.clearItem ) {
            store.clearItem()
          }

          if( actionProps.fetchItem && filters?._id ) {
            await store.get({
              filters: {
                _id: filters._id 
              }
            })
          }

          router.push({
            name: actionName.split('route:')[1],
            params: Object.assign({ id: filters._id }, actionProps.params || {}),
            query: actionProps.query || {}
          })
        }
      }

      if( scopeName === 'ui' ) {
        return (_filters: F) => {
          const filters = deepClone(_filters)
          Object.assign(eventBus, {
            id: Math.random(),
            name: scopedAction,
            params: filters
          })
        }
      }
    }

    const prepareFilters = (filters: F) => {
      return actionProps.requires
        ? store.select(actionProps.requires, filters)
        : filters
    }

    const storeAction = (() => {
      if( actionName in store ) {
        return store[actionName]
      }

      return actionEffect
        ? (payload: any) => store.customEffect(actionName, payload, getEffect(store, actionEffect))
        : (payload: any) => store.custom(actionName, payload)
    })()

    if( actionProps.ask ) {
      return (filters: F) => store.ask({
        action: storeAction,
        params: prepareFilters(filters)
      })
    }

    return (filters: F) => storeAction(prepareFilters(filters))
  }

  return [
    fn,
    eventBus
  ]
}
