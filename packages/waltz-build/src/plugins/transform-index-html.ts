import ejs from 'ejs'
import type { Plugin } from 'vite'
import type { getInstanceConfig } from '../instance'
import { PLUGIN_PREFIX } from '../constants'

export default (instanceConfig: Awaited<ReturnType<typeof getInstanceConfig>>): Plugin => {
  return {
    name: `${PLUGIN_PREFIX}:transform-index-html`,
    transformIndexHtml(html) {
      return ejs.render(html, { instanceConfig })
    }
  }
}
