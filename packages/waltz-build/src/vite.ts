import { defineConfig, type InlineConfig } from 'vite'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueComponents from 'unplugin-vue-components/vite'
import autoImport from 'unplugin-auto-import/vite'
import waltzIcons from 'waltz-icons'
import { icons } from 'waltz-icons/common'
import { getInstanceConfig } from './instance.js'
import transformIndexHtml from './plugins/transform-index-html.js'
import loadYaml from './plugins/load-yaml.js'

export default defineConfig(async () => {
  const instanceConfig = await getInstanceConfig()
  const config: InlineConfig = {
    publicDir: 'static',
    resolve: {
      alias: {
        'bson': fileURLToPath(new URL('bson.cjs', import.meta.resolve('bson'))),
      }
    },
    plugins: [
      waltzIcons({
        hash: true,
        libraries: instanceConfig.icons?.libraries || [],
        async preEmit() {
          const require = createRequire(import.meta.url)

          const userIcons = await import(process.cwd() + '/../api/node_modules/.sonata/icons.mjs')
          const builtinsIcons = require('@sonata-api/builtins/icons')

          userIcons.icons.forEach((icon: string) => {
            icons.add(icon)
          })

          builtinsIcons.icons.forEach((icon: string) => {
            icons.add(icon)
          })
        }
      }),
      autoImport({
        exclude: [
          /\/node_modules\//,
          /\.git\//,
          /@?waltz-ui/,
        ],
        imports: [
          'vue',
          'vue-router',
          {
            'waltz-ui': [
              'useStore',
              'useParentStore',
              'useClipboard',
              'useBreakpoints',
              'useAction',
              'useNavbar',
            ]
          }
        ]
      }),
      vueComponents({
        dirs: [
          process.cwd() + '/components',
          process.cwd() + '/src/components'
        ],
        resolvers: [
          (componentName) => {
            if( /^Aeria[A-Z]/.test(componentName) ) {
              return {
                name: componentName,
                from: '@waltz-ui/ui'
              }
            }
          }
        ]
      }),
      vue(),
      transformIndexHtml(instanceConfig),
      loadYaml()
    ],
    optimizeDeps: {
      include: [
        'bson',
        '@sonata-api/types',
        '@sonata-api/common',
      ],
      exclude: [
        'mongodb',
      ]
    },
    build: {
      target: 'esnext',
      sourcemap: !!instanceConfig.sourcemap
    },
  }

  if( instanceConfig.preserveSymlinks ) {
    config.resolve!.preserveSymlinks = true
  }

  return config
})
