import type { InstanceConfig } from  './types'
import path from 'path'
import { deserialize } from '@sonata-api/common'
import { writeFile, mkdir } from 'fs/promises'
import { topLevel } from './topLevel'

const mirrorDts = (mirrorObj: any) =>
`import type {
  Schema,
  CollectionDocument,
  GetPayload,
  GetAllPayload,
  InsertPayload,
  RemovePayload,
  RemoveAllPayload,
  UploadPayload,
  RemoveFilePayload

} from '@sonata-api/types'

declare type MirrorDescriptions = ${JSON.stringify(mirrorObj.descriptions, null, 2)}\n

declare type CollectionFunctions<
  TCollectionName extends keyof MirrorDescriptions
> = Schema<MirrorDescriptions[TCollectionName]> extends infer Document
  ? Document extends CollectionDocument<any>
    ? {
      get: (payload: GetPayload<Document>) => Promise<Document>
      getAll: (payload?: GetAllPayload<Document>) => Promise<Document[]>
      insert: (payload: InsertPayload<Document>) => Promise<Document>
      upload: (payload: UploadPayload<Document>) => Promise<any>
      remove: (payload: RemovePayload<Document>) => Promise<Document>
      removeAll: (payload: RemoveAllPayload<Document>) => Promise<any>
      removeFile: (payload: UploadPayload<Document>) => Promise<any>
    }
    : never
  : never

declare module 'aeria-sdk' {
  import {
    InstanceConfig,
    TopLevelObject,
    TLOFunctions
  } from 'aeria-sdk'

  type StrongelyTypedTLO = Omit<TopLevelObject, keyof MirrorDescriptions> & {
    [K in keyof MirrorDescriptions]: CollectionFunctions<K> extends infer Functions
      ? Functions & Omit<TLOFunctions, keyof Functions>
      : never
  }

  export const aeria: StrongelyTypedTLO
}
`

export const runtimeJs = (config: InstanceConfig) =>
`exports.url = '${config.apiUrl}'
exports.aeria = require('aeria-sdk').Aeria(${JSON.stringify(config)})
`

export const mirror = async (config: InstanceConfig) => {
  const api = topLevel(config)
  const runtimeBase = path.join(process.cwd(), 'node_modules', '.aeria-sdk')

  const mirror = deserialize(await api.describe())

  await mkdir(runtimeBase, { recursive: true })
  await writeFile(path.join(process.cwd(), 'aeria-sdk.d.ts'), mirrorDts(mirror))
  await writeFile(path.join(runtimeBase, 'index.js'), runtimeJs(config))
}

