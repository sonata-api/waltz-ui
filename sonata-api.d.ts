// this file will be overwritten
import type {} from '@sonata-api/types'

declare global {
  type Collections = typeof import('./src').collections extends infer UserCollections
    ? {
      [K in keyof UserCollections]: UserCollections[K] extends infer CollCandidate
        ? CollCandidate extends () => infer Coll
          ? Coll
          : CollCandidate
        : never
    }
    : never
}
//