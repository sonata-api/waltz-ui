import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'waltz-ui.d.ts'

const dts = `// WARNING: this file will be overriden
declare module 'waltz-ui' {
  export * from 'waltz-ui/dist'
  type SystemCollections = typeof import('@sonata-api/system/collections')
  type UserCollections = typeof import('../api/src').collections

  type Collections = {
    [K in keyof (SystemCollections & UserCollections)]: Awaited<ReturnType<(SystemCollections & UserCollections)[K]>>
  }

  type UserStores = typeof import('./src/stores')
  type Stores = {
    [P in keyof UserStores]: ReturnType<ReturnType<UserStores[P]>>
  }

  export const useStore: <TStoreId extends keyof Stores | keyof Collections>(storeId: TStoreId) => TStoreId extends keyof Stores
    ? Stores[TStoreId]
    : import('waltz-ui').CollectionStore<Collections[TStoreId]['item']>
}
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
