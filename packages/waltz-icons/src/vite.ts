import type { Plugin, ResolvedConfig  } from 'vite'
import path from 'path'
import { mkdir, readFile, writeFile, copyFile } from 'fs/promises'
import {
  type Options,
  scrapper,
  icons,
  packTogether,
  makeHash

} from './common.js'

export const vitePlugin = (options: Options = {}): Plugin => {
  const hash = makeHash()

  let config: ResolvedConfig

  return {
    name: 'aeria-icons',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use(config.base + 'assets/icons.svg', async (_req, res, next) => {
        try {
          const content = await readFile(new URL(await import.meta.resolve!('./icons.svg')).pathname)
          res.setHeader('content-type', 'image/svg+xml').end(content)

        } catch( e ) {
          next()
        }
      })
    },
    async transform(source, id) {
      if( !options.allIcons && /\.[cm]?((t|j)s(x|on)?|vue|svelte|html?)/.test(id) ) {
        if( !/node_modules/.test(id) || options.libraries?.some((library) => new RegExp(`/${library}/`).test(id)) ) {
          const scrap = scrapper(options)
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

      await mkdir(path.join(config.build.outDir, 'assets'), { recursive: true })

      if( options.allIcons ) {
        await copyFile(
          path.join(__dirname, '..', 'dist', 'icons.svg'),
          path.join(config.build.outDir, 'assets', 'icons.svg')
        )
        return
      }

      const filename = options.hash
        ? path.join(config.build.outDir, 'assets', `icons-${hash}.svg`)
        : path.join(config.build.outDir, 'assets', `icons.svg`)

      await writeFile(filename, svg)
    }
  }
}

