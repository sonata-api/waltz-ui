import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueRouter from 'unplugin-vue-router/vite'
import vueComponents from 'unplugin-vue-components/vite'
import autoImport from 'unplugin-auto-import/vite'
import waltzIcons from 'waltz-icons/vite'
import { icons } from 'waltz-icons/common'
import { VueRouterAutoImports } from 'unplugin-vue-router'

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
          const userIcons = require(process.cwd() + '/../api/node_modules/.sonata/icons')
          const systemIcons = require(process.cwd() + '/../api/node_modules/@sonata-api/system/dist/icons')

          userIcons.icons.forEach((icon: string) => {
            icons.add(icon)
          })

          systemIcons.icons.forEach((icon: string) => {
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
          VueRouterAutoImports,
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
      vueRouter({
        routesFolder: [
          process.cwd() + '/pages',
          process.cwd() + '/src/pages'
        ],
        exclude: [
          '**/_*'
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
        '@sonata-api/common'
      ],
      exclude: [
        'vue-router'
      ]
    },
    build: {
      target: 'esnext',
      sourcemap: !!instanceConfig.sourcemap
    },
  }

  return config
})
