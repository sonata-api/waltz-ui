import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'unplugin-vue-router/vite'
import vueComponents from 'unplugin-vue-components/vite'
import autoImport from 'unplugin-auto-import/vite'
import waltzIcons from 'waltz-icons/vite'
import { icons } from 'waltz-icons/common'

import { sassData } from './sassData.js'
import { getInstanceConfig } from './instance'

import transformIndexHtml from './plugins/transform-index-html'
import loadYaml from './plugins/load-yaml'

export default defineConfig(async () => {
  const instanceConfig = await getInstanceConfig()
  const config: ReturnType<typeof defineConfig> = {
    publicDir: 'static',
    resolve: {
      alias: {
        'bson': require.resolve('bson')
      }
    },
    plugins: [
      waltzIcons({
        tag: 'w-icon',
        hash: true,
        libraries: [
          '@waltz-ui/ui'
        ],
        async preEmit() {
          const collections = require(process.cwd() + '/../api/dist/collections')
          const systemIcons = require(process.cwd() + '/../api/node_modules/@sonata-api/system/dist/icons')

          systemIcons.forEach(icons.add)

          for( const collectionName in collections ) {
            const { description } = await collections[collectionName]()
            if( !description ) {
              return
            }

            const {
              icon,
              actions,
              individualActions

            } = description

            if( icon ) {
              icons.add(icon)
            }

            if( actions ) {
              Object.values(actions).forEach((action: any) => {
                if( action?.icon ) {
                  icons.add(action.icon)
                }
              })
            }

            if( individualActions ) {
              Object.values(individualActions).forEach((action: any) => {
                if( action?.icon ) {
                  icons.add(action.icon)
                }
              })
            }
          }
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
          {
            'waltz-ui': [
              'useStore',
              'useParentStore',
              'useRouter',
              'useClipboard',
              'useBreakpoints',
              'useAction',
              'useCondition',
              'useNavbar',
            ]
          },
          {
            '@sonata-api/common': [
              'error',
              'ok',
              'isError',
              'isOk',
              'unpack',
              'unsafe'
            ]
          }
        ]
      }),
      vueRouter({
        routesFolder: [
          process.cwd() + '/pages',
          process.cwd() + '/src/pages'
        ],
        exclude: [
          '**/_*'
        ],
        dts: false
      }),
      vueComponents({
        dirs: [
          process.cwd() + '/components',
          process.cwd() + '/src/components'
        ],
        resolvers: [
          (componentName) => {
            if( /^W[A-Z]/.test(componentName) ) {
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
        '@sonata-api/common'
      ],
      exclude: [
        'vue-router'
      ]
    },
    build: {
      target: 'esnext'
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: sassData({})
        }
      }
    },
  }

  return config
})
