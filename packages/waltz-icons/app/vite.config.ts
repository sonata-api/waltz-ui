import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import aeriaIcons from '..'

export default defineConfig({
  plugins: [
    vue(),
    aeriaIcons()
  ]
})
