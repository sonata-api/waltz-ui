import type { App } from 'vue'

import Overlay from './v-overlay'
import Loading from './v-loading'
import Clickable from './v-clickable'
import Focus from './v-focus'
import Theme from './v-theme'

export default (app: App) => {
  app.directive('overlay', Overlay)
  app.directive('loading', Loading)
  app.directive('clickable', Clickable)
  app.directive('focus', Focus)
  app.directive('theme', Theme)
}
