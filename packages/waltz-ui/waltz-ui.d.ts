// WARNING: this file will be overriden
import type { Context } from '@sonata-api/api'
import type { CollectionStore } from '@waltz-ui/web'

declare module '@waltz-ui/web' {
  type UserCollections = typeof import('api').collections
  type SystemCollections = typeof import('@sonata-api/system/collections')

  type Collections = {
    [K in keyof (UserCollections & SystemCollections)]: Awaited<ReturnType<(UserCollections & SystemCollections)[K]>>
  }

  export function useStore<StoreId extends keyof Collections>(storeId: StoreId): Omit<CollectionStore<Collections[StoreId]>,
    'functions'
    | 'item'
    | 'items'> & {
    functions: {
      [P in keyof Collections[StoreId]['functions']]: (arg: Parameters<Collections[StoreId]['functions'][P]>[0]) => ReturnType<Collections[StoreId]['functions'][P]>
    }
    item: Collections[StoreId]['item']
    items: Array<Collections[StoreId]['item']>
  }
}
//