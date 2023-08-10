export * from './app'
export * from './bootstrap'
export * from './composables'
export * from './constants'
export * from './options'
export * from './router'
export * from './state'
export * from './types'
export * from './http'

import metaStore from './stores/meta'
import userStore from './stores/user'

STORES.meta = metaStore
STORES.user = userStore

window.userStorage = localStorage
