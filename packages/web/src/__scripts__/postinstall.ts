import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'waltz-ui.d.ts'

const dts = `// WARNING: this file will be overriden
declare global {
  type UnpackCollections<TCollections> =  {
    [P in keyof TCollections]: TCollections[P] extends infer Candidate
      ? Candidate extends (...args: any[]) => infer Coll
        ? Coll
        : Candidate
      : never
  }

  type Collections = typeof import('../api/src') extends infer EntrypointModule
    ? 'collections' extends keyof EntrypointModule
      ? UnpackCollections<EntrypointModule['collections']>
      : 'default' extends keyof EntrypointModule
        ? EntrypointModule['default'] extends infer Entrypoint
          ? 'options' extends keyof Entrypoint
            ? 'collections' extends keyof Entrypoint['options']
              ? UnpackCollections<Entrypoint['options']['collections']>
              : never
            : never
          : never
        : never
    : never
}

declare module 'waltz-ui' {
  export * from 'waltz-ui/dist'

  type SystemStores = typeof import('@waltz-ui/web/stores')
  type UserStores = typeof import('./src/stores')

  type Stores = {
    [P in keyof (SystemStores & UserStores)]: ReturnType<ReturnType<(SystemStores & UserStores)[P]>>
  }

  export const useStore: <TStoreId extends keyof Stores | keyof Collections>(
    storeId: TStoreId,
    manager?: import('@waltz-ui/state-management').GlobalStateManager
  ) => TStoreId extends keyof Stores
    ? Stores[TStoreId]
    : import('waltz-ui').CollectionStore<Collections[TStoreId]['item']>
}

declare module '@vue/runtime-core' {
  import type { TemplateFunctions } from '@waltz-ui/web'

  interface ComponentCustomProperties extends TemplateFunctions {
    viewTitle: string
    viewIcon: string
    instanceConfig: typeof import('waltz-build').InstanceConfig
    currentUser: (typeof import('../api/src').collections.user extends infer UserCollection
      ? UserCollection extends (...args: any[]) => any
        ? ReturnType<UserCollection>
        : UserCollection
      : never
    ) extends infer Coll
      ? Coll['item']
      : never
    t: typeof import('@waltz-ui/i18n').t
  }
}

import type { RouteRecordRaw } from 'vue-router'
import type { Icon } from '@sonata-api/types'

declare global {
  const definePage: (page: Partial<RouteRecordRaw> & {
    meta: {
      title: string
      icon?: Icon
    }
  }) => void
}

export {}
//`

const install = async () => {
  const base = path.join(process.cwd(), '..', '..', '..')

  try {
    // prevent the script from installing the dts on @waltz-ui/* packages
    const { name } = require(path.join(base, 'package.json'))
    if( name.startsWith('@waltz-ui/') ) {
      return
    }

  } catch( e ) {
    //
  }

  await writeFile(path.join(base, DTS_FILENAME), dts)
}

install()
