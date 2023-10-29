import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import typescript2 from 'rollup-plugin-typescript2'
import dts from 'vite-plugin-dts'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true
    }),
    typescript2({
      check: false,
      exclude: [
        'vite.config.ts'
      ]
    }),
    viteStaticCopy({
      targets: [
        {
          src: './src/less',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'waltz-ui',
      formats: [
        'es'
      ]
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts')
      },
      output: {
        exports: 'named'
      },
      external: [
        'vue',
        'vue-router',
        /@waltz-ui\/web/,
        /@sonata-api\//,
      ]
    }
  },
})
