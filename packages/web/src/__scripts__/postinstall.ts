import { writeFile } from 'fs/promises'
import path from 'path'

const DTS_FILENAME = 'waltz-ui.d.ts'

const dts = `// WARNING: this file will be overriden
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
