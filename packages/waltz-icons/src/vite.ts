import type { Plugin, ResolvedConfig  } from 'vite'
import path from 'path'
import { readFile, writeFile } from 'fs/promises'
import {
  type Options,
  defaultOptions,
  scrapper,
  icons,
  packTogether,
  makeHash

} from './common'

export const vitePlugin = (_options: Options = {}): Plugin => {
  const options = Object.assign(defaultOptions, _options)
  const hash = makeHash()

  let config: ResolvedConfig

  return {
    name: 'aeria-icons',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use('/assets/icons.svg', async (_req, res, next) => {
        try {
          const content = await readFile(`${__dirname}/icons.svg`)
          res.setHeader('content-type', 'image/svg+xml').end(content)

        } catch( e: any ) {
          next()
        }
      })
    },
    async transform(source, id) {
      if( /\.[cm]?((t|j)s(x|on)?|vue|svelte|html?)/.test(id) ) {
        if( !/node_modules/.test(id) || options.libraries?.some((library) => new RegExp(`/${library}/`).test(id)) ) {
          const scrap = scrapper(
            options,
            () => null,
            (error) => this.warn(error)
          )

          await scrap(source)
        }

        if( process.env.NODE_ENV !== 'development' && options.hash ) {
          const newSource = source.replace('icons.svg', `icons-${hash}.svg`)
          return {
            code: newSource,
            map: null
          }
        }
      }

      return {
        code: source,
        map: null
      }
    },
    async generateBundle() {
      if( options.preEmit ) {
        await options.preEmit()
      }

      const svg = await packTogether([ ...icons ])

      const filename = options.hash
        ? path.join(config.build.outDir, 'assets', `icons-${hash}.svg`)
        : path.join(config.build.outDir, 'assets', `icons.svg`)

      await writeFile(filename, svg)
    }
  }
}

