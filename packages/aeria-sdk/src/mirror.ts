import type { InstanceConfig } from  './types'
import path from 'path'
import { deserialize } from '@sonata-api/common'
import { writeFile } from 'fs/promises'
import { topLevel } from './topLevel'

const mirrorDts = (mirrorObj: any) =>
`import type { Schema } from '@sonata-api/types'

declare type MirrorDescriptions = ${JSON.stringify(mirrorObj.descriptions, null, 2)}\n

declare module 'aeria-sdk' {
  export const descriptions: MirrorDescriptions
}
`

export const mirror = async (config: InstanceConfig) => {
  const api = topLevel(config)

  const mirror = deserialize(await api.describe())
  await writeFile(path.join(process.cwd(), 'aeria-sdk.d.ts'), mirrorDts(mirror))
}

