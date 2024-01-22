import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import aeriaIcons from '..'

export default defineConfig({
  plugins: [
    vue(),
    aeriaIcons({
      allIcons: true
    })
  ],
  base: '/waltz-ui/icons',
  build: {
    outDir: 'dist/icons'
  }
})
