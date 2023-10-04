import type { Router } from 'vue-router'
import type { CollectionAction } from '@sonata-api/types'
import type { Store } from '@waltz-ui/state-management'
import { reactive } from 'vue'
import { deepClone } from '@sonata-api/common'

export const STORE_EFFECTS = <const>{
  'ITEM_SET': 'setItem',
  'ITEM_INSERT': 'insertItem',
  'ITEMS_SET': 'setItems',
  'ITEMS_UPDATE': 'updateItems',
  'ITEM_REMOVE': 'removeItem',
}

export type ActionEvent<T={ _id: string }> = {
  id: number
  name: string
  params?: T|object
}

const getEffect = (store: any, effectName: keyof typeof STORE_EFFECTS) => {
  const effect = STORE_EFFECTS[effectName]
  return store.$actions[effect]
}

export const useAction = <F extends { _id: string }>(
  store: Store,
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
            store.$actions.clearItem()
          }

          if( actionProps.fetchItem && filters?._id ) {
            await store.$actions.get({
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
        ? store.$actions.select(actionProps.requires, filters)
        : store.$actions.select(['_id'], filters)
    }

    const storeAction = (() => {
      if( actionName in store.$actions ) {
        return store.$actions[actionName]
      }

      return actionEffect
        ? (payload: any) => store.$actions.customEffect(actionName, payload, getEffect(store, actionEffect as keyof typeof STORE_EFFECTS))
        : (payload: any) => store.$actions.custom(actionName, payload)
    })()

    if( actionProps.ask ) {
      return (filters: F) => store.$actions.ask({
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
