// this file will be overwritten
import type {} from '@sonata-api/types'

declare global {
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('./src').collections

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: ReturnType<(SystemCollections & UserCollections)[K]>
  }
}
//